# AI_LOG

How AI tools were used on this assignment, and where they were wrong.

## Tools used
- **Claude Code (Claude Opus)** — scaffolding, API/service design, the agent, UI, tests, docs.
- Supabase (managed Postgres) and Google Gemini / Groq power the running app, not the authoring.

## Which LLM runs the agent
- **Primary:** Google Gemini (`gemini-2.0-flash`), called via its OpenAI-compatible endpoint.
- **Fallback:** Groq (`llama-3.3-70b-versatile`).
- One OpenAI-SDK tool-calling loop drives both (just a different base URL + key + model).
- Keys live in the server `.env` only; the browser never sees them — all LLM calls go through
  `POST /api/v1/agent/chat`.

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
