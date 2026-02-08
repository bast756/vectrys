const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    const bosses = await prisma.bossBattle.count();
    console.log('✅ BossBattle table exists! Count:', bosses);
    
    const worlds = await prisma.questWorld.count();
    console.log('✅ QuestWorld table exists! Count:', worlds);
    
    const questions = await prisma.languageQuizQuestion.count({ where: { level_cecrl: { startsWith: 'A2' } } });
    console.log('✅ LanguageQuizQuestion (A2) exists! Count:', questions);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
