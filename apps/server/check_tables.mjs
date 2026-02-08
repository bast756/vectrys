import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTables() {
  try {
    const bosses = await prisma.bossBattle.count();
    console.log('✅ BossBattle table exists! Count:', bosses);
    
    if (bosses > 0) {
      const firstBoss = await prisma.bossBattle.findFirst();
      console.log('   Boss:', firstBoss.boss_name, '| ID:', firstBoss.id);
    }
    
    const worlds = await prisma.questWorld.count();
    console.log('✅ QuestWorld table exists! Count:', worlds);
    
    const questions = await prisma.languageQuizQuestion.count({ where: { level: { startsWith: 'A2' } } });
    console.log('✅ LanguageQuizQuestion (A2 level) exists! Count:', questions);
    
    console.log('\n🎯 Ready to test boss battle!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
