-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('FORM', 'AGENT');

-- CreateTable
CREATE TABLE "LoanScheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualRateBps" INTEGER NOT NULL,
    "maxLtvBps" INTEGER NOT NULL,
    "tenureMonths" INTEGER NOT NULL DEFAULT 12,
    "tenureNote" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoanScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "grossWeightGrams" DECIMAL(8,3) NOT NULL,
    "netWeightGrams" DECIMAL(8,3) NOT NULL,
    "karat" INTEGER NOT NULL,
    "schemeId" TEXT NOT NULL,
    "pureGoldGrams" DECIMAL(10,4) NOT NULL,
    "goldValuePaise" BIGINT NOT NULL,
    "eligibleLoanPaise" BIGINT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "source" "LeadSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStatusAudit" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "from" "LeadStatus",
    "to" "LeadStatus" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStatusAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_applicationId_key" ON "Lead"("applicationId");

-- CreateIndex
CREATE INDEX "Lead_mobileNumber_createdAt_idx" ON "Lead"("mobileNumber", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_schemeId_idx" ON "Lead"("schemeId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "LoanScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusAudit" ADD CONSTRAINT "LeadStatusAudit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
