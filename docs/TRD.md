# Technical Requirements Document (TRD)

Project: Gold Loan Portal with AI Agent
PRD source: `full-stack-developer-intern-at-tglobal (3).pdf` (the assignment PDF is the PRD)
Companion docs: [ASSIGNMENT_PLAN.md](ASSIGNMENT_PLAN.md), [UIUX_AND_FLOW.md](UIUX_AND_FLOW.md)

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────┐
│ Frontend (React + Vite + Tailwind)           │
│  • 3-step form path                          │
│  • Chat panel (agent path)                   │
│  • Admin table                               │
└───────────────┬──────────────┬──────────────┘
                │ REST         │ REST (chat)
┌───────────────▼──────────────▼──────────────┐
│ Backend (Node + Express + TS)                │
│  Routes → Controllers → SERVICE LAYER        │
│                           │                  │
│   /quotes ─┐              │                  │
│   /leads  ─┼──────────────┤ quoteService     │
│   agent   ─┘              │ leadService      │
│                           │                  │
│  Agent orchestrator ──────┘  (calls tools    │
│   (LLM + 3 typed tools)      that call the    │
│                              SAME services)   │
└───────────────┬──────────────────────────────┘
                │
┌───────────────▼──────────────┐
│ PostgreSQL (Prisma)           │
│  loan_schemes, leads,         │
│  (bonus: lead_status_audit,   │
│   idempotency_keys)           │
└───────────────────────────────┘
```

**Single rule that drives the design:** the form path and the agent path both call the
**same service functions** (`computeQuote`, `createLead`). Neither the controller nor the LLM
does arithmetic. A lead filed by the agent is byte-for-byte the same as one filed by the form.

---

## 2. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js ≥ 20 | |
| Language | TypeScript | `strict: true` |
| Web framework | Express | Fastify/Nest allowed; Express chosen for simplicity |
| Validation | Zod | Shared between API and agent tools |
| ORM | Prisma | Postgres; `Int` columns for paise |
| DB | PostgreSQL 16 | Docker for local |
| Frontend | React 18 + Vite | SPA |
| Styling | Tailwind CSS | Mobile-first |
| Tests | Vitest + Supertest | Unit (maths) + API (400/409) |
| LLM | Free tier (Groq/Gemini) or Ollama | Key in backend `.env` only |

---

## 3. Money representation

- **All money stored and compared as integer paise** (`BigInt`/`Int`). 1 rupee = 100 paise.
- Gold rate seeded as **700000 paise/gram** (= ₹7,000).
- `pureGoldGrams` is a weight, kept as a number with fixed decimals for display; it is NOT money.
- Rounding: `eligibleLoan = floor(goldValuePaise × ltv)`, then floor to whole rupee if the brief's
  outputs are in whole rupees. Expected values are whole rupees, so compute in paise and floor
  to the rupee at the end.

### Canonical calculation (single source of truth)

```ts
// weights in grams; rate in paise per gram; returns paise
function computeQuote(input: QuoteInput, plan: Plan) {
  const purity = input.karat / 24;              // 18→0.75, 22→0.9166..., 24→1
  const pureGoldGrams = input.netWeightGrams * purity;
  const goldValuePaise = Math.round(pureGoldGrams * RATE_24K_PAISE_PER_GRAM);
  const ltv = Math.min(plan.maxLtv, 0.75);
  const eligibleLoanPaise = Math.floor(goldValuePaise * ltv);
  // brief shows whole rupees → floor to rupee
  const eligibleLoanRupees = Math.floor(eligibleLoanPaise / 100);
  return { pureGoldGrams, goldValuePaise, eligibleLoanRupees };
}
```

> **Verify the floor timing** against expected outputs before locking: case 1 (45g,22K,EMI)
> → pure 41.25, value ₹288,750, loan should be floor(288750 × 0.75) = ₹216,562. Case 2
> (Bullet, 70%) → floor(288750 × 0.70) = ₹202,125. Case 3 (10g,18K,EMI) → value ₹52,500,
> loan floor(52500 × 0.75) = ₹39,375. All three match the brief.

---

## 4. Data model (Prisma)

```prisma
model LoanScheme {
  id              String  @id            // "PLAN_BULLET_01"
  name            String
  annualRateBps   Int                    // 1200 = 12.00%  (basis points, avoids float)
  maxLtv          Int                    // stored as bps too: 7000 = 70%, 7500 = 75%
  tenureMonths    Int     @default(12)
  tenureNote      String
  active          Boolean @default(true)
  leads           Lead[]
}

