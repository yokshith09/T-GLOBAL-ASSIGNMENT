import { Router } from "express";
import { z } from "zod";
import { asyncHandler, parseOrThrow } from "../lib/errors.js";
import { rateLimit } from "../lib/rateLimit.js";
import { LeadInput, QuoteInput } from "../schemas/loan.js";
import { listActiveSchemes } from "../services/schemeService.js";
import { getQuote } from "../services/quoteService.js";
import { createLead, getLeadAudit, listLeads, updateLeadStatus } from "../services/leadService.js";
import { getGoldRate } from "../services/rateService.js";

export const v1 = Router();

const StatusBody = z.object({ status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]) });

v1.get("/loan-schemes", asyncHandler(async (_req, res) => res.json(await listActiveSchemes())));

v1.get("/gold-rate", asyncHandler(async (_req, res) => res.json(getGoldRate())));

v1.post(
  "/quotes",
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(QuoteInput, req.body);
    res.json(await getQuote(input));
  }),
);

v1.post(
  "/leads",
  rateLimit(20, 60_000), // bonus: 20 submissions/min per IP
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(LeadInput, req.body);
    const idempotencyKey = req.header("Idempotency-Key") || undefined;
    const created = await createLead(input, "FORM", idempotencyKey);
    res.status(201).json(created);
  }),
);

v1.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const schemeId = typeof req.query.schemeId === "string" ? req.query.schemeId : undefined;
    res.json(await listLeads(schemeId));
  }),
);

// Bonus: status workflow + audit log
v1.patch(
  "/leads/:applicationId/status",
  asyncHandler(async (req, res) => {
    const { status } = parseOrThrow(StatusBody, req.body);
    res.json(await updateLeadStatus(req.params.applicationId, status));
  }),
);

v1.get(
  "/leads/:applicationId/audit",
  asyncHandler(async (req, res) => res.json(await getLeadAudit(req.params.applicationId))),
);
