require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'admin@onlymans.com';
const ADMIN_USERNAME = 'superadmin';
const ADMIN_PASSWORD = 'Admin@123';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`Admin already exists → email: ${ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email:        ADMIN_EMAIL,
      username:     ADMIN_USERNAME,
      passwordHash,
      role:         'ADMIN',
      isVerified:   true,
      isActive:     true,
    },
  });

  console.log('✅  Admin user created');
  console.log(`    Email    : ${admin.email}`);
  console.log(`    Username : ${admin.username}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(`    Role     : ${admin.role}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
