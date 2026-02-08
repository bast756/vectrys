/**
 * VECTRYS LINGUA - Hero Quest Journey API Routes
 * Routes for quest worlds, quests, boss battles, dialogues, and progression
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateQuestXP } from '../services/xp.service.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// WORLD MANAGEMENT
// ============================================================================

/**
 * GET /api/quest/worlds
 * Get all quest worlds with user's progression status
 */
router.get('/worlds', async (req, res) => {
  try {
    const { housekeeperId } = req.query;

    if (!housekeeperId) {
      return res.status(400).json({
        success: false,
        message: 'housekeeperId is required'
      });
    }

    // Fetch all worlds
    const worlds = await prisma.questWorld.findMany({
      where: { active: true },
      orderBy: { display_order: 'asc' },
      include: {
        boss_battle: true,
        quests: {
          where: { active: true },
          select: { id: true, type: true }
        }
      }
    });

    // Fetch user's world progress
    const worldProgressRecords = await prisma.worldProgress.findMany({
      where: { housekeeper_id: housekeeperId }
    });

    const progressMap = new Map(
      worldProgressRecords.map(wp => [wp.world_id, wp])
    );

    // Combine worlds with progress
    const worldsWithProgress = worlds.map(world => {
      const progress = progressMap.get(world.id) || {
        status: world.world_number === 1 ? 'unlocked' : 'locked',
        quests_completed: 0,
        quests_total: world.total_quests,
        completion_percent: 0,
        boss_unlocked: false,
        boss_defeated: false
      };

      return {
        world,
        progress,
        is_locked: progress.status === 'locked'
      };
    });

    res.json({
      success: true,
      data: worldsWithProgress
    });

  } catch (error) {
    console.error('Error fetching quest worlds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quest worlds',
      error: error.message
    });
  }
});

/**
 * GET /api/quest/worlds/:worldId
 * Get detailed world info with all quests and user progress
 */
