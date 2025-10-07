/**
 * Milestone & Reward Engine
 *
 * Handles achievement unlocks and rewards in learning paths:
 * - Checks milestone requirements (step completion, streaks, accuracy)
 * - Unlocks milestones when conditions met
 * - Awards rewards (badges, XP, exam unlocks, certificates)
 * - Tracks student achievements
 *
 * Milestone Types:
 * - Path Progress (25%, 50%, 75%, 100%)
 * - Concept Completion
 * - Checkpoint Pass
 * - Streak Achievements
 * - Speed Achievements
 * - Accuracy Achievements
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../logger';
import { canAdvanceToNextStep } from './progress-tracker';

const logger = createLogger({ component: 'MilestoneEngine' });

/**
 * Milestone check result
 */
export interface MilestoneCheckResult {
  milestoneId: string;
  unlocked: boolean;
  rewardAwarded: boolean;
  rewardType?: string;
  rewardData?: any;
}

/**
 * Badge definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
}

/**
 * XP calculation for step completion
 */
function calculateStepXP(stepType: string, performance?: any): number {
  const baseXP = {
    CONCEPT_STUDY: 10,
    PRACTICE_SET: 25,
    CHECKPOINT: 50,
    ASSESSMENT: 100,
  };

  let xp = baseXP[stepType as keyof typeof baseXP] || 10;

  // Bonus XP for high accuracy
  if (performance?.accuracy) {
    if (performance.accuracy >= 0.95) xp *= 1.5; // 50% bonus for 95%+
    else if (performance.accuracy >= 0.85) xp *= 1.25; // 25% bonus for 85%+
  }

  return Math.round(xp);
}

/**
 * Check if milestone requirements are met
 */
async function checkMilestoneRequirements(
  prisma: PrismaClient,
  userId: string,
  milestone: any
): Promise<boolean> {
  logger.debug('Checking milestone requirements', {
    userId,
    milestoneId: milestone.id,
    title: milestone.title,
  });

  // Parse required steps from JSON
  const requiredStepIndices = (milestone.requiredSteps as any) || [];

  // If no requirements, milestone is unlocked
  if (requiredStepIndices.length === 0) {
    return true;
  }

  // Get path steps
  const path = await prisma.learningPath.findUnique({
    where: { id: milestone.pathId },
    include: {
      steps: {
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!path) {
    return false;
  }

  // Check if all required steps are completed
  for (const stepIndex of requiredStepIndices) {
    if (stepIndex >= path.steps.length) continue;

    const step = path.steps[stepIndex];
    const completionCheck = await canAdvanceToNextStep(prisma, userId, step.id);

    if (!completionCheck.canAdvance) {
      return false; // At least one required step not completed
    }
  }

  return true; // All requirements met
}

/**
 * Award badge to student
 */
async function awardBadge(
  prisma: PrismaClient,
  userId: string,
  badgeId: string,
  badgeName: string
): Promise<void> {
  logger.debug('Awarding badge', { userId, badgeId, badgeName });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { badges: true },
  });

  const badges = (profile?.badges as Badge[]) || [];

  // Check if already has badge
  if (badges.some((b) => b.id === badgeId)) {
    logger.debug('Badge already awarded', { userId, badgeId });
    return;
  }

  // Add new badge
  const newBadge: Badge = {
    id: badgeId,
    name: badgeName,
    description: `Earned on ${new Date().toLocaleDateString()}`,
    earnedAt: new Date(),
  };

  badges.push(newBadge);

  await prisma.studentProfile.update({
    where: { userId },
    data: { badges: badges as any },
  });

  logger.info('Badge awarded', { userId, badgeId, badgeName });
}

/**
 * Award XP to student and check for level up
 */
async function awardXP(
  prisma: PrismaClient,
  userId: string,
  xp: number
): Promise<{ newLevel: number; leveledUp: boolean }> {
  logger.debug('Awarding XP', { userId, xp });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { xp: true, level: true },
  });

  const currentXP = profile?.xp || 0;
  const currentLevel = profile?.level || 1;

  const newXP = currentXP + xp;
  const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level

  const leveledUp = newLevel > currentLevel;

  await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      xp: newXP,
      level: newLevel,
    },
    update: {
      xp: newXP,
      level: newLevel,
    },
  });

  if (leveledUp) {
    logger.info('Student leveled up!', {
      userId,
      oldLevel: currentLevel,
      newLevel,
      totalXP: newXP,
    });
  }

  return { newLevel, leveledUp };
}

/**
 * Unlock exam for student
 */
async function unlockExam(
  prisma: PrismaClient,
  userId: string,
  examType: string
): Promise<void> {
  logger.info('Unlocking exam', { userId, examType });

  // Store exam unlock in student profile metadata
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  // For now, just log the unlock
  // In production, would update a dedicated ExamAccess table
  logger.info('Exam unlocked for student', { userId, examType });
}

