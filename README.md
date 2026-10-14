# Gold Loan Portal with AI Agent

A production-minded gold-loan intake portal. Borrowers get a preliminary offer two ways —
a guided 3-step form or an AI chat assistant — and **both paths run on the same validated
backend and produce identical numbers**.

> TGLOBAL junior full-stack assignment. Requirements live in [`docs/`](docs/)
> ([plan](docs/ASSIGNMENT_PLAN.md), [TRD](docs/TRD.md), [UI/UX & flow](docs/UIUX_AND_FLOW.md)).

## Stack
- **Backend:** Node + Express + TypeScript, Zod validation, Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind
- **Tests:** Vitest + Supertest
- **Database host:** Supabase (managed PostgreSQL)
- **LLM:** Google Gemini (primary) with Groq fallback — all calls server-side

## Prerequisites
- Node.js ≥ 20
- A Supabase project (free tier is fine). Copy its connection strings into `.env`
  (`DATABASE_URL` = pooled 6543, `DIRECT_URL` = direct 5432).

## Setup
```bash
# 1. Install (root installs both workspaces)
npm install

# 2. Configure env
cp .env.example .env
#   - set DATABASE_URL to your Postgres
#   - add GEMINI_API_KEY (primary) and/or GROQ_API_KEY (fallback) for the agent

# 3. Database (once a DB is reachable)
npm run db:migrate      # apply Prisma migrations
npm run db:seed         # seed the two loan schemes

# 4. Run everything (API on :4000, web on :5173)
npm run dev

# 5. Tests
npm test                # unit (maths) + API (400/409) tests
npm run eval            # agent test conversations (Part B)
```

## Environment variables
See [`.env.example`](.env.example). Never commit real keys — LLM keys are read on the
backend only and never reach the browser.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase pooled Postgres connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432), used by migrations |
| `PORT` | API port (default 4000) |
| `RATE_24K_PAISE_PER_GRAM` | Mock 24K gold rate in paise (700000 = ₹7,000/g) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Primary LLM |
| `GROQ_API_KEY` / `GROQ_MODEL` | Fallback LLM |
| `VITE_API_BASE_URL` | API base the frontend calls |

## Project layout
```
server/   Express API, Prisma schema + seed, services, agent, tests
client/   React + Vite SPA (apply flow, chat panel, admin)
docs/     PRD-derived plan, TRD, UI/UX & flow
```

## Status
Phase 0 (scaffold) complete: both workspaces install and run; `/health` + a passing
Supertest check are in place. Feature phases (maths → DB → API → UI → agent → tests) follow.

## What I'd do with more time
_(fill in at submission)_

## Bonuses attempted
_(list every bonus tried, even if unfinished — required by the brief)_
