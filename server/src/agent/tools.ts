import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import { QuoteInput } from "../schemas/loan.js";
import { listActiveSchemes } from "../services/schemeService.js";
import { getQuote } from "../services/quoteService.js";
import { findRecentApplication } from "../services/leadService.js";

const MobileArg = z.object({ mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.") });

/**
 * The agent's tools. The LLM never does arithmetic — every number comes from
 * calculate_quote. submit_application is NOT executed here: the orchestrator
 * intercepts it so the UI can confirm before anything is written.
 */
export const toolSchemas: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_loan_schemes",
      description: "List the active gold-loan plans with their interest rate and max LTV. Only describe plans this returns.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_quote",
      description:
        "Calculate pure gold, gold value and the eligible loan per plan. Always use this for any number — never compute amounts yourself.",
      parameters: {
        type: "object",
        properties: {
          netWeightGrams: { type: "number", description: "Net gold weight in grams (without stones)." },
          grossWeightGrams: { type: "number", description: "Gross jewellery weight in grams (with stones)." },
          karat: { type: "number", enum: [18, 22, 24], description: "Gold purity in karat." },
        },
        required: ["netWeightGrams", "grossWeightGrams", "karat"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_existing_application",
      description:
        "Check whether this mobile already has an application in the last 7 days, before quoting or submitting.",
      parameters: {
        type: "object",
        properties: { mobileNumber: { type: "string", description: "10-digit Indian mobile number." } },
        required: ["mobileNumber"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_application",
      description:
        "File the application. Call this only when you have the applicant's name, mobile, weights, karat and chosen plan, and the user has agreed to submit.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          mobileNumber: { type: "string", description: "10-digit Indian mobile number." },
          netWeightGrams: { type: "number" },
          grossWeightGrams: { type: "number" },
          karat: { type: "number", enum: [18, 22, 24] },
          schemeId: { type: "string", description: "A plan id from get_loan_schemes." },
        },
        required: ["name", "mobileNumber", "netWeightGrams", "grossWeightGrams", "karat", "schemeId"],
        additionalProperties: false,
      },
    },
  },
];

/** Run a read-only tool (get_loan_schemes / calculate_quote). Returns JSON-safe data or an error object. */
export async function runReadTool(name: string, rawArgs: unknown): Promise<unknown> {
  if (name === "get_loan_schemes") {
    return { schemes: await listActiveSchemes() };
  }
  if (name === "calculate_quote") {
    const parsed = QuoteInput.safeParse(rawArgs);
    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) };
    }
    return await getQuote(parsed.data);
  }
  if (name === "check_existing_application") {
    const parsed = MobileArg.safeParse(rawArgs);
    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) };
    }
    return await findRecentApplication(parsed.data.mobileNumber);
  }
  return { error: `Unknown tool: ${name}` };
}
