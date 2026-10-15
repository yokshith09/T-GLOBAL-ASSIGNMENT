# 2-Minute Demo Script

Record at 1280×800, light mode, with both servers running (`npm run dev`) and the hotspot on so
the DB + agent work. Target ~2:00. Keep the cursor deliberate; let numbers land.

## Setup (before recording)
- `npm run dev` (API :4000, web :5173).
- Have a fresh mobile number ready (e.g. 9765000111) so there's no duplicate.
- Admin passcode: `aurum-admin`.

## Shot list

**0:00–0:15 — Landing**
- Open `http://localhost:5173`. Show the hero ("Turn your gold into a fair loan").
- Toggle **dark mode** once and back (show the theme).
- Say: "One portal, two ways to apply — a guided form or an AI assistant, both on the same
  validated backend."

**0:15–0:45 — Apply (form)**
- Click **Get my estimate**. Type name, a 10-digit mobile; show the **inline validation** (type a
  bad mobile, see the error, fix it, green check).
- Enter 46 gross / 45 net, pick **22K**, click **See my quote**.
- On the live quote, point at **Pure 41.25 g · ₹2,88,750 · EMI ₹2,16,562** — "every number is
  computed on the server, in paise."
- Continue → Submit → show the **application ID** on the success screen.

**0:45–1:05 — Duplicate + calculator**
- Start another application with the **same mobile**, submit → show the friendly **409**:
  "You already applied on … , application GL-…".
- Open **Calculator** (top-right). Drag the **loan amount** slider — the EMI / interest / total and
  the **principal-vs-interest bar** update live. Switch **Bullet ↔ EMI** and the tenure.

**1:05–1:40 — AI assistant**
- Click the floating **Ask Loan Assist** (bottom-right).
- Type: "I have 45 grams of 22 carat jewellery, how much can I get?"
- It asks for the missing details; give gross weight, name, a **new** mobile, pick EMI.
- It shows the **confirmation card** (numbers from the tool, not the model). Click **Confirm &
  submit** → application ID.
- Quick guardrail beat: type "Which stocks should I buy?" → it politely declines.

**1:40–2:00 — Admin + wrap**
- Go to **Staff** (top-right), enter the passcode.
- Show the **leads table**: newest first, **masked mobiles**, stat tiles, **filter by plan**.
- Change a lead's status **SUBMITTED → UNDER_REVIEW → APPROVED** (the status workflow + audit).
- Close: "Exact money maths, one validated backend for form and agent, and a few bonuses —
  idempotency, race-safe duplicates, a status workflow, rate limiting and CI."

## Optional B-roll / callouts
- `npm test` passing (35 + bonus tests).
- `npm run eval` printing **6/6** agent scenarios (incl. prompt injection).
- The GitHub Actions CI run (green).
