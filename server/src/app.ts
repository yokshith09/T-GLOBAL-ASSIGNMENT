import cors from "cors";
import express from "express";
import { errorMiddleware } from "./lib/errors.js";
import { v1 } from "./routes/v1.js";
import { agent } from "./routes/agent.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => res.json({ service: "Gold Loan Portal API", status: "running", health: "ok" }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1", v1);
  app.use("/api/v1/agent", agent);

  // Error middleware must be last.
  app.use(errorMiddleware);
  return app;
}
