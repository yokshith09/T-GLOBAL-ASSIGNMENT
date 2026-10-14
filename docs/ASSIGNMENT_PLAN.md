# TGLOBAL Hiring Assignment: Gold Loan Portal with AI Agent

Level: Junior Full-Stack Developer (0–2 years). Node.js, React and AI agents.
Time limit: 48 hours. Expected real effort: about 10–14 hours.
Source: `full-stack-developer-intern-at-tglobal (3).pdf`

> Note: the PDF text was extracted with `pdftotext`. A few symbols came out garbled
> (for example `×`, `÷`, `≤`, `–`, `→`, `₹`). The maths below was checked by hand against
> the expected values in the brief, and it matches.

---

## 1. What you have to submit

1. **GitHub repo** where `npm install`, `npm run dev` and `npm test` all work.
2. **README.md** covering:
   - setup steps
   - env vars
   - which LLM you used (and whether it is free or local)
   - every bonus you attempted, even if unfinished
   - what you would do with more time
3. **AI_LOG.md** covering:
   - which AI tools you used and what for
   - 2 exact prompts: one for validation, one for the agent tools
   - 1 specific place where the AI was wrong, how you spotted it, and the test that now catches it
4. **`.env.example`**, with no real keys committed.

Stuck on something? Write down what you tried in the README. The brief says this counts.

---

## 2. Scoring

| Criterion | Weight | What scores well |
|---|---|---|
| Maths & validation | 25 | Test cases 1–6 pass. Money in whole rupees or paise. LTV enforced on the server. |
| AI agent | 25 | 3 working tools. No maths done by the model. Confirmation before submitting. Stays on topic. |
| Full-stack UX | 20 | Clean 3-step flow. Live quote. Usable chat and admin table. Works on mobile. |
| Tests & test conversations | 15 | Unit tests for maths. API tests for 400 and 409. All 5 conversations covered. |
| API & errors | 10 | Correct status codes. Consistent error body. Async errors handled. |
| AI_LOG & README | 5 | An honest, specific AI mistake. Setup works first time. |

**Bonus:** up to +5 per item, +15 in total. Bonus points never make up for missing required
work. The brief prefers 6 things done well over 12 half-done.

---

## 3. Core concepts to get right

### 3.1 The two paths
- **Form path:** a 3-step UI calls the backend directly.
- **Agent path:** a chat UI calls the backend, which calls the LLM, which calls typed tools.
- Both paths must go through the **same service layer**. A lead filed by the agent must be
  identical to one filed through the form.

### 3.2 Maths (exact, not "roughly right")

```
pureGoldGrams = netWeightGrams × (karat / 24)
goldValue     = pureGoldGrams × rate24kPerGram
eligibleLoan  = floor( goldValue × min(plan.maxLtv, 0.75) )
```

- Mock 24K rate: **7,000 per gram**.
- Loan is in **whole rupees** and never above **75% LTV**.
- Store money as **integer paise** or `DECIMAL`. Never float rupees.

### 3.3 Seed plans

| Plan ID | Name | Interest p.a. | Max LTV | Tenure |
|---|---|---|---|---|
| `PLAN_BULLET_01` | Bullet Repayment | 12.0% | 70% | 12 months, interest + principal at maturity |
| `PLAN_EMI_01` | Monthly EMI | 10.5% | 75% | 12 months, equal monthly instalments |

### 3.4 Expected results (use these as tests)

| # | Input | Expected |
|---|---|---|
| 1 | 45 g net, 22K, EMI | pure 41.25 g, value 2,88,750, loan **2,16,562** (floor of 216,562.5). The EMI column in the PDF is garbled; confirm the EMI figure in the original. |
| 2 | 45 g net, 22K, Bullet | value 2,88,750, loan **2,02,125** (70% LTV) |
| 3 | 10 g net, 18K, EMI | pure 7.5 g, value 52,500, loan **39,375** |
| 4 | net 52 g > gross 50 g | **400** with field error on `netWeightGrams` |
| 5 | mobile `5876543210` or `98765` | **400** with field error on `mobileNumber` |
| 6 | same mobile again within 7 days | **409** with the existing `applicationId` |
| 7 | BONUS: same request, same `Idempotency-Key` | original **201** replayed |
| 8 | BONUS: 2 parallel requests, same new mobile | exactly one **201** and one **409** |

