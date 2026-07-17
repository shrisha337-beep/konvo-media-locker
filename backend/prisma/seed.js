const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { email: 'demo@konvo.test' },
    update: {},
    create: { email: 'demo@konvo.test', password, walletBalance: 100 },
  });
  console.log('Seeded demo@konvo.test / demo1234');
}

main().finally(() => prisma.$disconnect());