router.get('/worlds/:worldId', async (req, res) => {
  try {
    const { worldId } = req.params;
    const { housekeeperId } = req.query;

    if (!housekeeperId) {
      return res.status(400).json({
        success: false,
        message: 'housekeeperId is required'
      });
    }

    // Fetch world with quests and boss
    const world = await prisma.questWorld.findUnique({
      where: { id: worldId },
      include: {
        quests: {
          where: { active: true },
          orderBy: { quest_number: 'asc' }
        },
        boss_battle: true
      }
    });

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      });
    }

    // Fetch world progress
    const worldProgress = await prisma.worldProgress.findUnique({
      where: {
        housekeeper_id_world_id: {
          housekeeper_id: housekeeperId,
          world_id: worldId
        }
      }
    });

    // Fetch quest progress for all quests in this world
    const questProgressRecords = await prisma.questProgress.findMany({
      where: {
        housekeeper_id: housekeeperId,
        quest_id: { in: world.quests.map(q => q.id) }
      }
    });

    const questProgressMap = new Map(
      questProgressRecords.map(qp => [qp.quest_id, qp])
    );

    // Combine quests with progress
    const questsWithProgress = world.quests.map(quest => {
      const progress = questProgressMap.get(quest.id) || {
        status: 'locked',
        completion_percent: 0
      };

      return {
        ...quest,
        progress
      };
    });

    res.json({
      success: true,
      data: {
        world,
        quests: questsWithProgress,
        progress: worldProgress,
        boss_battle: world.boss_battle
      }
    });

  } catch (error) {
    console.error('Error fetching world details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch world details',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/worlds/:worldId/unlock
 * Attempt to unlock a world
 */
router.post('/worlds/:worldId/unlock', async (req, res) => {
  try {
    const { worldId } = req.params;
    const { housekeeper_id } = req.body;

    if (!housekeeper_id) {
      return res.status(400).json({
        success: false,
        message: 'housekeeper_id is required'
      });
    }

    const world = await prisma.questWorld.findUnique({
      where: { id: worldId }
    });

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      });
    }

    // World 1 is always unlocked
    if (world.world_number === 1) {
      const progress = await prisma.worldProgress.upsert({
        where: {
          housekeeper_id_world_id: {
            housekeeper_id,
            world_id: worldId
          }
        },
        update: {
          status: 'unlocked',
          unlocked_at: new Date()
        },
        create: {
          housekeeper_id,
          world_id: worldId,
          status: 'unlocked',
          quests_total: world.total_quests,
          unlocked_at: new Date()
        }
      });

      return res.json({
        success: true,
        unlocked: true,
        message: 'World 1 is always available',
        progress
      });
    }

    // Check requirements for other worlds
    const previousWorldNumber = world.world_number - 1;
    const previousWorld = await prisma.questWorld.findUnique({
      where: { world_number: previousWorldNumber }
    });

    if (!previousWorld) {
      return res.status(400).json({
        success: false,
        message: 'Previous world not found'
      });
    }

    const previousProgress = await prisma.worldProgress.findUnique({
      where: {
        housekeeper_id_world_id: {
          housekeeper_id,
          world_id: previousWorld.id
        }
      }
    });

    // Check unlock requirements
    if (!previousProgress || !previousProgress.boss_defeated) {
      return res.status(403).json({
        success: false,
        unlocked: false,
        message: 'You must defeat the previous world\'s boss first'
      });
    }

    if (previousProgress.completion_percent < 70) {
      return res.status(403).json({
        success: false,
        unlocked: false,
        message: 'You must complete at least 70% of the previous world\'s quests'
      });
    }

    // Unlock the world
    const progress = await prisma.worldProgress.upsert({
      where: {
        housekeeper_id_world_id: {
          housekeeper_id,
          world_id: worldId
        }
      },
      update: {
        status: 'unlocked',
        unlocked_at: new Date()
      },
      create: {
        housekeeper_id,
        world_id: worldId,
        status: 'unlocked',
        quests_total: world.total_quests,
        unlocked_at: new Date()
      }
    });

    res.json({
      success: true,
      unlocked: true,
      message: `World ${world.world_number} unlocked!`,
      progress
    });

  } catch (error) {
    console.error('Error unlocking world:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock world',
      error: error.message
    });
  }
});

// ============================================================================
// QUEST MANAGEMENT
// ============================================================================

/**
 * GET /api/quest/quests/:questId
 * Get quest details with objectives and narrative
 */
