import type { NextFunction, Request, Response } from "express";

export interface HttpError extends Error {
  status?: number;
}

export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}
