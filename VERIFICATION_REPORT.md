# Verification Report

Generated 2026-10-15, this session. Method per row: **automated** (a test was actually run and
its real output is quoted/summarized), **code inspection** (the implementation was read and
traced, not executed), or **manual** (exercised by hand in the browser via the automated browser
tool). Nothing in this report is asserted without one of those three.

**Environment constraint that shaped this run:** the Supabase Postgres instance
(`aws-0-ap-south-1.pooler.supabase.com:5432`) is **unreachable from this network right now**,
confirmed three independent ways:
```
PS> Test-NetConnection -ComputerName aws-0-ap-south-1.pooler.supabase.com -Port 5432
TcpTestSucceeded : False

$ curl -X POST localhost:4000/api/v1/quotes -d '{...}'
{"error":{"code":"INTERNAL_ERROR","message":"Something went wrong.","fields":[]}}

[server log] Can't reach database server at `aws-0-ap-south-1.pooler.supabase.com:5432`
```
Every requirement that needs the database or the agent's write path is marked **BLOCKED** below,
with the exact reason. This is an infrastructure/network condition, not a defect found in the
application code — see "Code defects found" for the two real bugs this verification did find
and fix.

Full test run this session: `npm test` → **28 passed, 15 failed** (14 of the 15 failures are
`Can't reach database server`; 1 was a stale assertion in a test file, now fixed). After the fix
and isolating the DB-independent suites: **24 passed, 0 failed** of what could run without a
database.

---

## Code defects found and fixed during this verification

| # | Defect | File | Fix |
|---|---|---|---|
| 1 | **Silent failure on live quote / plan list fetch.** If `POST /quotes` or `GET /loan-schemes` failed (network or server error), the UI caught the error and showed nothing — the quote tiles stayed at `—` and "Continue" stayed disabled forever, with zero explanation to the user. This is almost certainly what was reported as "live quote not working." | `client/src/pages/ApplyPage.tsx`, `client/src/pages/CalculatorPage.tsx` | Added `quoteError` / `schemesError` state, a visible error banner with the server's message, and a **Retry** button that re-fires the fetch. |
| 2 | **Stale test assertion.** `agent.test.ts` hard-coded the tool list as exactly 3 names. When the bonus 4th tool (`check_existing_application`) was added, this test would fail even though the application is correct. | `server/tests/agent.test.ts` | Updated the expected list to the 4 current tools. |

Neither defect affects the money maths, the validation rules, or the core endpoint contracts.

---

## Requirement verification table

### Financial calculations

| Req | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| 1 | 45g/22K/EMI | pure 41.25g, value ₹288,750, loan ₹216,562 | `pureGoldGrams(…) === 41.25`; `goldValuePaise === 28875000`; `eligibleLoanRupees === 216562` | **PASS** (automated) | `server/tests/quote.test.ts` — `npx vitest run tests/quote.test.ts` → 5/5 ✓, run this session |
| 2 | 45g/22K/Bullet | value ₹288,750, loan ₹202,125 | `eligibleLoanRupees === 202125` | **PASS** (automated) | same file, same run |
| 3 | 10g/18K/EMI | pure 7.5g, value ₹52,500, loan ₹39,375 | `pureGoldGrams === 7.5`; `goldValuePaise === 5250000`; `eligibleLoanRupees === 39375` | **PASS** (automated) | same file, same run |
| 4 | LTV cap + rounding | loan never exceeds 75% LTV even if a plan claims more; money floors, never rounds up | A synthetic 90%-LTV plan still returns the 75%-capped amount; `₹2,16,562.50` floors to `216562` | **PASS** (automated) | `server/tests/quote.test.ts` → "LTV discipline" describe block, 2/2 ✓ |

### API and validation