router.get('/quests/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { housekeeperId } = req.query;

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        world: true
      }
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Fetch progress if housekeeperId provided
    let progress = null;
    if (housekeeperId) {
      progress = await prisma.questProgress.findUnique({
        where: {
          housekeeper_id_quest_id: {
            housekeeper_id: housekeeperId,
            quest_id: questId
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        quest,
        progress
      }
    });

  } catch (error) {
    console.error('Error fetching quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quest',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/quests/:questId/start
 * Start or resume a quest
 */
router.post('/quests/:questId/start', async (req, res) => {
  try {
    const { questId } = req.params;
    const { housekeeper_id } = req.body;

    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    // Check if quest is already in progress or completed
    let progress = await prisma.questProgress.findUnique({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      }
    });

    if (progress && progress.status === 'completed' && !quest.allow_replay) {
      return res.status(400).json({
        success: false,
        message: 'Quest already completed and replay is not allowed'
      });
    }

    // Initialize objectives state from quest objectives
    const objectivesState = quest.objectives;

    // Create or update progress
    progress = await prisma.questProgress.upsert({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      },
      update: {
        status: 'in_progress',
        started_at: new Date(),
        last_played: new Date(),
        attempts: { increment: 1 }
      },
      create: {
        housekeeper_id,
        quest_id: questId,
        status: 'in_progress',
        objectives_state: objectivesState,
        started_at: new Date(),
        last_played: new Date(),
        attempts: 1
      }
    });

    // Update quest stats
    await prisma.quest.update({
      where: { id: questId },
      data: {
        times_started: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: {
        quest_progress: progress,
        quest
      }
    });

  } catch (error) {
    console.error('Error starting quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quest',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/quests/:questId/update-objective
 * Update progress on a specific objective
 */
router.post('/quests/:questId/update-objective', async (req, res) => {
  try {
    const { questId } = req.params;
    const { housekeeper_id, objective_id, progress_value, completed } = req.body;

    const progress = await prisma.questProgress.findUnique({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Quest progress not found'
      });
    }

    // Update objectives state
    const objectivesState = progress.objectives_state;
    const objectiveIndex = objectivesState.findIndex(obj => obj.id === objective_id);

    if (objectiveIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Objective not found'
      });
    }

    objectivesState[objectiveIndex].progress = progress_value;
    objectivesState[objectiveIndex].completed = completed;

    // Calculate overall completion percent
    const totalObjectives = objectivesState.length;
    const completedObjectives = objectivesState.filter(obj => obj.completed).length;
    const completion_percent = Math.round((completedObjectives / totalObjectives) * 100);

    // Update progress
    const updatedProgress = await prisma.questProgress.update({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      },
      data: {
        objectives_state: objectivesState,
        completion_percent,
        last_played: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        quest_progress: updatedProgress,
        objective_completed: completed
      }
    });

  } catch (error) {
    console.error('Error updating objective:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update objective',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/quests/:questId/complete
 * Complete a quest and claim rewards
 */
router.post('/quests/:questId/complete', async (req, res) => {
  try {
    const { questId } = req.params;
    const { housekeeper_id, completion_percent } = req.body;

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { world: true }
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found'
      });
    }

    const progress = await prisma.questProgress.findUnique({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Quest progress not found'
      });
    }

    // Calculate XP reward using existing service
    const baseXP = calculateQuestXP({
      worldLevel: quest.world.world_number,
      questType: quest.type,
      completion: completion_percent
    });

    const bonusXP = completion_percent === 100 ? quest.xp_bonus : 0;
    const totalXP = baseXP + bonusXP;

    // Update quest progress
    const updatedProgress = await prisma.questProgress.update({
      where: {
        housekeeper_id_quest_id: {
          housekeeper_id,
          quest_id: questId
        }
      },
      data: {
        status: 'completed',
        completion_percent,
        completed_at: new Date(),
        xp_earned: totalXP,
        perfect_completion: completion_percent === 100,
        badges_unlocked: quest.badge_reward ? [quest.badge_reward] : [],
        items_unlocked: quest.item_rewards
      }
    });

    // Update housekeeper XP and level
    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeper_id }
    });

    const newTotalXP = housekeeper.total_xp + totalXP;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;

    await prisma.housekeeper.update({
      where: { id: housekeeper_id },
      data: {
        total_xp: newTotalXP,
        level: newLevel
      }
    });

    // Update world progress
    const worldProgress = await prisma.worldProgress.findUnique({
      where: {
        housekeeper_id_world_id: {
          housekeeper_id,
          world_id: quest.world_id
        }
      }
    });

    if (worldProgress) {
      const questsCompleted = worldProgress.quests_completed + 1;
      const worldCompletionPercent = Math.round((questsCompleted / quest.world.total_quests) * 100);

      await prisma.worldProgress.update({
        where: {
          housekeeper_id_world_id: {
            housekeeper_id,
            world_id: quest.world_id
          }
        },
        data: {
          quests_completed: questsCompleted,
          completion_percent: worldCompletionPercent,
          total_xp_earned: { increment: totalXP },
          boss_unlocked: worldCompletionPercent >= 70
        }
      });
    }

    // Update quest stats
    await prisma.quest.update({
      where: { id: questId },
      data: {
        times_completed: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: {
        xp_earned: totalXP,
        badges_unlocked: quest.badge_reward ? [quest.badge_reward] : [],
        items_unlocked: quest.item_rewards,
        level_up: newLevel > housekeeper.level,
        new_level: newLevel,
        quest_progress: updatedProgress
      }
    });

  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quest',
      error: error.message
    });
  }
});

// ============================================================================
// BOSS BATTLES
// ============================================================================

