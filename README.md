# Gold Loan Portal with AI Agent

A production-minded gold-loan intake portal. Borrowers get a preliminary offer two ways —
a guided 3-step form or an AI chat assistant — and **both paths run on the same validated
backend and produce identical numbers**.

> TGLOBAL junior full-stack assignment. Design docs in [`docs/`](docs/):
> [plan](docs/ASSIGNMENT_PLAN.md) · [TRD](docs/TRD.md) · [UI/UX & flow](docs/UIUX_AND_FLOW.md) ·
> [agent evals](docs/EVAL.md).

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
docs/     plan, TRD, UI/UX & flow, architecture, deploy, agent evals, progress
```

## Status
Required scope complete and verified end to end. **35 backend tests pass** (maths cases 1–6,
LTV cap, 400/404/409, masking, agent tools) and the **agent eval passes 5/5** against live
models + Supabase. Running checkpoints are in [`docs/PROGRESS.md`](docs/PROGRESS.md).

### LLM models
Verified live on 2026-10-15: **`gemini-2.5-flash`** (primary), **`openai/gpt-oss-20b`** (Groq
fallback). Earlier names were retired by the providers; `server/src/lib/env.ts` coerces the old
names to the live defaults. To re-check which models your key can use, list them from each
provider: `GET https://api.groq.com/openai/v1/models` (Bearer key) and
`GET https://generativelanguage.googleapis.com/v1beta/models?key=…`.

## Bonuses implemented
- **Idempotency-Key** on `POST /leads` (replays the original response — case 7).
- **Race-safe duplicates** via a per-mobile advisory lock (parallel → one 201 + one 409 — case 8).
- **Status workflow** `SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED` + audit log, with admin controls.
- **Cached gold-rate endpoint** `GET /gold-rate`.
- **Agent:** 4th tool `check_existing_application`; prompt-injection resistance (eval 6/6).
- **Ops:** rate limit on `/leads`, **GitHub Actions CI** (own Postgres), `ARCHITECTURE.md`, Vercel config + `docs/DEPLOY.md`. Provider fallback Gemini → Groq.
- Skipped (low ROI, over the +15 cap): slip OCR, NL admin filter, streaming, pagination.

## What I'd do with more time
- Finish B1: `Idempotency-Key` on `POST /leads`, a DB unique constraint for race-safe dedupe,
  and the status workflow endpoints with the audit log.
- Add streaming agent replies and a `check_existing_application` tool (B2).
- Dockerise (`docker compose up`) and add a GitHub Actions test run (B4).
- A small landing page and a light admin auth gate.
- Swap the random `GL-` id for a DB sequence if strictly sequential ids are wanted.
