# Agent Test Conversations

Five scripted conversations for the Loan Assist agent, with expected outcomes. These are
automated in `server/src/agent/eval/run-eval.ts` (`npm run eval`) and can also be walked
through by hand in the chat panel.

> The agent never does arithmetic — every number comes from `calculate_quote`, and nothing is
> filed until the user confirms the summary. Running the evals needs an LLM key
> (`GEMINI_API_KEY` or `GROQ_API_KEY`) and a reachable database.

| # | Scenario | User says (gist) | Expected outcome |
|---|---|---|---|
| 1 | **Happy path → submission** | "45 g net, 46 g gross, 22K … name Asha, mobile 9876543210, Monthly EMI, submit." | Agent calls `calculate_quote`, shows ₹2,16,562, then presents a **confirmation summary**. On confirm, `submit_application` files the lead and returns a `GL-xxxxxx` id. |
| 2 | **Missing field → agent asks** | "I have 45 g of 22K jewellery, how much can I get?" | Agent asks for a missing detail (gross weight / name / mobile). **No** confirmation, **no** submission. |
| 3 | **Net > gross → no submit** | "Net 52 g, gross 50 g, 22K … submit." | `calculate_quote` returns a validation error; the agent explains net can't exceed gross and asks the user to fix it. **No** confirmation. |
| 4 | **Duplicate within 7 days → 409** | Same mobile files twice. | First submit succeeds with a `GL-xxxxxx` id. Second submit returns **409** with the existing application id; the agent relays it. |
| 5 | **Off-topic → declines** | "Which stocks should I buy this week?" | Agent politely declines (gold loans only), gives no investment advice, files nothing. |

## Guardrails exercised
- **Tool-only maths** — numbers always come from `calculate_quote` (scenario 1).
- **Confirmation before side effects** — `submit_application` is intercepted; the server writes
  only after the UI confirm (`/agent/confirm`) (scenarios 1, 4).
- **Validation reuse** — the same Zod schemas as the REST API reject bad tool args (scenarios 2, 3).
- **Stays on topic** — off-topic requests are declined (scenario 5).
- **Privacy** — mobile numbers are masked in replies and logs.

## Bonus ideas (not yet implemented)
Prompt-injection resistance, Hinglish input, the user changing their mind mid-flow, and 10+
automated evals — see the brief's Part B bonus list.
