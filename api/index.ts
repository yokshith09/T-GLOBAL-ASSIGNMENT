// Vercel serverless entry point. vercel.json explicitly rewrites every
// /api/* request to this one function (plain named functions, not Next.js's
// [...param] bracket convention, since this isn't a Next.js project). Vercel
// preserves the original request path as req.url when rewriting, so the
// Express app's own "/api/v1/..." routing matches exactly as it does locally
// on :4000 — no path rewriting needed inside the app itself.
import { createApp } from "../server/src/app.js";

const app = createApp();

export default app;
