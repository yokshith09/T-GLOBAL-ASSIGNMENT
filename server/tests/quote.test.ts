import { describe, expect, it } from "vitest";
import { getPlan } from "../src/domain/plans.js";
import { computePlanQuote, computeQuote, pureGoldGrams } from "../src/domain/quote.js";

const RATE = 700000; // 24K paise/gram = ₹7,000/g (brief's mock rate)
const EMI = getPlan("PLAN_EMI_01")!; // 75% LTV
const BULLET = getPlan("PLAN_BULLET_01")!; // 70% LTV

describe("computeQuote — brief expected values", () => {
  it("case 1: 45g 22K EMI → pure 41.25g, value ₹2,88,750, loan ₹2,16,562", () => {
    const inputs = { netWeightGrams: 45, karat: 22 };
    expect(pureGoldGrams(inputs)).toBe(41.25);
    const q = computePlanQuote(inputs, EMI, RATE);
    expect(computeQuote(inputs, [EMI], RATE).goldValuePaise).toBe(28_875_000); // ₹2,88,750
    expect(q.eligibleLoanRupees).toBe(216_562); // floor(2,88,750 × 0.75) = floor(2,16,562.5)
  });

  it("case 2: 45g 22K Bullet → loan ₹2,02,125 (70% LTV)", () => {
    const inputs = { netWeightGrams: 45, karat: 22 };
    expect(computePlanQuote(inputs, BULLET, RATE).eligibleLoanRupees).toBe(202_125);
  });

  it("case 3: 10g 18K EMI → pure 7.5g, value ₹52,500, loan ₹39,375", () => {
    const inputs = { netWeightGrams: 10, karat: 18 };
    expect(pureGoldGrams(inputs)).toBe(7.5);
    expect(computeQuote(inputs, [EMI], RATE).goldValuePaise).toBe(5_250_000); // ₹52,500
    expect(computePlanQuote(inputs, EMI, RATE).eligibleLoanRupees).toBe(39_375);
  });
});

describe("LTV discipline", () => {
  it("never exceeds 75% even if a plan claims more", () => {
    const greedy = { ...EMI, maxLtvBps: 9000 }; // 90% plan
    const q = computePlanQuote({ netWeightGrams: 45, karat: 22 }, greedy, RATE);
    expect(q.maxLtvBps).toBe(7500);
    expect(q.eligibleLoanRupees).toBe(216_562); // capped at 75%, not 90%
  });

  it("money is whole rupees (floored, never rounded up)", () => {
    // 2,16,562.50 must floor to 2,16,562, not round to 2,16,563
    const q = computePlanQuote({ netWeightGrams: 45, karat: 22 }, EMI, RATE);
    expect(q.eligibleLoanPaise).toBe(21_656_250);
    expect(q.eligibleLoanRupees).toBe(216_562);
  });
});
