import { describe, expect, it } from "vitest";
import { getPlan } from "../src/domain/plans.js";
import { computePlanQuote, goldValueInPaise, pureGoldGrams } from "../src/domain/quote.js";
import { LeadInput, QuoteInput } from "../src/schemas/loan.js";

const RATE = 700000;
const EMI = getPlan("PLAN_EMI_01")!;
const BULLET = getPlan("PLAN_BULLET_01")!;
const base = {
  name: "Asha Rao",
  mobileNumber: "9876543210",
  grossWeightGrams: 46,
  netWeightGrams: 45,
  karat: 22,
  schemeId: "PLAN_EMI_01",
};

describe("maths — edge cases", () => {
  it("24K means pure gold equals net weight", () => {
    expect(pureGoldGrams({ netWeightGrams: 30, karat: 24 })).toBe(30);
  });

  it("decimal weights still produce an integer paise value (no fractional paise)", () => {
    const v = goldValueInPaise({ netWeightGrams: 45.5, karat: 22 }, RATE);
    expect(Number.isInteger(v)).toBe(true);
  });

  it("is monotonic: more net weight never yields a smaller loan", () => {
    const small = computePlanQuote({ netWeightGrams: 45, karat: 22 }, EMI, RATE).eligibleLoanPaise;
    const big = computePlanQuote({ netWeightGrams: 46, karat: 22 }, EMI, RATE).eligibleLoanPaise;
    expect(big).toBeGreaterThan(small);
  });

  it("higher-LTV plan lends at least as much for identical input", () => {
    const inputs = { netWeightGrams: 45, karat: 22 };
    const emi = computePlanQuote(inputs, EMI, RATE).eligibleLoanPaise; // 75%
    const bullet = computePlanQuote(inputs, BULLET, RATE).eligibleLoanPaise; // 70%
    expect(emi).toBeGreaterThanOrEqual(bullet);
  });

  it("max weight (1000g 24K) stays within JS safe integers", () => {
    const loan = computePlanQuote({ netWeightGrams: 1000, karat: 24 }, EMI, RATE).eligibleLoanPaise;
    expect(Number.isSafeInteger(loan)).toBe(true);
    expect(loan).toBe(525_000_000); // ₹52,50,000
  });
});

describe("plan lookup — the 404 path", () => {
  it("returns undefined for an unknown plan id", () => {
    expect(getPlan("PLAN_DOES_NOT_EXIST")).toBeUndefined();
  });
});

describe("validation — boundaries", () => {
  it("allows net == gross", () => {
    expect(QuoteInput.safeParse({ netWeightGrams: 45, grossWeightGrams: 45, karat: 22 }).success).toBe(true);
  });

  it("allows net = gross = 1000 but rejects 1000.001", () => {
    expect(QuoteInput.safeParse({ netWeightGrams: 1000, grossWeightGrams: 1000, karat: 24 }).success).toBe(true);
    expect(QuoteInput.safeParse({ netWeightGrams: 1000.001, grossWeightGrams: 1000.001, karat: 24 }).success).toBe(false);
  });

  it("rejects net just above gross", () => {
    expect(QuoteInput.safeParse({ netWeightGrams: 45.001, grossWeightGrams: 45, karat: 22 }).success).toBe(false);
  });

  it("accepts every valid first mobile digit, rejects 0-5 and wrong length", () => {
    for (const d of ["6", "7", "8", "9"]) {
      expect(LeadInput.safeParse({ ...base, mobileNumber: d + "000000000" }).success).toBe(true);
    }
    for (const bad of ["5999999999", "0999999999", "98765", "98765432100", "+919876543210", " 9876543210"]) {
      expect(LeadInput.safeParse({ ...base, mobileNumber: bad }).success).toBe(false);
    }
  });

  it("name: trims, allows 2 chars, rejects whitespace-only and 61 chars", () => {
    expect(LeadInput.safeParse({ ...base, name: "  Asha Rao  " }).success).toBe(true); // trimmed
    expect(LeadInput.safeParse({ ...base, name: "Al" }).success).toBe(true);
    expect(LeadInput.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(LeadInput.safeParse({ ...base, name: "A".repeat(61) }).success).toBe(false);
  });
});
