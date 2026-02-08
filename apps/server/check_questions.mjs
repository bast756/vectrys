import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkQuestions() {
  try {
    const total = await prisma.languageQuizQuestion.count();
    console.log('Total questions:', total);
    
    // Group by level
    const levels = await prisma.languageQuizQuestion.groupBy({
      by: ['level'],
      _count: true
    });
    
    console.log('\nQuestions par niveau:');
    levels.forEach(l => {
      console.log(`  ${l.level}: ${l._count} questions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestions();
