/**
 * Learning Path Progress Tracker
 *
 * Monitors student advancement through learning paths with:
 * - Step completion tracking and validation
 * - Overall progress calculation (0-100%)
 * - Time tracking and estimates
 * - Streak monitoring (consecutive study days)
 * - Adaptive difficulty adjustment based on performance
 * - Milestone progress tracking
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../logger';
import { calculateConceptMastery, type MasteryScore } from './mastery-calculator';

const logger = createLogger({ component: 'ProgressTracker' });

/**
 * Path progress summary
 */
export interface PathProgress {
  pathId: string;
  userId: string;

  // Overall progress
  overallProgress: number; // 0-100%
  currentStepIndex: number;
  stepsCompleted: number;
  stepsTotal: number;

  // Time tracking
  totalTimeSpent: number; // minutes
  estimatedTimeRemaining: number;

  // Performance
  conceptsMastered: number; // mastery >= 0.85
  conceptsDeveloping: number; // 0.40 < mastery < 0.85
  conceptsWeak: number; // mastery < 0.40

  // Recent activity
  lastActivity: Date | null;
  currentStreak: number; // consecutive days

  // Milestones
  milestonesUnlocked: number;
  milestonesTotal: number;
}

/**
 * Step completion check result
 */
export interface CompletionCheck {
  canAdvance: boolean;
  reason: string;
  currentAccuracy?: number;
  requiredAccuracy?: number;
  attemptsCount?: number;
}

/**
 * Difficulty adjustment result
 */
export interface DifficultyAdjustment {
  adjusted: boolean;
  oldDifficulty: number;
  newDifficulty: number;
  reason: string;
  replacedItemIds?: string[];
}

/**
 * Check if student can advance to next step
 *
 * Rules:
 * - CONCEPT_STUDY: Just needs to be marked as completed
 * - PRACTICE_SET: Must meet required accuracy threshold
 * - CHECKPOINT: All required steps must be completed
 * - ASSESSMENT: Must be taken (no minimum score)
 */
export async function canAdvanceToNextStep(
  prisma: PrismaClient,
  userId: string,
  stepId: string
): Promise<CompletionCheck> {
  logger.debug('Checking step completion', { userId, stepId });

  const step = await prisma.pathStep.findUnique({
    where: { id: stepId },
    include: {
      attempts: {
        where: { userId },
        orderBy: { attemptedAt: 'desc' },
      },
    },
  });

  if (!step) {
    return {
      canAdvance: false,
      reason: 'Step not found',
    };
  }

  const attempts = step.attempts;

  // CONCEPT_STUDY: Just needs completion flag
  if (step.type === 'CONCEPT_STUDY') {
    const isCompleted = attempts.some((a) => a.isCorrect);
    return {
      canAdvance: isCompleted,
      reason: isCompleted ? 'Concept study completed' : 'Mark as read to continue',
    };
  }

  // PRACTICE_SET: Must meet accuracy requirement
  if (step.type === 'PRACTICE_SET') {
    if (attempts.length === 0) {
      return {
        canAdvance: false,
        reason: 'No practice attempts yet',
        attemptsCount: 0,
      };
    }

    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const accuracy = correctCount / attempts.length;
    const requiredAccuracy = step.requiredAccuracy || 0.75;

    return {
      canAdvance: accuracy >= requiredAccuracy,
      reason:
        accuracy >= requiredAccuracy
          ? 'Accuracy requirement met'
          : `Need ${(requiredAccuracy * 100).toFixed(0)}% accuracy`,
      currentAccuracy: accuracy,
      requiredAccuracy,
      attemptsCount: attempts.length,
    };
  }

  // CHECKPOINT: All required steps must be completed
  if (step.type === 'CHECKPOINT') {
    const metadata = step.metadata as any;
    const requiredSteps = metadata?.requiredSteps || [];

    if (requiredSteps.length === 0) {
      return {
        canAdvance: true,
        reason: 'No requirements for checkpoint',
      };
    }

    // Check if all required steps are completed
    const requiredStepStatuses = await Promise.all(
      requiredSteps.map((reqStepId: string) =>
        canAdvanceToNextStep(prisma, userId, reqStepId)
      )
    );

    const allCompleted = requiredStepStatuses.every((status) => status.canAdvance);

    return {
      canAdvance: allCompleted,
      reason: allCompleted
        ? 'All checkpoint requirements met'
        : 'Complete required steps first',
    };
  }

  // ASSESSMENT: Must be taken (completed flag)
  if (step.type === 'ASSESSMENT') {
    const isCompleted = attempts.length > 0;
    return {
      canAdvance: isCompleted,
      reason: isCompleted ? 'Assessment completed' : 'Take assessment to continue',
      attemptsCount: attempts.length,
    };
  }

  return {
    canAdvance: false,
    reason: 'Unknown step type',
  };
}

