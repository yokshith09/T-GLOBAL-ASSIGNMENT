import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();
const mobile = (p: string) => p + String(Math.floor(10000000 + Math.random() * 89999999));
const MOBILE_IDEMP = mobile("91");
const MOBILE_RACE = mobile("92");
const MOBILE_STATUS = mobile("93");

const lead = (mobileNumber: string) => ({
  name: "Bonus Test",
  mobileNumber,
  grossWeightGrams: 46,
  netWeightGrams: 45,
  karat: 22,
  schemeId: "PLAN_EMI_01",
});

afterAll(async () => {
  await prisma.lead.deleteMany({ where: { mobileNumber: { in: [MOBILE_IDEMP, MOBILE_RACE, MOBILE_STATUS] } } });
  await prisma.idempotencyKey.deleteMany({ where: { key: { startsWith: "test-key-" } } });
  await prisma.$disconnect();
});

describe("B1 — idempotency (case 7)", () => {
  it("same Idempotency-Key replays the original 201", async () => {
    const key = "test-key-" + Date.now();
    const first = await request(app).post("/api/v1/leads").set("Idempotency-Key", key).send(lead(MOBILE_IDEMP));
    expect(first.status).toBe(201);
    const second = await request(app).post("/api/v1/leads").set("Idempotency-Key", key).send(lead(MOBILE_IDEMP));
    expect(second.status).toBe(201);
    expect(second.body.applicationId).toBe(first.body.applicationId); // replayed, not re-filed
  });
});

describe("B1 — race-safe duplicate (case 8)", () => {
  it("two parallel requests for a new mobile yield exactly one 201 and one 409", async () => {
    const [a, b] = await Promise.all([
      request(app).post("/api/v1/leads").send(lead(MOBILE_RACE)),
      request(app).post("/api/v1/leads").send(lead(MOBILE_RACE)),
    ]);
    const codes = [a.status, b.status].sort();
    expect(codes).toEqual([201, 409]);
  });
});

describe("B1 — status workflow + audit", () => {
  it("transitions SUBMITTED → UNDER_REVIEW → APPROVED and records an audit", async () => {
    const created = await request(app).post("/api/v1/leads").send(lead(MOBILE_STATUS));
    expect(created.status).toBe(201);
    const id = created.body.applicationId;

    const r1 = await request(app).patch(`/api/v1/leads/${id}/status`).send({ status: "UNDER_REVIEW" });
    expect(r1.status).toBe(200);
    expect(r1.body.status).toBe("UNDER_REVIEW");

    const r2 = await request(app).patch(`/api/v1/leads/${id}/status`).send({ status: "APPROVED" });
    expect(r2.body.status).toBe("APPROVED");

    const audit = await request(app).get(`/api/v1/leads/${id}/audit`);
    expect(audit.body.length).toBe(2);
    expect(audit.body.map((a: { to: string }) => a.to)).toEqual(["UNDER_REVIEW", "APPROVED"]);
  });

  it("rejects an invalid transition with 400", async () => {
    const created = await request(app).post("/api/v1/leads").send({ ...lead(MOBILE_STATUS), mobileNumber: mobile("94") });
    const id = created.body.applicationId;
    await request(app).patch(`/api/v1/leads/${id}/status`).send({ status: "APPROVED" });
    const bad = await request(app).patch(`/api/v1/leads/${id}/status`).send({ status: "UNDER_REVIEW" });
    expect(bad.status).toBe(400);
    await prisma.lead.deleteMany({ where: { applicationId: id } });
  });
});

describe("B1 — cached gold-rate endpoint", () => {
  it("returns the 24K rate", async () => {
    const res = await request(app).get("/api/v1/gold-rate");
    expect(res.status).toBe(200);
    expect(res.body.ratePerGramRupees).toBe(7000);
    expect(res.body.ttlSeconds).toBeGreaterThan(0);
  });
});