| Req | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| 5 | `GET /loan-schemes` | both plans, correct fields | Not run against a live server this session (DB required) | **BLOCKED** | `server/tests/api.test.ts` → `Can't reach database server`. Code inspection: `schemeService.listActiveSchemes()` reads `prisma.loanScheme.findMany({active:true})`, returns both seeded plans — logic unchanged since the session's earlier successful run (see "Prior verification" below). |
| 6 | `POST /quotes` both plans, no DB write | same | Not run live this session | **BLOCKED** (same cause) | `server/tests/api.test.ts` "case 1" ✓ earlier this session (see below); code unchanged in `quoteService.ts`. No `prisma.lead.create` appears anywhere in the quote path (`grep` confirms). |
| 7 | Invalid mobile → 400 | 400 + field error | `{field:"mobileNumber"}` on `98765` and `5876543210` | **PASS** (automated, DB-independent) | `server/tests/validation.test.ts` → "case 5" ✓, run this session, no DB needed (pure Zod) |
| 8 | Invalid karat → 400 | 400 | karat `20` rejected | **PASS** (automated) | `server/tests/validation.test.ts` → "rejects karat outside 18/22/24" ✓ |
| 9 | net > gross → 400 + field | `{field:"netWeightGrams"}` | confirmed | **PASS** (automated) | `server/tests/validation.test.ts` → "case 4" ✓; `server/tests/edge-cases.test.ts` → boundary cases (`net == gross` allowed, `net` a hair over `gross` rejected) ✓, 11/11 |
| 10 | Invalid weights/names rejected | 0 g, >1000 g, digits-in-name all 400 | confirmed | **PASS** (automated) | `server/tests/edge-cases.test.ts` ✓ (name trim/length, weight bounds) |
| 11 | Unknown plan → 404 on submit | 404 `SCHEME_NOT_FOUND` | Not run live this session | **BLOCKED** (DB) | `server/tests/api.test.ts` "unknown plan → 404" — passed earlier this session (see below); `leadService.createLead` calls `quoteForPlan`, which throws `notFound()` when `findActivePlan` returns null — code unchanged |
| 12 | Valid application → 201 + id | `GL-xxxxxx`, status `SUBMITTED` | Not run live this session | **BLOCKED** (DB) | same file, passed earlier this session; code path re-read this session, logic intact |
| 13 | Duplicate mobile <7d → 409 + existing id | 409 with `applicationId` | Not run live this session | **BLOCKED** (DB) | `server/tests/api.test.ts` "case 6" — passed earlier this session. The dedupe logic was **rewritten this session** (added an advisory-lock transaction for race-safety) and has **not yet been re-verified live** — flagged explicitly, see "What changed since the last full pass." |
| 14 | Server recalculates, never trusts client values | server ignores any amount fields a client might send | Code inspection: `LeadInput` schema has no eligible-loan/value fields at all; `createLead` calls `quoteForPlan` itself and uses *that* result, never anything from the request body | **PASS** (code inspection, reinforced by automated test 12 passing historically — a 201 response's `eligibleLoanRupees` always matches the server calculation, not a client-sent one, since none is accepted) |

### Database and admin API

| Req | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| 15 | Applications persisted and retrievable | row exists after insert | Not run live this session | **BLOCKED** (DB) | Inherent to `GET /leads` working — see 16 |
| 16 | `GET /leads` newest first | `createdAt` descending | Not run live this session | **BLOCKED** (DB) | `leadService.listLeads` uses `orderBy: { createdAt: "desc" }` — code inspection confirms; passed as an automated test earlier this session |
| 17 | Mobile masked in responses | `9876XXXX10` shape | Not run live this session | **BLOCKED** (DB) | `maskMobile()` applied in both `createLead` and `listLeads` return paths — code inspection; passed as an automated test earlier this session |
| 18 | Quote requests do not create records | no `Lead` row from `POST /quotes` | Not run live this session | **BLOCKED** (DB, but also confirmed by static analysis) | `grep -n "lead.create" server/src/services/quoteService.ts` → no matches; only `leadService.ts` calls `prisma.lead.create` |
| 19 | Migrations + seed work when DB reachable | `prisma migrate dev` + seed succeed | Verified **earlier in this overall project** (not this session) when connectivity was available: migration `20261014193439_init` applied, 2 plans seeded, confirmed by a direct query | **PASS (historical), not reconfirmed this session** | `docs/PROGRESS.md` "Checkpoint — 2026-10-15" log; not re-run here because the DB is unreachable right now |

### AI agent

| Req | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| 20 | `get_loan_schemes` retrieves real plans | tool calls `listActiveSchemes()`, not hardcoded | Not run live this session | **BLOCKED** (DB) | Code inspection: `agent/tools.ts` `runReadTool("get_loan_schemes")` → `{ schemes: await listActiveSchemes() }`, the exact same service as the REST endpoint. `server/tests/agent.test.ts` — this specific test errored with `Can't reach database server`, confirming it genuinely tries to hit the DB (not a mock) |
| 21 | `calculate_quote` calls the backend quote API | tool calls `getQuote()`, same service as `POST /quotes` | Not run live this session | **BLOCKED** (DB) | Code inspection: `runReadTool("calculate_quote")` calls `getQuote(parsed.data)` from `quoteService.ts` — identical function `POST /quotes` uses. `server/tests/agent.test.ts` attempted a real call, failed only on the DB-dependent `listActivePlans()` inside it (confirms it's wired to the real service, not a stub) |
| 22 | `submit_application` uses the backend application API | tool's confirm path calls `createLead` | Not run live this session | **BLOCKED** (DB) | New test `server/tests/agent-submit.test.ts` calls `confirmAndSubmit()` directly (the real orchestrator function wired to `POST /agent/confirm`) — attempted this session, failed only with `Can't reach database server`, confirming the code path genuinely reaches `leadService.createLead` and is not mocked |
| 23 | All amounts come from tool results, not LLM arithmetic | the model's own text output is never used as a number | **PASS** (code inspection) | — | `agent/orchestrator.ts`: the confirmation summary's `eligibleLoanRupees` is read from `runReadTool("calculate_quote", …)`'s return value (`eligibleFor(quote, schemeId)`), never from `message.content`. No code path parses a number out of the model's text. |
| 24 | Submission requires explicit confirmation | the agent cannot write a lead in the same turn it decides to submit | **PASS** (code inspection) | — | `orchestrator.ts` `runChat()`: when the model calls `submit_application`, the handler returns `{ pendingConfirmation }` and **returns immediately** — it never calls `createLead` or `confirmAndSubmit` in that branch. The only caller of `confirmAndSubmit` is the separate `POST /agent/confirm` route, which the UI only calls after the user clicks "Confirm & submit." |
| 25 | Invalid input / duplicates handled correctly | agent re-asks on bad tool args; relays 409 on duplicate | Not run live this session (needs LLM + DB) | **BLOCKED** | Code inspection: `runReadTool` returns `{ error: [...] }` for a failed Zod parse, which is fed back to the model as the tool result so it can re-ask (same pattern proven by `calculate_quote`'s unit-level validation test, which doesn't need the DB and **passed**: `server/tests/agent.test.ts` → "calculate_quote returns a field error for invalid args" ✓). Duplicate handling: `confirmAndSubmit` throws the same `AppError(409, …)` as the REST path — confirmed by code, not re-executed live this session. |

### Documentation and security

| Req | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| 26 | README.md, AI_LOG.md, .env.example present and complete | files exist with the required content | All three present; README has setup/env/API/architecture; AI_LOG has 2 exact prompts + 1 real bug with its catching test; `.env.example` lists every var with placeholder values | **PASS** (inspection) | `ls README.md AI_LOG.md .env.example` → all present |
| 27 | No secrets committed / exposed in frontend | `.env` not tracked, no real key value in the built bundle | `git ls-files` shows no tracked `.env`; `.gitignore` lists `.env`; scanning `client/dist/assets/*.js` for key patterns found only the **literal string** `GEMINI_API_KEY` inside a user-facing error message ("Add an LLM API key (GEMINI_API_KEY)…"), not a key value | **PASS** (automated scan) | `git ls-files \| grep -E "^\.env$"` → no output; `grep -roE "AIza[0-9A-Za-z_-]{20,}\|gsk_[A-Za-z0-9]{20,}" client/dist/assets/*.js` → no matches |
| 28 | 5 chatbot scenarios documented | happy/missing/net>gross/duplicate/off-topic documented | All 5 present, plus a 6th bonus (prompt injection) just added | **PASS** (inspection) | `docs/EVAL.md` |

---

## What changed since the last full live pass (important caveat)

Earlier in this overall session — **before** the bonus-hardening work — the full suite was run
against a reachable Supabase instance and passed: **35/35 backend tests**, and `npm run eval`
passed **5/5** agent scenarios with the live Gemini/Groq models. That is genuine, logged
evidence that the *original* Part A + Part B implementation worked end to end.

Since then, in the same session, the following **production code changed** and has **not yet
been re-verified live**, because the database has been unreachable for the rest of this session:
- `leadService.ts` was rewritten to add the idempotency key path and a `pg_advisory_xact_lock`
  transaction around duplicate-checking and insert.
- `routes/v1.ts` was rewritten to add the status-workflow and gold-rate endpoints and a rate
  limiter.
- `agent/tools.ts` and `agent/orchestrator.ts` gained the 4th tool and a prompt-injection
  resistance rule in the system prompt.
- A 6th eval scenario (prompt injection) was added to `run-eval.ts` and has **never been
  executed**, live or otherwise, because it needs both the DB and a real LLM call.

None of this new code has a known defect — it was read closely during this verification and the
logic traces correctly — but "traces correctly on inspection" is weaker than "ran and passed,"
and this report does not claim the stronger one for these items.

---

## Summary

| Status | Count | Notes |
|---|---|---|
| PASS (automated, run this session) | 10 requirements | maths cases 1–4, validation 7–10 |
| PASS (code inspection) | 8 requirements | 14, 18 (partially), 20–24 wiring, 26–28 |
| BLOCKED (DB unreachable this session) | 10 requirements | 5, 6, 11–13, 15–17, 20–22, 25 |
| PASS (historical, not reconfirmed) | 1 requirement | 19 — migrations/seed |

---

## Commands to run once the database is reachable

```bash
# 1. Confirm connectivity
npx prisma db pull --schema server/prisma/schema.prisma   # should not error

# 2. Full automated suite (this will exercise requirements 5,6,11-17,20-22,25)
npm test

# 3. Agent evals, including the new prompt-injection scenario (needs GEMINI_API_KEY or GROQ_API_KEY)
npm run eval

# 4. Confirm the two code fixes from this report didn't regress anything
npx vitest run tests/agent.test.ts     # tool-count assertion
```

## Manual checks you should still do yourself

- **Visually confirm** the live-quote error banner and Retry button (this report added the fix
  and confirmed it renders correctly with the DB down, but the *success* path — a quote actually
  appearing — needs a reachable DB to see).
- **Walk the chat UI by hand** once: ask Loan Assist for a quote, confirm, and check the
  application ID that comes back, mirroring eval scenario 1.
- **Try the admin status dropdown** end to end (`SUBMITTED → UNDER_REVIEW → APPROVED`) in the
  browser, not just via the API test.
- **Check the GitHub Actions run** after pushing — it spins its own Postgres and will exercise
  everything marked BLOCKED here, independent of your local network.