/**
 * Calculate overall path progress
 */
export async function calculatePathProgress(
  prisma: PrismaClient,
  userId: string,
  pathId: string
): Promise<PathProgress> {
  logger.debug('Calculating path progress', { userId, pathId });

  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      steps: {
        orderBy: { sequence: 'asc' },
        include: {
          attempts: {
            where: { userId },
          },
        },
      },
      milestones: true,
    },
  });

  if (!path) {
    throw new Error(`Learning path ${pathId} not found`);
  }

  const steps = path.steps;
  const totalSteps = steps.length;

  // Count completed steps
  let completedSteps = 0;
  let currentStepIndex = 0;

  for (let i = 0; i < steps.length; i++) {
    const check = await canAdvanceToNextStep(prisma, userId, steps[i].id);
    if (check.canAdvance) {
      completedSteps++;
      currentStepIndex = Math.min(i + 1, totalSteps - 1);
    } else {
      break; // Stop at first incomplete step
    }
  }

  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Calculate time tracking
  const allAttempts = steps.flatMap((s) => s.attempts);
  const totalTimeSpent = Math.round(
    allAttempts.reduce((sum, a) => sum + (a.timeSeconds || 0), 0) / 60
  ); // Convert to minutes

  const estimatedTotalMinutes = steps.reduce(
    (sum, s) => sum + s.estimatedMinutes,
    0
  );
  const estimatedTimeRemaining = Math.max(
    0,
    estimatedTotalMinutes - totalTimeSpent
  );

  // Calculate concept mastery distribution
  const conceptIds = [
    ...new Set(steps.map((s) => s.conceptId).filter((id): id is string => id !== null)),
  ];

  let conceptsMastered = 0;
  let conceptsDeveloping = 0;
  let conceptsWeak = 0;

  for (const conceptId of conceptIds) {
    const mastery = await calculateConceptMastery(prisma, userId, conceptId);
    if (mastery.overall >= 0.85) conceptsMastered++;
    else if (mastery.overall >= 0.4) conceptsDeveloping++;
    else conceptsWeak++;
  }

  // Calculate streak
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { currentStreak: true },
  });
  const currentStreak = studentProfile?.currentStreak || 0;

  // Get last activity
  const lastAttempt = allAttempts.sort(
    (a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime()
  )[0];
  const lastActivity = lastAttempt?.attemptedAt || null;

  // Count unlocked milestones
  const unlockedMilestones = path.milestones.filter((m) => m.status === 'UNLOCKED');
  const milestonesUnlocked = unlockedMilestones.length;
  const milestonesTotal = path.milestones.length;

  logger.info('Path progress calculated', {
    userId,
    pathId,
    overallProgress: overallProgress.toFixed(1),
    completedSteps,
    totalSteps,
  });

  return {
    pathId,
    userId,
    overallProgress,
    currentStepIndex,
    stepsCompleted: completedSteps,
    stepsTotal: totalSteps,
    totalTimeSpent,
    estimatedTimeRemaining,
    conceptsMastered,
    conceptsDeveloping,
    conceptsWeak,
    lastActivity,
    currentStreak,
    milestonesUnlocked,
    milestonesTotal,
  };
}

