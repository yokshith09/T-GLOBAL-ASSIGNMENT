# Deploying

## Vercel (recommended — one project, frontend + API)

The repo deploys as a **single Vercel project**: the static frontend build plus the Express API
running as one serverless function. No Docker, no second host.

1. Import the GitHub repo in Vercel. Leave **Root Directory** at the repo root (the project's own
   [`vercel.json`](../vercel.json) sets the build command and output directory for you).
2. Set these environment variables in the Vercel project settings:

   | Var | Value |
   |---|---|
   | `DATABASE_URL` | Supabase **Session pooler** connection string (port 5432) |
   | `DIRECT_URL` | Same pooler string — only used if you also run `prisma migrate` from CI/locally |
   | `RATE_24K_PAISE_PER_GRAM` | `700000` |
   | `GEMINI_API_KEY` / `GEMINI_MODEL` | your key / `gemini-2.5-flash` |
   | `GROQ_API_KEY` / `GROQ_MODEL` | your key / `openai/gpt-oss-20b` |
   | `VITE_API_BASE_URL` | `/api/v1` — **relative**, since the API now lives on the same domain |

   **Important:** check the environment checkboxes on every var — Vercel scopes each one to
   Production / Preview / Development independently, and a var saved with only "Preview" ticked
   will not exist in your live site's build, which is a very easy mistake to make and produces
   confusing failures (the live site silently falling back to `localhost:4000`, or the API
   function crashing because `DATABASE_URL` is empty). Tick **Production** on every var above.
3. Deploy. `vercel.json`'s `buildCommand` runs `prisma generate` before building the client, so
   the API function has a generated Prisma Client to import.
4. Run the migration once against your Supabase database from wherever you can reach it
   (locally, or let `npm run eval`'s CI job apply it): `npx prisma migrate deploy --schema
   server/prisma/schema.prisma`, then `npm run db:seed`.
5. **After changing any env var, redeploy** (Deployments → ⋯ → Redeploy). Vite inlines
   `VITE_*` vars at build time, and the API function only reads `process.env` fresh on a new
   build/deploy — saving a variable alone does not update an already-built deployment.

### How it's wired
- `api/index.ts` is a single named Vercel Serverless Function. `vercel.json` explicitly
  rewrites every request under `/api/*` to it (`"/api/(.*)" → "/api"`), and it exports the
  **same Express app** (`server/src/app.ts`) used for local dev — no route duplication, no
  behaviour difference. Vercel preserves the original path as `req.url` on a rewrite, so the
  app's own `/api/v1/...` routing matches exactly as it does on `localhost:4000`.
  (An earlier version of this file was named `api/[...path].ts` — Next.js's bracket catch-all
  convention, which doesn't reliably apply on a plain, non-Next.js Vercel project and produced a
  404 on every request. See `AI_LOG.md` for the full story.)
- `vercel.json`'s second rewrite sends every non-`/api` path to `index.html`, so client-side
  routes (`/dashboard/apply`, `/calculator`, …) work on refresh and on a shared link.
- Prisma + Supabase's pooled connection (`pgbouncer=true`) is the standard, supported pairing
  for serverless — each function invocation borrows a pooled connection rather than opening a
  fresh one.

### The one caveat serverless shares with any host
If your own network can't reach the Supabase pooler on port 5432 (see the note in the main
README), that's a property of *your* network, not of Vercel — Vercel's own servers reach
Supabase fine. Deployed functions are not affected by a developer's local connectivity.

## Alternative: frontend on Vercel, API on a separate Node host

If you'd rather keep the API on a traditional long-running Node process (Render, Railway, Fly),
[`client/vercel.json`](../client/vercel.json) deploys just the frontend (Root Directory =
`client/`). Point `VITE_API_BASE_URL` at the other host's `/api/v1`, and on that host: build
`npm install && npm run build`, start `npm start`, and set the same env vars as above (minus
`VITE_API_BASE_URL`). Run the migration + seed there too.

## Troubleshooting a Vercel deploy

| Symptom | Likely cause | Fix |
|---|---|---|
| "Couldn't load loan plans", network tab shows a request to `localhost:4000` | `VITE_API_BASE_URL` wasn't applied to this build | Check it's set for **Production**, then redeploy |
| Request reaches `yoursite.vercel.app/api/...` but returns **404** | The API function isn't being found/routed | Confirm `api/index.ts` exists (not a bracket-named file) and `vercel.json`'s `/api/(.*)` rewrite is present |
| Request returns **500** with Vercel's own "FUNCTION_INVOCATION_FAILED" page (not our JSON error body) | The function crashed on startup — almost always `DATABASE_URL` missing/empty in Production, or `@prisma/client` not generated for this build | Check every backend env var has **Production** ticked; confirm `vercel.json`'s `buildCommand` includes `prisma generate` |
| Request returns **500** with our own JSON body (`{"error":{"code":"INTERNAL_ERROR",...}}`) | The function started fine but a request-time call failed (e.g. Supabase unreachable) | Check the Function's runtime logs in the Vercel dashboard for the real error |

## CORS
The API currently enables permissive CORS for the demo (`server/src/app.ts`). On the unified
Vercel deployment this isn't even exercised (frontend and API share an origin); if you deploy
the API separately, restrict CORS to your frontend's actual origin before sharing the link
widely.
