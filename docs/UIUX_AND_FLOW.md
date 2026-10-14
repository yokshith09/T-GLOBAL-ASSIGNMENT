# UI/UX & App Flow

Project: Gold Loan Portal with AI Agent
Companion docs: [ASSIGNMENT_PLAN.md](ASSIGNMENT_PLAN.md), [TRD.md](TRD.md)
PRD: the assignment PDF.

---

## 1. Design principles (from the brief)
- **Mobile first.** Field agents use phones. Everything works at **375 px** wide.
- **Live, not laggy.** Re-quote as the user types, debounced ~**300 ms**.
- **Errors people understand.** Show the API's `fields[]` inline. A 409 reads
  "You already applied on 3 Oct, application GL-1042", never "Error 409".
- **Numeric keypads.** `inputmode="decimal"` for weights, `inputmode="numeric"` for mobile.
- **Accessible.** Labels on every field, focus states, aria-live on the quote and on errors.
- **Two paths, one truth.** Form and chat produce identical leads.

---

## 2. Screen map

```
App
├─ /           Apply (3-step wizard)  ── Step 1 Details
│                                      ── Step 2 Live quote
│                                      ── Step 3 Confirm → Success
├─ (chat panel)  AI Loan Assist        (slide-over / docked panel, available on Apply)
└─ /admin        Leads table
```

Navigation: a top bar with **Apply** and **Admin**. The chat panel is a button
("💬 Ask the assistant") that opens a slide-over on mobile and a right dock on desktop.

---

## 3. Form path — 3-step wizard

### Step 1 — Details
Fields: Name, Mobile, Gross weight (g), Net weight (g), Karat (18/22/24 segmented control).

- Inline validation **as you type** (mirrors Zod): name pattern, mobile `^[6-9]\d{9}$`,
  `0 < net ≤ gross ≤ 1000`.
- Error text comes from the same messages the API returns, so form and API agree.
- "Continue" disabled until Step-1 fields are valid.

States: default, focused, error (red border + message + aria-live), valid.

### Step 2 — Live quote
- On any valid change, debounce 300 ms, call `POST /quotes`.
- Show: **Pure gold (g)**, **Gold value (₹)**, then **one card per plan** with its
  eligible loan, interest %, LTV %, tenure note.
- Cards are selectable (radio semantics). Selected card highlighted (border + check).
- While fetching: skeleton/"Calculating…" on the numbers (don't block typing).
- If `/quotes` 400s (e.g. net>gross entered here), show the inline field error and no cards.

### Step 3 — Confirm
- Read-only summary: name, masked-preview mobile, weights, karat, chosen plan, loan amount.
- "Submit application" → `POST /leads`.
- **201** → Success screen: big Application ID (`GL-1042`), chosen plan, loan, "Apply for
  another" button.
- **409** → friendly banner: "You already applied on {appliedAt}, application {applicationId}."
  Offer "View in admin" (optional). Not a raw error code.
- **400** (shouldn't happen if step 1 validated, but handle) → jump back to the offending field.

---

## 4. Agent path — chat panel

Entry: borrower types e.g. "I have 45 grams of 22 carat jewellery, how much can I get?"

Flow:
1. Agent calls `get_loan_schemes` (to speak only about real plans).
2. Agent collects missing fields conversationally (gross weight, karat, name, mobile) —
   asks one thing at a time.
3. Agent calls `calculate_quote` → shows the numbers **from the tool** (never its own maths).
4. Agent presents a **confirmation card** (full summary) and asks the user to confirm.
5. Only on explicit "yes/confirm" does it call `submit_application` → shows Application ID.

UI details:
- **Tool-status chips** (bonus B2): "Fetching plans…", "Calculating quote…", "Filing application…".
- Messages: user right, assistant left; quote and confirm rendered as cards, not raw text.
- A visible **Confirm / Edit** control on the summary card — submission is gated behind it.
- Guardrail responses: off-topic → polite decline; no investment advice; no approval promises.
- All LLM traffic via `POST /agent/chat`; the browser never sees an API key.

### Agent states
`idle → collecting → quoting (tool running) → awaiting-confirm → submitting → done/error`.
On a tool validation error (e.g. net>gross), the agent says what's wrong and re-asks.

---

## 5. Admin view (`/admin`)

- Table, **newest first**.
- Columns: Application ID, Name, **Mobile (masked `9876XXXX10`)**, Net weight, Plan,
  Loan (₹), Status, Created.
- **Filter by plan** (dropdown; calls `GET /leads?schemeId=`).
- Status shown as a badge (SUBMITTED / UNDER_REVIEW / APPROVED / REJECTED — last three are
  bonus workflow).
- Mobile responsive: on 375px, collapse to stacked cards (label:value) instead of a wide table.
- Empty state: "No leads yet."

---

## 6. Component inventory

| Component | Used in | Notes |
|---|---|---|
| `TextField` | form, admin filter | label, error, inputmode |
| `KaratToggle` | form, chat confirm | segmented 18/22/24 |
| `PlanCard` | step 2, chat quote | selectable, shows loan/LTV/rate |
| `QuoteSummary` | step 3, chat confirm | read-only review |
| `SuccessPanel` | step 3, chat done | big Application ID |
| `DuplicateBanner` | step 3, chat | friendly 409 message |
| `ChatPanel` | Apply | message list + input + tool chips |
| `ToolChip` | chat | status indicator (bonus) |
| `LeadsTable` / `LeadCard` | admin | masked mobile, filter |
| `FieldError` | everywhere | renders API `fields[]` |

---

## 7. Masking & privacy in the UI
- The client never displays a full mobile from a list response (server already masks).
- In the form, the user's own typed mobile is visible to them while entering (that's their data).
- Logs (front and back) never print a full mobile.

---

## 8. Responsive / accessibility checklist
- [ ] Layout holds at 375 px (no horizontal scroll).
- [ ] Weight inputs → numeric/decimal keypad; mobile input → numeric keypad.
- [ ] Every input has a visible label.
- [ ] Quote numbers in an `aria-live="polite"` region.
- [ ] Errors announced; focus moves to first error on failed submit.
- [ ] Plan cards keyboard-selectable (radiogroup).
- [ ] Color is not the only signal for selected/error (icon + text too).

---

## 9. Happy-path sequence (both paths converge)

```
Form:  Step1 valid ─▶ /quotes (debounced) ─▶ pick plan ─▶ Confirm ─▶ /leads ─▶ GL-id
Chat:  collect ────▶ calculate_quote(/quotes) ─▶ confirm card ─▶ submit_application(/leads) ─▶ GL-id
                              │                                        │
                              └────────── same quoteService ──────────┘
                                          same leadService
```
Result: a lead row with `source = FORM` or `AGENT`, every other field computed identically.
