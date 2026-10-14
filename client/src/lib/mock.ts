/** Mock data for the UI scaffold. Replaced by real API calls in later phases. */

export type Plan = {
  id: string;
  name: string;
  annualRatePercent: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureNote: string;
};

export const MOCK_PLANS: Plan[] = [
  {
    id: "PLAN_EMI_01",
    name: "Monthly EMI",
    annualRatePercent: 10.5,
    maxLtvPercent: 75,
    tenureMonths: 12,
    tenureNote: "Equal monthly instalments",
  },
  {
    id: "PLAN_BULLET_01",
    name: "Bullet Repayment",
    annualRatePercent: 12.0,
    maxLtvPercent: 70,
    tenureMonths: 12,
    tenureNote: "Interest + principal at maturity",
  },
];

export type MockLead = {
  applicationId: string;
  name: string;
  mobileNumber: string;
  netWeightGrams: number;
  schemeId: string;
  eligibleLoanRupees: number;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export const MOCK_LEADS: MockLead[] = [
  { applicationId: "GL-1042", name: "Asha Rao", mobileNumber: "9876543210", netWeightGrams: 45, schemeId: "PLAN_EMI_01", eligibleLoanRupees: 216562, status: "SUBMITTED", createdAt: "2026-10-14T09:12:00Z" },
  { applicationId: "GL-1041", name: "Vikram Nair", mobileNumber: "9811122233", netWeightGrams: 45, schemeId: "PLAN_BULLET_01", eligibleLoanRupees: 202125, status: "UNDER_REVIEW", createdAt: "2026-10-13T16:40:00Z" },
  { applicationId: "GL-1040", name: "Fatima Khan", mobileNumber: "9700088899", netWeightGrams: 10, schemeId: "PLAN_EMI_01", eligibleLoanRupees: 39375, status: "APPROVED", createdAt: "2026-10-12T11:05:00Z" },
];

/** Placeholder quote numbers for the scaffold (NOT the real calc). */
export const MOCK_QUOTE = {
  pureGoldGrams: 41.25,
  goldValueRupees: 288750,
  byPlan: { PLAN_EMI_01: 216562, PLAN_BULLET_01: 202125 } as Record<string, number>,
};
