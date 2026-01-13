import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  try {
    const hashedpassword = await bcrypt.hash('admin@debugDuel', 10);
    console.log('🌱 Starting database seeding...');

    await prisma.user.create({
      data:{
        username: 'admin',
        email: 'k240603@nu.edu.pk',
        password: hashedpassword,
        role: 'ADMIN'
      },
    })

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
