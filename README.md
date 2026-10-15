# Gold Loan Portal with AI Agent

A production-minded gold-loan intake portal. Borrowers get a preliminary offer two ways —
a guided 3-step form or an AI chat assistant — and **both paths run on the same validated
backend and produce identical numbers**.

> TGLOBAL junior full-stack assignment. Docs in [`docs/`](docs/):
> [plan](docs/ASSIGNMENT_PLAN.md) · [architecture](docs/ARCHITECTURE.md) ·
> [agent evals](docs/EVAL.md) · [deploy](docs/DEPLOY.md) · [progress log](docs/PROGRESS.md).
> See [`VERIFICATION_REPORT.md`](VERIFICATION_REPORT.md) for a requirement-by-requirement audit.

## Stack
- **Backend:** Node + Express + TypeScript, Zod validation, Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind (shadcn/ui components)
- **Tests:** Vitest + Supertest
- **Database:** Supabase (managed PostgreSQL)
- **LLM:** Google Gemini (primary) with Groq fallback — all calls server-side

## How it's built
The money maths and validation live in a pure, framework-free core (`server/src/domain`,
`server/src/schemas`). A thin **service layer** (`server/src/services`) wraps it, and **both**
the REST API and the AI agent call that same layer — so a lead filed by the chat agent is
identical to one filed through the form. Money is integer **paise** end to end; LTV is applied
in **basis points**, so there is no floating-point rounding error.

```
Form  ─▶ /quotes, /leads ─┐
                          ├─▶ services (computeQuote, createLead) ─▶ Prisma ─▶ Postgres
Agent ─▶ tools ───────────┘   (same code path, same numbers)
```

## Prerequisites
- Node.js ≥ 20
- A Supabase project (free tier is fine) — copy its connection string into `.env`.

## Setup
```bash
# 1. Install (root installs both workspaces)
npm install

# 2. Configure env
cp .env.example .env
#   - set DATABASE_URL (and DIRECT_URL) to your Supabase connection string
#   - add GEMINI_API_KEY (primary) and/or GROQ_API_KEY (fallback) for the agent

# 3. Database
npm run db:migrate      # apply Prisma migrations
npm run db:seed         # seed the two loan schemes

# 4. Run everything (API on :4000, web on :5173)
npm run dev

# 5. Tests
npm test                # unit (maths) + API (400/404/409) tests
npm run eval            # agent test conversations (needs an LLM key + DB)
```

> **Supabase networking note:** direct connections (`db.<ref>.supabase.co`) are IPv6-only.
> On an IPv4 network use the **Session pooler** string (`...pooler.supabase.com:5432`) for
> both `DATABASE_URL` and `DIRECT_URL`. Some networks block outbound 5432 — use one that allows it.

## Environment variables
See [`.env.example`](.env.example). LLM keys are read on the **backend only** and never reach
the browser. Never commit real keys — `.env` is gitignored.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase connection (Session pooler, port 5432) |
| `DIRECT_URL` | Connection used by Prisma migrations |
| `PORT` | API port (default 4000) |
| `RATE_24K_PAISE_PER_GRAM` | Mock 24K gold rate in paise (700000 = ₹7,000/g) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Primary LLM |
| `GROQ_API_KEY` / `GROQ_MODEL` | Fallback LLM |
| `VITE_API_BASE_URL` | API base the frontend calls |

## Deployment
The whole app (static frontend + the Express API as a serverless function) deploys as a single
Vercel project — see [`docs/DEPLOY.md`](docs/DEPLOY.md) for the exact steps, a troubleshooting
table for the usual first-deploy snags (env vars scoped to the wrong environment, the function
not being found, a crash on startup), and the one Supabase-networking caveat serverless
functions share with any other host.

## API
Base path `/api/v1`. Errors share one shape: `{ error: { code, message, fields[] } }`.