model Lead {
  id               String   @id @default(cuid())
  applicationId    String   @unique       // human id, e.g. "GL-1042"
  name             String
  mobileNumber     String                 // stored raw, masked in responses/logs
  grossWeightGrams Decimal  @db.Decimal(8,3)
  netWeightGrams   Decimal  @db.Decimal(8,3)
  karat            Int
  schemeId         String
  scheme           LoanScheme @relation(fields: [schemeId], references: [id])
  pureGoldGrams    Decimal  @db.Decimal(10,4)
  goldValuePaise   BigInt
  eligibleLoanPaise BigInt
  status           LeadStatus @default(SUBMITTED)
  source           LeadSource               // FORM | AGENT  (same data either way)
  createdAt        DateTime @default(now())

  @@index([mobileNumber, createdAt])         // duplicate lookup
  @@index([schemeId])                        // admin filter
}

enum LeadStatus { SUBMITTED UNDER_REVIEW APPROVED REJECTED }  // workflow is bonus B1
enum LeadSource { FORM AGENT }

// Bonus B1:
model LeadStatusAudit {
  id        String   @id @default(cuid())
  leadId    String
  from      LeadStatus?
  to        LeadStatus
  at        DateTime @default(now())
}
model IdempotencyKey {
  key        String   @id
  leadId     String
  response   Json
  createdAt  DateTime @default(now())
}
```

Store LTV and interest as **basis points (Int)** to avoid any float in the DB. Convert to a
fraction only inside `computeQuote`.

### Application ID format
`GL-` + zero-padded sequence or short random, e.g. `GL-1042`. Must be stable and unique.

---

## 5. API contract

Base path: `/api/v1`

### GET /loan-schemes
- 200: `[{ id, name, annualRatePercent, maxLtvPercent, tenureMonths, tenureNote }]`
- Only `active = true`. `maxLtvPercent` never above 75.

### POST /quotes  (pure, no DB write)
Request:
```json
{ "netWeightGrams": 45, "grossWeightGrams": 46, "karat": 22 }
```
Response 200:
```json
{
  "pureGoldGrams": 41.25,
  "goldValuePaise": 28875000,
  "goldValueRupees": 288750,
  "quotes": [
    { "schemeId": "PLAN_EMI_01",    "eligibleLoanRupees": 216562, "maxLtvPercent": 75 },
    { "schemeId": "PLAN_BULLET_01", "eligibleLoanRupees": 202125, "maxLtvPercent": 70 }
  ]
}
```
- 400 on validation failure (weights, karat).

### POST /leads
Request:
```json
{
  "name": "Asha Rao",
  "mobileNumber": "9876543210",
  "grossWeightGrams": 46,
  "netWeightGrams": 45,
  "karat": 22,
  "schemeId": "PLAN_EMI_01"
}
```
- Server **re-computes** the quote. Any client-sent numbers are ignored.
- 201: `{ "applicationId": "GL-1042", "status": "SUBMITTED", "eligibleLoanRupees": 216562, "mobileNumber": "9876XXXX10" }`
- 400 validation, 404 unknown `schemeId`, 409 duplicate.
- 409 body includes the existing `applicationId` and `appliedAt`.
- Bonus: honours `Idempotency-Key` header (replays original 201).

### GET /leads
- 200: newest first, mobile masked (`9876XXXX10`), fields: `applicationId`, `name`,
  `mobileNumberMasked`, `netWeightGrams`, `schemeId`, `eligibleLoanRupees`, `status`, `createdAt`.
- Query: `?schemeId=` filter. Pagination (`?page=&limit=`) is bonus.

### POST /agent/chat  (backend-hosted LLM)
Request: `{ "sessionId": "...", "messages": [...] }`
- Backend runs the LLM loop, executes tool calls server-side, returns assistant message +
  any tool-status events. No LLM key ever reaches the browser.

---

## 6. Error contract (every error, same shape)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": [
      { "field": "netWeightGrams", "message": "Net weight cannot exceed gross weight." }
    ]
  }
}
```

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod failure, net > gross, bad karat/mobile/name |
| `SCHEME_NOT_FOUND` | 404 | `schemeId` does not exist |
| `DUPLICATE_LEAD` | 409 | same mobile within 7 days (fields include `applicationId`, `appliedAt`) |
| `INTERNAL_ERROR` | 500 | uncaught; JSON only, **no stack trace** |