/**
 * GET /api/quest/boss/:bossId
 * Get boss battle details
 */
router.get('/boss/:bossId', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { housekeeperId } = req.query;

    const boss = await prisma.bossBattle.findUnique({
      where: { id: bossId },
      include: {
        world: true
      }
    });

    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss battle not found'
      });
    }

    // Fetch user's attempts if housekeeperId provided
    let attempts = [];
    if (housekeeperId) {
      attempts = await prisma.bossBattleAttempt.findMany({
        where: {
          housekeeper_id: housekeeperId,
          boss_battle_id: bossId
        },
        orderBy: { started_at: 'desc' },
        take: 10
      });
    }

    res.json({
      success: true,
      data: {
        boss,
        user_attempts: attempts
      }
    });

  } catch (error) {
    console.error('Error fetching boss battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boss battle',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/boss/:bossId/start
 * Start a boss battle attempt
 */
router.post('/boss/:bossId/start', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { housekeeper_id } = req.body;

    const boss = await prisma.bossBattle.findUnique({
      where: { id: bossId }
    });

    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss battle not found'
      });
    }

    // Count previous attempts
    const previousAttempts = await prisma.bossBattleAttempt.count({
      where: {
        housekeeper_id,
        boss_battle_id: bossId
      }
    });

    // Create new attempt
    const attempt = await prisma.bossBattleAttempt.create({
      data: {
        housekeeper_id,
        boss_battle_id: bossId,
        attempt_number: previousAttempts + 1,
        status: 'in_progress',
        lives_remaining: boss.challenge_data.lives || 3
      }
    });

    // Update boss stats
    await prisma.bossBattle.update({
      where: { id: bossId },
      data: {
        times_attempted: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: {
        attempt_id: attempt.id,
        boss,
        challenge_config: boss.challenge_data
      }
    });

  } catch (error) {
    console.error('Error starting boss battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start boss battle',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/boss/:bossId/submit-round
 * Submit answers for a battle round
 */
router.post('/boss/:bossId/submit-round', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { attempt_id, round_number, answers, correct_count, lives_lost } = req.body;

    const attempt = await prisma.bossBattleAttempt.findUnique({
      where: { id: attempt_id }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Battle attempt not found'
      });
    }

    // Update attempt with round results
    const newLivesRemaining = attempt.lives_remaining - lives_lost;
    const newScore = attempt.score + correct_count;
    const newRoundsCompleted = attempt.rounds_completed + 1;

    const updatedAttempt = await prisma.bossBattleAttempt.update({
      where: { id: attempt_id },
      data: {
        rounds_completed: newRoundsCompleted,
        lives_remaining: newLivesRemaining,
        score: newScore,
        answers_log: {
          ...(attempt.answers_log || {}),
          [`round_${round_number}`]: answers
        }
      }
    });

    // Check if battle should continue
    const shouldContinue = newLivesRemaining > 0;

    res.json({
      success: true,
      data: {
        round_result: {
          correct_count,
          lives_lost,
          lives_remaining: newLivesRemaining
        },
        continue: shouldContinue,
        attempt: updatedAttempt
      }
    });

  } catch (error) {
    console.error('Error submitting boss round:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit boss round',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/boss/:bossId/complete
 * Complete boss battle (victory or defeat)
 */
router.post('/boss/:bossId/complete', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { attempt_id, victory, final_score, housekeeper_id } = req.body;

    const boss = await prisma.bossBattle.findUnique({
      where: { id: bossId },
      include: { world: true }
    });

    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss battle not found'
      });
    }

    // Calculate XP and accuracy
    const xpEarned = victory ? boss.xp_reward : Math.floor(boss.xp_reward * 0.1);
    const accuracy = (final_score / (boss.challenge_data.rounds * boss.challenge_data.questions_per_round)) * 100;

    // Update attempt
    const updatedAttempt = await prisma.bossBattleAttempt.update({
      where: { id: attempt_id },
      data: {
        status: victory ? 'victory' : 'defeat',
        victory,
        score: final_score,
        accuracy_percent: accuracy,
        xp_earned: xpEarned,
        badges_unlocked: victory ? [boss.badge_reward] : [],
        completed_at: new Date()
      }
    });

    // If victory, update world progress and unlock next world
    if (victory) {
      // Update world progress
      await prisma.worldProgress.update({
        where: {
          housekeeper_id_world_id: {
            housekeeper_id,
            world_id: boss.world_id
          }
        },
        data: {
          boss_defeated: true,
          status: 'completed',
          completed_at: new Date(),
          total_xp_earned: { increment: xpEarned }
        }
      });

      // Update housekeeper XP
      const housekeeper = await prisma.housekeeper.findUnique({
        where: { id: housekeeper_id }
      });

      const newTotalXP = housekeeper.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXP / 1000) + 1;

      await prisma.housekeeper.update({
        where: { id: housekeeper_id },
        data: {
          total_xp: newTotalXP,
          level: newLevel
        }
      });

      // Update boss stats
      await prisma.bossBattle.update({
        where: { id: bossId },
        data: {
          times_defeated: { increment: 1 }
        }
      });

      // Unlock next world if applicable
      if (boss.unlock_next_world) {
        const nextWorld = await prisma.questWorld.findFirst({
          where: { world_number: boss.world.world_number + 1 }
        });

        if (nextWorld) {
          await prisma.worldProgress.upsert({
            where: {
              housekeeper_id_world_id: {
                housekeeper_id,
                world_id: nextWorld.id
              }
            },
            update: {
              status: 'unlocked',
              unlocked_at: new Date()
            },
            create: {
              housekeeper_id,
              world_id: nextWorld.id,
              status: 'unlocked',
              quests_total: nextWorld.total_quests,
              unlocked_at: new Date()
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        victory,
        xp_earned: xpEarned,
        badges: victory ? [boss.badge_reward] : [],
        next_world_unlocked: victory && boss.unlock_next_world,
        attempt: updatedAttempt
      }
    });

  } catch (error) {
    console.error('Error completing boss battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete boss battle',
      error: error.message
    });
  }
});

