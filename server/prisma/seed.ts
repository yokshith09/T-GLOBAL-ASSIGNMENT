import { PrismaClient } from "@prisma/client";
import { PLANS } from "../src/domain/plans.js";

const prisma = new PrismaClient();

async function main() {
  for (const p of PLANS) {
    await prisma.loanScheme.upsert({
      where: { id: p.id },
      update: { ...p, active: true },
      create: { ...p, active: true },
    });
  }
  console.log(`Seeded ${PLANS.length} loan schemes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
