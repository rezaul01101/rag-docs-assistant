import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";

import type { HttpError } from "../middleware/errorHandler";
import { PUBLIC_DIR } from "../middleware/upload.middleware";
import {
  isValidStoredFilename,
  MIME_TYPE_BY_EXTENSION,
  toDisplayName,
} from "../models/upload.model";
import {
  toChunkWithEmbedding,
  toPgVectorLiteral,
  type ChunkWithEmbedding,
  type DocumentChunkRecord,
  type DocumentRecord,
} from "../models/document.model";
import { chunkText } from "../services/chunking.service";
import { query, withTransaction } from "../services/db.service";
import {
  embedChunk,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "../services/embedding.service";
import { extractTextFromFile } from "../services/pdf.service";

function sendError(next: NextFunction, status: number, message: string): void {
  const error: HttpError = new Error(message);
  error.status = status;
  next(error);
}

function resolveFile(filename: string): { fullPath: string; mimetype: string } | null {
  const fullPath = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(fullPath)) return null;
  const extension = path.extname(filename).toLowerCase();
  const mimetype = MIME_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";
  return { fullPath, mimetype };
}

export async function extractDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { filename } = req.params;

  if (!isValidStoredFilename(filename)) {
    sendError(next, 400, "Invalid filename");
    return;
  }

  const resolved = resolveFile(filename);
  if (!resolved) {
    sendError(next, 404, "File not found");
    return;
  }

  try {
    const text = await extractTextFromFile(resolved.fullPath, resolved.mimetype);

    if (!text.trim()) {
      sendError(next, 422, "No extractable text found in this file");
      return;
    }

    const originalName = toDisplayName(filename);

    const { rows } = await query<DocumentRecord>(
      `INSERT INTO documents (filename, original_name, mimetype, status, extracted_text, error_message)
       VALUES ($1, $2, $3, 'extracted', $4, NULL)
       ON CONFLICT (filename) DO UPDATE SET
         original_name = EXCLUDED.original_name,
         mimetype = EXCLUDED.mimetype,
         status = 'extracted',
         extracted_text = EXCLUDED.extracted_text,
         error_message = NULL
       RETURNING id`,
      [filename, originalName, resolved.mimetype, text],
    );

    const chunkPreviewCount = chunkText(text).length;

    res.json({
      documentId: rows[0].id,
      filename,
      status: "extracted",
      extractedText: text,
      chunkPreviewCount,
      textLength: text.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    try {
      await query(
        `INSERT INTO documents (filename, original_name, mimetype, status, error_message)
         VALUES ($1, $2, $3, 'failed', $4)
         ON CONFLICT (filename) DO UPDATE SET status = 'failed', error_message = EXCLUDED.error_message`,
        [filename, toDisplayName(filename), resolved.mimetype, message],
      );
    } catch {
      // best-effort status update only
    }
    sendError(next, 500, message);
  }
}

export async function embedDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { filename } = req.params;

  if (!isValidStoredFilename(filename)) {
    sendError(next, 400, "Invalid filename");
    return;
  }

  const { rows } = await query<DocumentRecord>(
    "SELECT * FROM documents WHERE filename = $1",
    [filename],
  );
  const doc = rows[0];

  if (!doc || !doc.extracted_text) {
    sendError(next, 404, "Extract this file before embedding");
    return;
  }

  const chunks = chunkText(doc.extracted_text);
  const chunksWithEmbeddings: ChunkWithEmbedding[] = [];

  try {
    for (const chunk of chunks) {
      const embedding = await embedChunk(chunk.content);
      chunksWithEmbeddings.push({
        index: chunk.index,
        content: chunk.content,
        wordCount: chunk.wordCount,
        embedding,
      });
    }

    await query("UPDATE documents SET status = 'embedded' WHERE id = $1", [doc.id]);

    res.json({
      documentId: doc.id,
      filename: doc.filename,
      status: "embedded",
      embeddingModel: EMBEDDING_MODEL,
      chunks: chunksWithEmbeddings,
    });
  } catch (err) {
    const failedIndex = chunksWithEmbeddings.length;
    const message = err instanceof Error ? err.message : "Embedding failed";
    const fullMessage = `Chunk ${failedIndex}: ${message}`;
    try {
      await query(
        "UPDATE documents SET status = 'failed', error_message = $2 WHERE id = $1",
        [doc.id, fullMessage],
      );
    } catch {
      // best-effort status update only
    }
    sendError(next, 502, fullMessage);
  }
}

export async function saveDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { filename } = req.params;

  if (!isValidStoredFilename(filename)) {
    sendError(next, 400, "Invalid filename");
    return;
  }

  const chunks = req.body?.chunks;

  if (!Array.isArray(chunks) || chunks.length === 0) {
    sendError(next, 400, "No chunks provided");
    return;
  }

  for (const chunk of chunks) {
    const validEmbedding =
      Array.isArray(chunk?.embedding) &&
      chunk.embedding.length === EMBEDDING_DIMENSIONS &&
      chunk.embedding.every((n: unknown) => typeof n === "number");

    if (
      typeof chunk?.index !== "number" ||
      typeof chunk?.content !== "string" ||
      typeof chunk?.wordCount !== "number" ||
      !validEmbedding
    ) {
      sendError(next, 400, "Malformed chunk payload");
      return;
    }
  }

  try {
    const { rows } = await query<DocumentRecord>(
      "SELECT * FROM documents WHERE filename = $1",
      [filename],
    );
    const doc = rows[0];

    if (!doc) {
      sendError(next, 404, "Extract and embed this file before saving");
      return;
    }

    await withTransaction(async (client) => {
      await client.query("DELETE FROM document_chunks WHERE document_id = $1", [doc.id]);

      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            doc.id,
            chunk.index,
            chunk.content,
            chunk.wordCount,
            toPgVectorLiteral(chunk.embedding),
          ],
        );
      }

      await client.query(
        `UPDATE documents
         SET status = 'vectorized', chunk_count = $2, embedding_model = $3
         WHERE id = $1`,
        [doc.id, chunks.length, EMBEDDING_MODEL],
      );
    });

    res.json({
      documentId: doc.id,
      filename: doc.filename,
      status: "vectorized",
      chunkCount: chunks.length,
    });
  } catch (err) {
    sendError(next, 500, err instanceof Error ? err.message : "Failed to save vectors");
  }
}

export async function getDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { filename } = req.params;

  if (!isValidStoredFilename(filename)) {
    sendError(next, 400, "Invalid filename");
    return;
  }

  try {
    const { rows: docRows } = await query<DocumentRecord>(
      "SELECT * FROM documents WHERE filename = $1 AND status = 'vectorized'",
      [filename],
    );
    const doc = docRows[0];

    if (!doc) {
      sendError(next, 404, "Document not yet vectorized");
      return;
    }

    const { rows: chunkRows } = await query<DocumentChunkRecord>(
      "SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC",
      [doc.id],
    );

    res.json({
      documentId: doc.id,
      filename: doc.filename,
      status: doc.status,
      embeddingModel: doc.embedding_model,
      chunkCount: doc.chunk_count,
      chunks: chunkRows.map(toChunkWithEmbedding),
    });
  } catch (err) {
    sendError(next, 500, err instanceof Error ? err.message : "Failed to load document");
  }
}