// ============================================================================
// PROGRESS & STATS
// ============================================================================

/**
 * GET /api/quest/progress/:housekeeperId
 * Get user's complete quest progression
 */
router.get('/progress/:housekeeperId', async (req, res) => {
  try {
    const { housekeeperId } = req.params;

    // Fetch all world progress
    const worldsProgress = await prisma.worldProgress.findMany({
      where: { housekeeper_id: housekeeperId },
      include: {
        world: {
          include: {
            boss_battle: true
          }
        }
      }
    });

    // Fetch active quests
    const activeQuests = await prisma.questProgress.findMany({
      where: {
        housekeeper_id: housekeeperId,
        status: 'in_progress'
      },
      include: {
        quest: {
          include: {
            world: true
          }
        }
      }
    });

    // Fetch completed quests
    const completedQuests = await prisma.questProgress.findMany({
      where: {
        housekeeper_id: housekeeperId,
        status: 'completed'
      },
      include: {
        quest: true
      }
    });

    // Calculate total stats
    const totalStats = {
      worlds_completed: worldsProgress.filter(wp => wp.status === 'completed').length,
      quests_completed: completedQuests.length,
      bosses_defeated: worldsProgress.filter(wp => wp.boss_defeated).length,
      total_quest_xp: worldsProgress.reduce((sum, wp) => sum + wp.total_xp_earned, 0)
    };

    res.json({
      success: true,
      data: {
        worlds_progress: worldsProgress,
        active_quests: activeQuests,
        completed_quests: completedQuests,
        total_stats: totalStats
      }
    });

  } catch (error) {
    console.error('Error fetching quest progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quest progress',
      error: error.message
    });
  }
});

// ============================================================================
// DIALOGUE SYSTEM
// ============================================================================

/**
 * GET /api/quest/dialogue/:dialogueId
 * Get dialogue tree
 */
