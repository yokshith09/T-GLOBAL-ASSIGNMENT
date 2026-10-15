import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errors.js";

// ponytail: in-memory fixed-window limiter, fine for a single instance. Swap for
// Redis if this ever runs multi-process.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Limit each client (IP) to `max` requests per `windowMs`. 429 on exceed. */
export function rateLimit(max: number, windowMs: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now > b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (b.count >= max) {
      throw new AppError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
    }
    b.count++;
    next();
  };
}
