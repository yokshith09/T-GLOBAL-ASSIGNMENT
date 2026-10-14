import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodSchema } from "zod";

export type FieldError = { field: string; message: string };

/** Single error shape for the whole API: { error: { code, message, fields[], ...extra } } */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldError[] = [],
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields: FieldError[] = []) =>
  new AppError(400, "VALIDATION_ERROR", message, fields);
export const notFound = (message: string) => new AppError(404, "SCHEME_NOT_FOUND", message);
export const conflict = (message: string, extra: Record<string, unknown> = {}) =>
  new AppError(409, "DUPLICATE_LEAD", message, [], extra);

/** Parse with Zod or throw a 400 whose fields[] carry per-field messages. */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw badRequest("One or more fields are invalid.", toFieldErrors(result.error));
}

function toFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((i) => ({ field: i.path.join(".") || "_root", message: i.message }));
}

/** Wrap async handlers so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** Global error middleware. 500s are JSON with no stack trace. */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields, ...err.extra },
    });
  }
  console.error("[INTERNAL_ERROR]", err instanceof Error ? err.message : err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong.", fields: [] },
  });
}
