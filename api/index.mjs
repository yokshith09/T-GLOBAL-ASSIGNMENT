// Vercel serverless entry. Plain ESM (.mjs) importing the tsc-compiled server,
// so Vercel never has to transpile the server's ESM TypeScript itself.
// vercel.json rewrites every /api/* request here; req.url keeps the original
// path, so the app's own /api/v1/... routes match exactly as on localhost.
import { createApp } from "../server/dist/app.js";

export default createApp();
