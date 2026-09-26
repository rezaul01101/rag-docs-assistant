import type { NextFunction, Request, Response } from "express";

import type { HttpError } from "../middleware/errorHandler";
import { PUBLIC_DIR } from "../middleware/upload.middleware";
import {
  deleteStoredFile,
  isValidStoredFilename,
  listStoredFiles,
  toUploadedFileMeta,
} from "../models/upload.model";
import { query } from "../services/db.service";

export function handleUpload(req: Request, res: Response, next: NextFunction): void {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    const error: HttpError = new Error("No files were uploaded");
    error.status = 400;
    next(error);
    return;
  }

  res.status(201).json({
    files: files.map(toUploadedFileMeta),
  });
}

export async function listUploads(_req: Request, res: Response): Promise<void> {
  const files = listStoredFiles(PUBLIC_DIR);

  let statusByFilename = new Map<string, string>();
  let dbReachable = true;
  try {
    const { rows } = await query<{ filename: string; status: string }>(
      "SELECT filename, status FROM documents WHERE filename = ANY($1)",
      [files.map((f) => f.filename)],
    );
    statusByFilename = new Map(rows.map((row) => [row.filename, row.status]));
  } catch {
    dbReachable = false;
  }

  res.json({
    files: files.map((file) => ({
      ...file,
      vectorizationStatus: dbReachable
        ? (statusByFilename.get(file.filename) ?? "not_started")
        : "unknown",
    })),
  });
}

export function deleteUpload(req: Request, res: Response, next: NextFunction): void {
  const { filename } = req.params;

  if (!isValidStoredFilename(filename)) {
    const error: HttpError = new Error("Invalid filename");
    error.status = 400;
    next(error);
    return;
  }

  const deleted = deleteStoredFile(PUBLIC_DIR, filename);
  if (!deleted) {
    const error: HttpError = new Error("File not found");
    error.status = 404;
    next(error);
    return;
  }

  res.status(200).json({ success: true });
}
