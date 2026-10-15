// Vercel serverless entry point. A catch-all under /api/* so the same Express
// app (routes already prefixed "/api/v1/...") handles every request exactly
// as it does locally on :4000 — no path rewriting needed, Vercel forwards the
// full original URL as req.url.
import { createApp } from "../server/src/app.js";

const app = createApp();

export default app;
