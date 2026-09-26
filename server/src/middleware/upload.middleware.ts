import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";

import type { HttpError } from "./errorHandler";
import {
  ALLOWED_EXTENSIONS,
  buildStoredFilename,
  isAllowedUpload,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REQUEST,
  PUBLIC_DIR_NAME,
} from "../models/upload.model";

export const PUBLIC_DIR = path.join(process.cwd(), PUBLIC_DIR_NAME);

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PUBLIC_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, buildStoredFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedUpload(file.mimetype, file.originalname)) {
      cb(new Error(`Only ${ALLOWED_EXTENSIONS.join(" and ")} files are allowed`));
      return;
    }
    cb(null, true);
  },
});

export function uploadFiles(req: Request, res: Response, next: NextFunction): void {
  upload.array("files", MAX_FILES_PER_REQUEST)(req, res, (err: unknown) => {
    if (err) {
      const httpError: HttpError =
        err instanceof Error ? err : new Error("File upload failed");
      httpError.status = 400;
      next(httpError);
      return;
    }
    next();
  });
}
