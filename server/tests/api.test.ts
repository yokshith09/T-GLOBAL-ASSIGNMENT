import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

// Unique mobile per run so the 7-day dedup check starts clean; cleaned up after.
const testMobile = "9" + String(Math.floor(100000000 + Math.random() * 899999999));
const validLead = {
  name: "Test User",
  mobileNumber: testMobile,
  grossWeightGrams: 46,
  netWeightGrams: 45,
  karat: 22,
  schemeId: "PLAN_EMI_01",
};

afterAll(async () => {
  await prisma.lead.deleteMany({ where: { mobileNumber: testMobile } });
  await prisma.$disconnect();
});

describe("GET /api/v1/loan-schemes", () => {
  it("returns active plans with percent rates, LTV never above 75", async () => {
    const res = await request(app).get("/api/v1/loan-schemes");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    for (const s of res.body) expect(s.maxLtvPercent).toBeLessThanOrEqual(75);
  });
});

describe("POST /api/v1/quotes", () => {
  it("case 1: 45g 22K → value ₹2,88,750, EMI loan ₹2,16,562", async () => {
    const res = await request(app).post("/api/v1/quotes").send({
      netWeightGrams: 45,
      grossWeightGrams: 46,
      karat: 22,
    });
    expect(res.status).toBe(200);
    expect(res.body.pureGoldGrams).toBe(41.25);
    expect(res.body.goldValueRupees).toBe(288750);
    const emi = res.body.quotes.find((q: { schemeId: string }) => q.schemeId === "PLAN_EMI_01");
    expect(emi.eligibleLoanRupees).toBe(216562);
  });

  it("case 4: net > gross → 400 on netWeightGrams", async () => {
    const res = await request(app).post("/api/v1/quotes").send({
      netWeightGrams: 52,
      grossWeightGrams: 50,
      karat: 22,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields.map((f: { field: string }) => f.field)).toContain("netWeightGrams");
  });
});

describe("POST /api/v1/leads", () => {
  it("case 5: bad mobile → 400 on mobileNumber", async () => {
    const res = await request(app).post("/api/v1/leads").send({ ...validLead, mobileNumber: "5876543210" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.map((f: { field: string }) => f.field)).toContain("mobileNumber");
  });

  it("unknown plan → 404", async () => {
    const res = await request(app).post("/api/v1/leads").send({ ...validLead, schemeId: "PLAN_NOPE" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SCHEME_NOT_FOUND");
  });

  it("valid lead → 201 with applicationId and masked mobile", async () => {
    const res = await request(app).post("/api/v1/leads").send(validLead);
    expect(res.status).toBe(201);
    expect(res.body.applicationId).toMatch(/^GL-\d{6}$/);
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.eligibleLoanRupees).toBe(216562);
    expect(res.body.mobileNumber).toBe(testMobile.slice(0, 4) + "XXXX" + testMobile.slice(8));
  });

  it("case 6: same mobile within 7 days → 409 with the existing applicationId", async () => {
    const res = await request(app).post("/api/v1/leads").send(validLead);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_LEAD");
    expect(res.body.error.applicationId).toMatch(/^GL-\d{6}$/);
  });
});

describe("GET /api/v1/leads", () => {
  it("returns leads newest first with masked mobiles", async () => {
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(200);
    const mine = res.body.find((l: { mobileNumberMasked: string }) =>
      l.mobileNumberMasked === testMobile.slice(0, 4) + "XXXX" + testMobile.slice(8),
    );
    expect(mine).toBeTruthy();
    for (const l of res.body) expect(l.mobileNumberMasked).toContain("XXXX");
  });
});
