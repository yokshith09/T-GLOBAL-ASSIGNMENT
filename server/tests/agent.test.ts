import { describe, expect, it, afterAll } from "vitest";
import { runReadTool, toolSchemas } from "../src/agent/tools.js";
import { prisma } from "../src/lib/prisma.js";

afterAll(() => prisma.$disconnect());

describe("agent tools", () => {
  it("exposes exactly the three required tools", () => {
    const names = toolSchemas.map((t) => t.function.name).sort();
    expect(names).toEqual(["calculate_quote", "get_loan_schemes", "submit_application"]);
  });

  it("calculate_quote returns tool-computed numbers (not the model's)", async () => {
    const q = (await runReadTool("calculate_quote", {
      netWeightGrams: 45,
      grossWeightGrams: 46,
      karat: 22,
    })) as { goldValueRupees: number; quotes: { schemeId: string; eligibleLoanRupees: number }[] };
    expect(q.goldValueRupees).toBe(288750);
    expect(q.quotes.find((x) => x.schemeId === "PLAN_EMI_01")?.eligibleLoanRupees).toBe(216562);
  });

  it("calculate_quote returns a field error for invalid args (agent re-asks)", async () => {
    const r = (await runReadTool("calculate_quote", {
      netWeightGrams: 52,
      grossWeightGrams: 50,
      karat: 22,
    })) as { error: { field: string }[] };
    expect(r.error.map((e) => e.field)).toContain("netWeightGrams");
  });

  it("get_loan_schemes lists active plans from the DB", async () => {
    const r = (await runReadTool("get_loan_schemes", {})) as { schemes: { id: string }[] };
    expect(r.schemes.length).toBeGreaterThanOrEqual(2);
  });
});
