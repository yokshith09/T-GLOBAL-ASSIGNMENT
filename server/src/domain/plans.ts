/** Single source of truth for loan plans. Seed and services both read from here. */

export type Plan = {
  id: string;
  name: string;
  annualRateBps: number; // 1200 = 12.00%
  maxLtvBps: number; // 7000 = 70%, 7500 = 75%
  tenureMonths: number;
  tenureNote: string;
};

/** Regulatory hard cap: no plan lends above 75% LTV, whatever the plan says. */
export const MAX_LTV_BPS = 7500;

export const PLANS: Plan[] = [
  {
    id: "PLAN_BULLET_01",
    name: "Bullet Repayment",
    annualRateBps: 1200,
    maxLtvBps: 7000,
    tenureMonths: 12,
    tenureNote: "Interest + principal at maturity",
  },
  {
    id: "PLAN_EMI_01",
    name: "Monthly EMI",
    annualRateBps: 1050,
    maxLtvBps: 7500,
    tenureMonths: 12,
    tenureNote: "Equal monthly instalments",
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
