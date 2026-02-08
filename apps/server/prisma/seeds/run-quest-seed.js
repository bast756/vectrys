/**
 * Runner script to execute Quest Seed
 */

import { seedAllWorlds } from './quest.seed.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Hero Quest Journey Seed...\n');

  try {
    await seedAllWorlds();
    console.log('\n✅ Quest seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Quest seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
