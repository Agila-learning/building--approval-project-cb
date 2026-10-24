const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.document.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.case.deleteMany();
  await prisma.property.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleared successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
