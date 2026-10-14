import cors from "cors";
import express from "express";
import { errorMiddleware } from "./lib/errors.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Phase 1+: mount /api/v1 routers here (loan-schemes, quotes, leads, agent).

  // Error middleware must be last.
  app.use(errorMiddleware);
  return app;
}
