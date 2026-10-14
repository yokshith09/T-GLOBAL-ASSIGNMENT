import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    id: "PLAN_BULLET_01",
    name: "Bullet Repayment",
    annualRateBps: 1200, // 12.00%
    maxLtvBps: 7000, // 70%
    tenureMonths: 12,
    tenureNote: "Interest + principal at maturity",
    active: true,
  },
  {
    id: "PLAN_EMI_01",
    name: "Monthly EMI",
    annualRateBps: 1050, // 10.50%
    maxLtvBps: 7500, // 75%
    tenureMonths: 12,
    tenureNote: "Equal monthly instalments",
    active: true,
  },
];

async function main() {
  for (const p of plans) {
    await prisma.loanScheme.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log(`Seeded ${plans.length} loan schemes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
