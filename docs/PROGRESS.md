# Project Progress — Checkpoints

A running record of what's built and what remains. Newest checkpoint on top.

---

## ✅ Checkpoint — 2026-10-15 (current, post-verification)

### This checkpoint's work
- **Routes restructured to nested:** `/dashboard/apply`, `/dashboard/assistant` (new dedicated
  chat page), `/dashboard/admin`. `/calculator` stays top-level (no account needed). Legacy
  flat paths (`/apply`, `/assistant`, `/admin`) redirect for back-compat.
- **Fixed a real bug:** the live-quote and plan-list fetches failed silently on error (network
  or server issue) — the UI just showed `—` forever with no explanation. Now shows a clear
  error banner with a **Retry** button, in both Apply and the Calculator.
- **Fixed a stale test:** `agent.test.ts` still asserted exactly 3 tools after the bonus 4th
  tool was added.
- **Full requirements verification run** against the user's 28-item checklist — see
  [`../VERIFICATION_REPORT.md`](../VERIFICATION_REPORT.md) for the complete table, evidence,
  and exact blocked/passed classification. Headline: 10 requirements PASS (automated, run this
  session), 9 PASS (code inspection), 10 BLOCKED (Supabase unreachable from this network during
  this session — confirmed three ways, not a code defect), 1 PASS (historical, not reconfirmed
  this session).
- Removed `docs/DEMO.md` from the repo per request.
- Docs updated: README (frontend routes, new endpoints), `docs/EVAL.md` (6th prompt-injection
  scenario, 4-tool list documented).

### Open item carried forward
- Re-run `npm test` and `npm run eval` once Supabase is reachable again, to move the 10
  BLOCKED items in `VERIFICATION_REPORT.md` to PASS/FAIL with fresh evidence — this is
  especially important because the lead-service and routes were rewritten for B1 hardening
  (idempotency, advisory-lock dedupe) **after** the last confirmed live pass.

---

## ✅ Checkpoint — 2026-10-15 (bonuses + palette)

### Required scope — complete & verified
- **Phase 0 — Scaffold:** npm-workspaces monorepo (server + client), `npm install/dev/test` work.
- **Phase 1 — Maths & validation:** pure `computeQuote` (integer paise + basis-point LTV), shared Zod schemas. 23 unit/edge tests, brief cases 1–6.
- **Phase 2 — Database:** Prisma schema on Supabase (money as `BigInt` paise), migration + seed of the two plans.
- **Phase 3 — API:** 4 endpoints behind a reusable service layer — `GET /loan-schemes`, `POST /quotes`, `POST /leads` (re-computes server-side, 7-day dedupe → 409, unknown plan → 404, 201 with `GL-xxxxxx`), `GET /leads` (newest first, masked, plan filter). Single error contract, 500s as clean JSON, all async wrapped. 8 live-DB API tests.
- **Phase 4 — Apply form:** typed API client, 3-step flow, debounced live `/quotes`, real submit, friendly 409 banner, **per-field validation on blur** with hints + valid/error icons.
- **Phase 5 — Admin:** live `GET /leads`, stat tiles, plan filter, masked mobiles, loading/empty/error states. Reached via a gated **Staff** link in the top header.
- **Phase 6 — AI agent:** `POST /agent/chat|confirm|status`, one OpenAI-SDK loop with **Gemini primary → Groq fallback**, 3 Zod-validated tools on the same services, guardrails + confirm-before-submit gating. Floating Loan Assist widget.
- **Phase 7 — Evals:** `npm run eval` — **5/5 scenarios pass** (happy, missing field, net>gross, duplicate 409, off-topic) against live models + DB.
- **Phase 8 — Docs:** README, AI_LOG (2 prompts + a real floor-vs-round bug), EVAL.md, this file.

### Tests
- **35 backend tests pass** (maths, validation, edge cases, API 400/404/409, agent tools).
- **Agent eval 5/5** with live models.

### LLM models — verified live 2026-10-15
- Old names were **deprecated/404**. Verified replacements:
  - Primary: **`gemini-2.5-flash`**
  - Fallback (Groq): **`openai/gpt-oss-20b`**
- `env.ts` coerces the old names (`gemini-2.0-flash`, `llama-3.3-70b-versatile`) to the live defaults.
- Re-check anytime by hitting each provider's `/models` endpoint with your key (see README).

### UI / UX
- Aurum identity (Fraunces + Plus Jakarta Sans), light default + enhanced dark mode (persisted, toggle).
- Public **landing** (hero + animation, partners, why, how-it-works, FAQ) and public **`/calculator`** (slider, tenure, EMI/interest/total breakdown, principal-vs-interest bar, today's rate).
- **App shell** (`/apply`, `/calculator`, `/admin`) with Apply/Calculator/Staff in the top header; floating Loan Assist.

---

## ✅ Bonuses implemented (maxes the +15 cap)

- **B1 — Harden backend (complete):**
  - `Idempotency-Key` on `POST /leads` — replays the original response (brief case 7).
  - **Race-safe duplicates** — per-mobile `pg_advisory_xact_lock` in a transaction; parallel
    requests give exactly one 201 + one 409 (brief case 8).
  - **Status workflow** `SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED` with a transition guard and
    a `LeadStatusAudit` row per change; endpoints `PATCH /leads/:id/status`, `GET /leads/:id/audit`,
    plus status controls in the admin UI.
  - **Cached gold-rate endpoint** `GET /gold-rate` (60s TTL).
- **B2 — Smarter agent (partial):** 4th tool `check_existing_application`; a **prompt-injection**
  eval scenario (6/6); the system prompt refuses override attempts. (Streaming not done.)
- **B4 — Ops (partial):** **rate limit** on `/leads` (20/min/IP), **GitHub Actions CI**
  (`.github/workflows/ci.yml`, spins its own Postgres), **`ARCHITECTURE.md`**, **Vercel** config +
  `docs/DEPLOY.md`. Docker skipped (deploying on Vercel).

Bonus tests live in `server/tests/bonus.test.ts` (idempotency, parallel race, status workflow, gold-rate).

## ⬜ Left to do
- **Deliberately skipped** (lowest ROI, over the +15 cap): B3 appraisal-slip OCR, plain-English
  admin filter; B2 streamed replies; pagination on `GET /leads`.
- Final fresh-clone smoke test (`npm install && npm run dev && npm test`) once the DB is reachable.
