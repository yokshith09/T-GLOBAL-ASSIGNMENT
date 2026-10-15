# Architecture

## One idea

Both the form and the AI agent call the **same service layer**, so a lead filed by chat is
identical to one filed by the form. Money is integer **paise** end to end; LTV is applied in
**basis points**, so there is no floating-point rounding. The maths and validation live in a
pure, framework-free core that is unit-tested without a server or database.

```
                     ┌──────────────────────────────────────────────┐
  Browser            │  client (React + Vite + Tailwind)            │
                     │  Landing · Apply (3-step) · Calculator ·     │
                     │  Admin · Floating Loan Assist                │
                     └───────────────┬───────────────┬──────────────┘
                        REST /api/v1 │               │ POST /api/v1/agent/*
                     ┌───────────────▼───────────────▼──────────────┐
  server (Express)   │  routes → controllers                        │
                     │                     ┌────────────────────┐   │
                     │  /quotes  ──────────▶│                    │   │
                     │  /leads   ──────────▶│  SERVICE LAYER      │   │
                     │  agent tools ───────▶│  quoteService      │   │
                     │                      │  leadService       │   │
                     │  LLM loop (Gemini → Groq)  schemeService  │   │
                     │   get_loan_schemes / calculate_quote /    │   │
                     │   check_existing_application /            │   │
                     │   submit_application (gated by UI confirm)│   │
                     │                     └─────────┬──────────┘   │
                     │  domain: computeQuote (paise, bps) · Zod     │
                     └────────────────────────────────┬─────────────┘
                                                       │ Prisma
                     ┌─────────────────────────────────▼────────────┐
  Postgres (Supabase)│ LoanScheme · Lead · LeadStatusAudit ·        │
                     │ IdempotencyKey                                │
                     └───────────────────────────────────────────────┘
```

## Layers

- **domain/** — pure functions and types. `computeQuote` (pure gold, gold value, eligible loan),
  `money` (paise helpers). No I/O, fully unit-tested against the brief's cases.
- **schemas/** — Zod schemas shared by the REST routes and the agent tools, so both reject the
  same inputs with the same messages.
- **services/** — `schemeService`, `quoteService`, `leadService`, `rateService`. The only place
  that touches Prisma. Both entry points (REST + agent) go through here.
- **agent/** — `provider` (one OpenAI-SDK loop, Gemini primary → Groq fallback), `tools`
  (definitions + executors), `orchestrator` (tool loop, guardrails, confirm-before-submit gating).
- **routes/** — thin Express routers; `parseOrThrow` maps Zod errors to the 400 contract.
- **lib/** — `errors` (one error shape + async wrapper), `prisma`, `env`, `mask`, `rateLimit`.

## Request flows

**Form quote → submit**
1. `POST /quotes` runs `computeQuote` across active plans. No DB write.
2. `POST /leads` validates, re-computes server-side (client numbers ignored), takes a
   per-mobile advisory lock, checks the 7-day window, inserts, returns `201` with `GL-xxxxxx`.

**Agent**
1. Client posts the conversation to `POST /agent/chat`.
2. The LLM may call `get_loan_schemes` / `calculate_quote` / `check_existing_application` — these
   run for real against the services. It never does arithmetic itself.
3. When it calls `submit_application`, the server **intercepts** it and returns a confirmation
   summary. Nothing is written until the UI posts `POST /agent/confirm`, which calls the same
   `createLead`.

## Key decisions

- **Integer money** (paise + bps) avoids float drift; verified by the brief's expected values.
- **Shared service layer** guarantees "same truth, two paths".
- **Advisory lock** (`pg_advisory_xact_lock(hashtext(mobile))`) serialises concurrent submits for
  a mobile, so parallel requests yield exactly one `201` and one `409`.
- **Idempotency-Key** replays the original response instead of filing twice.
- **Status workflow** (`SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED`) is guarded by a transition
  table and writes a `LeadStatusAudit` row per change.
- **LLM keys stay server-side**; the browser only talks to our API.

## Tech

Node + Express + TypeScript · Prisma + PostgreSQL (Supabase) · React + Vite + Tailwind ·
Vitest + Supertest · Gemini + Groq via the OpenAI SDK.
