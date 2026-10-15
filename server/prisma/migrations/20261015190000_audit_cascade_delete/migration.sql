-- Deleting a Lead (test cleanup, admin tooling) should remove its audit trail with it,
-- instead of failing with a foreign-key violation.
ALTER TABLE "LeadStatusAudit" DROP CONSTRAINT "LeadStatusAudit_leadId_fkey";
ALTER TABLE "LeadStatusAudit" ADD CONSTRAINT "LeadStatusAudit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
