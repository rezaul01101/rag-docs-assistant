import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface UploadedFileMeta {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export const PUBLIC_DIR_NAME = "public";
export const PUBLIC_ROUTE = "/public";

export const ALLOWED_MIME_TYPES = ["application/pdf", "text/plain"];
export const ALLOWED_EXTENSIONS = [".pdf", ".txt"];
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 10;

export const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

const STORED_FILENAME_PATTERN = /^\d+__[0-9a-f-]{36}__(.+)$/;

export function isAllowedUpload(mimetype: string, originalName: string): boolean {
  const extension = path.extname(originalName).toLowerCase();
  return (
    ALLOWED_MIME_TYPES.includes(mimetype) && ALLOWED_EXTENSIONS.includes(extension)
  );
}

export function buildStoredFilename(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${Date.now()}__${crypto.randomUUID()}__${base || "file"}${extension}`;
}

export function toDisplayName(storedFilename: string): string {
  const match = STORED_FILENAME_PATTERN.exec(storedFilename);
  return match ? match[1] : storedFilename;
}

export function toUploadedFileMeta(file: Express.Multer.File): UploadedFileMeta {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: `${PUBLIC_ROUTE}/${file.filename}`,
    uploadedAt: new Date().toISOString(),
  };
}

export function listStoredFiles(publicDir: string): UploadedFileMeta[] {
  const entries = fs.readdirSync(publicDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
    .map((entry) => {
      const stat = fs.statSync(path.join(publicDir, entry.name));
      const extension = path.extname(entry.name).toLowerCase();
      return {
        originalName: toDisplayName(entry.name),
        filename: entry.name,
        mimetype: MIME_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream",
        size: stat.size,
        url: `${PUBLIC_ROUTE}/${entry.name}`,
        uploadedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function isValidStoredFilename(filename: string): boolean {
  return (
    filename.length > 0 &&
    filename !== ".gitkeep" &&
    path.basename(filename) === filename
  );
}

export function deleteStoredFile(publicDir: string, filename: string): boolean {
  const fullPath = path.join(publicDir, filename);
  if (!fs.existsSync(fullPath)) return false;
  fs.unlinkSync(fullPath);
  return true;
}