### 3.5 Validation rules
- Name: 2–60 characters, letters and spaces only.
- Mobile: Indian 10-digit, regex `^[6-9]\d{9}$`.
- Weights: `0 < net ≤ gross ≤ 1000 g`.
- Karat: one of `18`, `22`, `24`.
- Plan ID must exist, else **404**.

---

## 4. Endpoints

| Method | Path | Behaviour |
|---|---|---|
| GET | `/api/v1/loan-schemes` | Active plans: id, name, annual rate, tenure, max LTV (never above 75%). Seeded from DB. |
| POST | `/api/v1/quotes` | Pure calculation, **no DB write**. Returns pure gold, gold value, and eligible loan per plan. Used by the UI calculator and the agent. |
| POST | `/api/v1/leads` | Validate, re-compute the quote **server-side** (never trust client numbers), de-duplicate, store with status `SUBMITTED`, return **201** with `applicationId`. |
| GET | `/api/v1/leads` | All leads, newest first. Mobile **always masked** in responses (e.g. `9876XXXX10`). Pagination is a bonus. |

### Error contract
Every error body has the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": [ { "field": "netWeightGrams", "message": "..." } ] } }
```

- 400 validation, 404 unknown plan, 409 duplicate.
- 500s return JSON with **no stack traces**.
- Handle all async errors (wrap route handlers, or use an error middleware that catches promise rejections).

### Duplicate rule
- The same mobile within **7 days** returns **409** with the existing `applicationId`.
- A simple lookup before insert is fine. Making it safe for simultaneous requests is a bonus
  (DB unique constraint, or a transaction).

---

## 5. Required web portal (Part A)

One responsive SPA (React + Vite or Next.js), with:

1. **Details:** name, mobile, gross and net weight, karat. Inline validation as you type.
2. **Live quote:** call `/quotes`, debounced about **300 ms**. Show pure gold, value, and loan per
   plan as selectable cards. Highlight the selected card.
3. **Confirm:** review, submit, then a success screen with the Application ID. A 409 becomes a
   friendly message such as "You already applied on 3 Oct, application GL-1042", not "Error 409".
4. **Admin view:** leads table, mobile masked, showing net weight, plan, loan, status, and a
   simple filter by plan.

**Must work at 375 px wide.** Use numeric keypad input types for weights and mobile.

---

## 6. Required AI agent (Part B)

### 6.1 Three tools (function calling)

| Tool | Does | Rule |
|---|---|---|
| `get_loan_schemes()` | Lists plans and rates | The agent may only describe plans returned by this tool. |
| `calculate_quote(net, gross, karat)` | Calls `POST /quotes` | The LLM never does the maths. Every number comes from this tool. |
| `submit_application(payload)` | Calls `POST /leads` | Runs **only after an explicit confirmation step** in the UI that shows the full summary. |

- Tool arguments validated with the **same Zod schemas** as the API.
- On an invalid tool call, return the error to the agent, and the agent asks the user to fix it.

### 6.2 Guardrails
- Stays on gold loans.
- No investment advice. No promise of approval.
- Politely declines anything off-topic.
- **Privacy:** mobile numbers masked in logs. **No API keys in the browser.** All LLM calls go
  through your backend.

### 6.3 Five test conversations (required)
You must cover all of these:
1. **Happy path** through to submission.
2. **Missing field** the agent asks for.
3. **Net weight greater than gross.**
4. **Duplicate** within 7 days.
5. **Off-topic** request.

Write them as an `npm run eval` script, or as a written checklist with screenshots.

---

## 7. Bonus menu (pick any; each up to +5, max +15)

Only start these after Parts A and B work end to end.

- **B1 Harden the backend:** race-safe duplicate checks, `Idempotency-Key`, status workflow
  (`SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED`) with audit log, cached gold-rate endpoint.
- **B2 Smarter agent:** 4th tool `check_existing_application`, prompt-injection tests,
  streamed replies, tool-status chips ("Calculating quote…").
- **B3 AI extras:** read weights and karat from a photo of an appraisal slip, or let admins
  filter leads in plain English through a safe tool.
- **B4 Ops ready:** `docker compose up`, GitHub Actions test run, rate limit on `/leads`,
  `ARCHITECTURE.md`, 2-minute demo video.

Also listed as bonus inside Part B: prompt injection, Hinglish, the user changing their mind,
10+ automated evals.

---

## 8. Ground rules
- Any AI coding tool is allowed and encouraged. Document where it was wrong.
- **Never commit API keys.** Use `.env`, ship `.env.example`.
- A free LLM tier or a local model through Ollama is fine. Document which one you used.
- The agent's design matters more than which model it runs on.

---

## 9. Suggested build plan (about 12 hours)

| Phase | Hours | Output |
|---|---|---|
| 0. Setup | 0.5 | Repo, `.env.example`, README skeleton, AI_LOG skeleton. Backend and frontend both run. |
| 1. Maths + validation | 1.5 | Pure `quote.ts` function with unit tests for cases 1–3. Zod schemas. |
| 2. Database + seed | 1 | Postgres schema (money as paise), migration, seed script for 2 plans. |
| 3. API | 2 | 4 endpoints, error contract, 409 duplicate, LTV enforcement. API tests for 400 and 409 (cases 4–6). |
| 4. Web form | 2.5 | 3-step flow, live quote with debounce, plan cards, 409 message, 375 px layout. |
| 5. Admin table | 0.75 | Masked mobile, newest first, plan filter. |
| 6. Agent | 2.5 | `/chat` endpoint on backend, 3 tools, confirmation UI, guardrails. |
| 7. Test conversations | 1 | `npm run eval` with the 5 required scenarios. |
| 8. Docs | 0.75 | README, AI_LOG (2 prompts plus 1 real AI mistake), `.env.example`. |
| 9. Buffer and polish | 0.5 | Fix anything not working on a clean clone. |

Only then, pick **one or two** bonuses (for example B1 idempotency, and B4 Docker plus CI).

---

## 10. Recommended stack (defaults, change if you prefer)

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Express, TypeScript, Zod | Brief-listed, simple |
| DB | PostgreSQL + Prisma (or Drizzle) | Brief-preferred. Use `Int` paise. |
| Frontend | React + Vite + Tailwind | Fast to build, mobile-friendly |
| Tests | Vitest + Supertest | One tool for unit and API tests |
| LLM | Free tier (Gemini or Groq) or Ollama locally | Brief allows it. Keys stay in `.env` on the backend. |

---

## 11. Pre-submit checklist

- [ ] Fresh clone: `npm install`, `npm run dev`, `npm test` all work.
- [ ] `.env.example` present. `git log` and the code contain no real keys.
- [ ] Test cases 1–6 pass. Money in paise or whole rupees.
- [ ] Server re-computes every number on `/leads`. Client values ignored.
- [ ] Mobile masked in every response and log line.
- [ ] Agent never outputs a number that did not come from `calculate_quote`.
- [ ] Agent asks for confirmation before `submit_application`.
- [ ] All 5 required conversations are covered.
- [ ] Layout checked at 375 px.
- [ ] README lists every bonus attempted, plus what you would do next.
- [ ] AI_LOG has 2 exact prompts and 1 real AI mistake with the test that catches it.
- [ ] Repo is public or shared with the reviewers.

---

## 12. Open questions for you

1. **Deadline:** the PDF says 48 hours but does not give a start date or time. Check the email
   or message where you received the assignment.
2. **EMI figure:** the expected EMI output for test case 1 is garbled in the PDF (`201`). Check
   the original file or ask TGLOBAL.
3. **Which LLM:** pick a free tier (e.g. Gemini or Groq key) or Ollama. Decide before Phase 6.
4. **Repo visibility:** check how the reviewers expect access.