- A global Express error middleware maps thrown `AppError`s to this shape.
- All async route handlers wrapped (`asyncHandler`) so promise rejections reach the middleware.

---

## 7. Validation (Zod, shared by API and agent tools)

```ts
const QuoteInput = z.object({
  netWeightGrams:   z.number().positive().max(1000),
  grossWeightGrams: z.number().positive().max(1000),
  karat:            z.union([z.literal(18), z.literal(22), z.literal(24)]),
}).refine(v => v.netWeightGrams <= v.grossWeightGrams, {
  path: ["netWeightGrams"],
  message: "Net weight cannot exceed gross weight.",
});

const LeadInput = QuoteInput.extend({
  name:         z.string().regex(/^[A-Za-z ]{2,60}$/, "Letters and spaces, 2–60 chars."),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile."),
  schemeId:     z.string(),
});
```
The agent's 3 tools import these exact schemas — no second copy.

---

## 8. Duplicate rule
- Lookup: any `Lead` with same `mobileNumber` and `createdAt >= now - 7 days`.
- Found → 409 with its `applicationId`.
- **Bonus (race-safe):** DB unique partial index or a transaction; parallel requests yield
  exactly one 201 + one 409 (test case 8).

---

## 9. Agent tool contracts

| Tool | Args (Zod) | Calls | Returns |
|---|---|---|---|
| `get_loan_schemes` | `{}` | `loanSchemeService.list()` | array of plans |
| `calculate_quote` | `QuoteInput` | `quoteService.compute()` | quote object (all numbers from here) |
| `submit_application` | `LeadInput` | `leadService.create()` | `{ applicationId, status }` — only after UI confirm |

- Invalid tool args → return the Zod error object to the LLM; the agent asks the user to fix it.
- `submit_application` is gated: the orchestrator will not call it until the client has sent a
  `confirmed: true` for the shown summary.
- **Guardrails** (system prompt + server checks): gold loans only, no investment advice, no
  approval promises, declines off-topic. Mobile masked in all logs.

---

## 10. Repo layout

```
/
├─ apps/
│  ├─ api/            # Express backend
│  │  ├─ src/
│  │  │  ├─ routes/
│  │  │  ├─ services/      # computeQuote, createLead  (SHARED by both paths)
│  │  │  ├─ agent/         # orchestrator + tools
│  │  │  ├─ schemas/       # Zod (shared)
│  │  │  ├─ lib/           # money, masking, errors, asyncHandler
│  │  │  └─ app.ts
│  │  ├─ prisma/           # schema, migrations, seed
│  │  └─ tests/            # vitest: maths unit + supertest API
│  └─ web/            # React + Vite
│     └─ src/{pages,components,lib}
├─ .env.example
├─ docker-compose.yml   # (bonus) postgres + api + web
├─ README.md
├─ AI_LOG.md
└─ docs/
```
(If a monorepo is too heavy for 48h, a flat `/server` + `/client` with one root `package.json`
and workspace scripts `npm run dev` / `npm test` is acceptable — the brief only requires those
scripts to work.)

---

## 11. Non-functional requirements
- `npm install && npm run dev && npm test` must work on a fresh clone.
- No secrets in git; `.env.example` lists every var with dummy values.
- 500s never leak stack traces.
- Mobile masked everywhere it leaves the server (responses + logs).
- Frontend usable at 375px; numeric input modes for weight/mobile.

---

## 12. Test matrix (maps to PDF cases)

| Case | Layer | Assertion |
|---|---|---|
| 1 | unit + API | 45/22/EMI → pure 41.25, value 288750, loan 216562, 201 |
| 2 | unit | 45/22/Bullet → loan 202125 (70%) |
| 3 | unit | 10/18/EMI → pure 7.5, value 52500, loan 39375 |
| 4 | API | net 52 > gross 50 → 400, field `netWeightGrams` |
| 5 | API | mobile `5876543210` / `98765` → 400, field `mobileNumber` |
| 6 | API | same mobile < 7 days → 409 + existing applicationId |
| 7 (bonus) | API | same `Idempotency-Key` → replay original 201 |
| 8 (bonus) | API | 2 parallel, new mobile → one 201, one 409 |
| agent ×5 | eval | happy / missing field / net>gross / duplicate / off-topic |