router.get('/dialogue/:dialogueId', async (req, res) => {
  try {
    const { dialogueId } = req.params;

    const dialogue = await prisma.questDialogue.findUnique({
      where: { dialogue_id: dialogueId }
    });

    if (!dialogue) {
      return res.status(404).json({
        success: false,
        message: 'Dialogue not found'
      });
    }

    res.json({
      success: true,
      data: dialogue
    });

  } catch (error) {
    console.error('Error fetching dialogue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dialogue',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/dialogue/:dialogueId/play
 * Log dialogue play session
 */
router.post('/dialogue/:dialogueId/play', async (req, res) => {
  try {
    const { dialogueId } = req.params;
    const { housekeeper_id, choices_made, success_rate } = req.body;

    // Update dialogue stats
    await prisma.questDialogue.update({
      where: { dialogue_id: dialogueId },
      data: {
        times_played: { increment: 1 }
      }
    });

    // Calculate XP based on success
    const xpEarned = Math.round(success_rate * 50); // Max 50 XP for perfect dialogue

    res.json({
      success: true,
      xp_earned: xpEarned
    });

  } catch (error) {
    console.error('Error logging dialogue play:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log dialogue play',
      error: error.message
    });
  }
});

// ============================================================================
// CINEMATICS
// ============================================================================

/**
 * GET /api/quest/cinematic/:cinematicId
 * Get cinematic data
 */
router.get('/cinematic/:cinematicId', async (req, res) => {
  try {
    const { cinematicId } = req.params;

    const cinematic = await prisma.questCinematic.findUnique({
      where: { cinematic_id: cinematicId }
    });

    if (!cinematic) {
      return res.status(404).json({
        success: false,
        message: 'Cinematic not found'
      });
    }

    res.json({
      success: true,
      data: cinematic
    });

  } catch (error) {
    console.error('Error fetching cinematic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cinematic',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/cinematic/:cinematicId/viewed
 * Track cinematic view
 */
router.post('/cinematic/:cinematicId/viewed', async (req, res) => {
  try {
    const { cinematicId } = req.params;
    const { housekeeper_id, skipped } = req.body;

    await prisma.questCinematic.update({
      where: { cinematic_id: cinematicId },
      data: {
        times_viewed: { increment: 1 },
        times_skipped: skipped ? { increment: 1 } : undefined
      }
    });

    res.json({
      success: true
    });

  } catch (error) {
    console.error('Error tracking cinematic view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track cinematic view',
      error: error.message
    });
  }
});

/**
 * POST /api/quest/boss/answer
 * Submit answer for a single boss battle question
 */
router.post('/boss/answer', async (req, res) => {
  try {
    const {
      housekeeper_id,
      boss_battle_attempt_id,
      question_id,
      selected_option,
      round,
      time_taken_seconds
    } = req.body;

    // Get the question
    const question = await prisma.languageQuizQuestion.findUnique({
      where: { id: question_id }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if answer is correct
    const is_correct = selected_option && selected_option.toUpperCase() === question.correct_option.toUpperCase();

    // Calculate XP for this question
    const baseXP = 15;
    const timeBonus = time_taken_seconds <= 10 ? 5 : 0;
    const xp_earned = is_correct ? baseXP + timeBonus : 0;

    // Update question stats
    await prisma.languageQuizQuestion.update({
      where: { id: question_id },
      data: {
        times_shown: { increment: 1 },
        times_correct: is_correct ? { increment: 1 } : undefined
      }
    });

    // Create response record
    const response = await prisma.languageQuizResponse.create({
      data: {
        housekeeper_id,
        question_id,
        selected_option: selected_option || 'TIMEOUT',
        is_correct,
        time_taken_seconds,
        xp_earned
      }
    });

    // Get explanation
    const explanation = {
      text: question.explanation_text,
      audio: question.explanation_audio_url
    };

    res.json({
      success: true,
      data: {
        response: {
          is_correct,
          correct_option: question.correct_option,
          selected_option,
          xp_earned,
          explanation
        }
      }
    });

  } catch (error) {
    console.error('Error submitting boss battle answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
});

/**
 * GET /api/quest/boss/:bossId/questions
 * Get questions for boss battle (specific round)
 */
router.get('/boss/:bossId/questions', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { round = 1, difficulty = 'A2.1' } = req.query;

    const boss = await prisma.bossBattle.findUnique({
      where: { id: bossId }
    });

    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss battle not found'
      });
    }

    const questionsPerRound = boss.challenge_data.questions_per_round || 5;

    // Fetch questions from language quiz matching the difficulty
    const questions = await prisma.languageQuizQuestion.findMany({
      where: {
        level_cecrl: difficulty,
        // You can add category filters based on boss world theme
        OR: [
          { category: 'vocabulary' },
          { category: 'grammar' },
          { category: 'listening' }
        ]
      },
      take: questionsPerRound,
      orderBy: {
        times_shown: 'asc' // Prioritize less-shown questions
      }
    });

    // Remove correct_option from response (security)
    const sanitizedQuestions = questions.map(q => {
      const { correct_option, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    res.json({
      success: true,
      data: {
        questions: sanitizedQuestions
      }
    });

  } catch (error) {
    console.error('Error fetching boss questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
});

/**
 * Enhanced POST /api/quest/boss/:bossId/start
 * Start boss battle with initial questions
 */
router.post('/boss/:bossId/start-battle', async (req, res) => {
  try {
    const { bossId } = req.params;
    const { housekeeper_id } = req.body;

    const boss = await prisma.bossBattle.findUnique({
      where: { id: bossId },
      include: { world: true }
    });

    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss battle not found'
      });
    }

    // Count previous attempts
    const previousAttempts = await prisma.bossBattleAttempt.count({
      where: {
        housekeeper_id,
        boss_battle_id: bossId
      }
    });

    // Create new attempt
    const attempt = await prisma.bossBattleAttempt.create({
      data: {
        housekeeper_id,
        boss_battle_id: bossId,
        attempt_number: previousAttempts + 1,
        status: 'in_progress',
        lives_remaining: boss.challenge_data.lives || 3
      }
    });

    // Update boss stats
    await prisma.bossBattle.update({
      where: { id: bossId },
      data: {
        times_attempted: { increment: 1 }
      }
    });

    // Get first round questions
    const totalQuestions = (boss.challenge_data.rounds || 3) * (boss.challenge_data.questions_per_round || 5);
    const difficultyProgression = boss.challenge_data.difficulty_progression || ['A2.1', 'A2.1', 'A2.2'];

    // Fetch all questions at once for all rounds
    const allQuestions = [];
    for (let round = 0; round < (boss.challenge_data.rounds || 3); round++) {
      const roundQuestions = await prisma.languageQuizQuestion.findMany({
        where: {
          level_cecrl: difficultyProgression[round] || 'A2.1',
          OR: [
            { category: 'vocabulary' },
            { category: 'grammar' },
            { category: 'listening' }
          ]
        },
        take: boss.challenge_data.questions_per_round || 5,
        orderBy: {
          times_shown: 'asc'
        }
      });

      allQuestions.push(...roundQuestions);
    }

    // Remove correct_option from questions (security)
    const sanitizedQuestions = allQuestions.map(q => {
      const { correct_option, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    res.json({
      success: true,
      data: {
        boss,
        attempt,
        questions: sanitizedQuestions,
        config: boss.challenge_data
      }
    });

  } catch (error) {
    console.error('Error starting boss battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start boss battle',
      error: error.message
    });
  }
});

/**
 * Enhanced POST /api/quest/boss/complete-battle
 * Complete boss battle with final results
 */
router.post('/boss/complete-battle', async (req, res) => {
  try {
    const {
      boss_battle_attempt_id,
      housekeeper_id,
      victory,
      score,
      lives_remaining,
      rounds_completed
    } = req.body;

    const attempt = await prisma.bossBattleAttempt.findUnique({
      where: { id: boss_battle_attempt_id },
      include: {
        boss_battle: {
          include: { world: true }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Battle attempt not found'
      });
    }

    const boss = attempt.boss_battle;

    // Calculate XP and accuracy
    const xpEarned = victory ? boss.xp_reward : Math.floor(boss.xp_reward * 0.1);
    const totalQuestions = boss.challenge_data.rounds * boss.challenge_data.questions_per_round;
    const accuracy = (score / totalQuestions) * 100;

    // Update attempt
    const updatedAttempt = await prisma.bossBattleAttempt.update({
      where: { id: boss_battle_attempt_id },
      data: {
        status: victory ? 'victory' : 'defeat',
        victory,
        score,
        accuracy_percent: accuracy,
        xp_earned: xpEarned,
        lives_remaining,
        rounds_completed,
        badges_unlocked: victory ? [boss.badge_reward] : [],
        completed_at: new Date()
      }
    });

    // If victory, update progress
    if (victory) {
      // Update world progress
      await prisma.worldProgress.update({
        where: {
          housekeeper_id_world_id: {
            housekeeper_id,
            world_id: boss.world_id
          }
        },
        data: {
          boss_defeated: true,
          status: 'completed',
          completed_at: new Date(),
          total_xp_earned: { increment: xpEarned }
        }
      });

      // Update housekeeper XP and level
      const housekeeper = await prisma.housekeeper.findUnique({
        where: { id: housekeeper_id }
      });

      const newTotalXP = housekeeper.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXP / 1000) + 1;

      await prisma.housekeeper.update({
        where: { id: housekeeper_id },
        data: {
          total_xp: newTotalXP,
          level: newLevel
        }
      });

      // Update boss stats
      await prisma.bossBattle.update({
        where: { id: boss.id },
        data: {
          times_defeated: { increment: 1 }
        }
      });

      // Unlock next world
      if (boss.unlock_next_world) {
        const nextWorld = await prisma.questWorld.findFirst({
          where: { world_number: boss.world.world_number + 1 }
        });

        if (nextWorld) {
          await prisma.worldProgress.upsert({
            where: {
              housekeeper_id_world_id: {
                housekeeper_id,
                world_id: nextWorld.id
              }
            },
            update: {
              status: 'unlocked',
              unlocked_at: new Date()
            },
            create: {
              housekeeper_id,
              world_id: nextWorld.id,
              status: 'unlocked',
              unlocked_at: new Date()
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        victory,
        xp_earned: xpEarned,
        badges_unlocked: victory ? [boss.badge_reward] : [],
        new_level: victory ? Math.floor((housekeeper.total_xp + xpEarned) / 1000) + 1 : null,
        attempt: updatedAttempt
      }
    });

  } catch (error) {
    console.error('Error completing boss battle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete boss battle',
      error: error.message
    });
  }
});

// ============================================================================
// HERO AVATAR
// ============================================================================

/**
 * GET /api/quest/avatar/:housekeeperId
 * Get hero avatar
 */
router.get('/avatar/:housekeeperId', async (req, res) => {
  try {
    const { housekeeperId } = req.params;

    let avatar = await prisma.heroAvatar.findUnique({
      where: { housekeeper_id: housekeeperId }
    });

    // Create default avatar if none exists
    if (!avatar) {
      avatar = await prisma.heroAvatar.create({
        data: {
          housekeeper_id: housekeeperId,
          equipped_items: {}
        }
      });
    }

    res.json({
      success: true,
      data: avatar
    });

  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch avatar',
      error: error.message
    });
  }
});

/**
 * PUT /api/quest/avatar/:housekeeperId
 * Update hero avatar customization
 */
router.put('/avatar/:housekeeperId', async (req, res) => {
  try {
    const { housekeeperId } = req.params;
    const customizationData = req.body;

    const avatar = await prisma.heroAvatar.upsert({
      where: { housekeeper_id: housekeeperId },
      update: {
        ...customizationData,
        updated_at: new Date()
      },
      create: {
        housekeeper_id: housekeeperId,
        ...customizationData
      }
    });

    res.json({
      success: true,
      data: avatar
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar',
      error: error.message
    });
  }
});

export default router;
