# AI_LOG

How AI tools were used on this assignment, and where they were wrong.

## Tools used
- **Claude Code (Claude Opus)** — scaffolding, API/service design, the agent, UI, tests, docs.
- Supabase (managed Postgres) and Google Gemini / Groq power the running app, not the authoring.

## Which LLM runs the agent
- **Primary:** Google Gemini (`gemini-2.5-flash`), called via its OpenAI-compatible endpoint.
- **Fallback:** Groq (`openai/gpt-oss-20b`).
- One OpenAI-SDK tool-calling loop drives both (just a different base URL + key + model).
- Keys live in the server `.env` only; the browser never sees them — all LLM calls go through
  `POST /api/v1/agent/chat`.
- Model names drift as providers retire old ones — we started with `gemini-2.0-flash` and
  `llama-3.3-70b-versatile`, both since retired (404 from the provider). `server/src/lib/env.ts`
  keeps a small set of known-retired names and falls back to the current default for any of
  them, so an old `.env` keeps working without a manual edit.

## Two exact prompts

### 1. Prompt used for validation
```
Write the shared Zod schemas for this gold-loan API, to be imported by both the REST
routes and the agent tools so they validate identically. Rules from the brief:
 - name: letters and spaces only, 2–60 characters
 - mobileNumber: Indian 10-digit, regex ^[6-9]\d{9}$
 - weights: 0 < netWeightGrams <= grossWeightGrams <= 1000
 - karat must be one of 18, 22, 24
Return per-field messages a UI can show, and put the net<=gross check on the
netWeightGrams path so the error attaches to the right field.
```

### 2. Prompt used for the agent tools
```
Design the 3 function-calling tools for the Loan Assist agent: get_loan_schemes,
calculate_quote(net, gross, karat), submit_application(payload). Hard rules:
 - the model must NEVER do arithmetic itself — every number comes from calculate_quote
 - validate tool arguments with the SAME Zod schemas as the REST API; on invalid args
   return the error to the model so it asks the user to fix it
 - submit_application must NOT write to the DB directly: intercept it so the UI shows a
   confirmation summary, and only file the lead after the user explicitly confirms
 - the agent stays on gold loans, gives no investment advice, promises no approval
Have all three tools call the same service layer the REST endpoints use.
```

## One place the AI got it wrong

**What it did wrong.** In the first draft of `listLeads` (and the lead-created response), the
AI converted stored paise to rupees with a plain division:

```ts
eligibleLoanRupees: Number(lead.eligibleLoanPaise) / 100
```

That is not whole rupees. For the brief's own case 1 the eligible loan is `21,656,250` paise =
`₹2,16,562.50`, and this expression returns the fractional `216562.5` instead of the floored
`216562` the brief requires ("Loan is in whole rupees").

**How I spotted it.** The API test for a valid lead asserts the exact integer:

```ts
expect(res.body.eligibleLoanRupees).toBe(216562);
```

The plain-division version returns `216562.5`, so the test fails on that `.5`.

**The fix and the test that now catches it.** The code was changed to floor through the shared
money helper:

```ts
eligibleLoanRupees: paiseToWholeRupees(Number(lead.eligibleLoanPaise)) // Math.floor(p / 100)
```

Regression coverage: `server/tests/api.test.ts` → "valid lead → 201 with applicationId and
masked mobile" (asserts `216562`), backed by the unit test
`server/tests/quote.test.ts` → "money is whole rupees (floored, never rounded up)" which pins
`₹2,16,562.50 → 216562`.

## A second place the AI got it wrong (deployment)

**What it did wrong.** The first Vercel serverless entry point was named `api/[...path].ts` —
bracket catch-all routing. That naming convention is **Next.js's own file-based router**, not a
guarantee of Vercel's plain Serverless Functions platform. On a non-Next.js project it produced
a consistent **404** on every API request in production, even though the file built and
typechecked cleanly locally.

**How it was spotted.** Not by a test — by reading the actual live deployment's network
requests after the user reported the error, which showed `GET
https://…/api/v1/loan-schemes → 404` instead of reaching the function at all.

**The fix.** Renamed to a plain named function (`api/index.*`, no brackets) and added an explicit
`vercel.json` rewrite (`"/api/(.*)" → "/api"`) so every `/api/*` request is routed to it by name,
with no dependence on bracket-folder inference. This is the standard, unambiguous
"Express-on-Vercel" pattern.

A related second deploy-only issue, same root habit (assuming instead of checking): after the
routing fix the function still crashed on every request (`FUNCTION_INVOCATION_FAILED`). The AI
first guessed Prisma Client generation, but the build log showed generation succeeding, so
that guess was wrong. The real cause: the root `package.json` has no `"type": "module"`, so
Vercel compiled `api/index.ts` as CommonJS while it imported the server's ESM TypeScript, and
the function died on load. Fixed with a plain ESM `api/index.mjs` that imports the
tsc-compiled server (`server/dist`), smoke-tested locally against `/api/v1/gold-rate` before
pushing, then confirmed live (`/api/v1/loan-schemes` → 200).

Neither of these had a meaningful local test to catch them — they're platform-integration
issues, not application-logic ones. The real lesson: deployment plumbing deserves the same "run
it for real before claiming it works" discipline as application code, not just a clean local
`tsc` pass.