| Method | Path | Notes |
|---|---|---|
| GET | `/loan-schemes` | Active plans (rate/LTV as %, never above 75%). |
| POST | `/quotes` | Pure calculation, no DB write. |
| POST | `/leads` | Validates, **re-computes server-side**, dedupes (409 within 7 days), 201 with `applicationId`. |
| GET | `/leads` | Newest first, mobile masked, `?schemeId=` filter. |
| POST | `/agent/chat` | Runs the LLM + tools server-side. |
| POST | `/agent/confirm` | Files a lead the user confirmed in chat. |
| PATCH | `/leads/:applicationId/status` | Status workflow transition + audit log entry. |
| GET | `/leads/:applicationId/audit` | Status change history for one lead. |
| GET | `/gold-rate` | Cached 24K rate. |

## Frontend routes
```
/                      Public landing (hero, how it works, FAQ)
/calculator            Public gold-loan calculator (no account needed)
/dashboard/apply       3-step application form
/dashboard/assistant   Dedicated Loan Assist chat page
/dashboard/admin       Leads table (passcode-gated)
```
A floating Loan Assist launcher is also available on every `/dashboard/*` and `/calculator`
page for a quick chat without leaving the current screen.

## Project layout
```
server/   Express API, Prisma schema + seed, domain maths, services, agent, tests
client/   React + Vite SPA (landing, calculator, apply, assistant, admin)
api/      Vercel serverless entry point (wraps the same Express app)
docs/     plan, architecture, deploy, agent evals, progress checkpoints
```

## Status
Required scope complete. **43 backend tests** across maths, validation, the 4 endpoints, the
agent tools, and the B1 bonus hardening (idempotency, race-safe dedupe, status workflow).
**All 28 items on the project's own verification checklist pass** — see
[`VERIFICATION_REPORT.md`](VERIFICATION_REPORT.md) for the full table and how each one was
checked (local test run, CI run, or code inspection). Running checkpoints are in
[`docs/PROGRESS.md`](docs/PROGRESS.md).

### LLM models
Verified live on 2026-10-15: **`gemini-2.5-flash`** (primary), **`openai/gpt-oss-20b`** (Groq
fallback). Earlier names were retired by the providers; `server/src/lib/env.ts` coerces the old
names to the live defaults. To re-check which models your key can use, list them from each
provider: `GET https://api.groq.com/openai/v1/models` (Bearer key) and
`GET https://generativelanguage.googleapis.com/v1beta/models?key=…`.

## Bonuses implemented
- **Idempotency-Key** on `POST /leads` (replays the original response — case 7). Verified by CI.
- **Race-safe duplicates** via a per-mobile advisory-lock transaction (parallel → one 201 + one 409 — case 8). Verified by CI.
- **Status workflow** `SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED` + audit log, with admin
  status controls. Verified by CI, including the cascade-delete fix CI's own run surfaced.
- **Cached gold-rate endpoint** `GET /gold-rate`.
- **Agent:** 4th tool `check_existing_application`; a prompt-injection scenario is written into
  `npm run eval` (6 scenarios total) but has not yet had a fresh live run against the current
  code — see [`VERIFICATION_REPORT.md`](VERIFICATION_REPORT.md) for exactly what's confirmed.
- **Ops:** rate limit on `/leads`, **GitHub Actions CI** (own Postgres, so it's not at the mercy
  of a developer's network), `ARCHITECTURE.md`, and a working **Vercel** deployment (frontend +
  API as a serverless function) — see `docs/DEPLOY.md`.
- Skipped (low ROI, over the brief's +15 bonus cap): appraisal-slip OCR, a plain-English admin
  filter, streamed agent replies, pagination on `GET /leads`.

## What I'd do with more time
- Run `npm run eval`'s 6th (prompt-injection) scenario live and fold the result into
  `VERIFICATION_REPORT.md`.
- A real admin login (Supabase Auth) in place of the passcode gate, which is cosmetic only.
- B3: appraisal-slip OCR and a plain-English admin lead filter.
- B2: streamed agent replies.
- Pagination on `GET /leads`.
- Swap the random `GL-` id for a DB sequence if strictly sequential ids are wanted.
