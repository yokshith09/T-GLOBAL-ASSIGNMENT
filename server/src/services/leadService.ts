import { Prisma } from "@prisma/client";
import type { LeadSource, LeadStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
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

type Tx = Prisma.TransactionClient;

/**
 * Create a lead. The server re-computes every number from the plan — client-sent
 * amounts are never trusted. Same mobile within 7 days → 409 with the existing id.
 *
 * Bonus hardening:
 *  - Idempotency-Key: the same key replays the original response instead of filing again.
 *  - Race-safe dedupe: a per-mobile advisory lock serialises concurrent submits, so two
 *    parallel requests for a new mobile yield exactly one 201 and one 409.
 */
export async function createLead(
  input: LeadInputType,
  source: LeadSource,
  idempotencyKey?: string,
): Promise<LeadCreated> {
  if (idempotencyKey) {
    const prior = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (prior) return prior.response as unknown as LeadCreated;
  }

  const quote = await quoteForPlan(input, input.schemeId); // throws 404 if plan unknown
  const goldValuePaise = goldValueInPaise(input, env.rate24kPaisePerGram);

  return prisma.$transaction(async (tx) => {
    // Serialise everyone filing for this mobile until the transaction commits.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.mobileNumber}))`;

    const existing = await findRecentByMobile(tx, input.mobileNumber);
    if (existing) {
      throw conflict("You already applied in the last 7 days.", {
        applicationId: existing.applicationId,
        appliedAt: existing.createdAt.toISOString(),
      });
    }

    const lead = await insertWithUniqueId(tx, { input, source, goldValuePaise, eligibleLoanPaise: quote.eligibleLoanPaise });
    const response: LeadCreated = {
      applicationId: lead.applicationId,
      status: lead.status,
      eligibleLoanRupees: quote.eligibleLoanRupees,
      mobileNumber: maskMobile(lead.mobileNumber),
    };

    if (idempotencyKey) {
      await tx.idempotencyKey.create({ data: { key: idempotencyKey, leadId: lead.id, response } });
    }
    return response;
  });
}

export async function listLeads(schemeId?: string): Promise<LeadView[]> {
  const rows = await prisma.lead.findMany({
    where: schemeId ? { schemeId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toView);
}

const toView = (r: {
  applicationId: string; name: string; mobileNumber: string; netWeightGrams: Prisma.Decimal;
  schemeId: string; eligibleLoanPaise: bigint; status: LeadStatus; createdAt: Date;
}): LeadView => ({
  applicationId: r.applicationId,
  name: r.name,
  mobileNumberMasked: maskMobile(r.mobileNumber),
  netWeightGrams: Number(r.netWeightGrams),
  schemeId: r.schemeId,
  eligibleLoanRupees: paiseToWholeRupees(Number(r.eligibleLoanPaise)),
  status: r.status,
  createdAt: r.createdAt.toISOString(),
});

/** Most recent application for a mobile, masked — used by the agent's check tool. */
export async function findRecentApplication(mobileNumber: string) {
  const row = await findRecentByMobile(prisma, mobileNumber);
  if (!row) return { exists: false as const };
  return {
    exists: true as const,
    applicationId: row.applicationId,
    appliedAt: row.createdAt.toISOString(),
    status: row.status,
  };
}

// ---- Status workflow (bonus) ----

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export async function updateLeadStatus(applicationId: string, to: LeadStatus) {
  const lead = await prisma.lead.findUnique({ where: { applicationId } });
  if (!lead) throw notFound(`Unknown application: ${applicationId}`);
  if (lead.status === to) return { applicationId, status: to };
  if (!TRANSITIONS[lead.status].includes(to)) {
    throw badRequest(`Cannot move ${applicationId} from ${lead.status} to ${to}.`, [
      { field: "status", message: `Invalid transition from ${lead.status}.` },
    ]);
  }
  const [updated] = await prisma.$transaction([
    prisma.lead.update({ where: { applicationId }, data: { status: to } }),
    prisma.leadStatusAudit.create({ data: { leadId: lead.id, from: lead.status, to } }),
  ]);
  return { applicationId, status: updated.status };
}

export async function getLeadAudit(applicationId: string) {
  const lead = await prisma.lead.findUnique({ where: { applicationId } });
  if (!lead) throw notFound(`Unknown application: ${applicationId}`);
  const audits = await prisma.leadStatusAudit.findMany({ where: { leadId: lead.id }, orderBy: { at: "asc" } });
  return audits.map((a) => ({ from: a.from, to: a.to, at: a.at.toISOString() }));
}

// ---- internals ----

function findRecentByMobile(tx: Tx, mobileNumber: string) {
  const since = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return tx.lead.findFirst({
    where: { mobileNumber, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
}

/** Insert, retrying on the rare applicationId collision from the random generator. */
async function insertWithUniqueId(tx: Tx, args: {
  input: LeadInputType; source: LeadSource; goldValuePaise: number; eligibleLoanPaise: number;
}) {
  const { input, source, goldValuePaise, eligibleLoanPaise } = args;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await tx.lead.create({
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
