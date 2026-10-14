import type { NextFunction, Request, Response } from "express";

export type FieldError = { field: string; message: string };

/** Single error shape for the whole API: { error: { code, message, fields[] } } */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldError[] = [],
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields: FieldError[] = []) =>
  new AppError(400, "VALIDATION_ERROR", message, fields);
export const notFound = (message: string, fields: FieldError[] = []) =>
  new AppError(404, "SCHEME_NOT_FOUND", message, fields);
export const conflict = (message: string, fields: FieldError[] = []) =>
  new AppError(409, "DUPLICATE_LEAD", message, fields);

/** Wrap async handlers so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** Global error middleware. 500s are JSON with no stack trace. */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
  }
  // Unknown error: log server-side, return a clean JSON 500.
  console.error("[INTERNAL_ERROR]", err instanceof Error ? err.message : err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong.", fields: [] },
  });
}
