import { env } from "../lib/env.js";
import { notFound } from "../lib/errors.js";
import { computePlanQuote, pureGoldGrams, goldValueInPaise } from "../domain/quote.js";
import { paiseToWholeRupees } from "../domain/money.js";
import { findActivePlan, listActivePlans } from "./schemeService.js";
import type { QuoteInputType } from "../schemas/loan.js";

export type QuoteView = {
  pureGoldGrams: number;
  goldValuePaise: number;
  goldValueRupees: number;
  quotes: { schemeId: string; eligibleLoanRupees: number; maxLtvPercent: number }[];
};

/** Quote across all active plans. Shared by POST /quotes and the agent's calculate_quote tool. */
export async function getQuote(input: QuoteInputType): Promise<QuoteView> {
  const plans = await listActivePlans();
  const rate = env.rate24kPaisePerGram;
  const goldValuePaise = goldValueInPaise(input, rate);
  return {
    pureGoldGrams: pureGoldGrams(input),
    goldValuePaise,
    goldValueRupees: paiseToWholeRupees(goldValuePaise),
    quotes: plans.map((plan) => {
      const q = computePlanQuote(input, plan, rate);
      return { schemeId: plan.id, eligibleLoanRupees: q.eligibleLoanRupees, maxLtvPercent: plan.maxLtvBps / 100 };
    }),
  };
}

/** Quote for a single plan; throws 404 if the plan is unknown. Used when filing a lead. */
export async function quoteForPlan(input: QuoteInputType, schemeId: string) {
  const plan = await findActivePlan(schemeId);
  if (!plan) throw notFound(`Unknown plan: ${schemeId}`);
  return computePlanQuote(input, plan, env.rate24kPaisePerGram);
}
