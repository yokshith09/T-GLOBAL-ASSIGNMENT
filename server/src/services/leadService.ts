import { Prisma } from "@prisma/client";
import type { LeadSource, LeadStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { conflict } from "../lib/errors.js";
import { maskMobile } from "../lib/mask.js";
import { newApplicationId } from "../lib/applicationId.js";
import { paiseToWholeRupees } from "../domain/money.js";
import { goldValueInPaise, pureGoldGrams } from "../domain/quote.js";
import { quoteForPlan } from "./quoteService.js";
import type { LeadInputType } from "../schemas/loan.js";

const DEDUP_WINDOW_DAYS = 7;

export type LeadCreated = {
  applicationId: string;
  status: LeadStatus;
  eligibleLoanRupees: number;
  mobileNumber: string; // masked
};

export type LeadView = {
  applicationId: string;
  name: string;
  mobileNumberMasked: string;
  netWeightGrams: number;
  schemeId: string;
  eligibleLoanRupees: number;
  status: LeadStatus;
  createdAt: string;
};

/**
 * Create a lead. The server re-computes every number from the plan — client-sent
 * amounts are never trusted. Same mobile within 7 days → 409 with the existing id.
 * Shared by POST /leads and the agent's submit_application tool.
 */
export async function createLead(input: LeadInputType, source: LeadSource): Promise<LeadCreated> {
  const existing = await findRecentByMobile(input.mobileNumber);
  if (existing) {
    throw conflict("You already applied in the last 7 days.", {
      applicationId: existing.applicationId,
      appliedAt: existing.createdAt.toISOString(),
    });
  }

  const quote = await quoteForPlan(input, input.schemeId); // throws 404 if plan unknown
  const goldValuePaise = goldValueInPaise(input, env.rate24kPaisePerGram);

  const lead = await insertWithUniqueId({
    input,
    source,
    goldValuePaise,
    eligibleLoanPaise: quote.eligibleLoanPaise,
  });

  return {
    applicationId: lead.applicationId,
    status: lead.status,
    eligibleLoanRupees: quote.eligibleLoanRupees,
    mobileNumber: maskMobile(lead.mobileNumber),
  };
}

export async function listLeads(schemeId?: string): Promise<LeadView[]> {
  const rows = await prisma.lead.findMany({
    where: schemeId ? { schemeId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    applicationId: r.applicationId,
    name: r.name,
    mobileNumberMasked: maskMobile(r.mobileNumber),
    netWeightGrams: Number(r.netWeightGrams),
    schemeId: r.schemeId,
    eligibleLoanRupees: paiseToWholeRupees(Number(r.eligibleLoanPaise)),
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

function findRecentByMobile(mobileNumber: string) {
  const since = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return prisma.lead.findFirst({
    where: { mobileNumber, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
}

/** Insert, retrying on the rare applicationId collision from the random generator. */
async function insertWithUniqueId(args: {
  input: LeadInputType;
  source: LeadSource;
  goldValuePaise: number;
  eligibleLoanPaise: number;
}) {
  const { input, source, goldValuePaise, eligibleLoanPaise } = args;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.lead.create({
        data: {
          applicationId: newApplicationId(),
          name: input.name,
          mobileNumber: input.mobileNumber,
          grossWeightGrams: input.grossWeightGrams,
          netWeightGrams: input.netWeightGrams,
          karat: input.karat,
          schemeId: input.schemeId,
          pureGoldGrams: pureGoldGrams(input),
          goldValuePaise: BigInt(goldValuePaise),
          eligibleLoanPaise: BigInt(eligibleLoanPaise),
          source,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("Could not allocate a unique application id.");
}
