import { prisma } from "../lib/prisma.js";
import type { Plan } from "../domain/plans.js";

export type SchemeView = {
  id: string;
  name: string;
  annualRatePercent: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureNote: string;
};

const toView = (p: Plan): SchemeView => ({
  id: p.id,
  name: p.name,
  annualRatePercent: p.annualRateBps / 100,
  maxLtvPercent: p.maxLtvBps / 100,
  tenureMonths: p.tenureMonths,
  tenureNote: p.tenureNote,
});

const toPlan = (row: {
  id: string;
  name: string;
  annualRateBps: number;
  maxLtvBps: number;
  tenureMonths: number;
  tenureNote: string;
}): Plan => ({
  id: row.id,
  name: row.name,
  annualRateBps: row.annualRateBps,
  maxLtvBps: row.maxLtvBps,
  tenureMonths: row.tenureMonths,
  tenureNote: row.tenureNote,
});

/** Active plans as domain objects (for the maths). */
export async function listActivePlans(): Promise<Plan[]> {
  const rows = await prisma.loanScheme.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  return rows.map(toPlan);
}

/** Active plans in API shape (percent). Used by GET /loan-schemes and get_loan_schemes. */
export async function listActiveSchemes(): Promise<SchemeView[]> {
  return (await listActivePlans()).map(toView);
}

/** Domain plan for a scheme id, or null if it does not exist / is inactive. */
export async function findActivePlan(id: string): Promise<Plan | null> {
  const row = await prisma.loanScheme.findFirst({ where: { id, active: true } });
  return row ? toPlan(row) : null;
}