/**
 * Award certificate to student
 */
async function awardCertificate(
  prisma: PrismaClient,
  userId: string,
  certificateType: string
): Promise<void> {
  logger.info('Awarding certificate', { userId, certificateType });

  // Award special badge for certificate
  await awardBadge(
    prisma,
    userId,
    `cert-${certificateType}`,
    `${certificateType} Certificate`
  );
}

/**
 * Process reward based on type
 */
async function processReward(
  prisma: PrismaClient,
  userId: string,
  rewardType: string,
  rewardData: any
): Promise<void> {
  logger.debug('Processing reward', { userId, rewardType, rewardData });

  switch (rewardType) {
    case 'BADGE':
      await awardBadge(
        prisma,
        userId,
        rewardData.badgeId,
        rewardData.badgeName || 'Achievement'
      );
      break;

    case 'UNLOCK_EXAM':
      await unlockExam(prisma, userId, rewardData.examType);
      break;

    case 'CERTIFICATE':
      await awardCertificate(prisma, userId, rewardData.certificateType);
      break;

    case 'XP':
      await awardXP(prisma, userId, rewardData.xp || 100);
      break;

    default:
      logger.warn('Unknown reward type', { rewardType });
  }
}

/**
 * Check all milestones for a learning path and unlock if requirements met
 */
export async function checkAndUnlockMilestones(
  prisma: PrismaClient,
  userId: string,
  pathId: string
): Promise<MilestoneCheckResult[]> {
  logger.debug('Checking milestones for path', { userId, pathId });

  const milestones = await prisma.pathMilestone.findMany({
    where: {
      pathId,
      status: 'LOCKED', // Only check locked milestones
    },
    orderBy: { sequence: 'asc' },
  });

  const results: MilestoneCheckResult[] = [];

  for (const milestone of milestones) {
    const requirementsMet = await checkMilestoneRequirements(
      prisma,
      userId,
      milestone
    );

    if (requirementsMet) {
      // Unlock milestone
      await prisma.pathMilestone.update({
        where: { id: milestone.id },
        data: {
          status: 'UNLOCKED',
          unlockedAt: new Date(),
        },
      });

      // Award reward
      if (milestone.rewardType && milestone.rewardData) {
        await processReward(
          prisma,
          userId,
          milestone.rewardType,
          milestone.rewardData
        );
      }

      logger.info('Milestone unlocked', {
        userId,
        milestoneId: milestone.id,
        title: milestone.title,
        rewardType: milestone.rewardType,
      });

      results.push({
        milestoneId: milestone.id,
        unlocked: true,
        rewardAwarded: true,
        rewardType: milestone.rewardType || undefined,
        rewardData: milestone.rewardData || undefined,
      });
    } else {
      results.push({
        milestoneId: milestone.id,
        unlocked: false,
        rewardAwarded: false,
      });
    }
  }

  return results;
}

/**
 * Award XP for completing a step and check for level ups
 */
export async function awardStepCompletion(
  prisma: PrismaClient,
  userId: string,
  stepId: string
): Promise<{ xpAwarded: number; leveledUp: boolean; newLevel: number }> {
  logger.debug('Awarding step completion', { userId, stepId });

  const step = await prisma.pathStep.findUnique({
    where: { id: stepId },
    include: {
      attempts: {
        where: { userId },
      },
    },
  });

  if (!step) {
    return { xpAwarded: 0, leveledUp: false, newLevel: 1 };
  }

  // Calculate performance
  const attempts = step.attempts;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracy = attempts.length > 0 ? correctCount / attempts.length : 0;

  const xp = calculateStepXP(step.type, { accuracy });

  const { newLevel, leveledUp } = await awardXP(prisma, userId, xp);

  logger.info('Step completion awarded', {
    userId,
    stepId,
    stepType: step.type,
    xpAwarded: xp,
    leveledUp,
    newLevel,
  });

  return { xpAwarded: xp, leveledUp, newLevel };
}

/**
 * Get all badges earned by student
 */
export async function getStudentBadges(
  prisma: PrismaClient,
  userId: string
): Promise<Badge[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { badges: true },
  });

  return (profile?.badges as Badge[]) || [];
}

/**
 * Get student level and XP progress
 */
export async function getStudentProgress(
  prisma: PrismaClient,
  userId: string
): Promise<{
  level: number;
  xp: number;
  xpToNextLevel: number;
  badges: Badge[];
}> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { level: true, xp: true, badges: true },
  });

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpToNextLevel = level * 1000 - xp;
  const badges = (profile?.badges as Badge[]) || [];

  return { level, xp, xpToNextLevel, badges };
}
