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

3. Deploy. `npm install` at the root runs a `postinstall` that generates the Prisma client
   before the API function is bundled — no extra build step needed.
4. Run the migration once against your Supabase database from wherever you can reach it
   (locally, or let `npm run eval`'s CI job apply it): `npx prisma migrate deploy --schema
   server/prisma/schema.prisma`, then `npm run db:seed`.

### How it's wired
- `api/[...path].ts` is a Vercel catch-all function: every request under `/api/*` reaches it,
  and it simply exports the **same Express app** (`server/src/app.ts`) used for local dev — no
  route duplication, no behaviour difference. Vercel forwards the full original path, so the
  app's own `/api/v1/...` routing matches exactly as it does on `localhost:4000`.
- `vercel.json`'s rewrite sends every non-`/api` path to `index.html`, so client-side routes
  (`/dashboard/apply`, `/calculator`, …) work on refresh and on a shared link.
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

## CORS
The API currently enables permissive CORS for the demo (`server/src/app.ts`). On the unified
Vercel deployment this isn't even exercised (frontend and API share an origin); if you deploy
the API separately, restrict CORS to your frontend's actual origin before sharing the link
widely.
