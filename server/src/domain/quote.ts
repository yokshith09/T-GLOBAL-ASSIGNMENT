import { MAX_LTV_BPS, type Plan } from "./plans.js";
import { paiseToWholeRupees } from "./money.js";

export type QuoteInputs = {
  netWeightGrams: number;
  karat: number; // 18 | 22 | 24
};

export type PlanQuote = {
  schemeId: string;
  eligibleLoanPaise: number;
  eligibleLoanRupees: number;
  maxLtvBps: number;
};

export type Quote = {
  pureGoldGrams: number;
  goldValuePaise: number;
  perPlan: PlanQuote[];
};

/**
 * Exact gold-loan maths. All money in integer paise; LTV applied in basis points
 * so there is no float rounding (0.70 is not exact in binary — bps avoids it).
 *
 *   pureGoldGrams = net * karat / 24
 *   goldValuePaise = round( net * karat * ratePaisePerGram / 24 )
 *   eligibleLoanPaise = floor( goldValuePaise * min(plan.maxLtvBps, 7500) / 10000 )
 */
export function computePlanQuote(
  inputs: QuoteInputs,
  plan: Plan,
  ratePaisePerGram: number,
): PlanQuote {
  const goldValuePaise = goldValueInPaise(inputs, ratePaisePerGram);
  const ltvBps = Math.min(plan.maxLtvBps, MAX_LTV_BPS);
  const eligibleLoanPaise = Math.floor((goldValuePaise * ltvBps) / 10000);
  return {
    schemeId: plan.id,
    eligibleLoanPaise,
    eligibleLoanRupees: paiseToWholeRupees(eligibleLoanPaise),
    maxLtvBps: ltvBps,
  };
}

export function pureGoldGrams(inputs: QuoteInputs): number {
  return (inputs.netWeightGrams * inputs.karat) / 24;
}

export function goldValueInPaise(inputs: QuoteInputs, ratePaisePerGram: number): number {
  return Math.round((inputs.netWeightGrams * inputs.karat * ratePaisePerGram) / 24);
}

/** Full quote across every plan — used by POST /quotes and the agent's calculate_quote tool. */
export function computeQuote(inputs: QuoteInputs, plans: Plan[], ratePaisePerGram: number): Quote {
  return {
    pureGoldGrams: pureGoldGrams(inputs),
    goldValuePaise: goldValueInPaise(inputs, ratePaisePerGram),
    perPlan: plans.map((p) => computePlanQuote(inputs, p, ratePaisePerGram)),
  };
}
