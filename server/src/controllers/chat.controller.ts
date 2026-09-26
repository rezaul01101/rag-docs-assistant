import type { NextFunction, Request, Response } from "express";

import type { HttpError } from "../middleware/errorHandler";
import { DEFAULT_TOP_K, toChatSource, type SimilarChunkRow } from "../models/chat.model";
import { toPgVectorLiteral } from "../models/document.model";
import { query } from "../services/db.service";
import { embedChunk } from "../services/embedding.service";
import { generateAnswer } from "../services/llm.service";

function sendError(next: NextFunction, status: number, message: string): void {
  const error: HttpError = new Error(message);
  error.status = status;
  next(error);
}

export async function handleChat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const message = req.body?.message;

  if (typeof message !== "string" || !message.trim()) {
    sendError(next, 400, "message is required");
    return;
  }

  try {
    const queryEmbedding = await embedChunk(message);

    const { rows } = await query<SimilarChunkRow>(
      `SELECT dc.content, dc.chunk_index, d.filename, d.original_name,
              1 - (dc.embedding <=> $1) AS similarity
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       ORDER BY dc.embedding <=> $1
       LIMIT $2`,
      [toPgVectorLiteral(queryEmbedding), DEFAULT_TOP_K],
    );

    if (rows.length === 0) {
      res.json({
        answer:
          "I don't have any vectorized documents to answer from yet. Upload and vectorize a file first.",
        sources: [],
      });
      return;
    }

    const answer = await generateAnswer(
      message,
      rows.map((row) => ({ content: row.content, originalName: row.original_name })),
    );

    res.json({
      answer,
      sources: rows.map(toChatSource),
    });
  } catch (err) {
    sendError(next, 502, err instanceof Error ? err.message : "Chat request failed");
  }
}
