# AI_LOG

How AI tools were used on this assignment, and where they were wrong.

## Tools used
- **Claude Code** — scaffolding, API/service design, docs.
- _(add Cursor / Copilot / Gemini if used, and for what)_

## Which LLM runs the agent
- **Primary:** Google Gemini (`gemini-2.0-flash`).
- **Fallback:** Groq (`llama-3.3-70b-versatile`).
- Keys are server-side only; the browser never sees them.

## Two exact prompts

### 1. Prompt used for validation
```
_(paste the exact prompt you gave the AI to generate/refine the Zod validation
 schemas and the 400/404/409 error contract)_
```

### 2. Prompt used for the agent tools
```
_(paste the exact prompt used to design the 3 function-calling tools:
 get_loan_schemes, calculate_quote, submit_application — including the rule that
 the LLM must never do arithmetic itself)_
```

## One place the AI got it wrong
**What it did wrong:**
_(be specific — e.g. "the AI rounded the loan with Math.round instead of Math.floor,
 so case 1 returned 216,563 instead of 216,562")_

**How I spotted it:**
_(e.g. the expected-value table in the brief; a failing unit test)_

**The test that now catches it:**
_(name the test file and case, e.g. `server/tests/quote.test.ts` → "45g 22K EMI floors to 216562")_
