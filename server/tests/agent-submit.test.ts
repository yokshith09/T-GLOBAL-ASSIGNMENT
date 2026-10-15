import { describe, expect, it, afterAll } from "vitest";
import { confirmAndSubmit } from "../src/agent/orchestrator.js";
import { AppError } from "../src/lib/errors.js";
import { prisma } from "../src/lib/prisma.js";

const mobile = "9" + String(Math.floor(100000000 + Math.random() * 899999999));
const payload = {
  name: "Agent Submit Test",
  mobileNumber: mobile,
  netWeightGrams: 45,
  grossWeightGrams: 46,
  karat: 22,
  schemeId: "PLAN_EMI_01",
};

afterAll(() => prisma.lead.deleteMany({ where: { mobileNumber: mobile } }).then(() => prisma.$disconnect()));

describe("agent submit_application wiring (req #22, #24)", () => {
  it("confirmAndSubmit calls the same leadService used by POST /leads, returns a real GL- id", async () => {
    const created = await confirmAndSubmit(payload);
    expect(created.applicationId).toMatch(/^GL-\d{6}$/);
    expect(created.status).toBe("SUBMITTED");
    // mobile masked, same as the REST path
    expect(created.mobileNumber).toBe(mobile.slice(0, 4) + "XXXX" + mobile.slice(8));
  });

  it("confirmAndSubmit enforces the same 7-day dedupe as the form (second call -> 409)", async () => {
    await expect(confirmAndSubmit(payload)).rejects.toMatchObject({ status: 409 });
    try {
      await confirmAndSubmit(payload);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).extra.applicationId).toMatch(/^GL-\d{6}$/);
    }
  });

  it("confirmAndSubmit rejects an invalid payload with 400 (same Zod rules as the form)", async () => {
    await expect(confirmAndSubmit({ ...payload, mobileNumber: "123" })).rejects.toMatchObject({ status: 400 });
  });
});

// Explicit-confirmation gating (req #24) is a code-level guarantee, verified by inspection:
// runOrchestrator (src/agent/orchestrator.ts) intercepts the model's submit_application tool
// call and returns { pendingConfirmation } WITHOUT calling createLead/confirmAndSubmit. Only a
// separate call to confirmAndSubmit (wired to POST /agent/confirm, triggered by the user clicking
// "Confirm & submit" in the UI) performs the write. No code path lets runChat call createLead
// directly. See VERIFICATION_REPORT.md for the inspected line numbers.
