import { describe, expect, it } from "vitest";
import { LeadInput, QuoteInput } from "../src/schemas/loan.js";

const base = {
  name: "Asha Rao",
  mobileNumber: "9876543210",
  grossWeightGrams: 46,
  netWeightGrams: 45,
  karat: 22,
  schemeId: "PLAN_EMI_01",
};

function fieldErrors(result: ReturnType<typeof LeadInput.safeParse>) {
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
}

describe("validation — brief cases 4 & 5", () => {
  it("case 4: net > gross fails on netWeightGrams", () => {
    const r = QuoteInput.safeParse({ netWeightGrams: 52, grossWeightGrams: 50, karat: 22 });
    expect(r.success).toBe(false);
    expect(fieldErrors(r as never)).toContain("netWeightGrams");
  });

  it("case 5: bad mobile fails on mobileNumber", () => {
    for (const mobileNumber of ["5876543210", "98765"]) {
      const r = LeadInput.safeParse({ ...base, mobileNumber });
      expect(r.success).toBe(false);
      expect(fieldErrors(r)).toContain("mobileNumber");
    }
  });
});

describe("validation — rules", () => {
  it("accepts a valid lead", () => {
    expect(LeadInput.safeParse(base).success).toBe(true);
  });

  it("rejects karat outside 18/22/24", () => {
    expect(LeadInput.safeParse({ ...base, karat: 20 }).success).toBe(false);
  });

  it("rejects names with digits or symbols", () => {
    expect(LeadInput.safeParse({ ...base, name: "Asha99" }).success).toBe(false);
    expect(LeadInput.safeParse({ ...base, name: "A" }).success).toBe(false);
  });

  it("rejects weight over 1000 g and non-positive weight", () => {
    expect(LeadInput.safeParse({ ...base, netWeightGrams: 1001, grossWeightGrams: 1001 }).success).toBe(false);
    expect(LeadInput.safeParse({ ...base, netWeightGrams: 0 }).success).toBe(false);
  });
});