/**
 * Update student streak based on activity
 */
export async function updateStudentStreak(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  logger.debug('Updating student streak', { userId });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!profile) {
    // Create profile with streak of 1
    await prisma.studentProfile.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
      },
    });
    return 1;
  }

  // Check if last study was yesterday or today
  const lastStudyDate = profile.lastStudyDate
    ? new Date(
        profile.lastStudyDate.getFullYear(),
        profile.lastStudyDate.getMonth(),
        profile.lastStudyDate.getDate()
      )
    : null;

  let newStreak = profile.currentStreak;

  if (!lastStudyDate) {
    // First time studying
    newStreak = 1;
  } else {
    const daysDiff = Math.floor(
      (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day, no change
      return newStreak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment
      newStreak++;
    } else {
      // Streak broken, reset
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, profile.longestStreak);

  await prisma.studentProfile.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastStudyDate: now,
    },
  });

  logger.info('Student streak updated', { userId, newStreak, longestStreak });

  return newStreak;
}

/**
 * Adjust difficulty based on recent performance
 *
 * Rules:
 * - If accuracy > 90% and time < expected: Increase difficulty by 0.3
 * - If accuracy < 50%: Decrease difficulty by 0.3
 * - Clamp within student ability ± 1.0
 */
export async function adjustStepDifficulty(
  prisma: PrismaClient,
  userId: string,
  stepId: string
): Promise<DifficultyAdjustment> {
  logger.debug('Checking difficulty adjustment', { userId, stepId });

  const step = await prisma.pathStep.findUnique({
    where: { id: stepId },
    include: {
      attempts: {
        where: { userId },
        orderBy: { attemptedAt: 'desc' },
        take: 10, // Last 10 attempts
      },
    },
  });

  if (!step || step.type !== 'PRACTICE_SET' || step.attempts.length < 5) {
    return {
      adjusted: false,
      oldDifficulty: 0,
      newDifficulty: 0,
      reason: 'Not enough data for adjustment',
    };
  }

  const recentAttempts = step.attempts;
  const correctCount = recentAttempts.filter((a) => a.isCorrect).length;
  const accuracy = correctCount / recentAttempts.length;

  const avgTime =
    recentAttempts.reduce((sum, a) => sum + (a.timeSeconds || 0), 0) /
    recentAttempts.length;
  const expectedTime = step.estimatedMinutes * 60;

  // Get student ability
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { overallTheta: true },
  });

  const studentAbility = profile?.overallTheta || 0;
  const currentDifficulty = studentAbility; // Default to student ability

  let newDifficulty = currentDifficulty;
  let reason = '';

  // Check if too easy
  if (accuracy > 0.9 && avgTime < expectedTime) {
    newDifficulty = currentDifficulty + 0.3;
    reason = 'Performance too strong, increasing difficulty';
  }
  // Check if too hard
  else if (accuracy < 0.5) {
    newDifficulty = currentDifficulty - 0.3;
    reason = 'Struggling with accuracy, decreasing difficulty';
  } else {
    return {
      adjusted: false,
      oldDifficulty: currentDifficulty,
      newDifficulty: currentDifficulty,
      reason: 'Difficulty appropriate for current performance',
    };
  }

  // Clamp within bounds (student ability ± 1.0)
  newDifficulty = Math.max(
    studentAbility - 1.0,
    Math.min(studentAbility + 1.0, newDifficulty)
  );

  logger.info('Difficulty adjusted', {
    userId,
    stepId,
    oldDifficulty: currentDifficulty.toFixed(2),
    newDifficulty: newDifficulty.toFixed(2),
    reason,
    accuracy: accuracy.toFixed(2),
  });

  return {
    adjusted: true,
    oldDifficulty: currentDifficulty,
    newDifficulty,
    reason,
  };
}
