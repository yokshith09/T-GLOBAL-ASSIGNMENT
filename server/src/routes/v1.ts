import { Router } from "express";
import { asyncHandler, parseOrThrow } from "../lib/errors.js";
import { LeadInput, QuoteInput } from "../schemas/loan.js";
import { listActiveSchemes } from "../services/schemeService.js";
import { getQuote } from "../services/quoteService.js";
import { createLead, listLeads } from "../services/leadService.js";

export const v1 = Router();

v1.get(
  "/loan-schemes",
  asyncHandler(async (_req, res) => {
    res.json(await listActiveSchemes());
  }),
);

v1.post(
  "/quotes",
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(QuoteInput, req.body);
    res.json(await getQuote(input));
  }),
);

v1.post(
  "/leads",
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(LeadInput, req.body);
    const created = await createLead(input, "FORM");
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
