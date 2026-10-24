import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '9999999999';
  const adminPassword = 'adminpassword123';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone }
  });

  if (existingAdmin) {
    console.log('Admin already exists:', existingAdmin.phone);
    return;
  }

  const password_hash = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      phone: adminPhone,
      email: 'admin@buildingapproval.com',
      role: Role.ADMIN,
      password_hash
    }
  });
  
  console.log('Admin created successfully:', admin.phone, adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
