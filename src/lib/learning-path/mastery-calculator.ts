/**
 * Concept Mastery Calculator
 *
 * Calculates student mastery of concepts using a 5-factor weighted model:
 * - Recent Accuracy (40%): Last 10 attempts with exponential weighting
 * - Overall Accuracy (25%): All-time accuracy on this concept
 * - Time Efficiency (15%): Speed relative to average time
 * - Consistency (10%): Low variance in recent performance
 * - Retention (10%): Exponential decay over time (14-day half-life)
 *
 * Mastery Levels:
 * - NOVICE (0-40%): Needs initial study
 * - DEVELOPING (40-70%): Needs more practice
 * - PROFICIENT (70-85%): Ready for exam
 * - MASTERY (85-100%): Can teach others
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../logger';

const logger = createLogger({ component: 'MasteryCalculator' });

/**
 * Mastery calculation result
 */
export interface MasteryScore {
  overall: number; // 0-1 overall mastery
  recentAccuracy: number; // 0-1 recent performance
  overallAccuracy: number; // 0-1 lifetime accuracy
  timeEfficiency: number; // 0-1 speed score
  consistency: number; // 0-1 consistency score
  retention: number; // 0-1 retention score
  level: MasteryLevel;
  attemptsUsed: number;
  lastAttemptDate: Date | null;
}

/**
 * Mastery level classification
 */
export type MasteryLevel = 'NOVICE' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERY';

/**
 * Attempt data for mastery calculation
 */
export interface AttemptData {
  isCorrect: boolean;
  timeSeconds: number;
  attemptedAt: Date;
}

/**
 * Calculate recent accuracy (40% weight)
 *
 * Uses exponential weighting where most recent attempts count more.
 * Formula: sum(correct[i] * 0.9^(n-i)) / sum(0.9^(n-i))
 */
function calculateRecentAccuracy(attempts: AttemptData[], limit: number = 10): number {
  if (attempts.length === 0) return 0;

  // Take last N attempts (most recent)
  const recentAttempts = attempts.slice(-limit);
  const n = recentAttempts.length;

  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < n; i++) {
    const weight = Math.pow(0.9, n - 1 - i); // More recent = higher weight
    weightTotal += weight;
    if (recentAttempts[i].isCorrect) {
      weightedSum += weight;
    }
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

/**
 * Calculate overall accuracy (25% weight)
 *
 * Simple proportion: correctCount / totalAttempts
 */
function calculateOverallAccuracy(attempts: AttemptData[]): number {
  if (attempts.length === 0) return 0;

  const correctCount = attempts.filter((a) => a.isCorrect).length;
  return correctCount / attempts.length;
}

/**
 * Calculate time efficiency (15% weight)
 *
 * Compares student's average time to concept's average time.
 * Formula: min(1.0, avgTime / studentTime)
 * Faster = better mastery
 */
function calculateTimeEfficiency(
  attempts: AttemptData[],
  conceptAvgTime: number
): number {
  if (attempts.length === 0 || conceptAvgTime === 0) return 1.0;

  const totalTime = attempts.reduce((sum, a) => sum + a.timeSeconds, 0);
  const studentAvgTime = totalTime / attempts.length;

  // Faster students get higher scores (capped at 1.0)
  const efficiency = Math.min(1.0, conceptAvgTime / studentAvgTime);

  return efficiency;
}

/**
 * Calculate consistency (10% weight)
 *
 * Low variance in recent performance indicates stable understanding.
 * Formula: 1 - (stddev(last10) / 0.5)
 */
function calculateConsistency(attempts: AttemptData[], limit: number = 10): number {
  if (attempts.length < 2) return 1.0; // Can't calculate variance with <2 attempts

  const recentAttempts = attempts.slice(-limit);
  const values = recentAttempts.map((a) => (a.isCorrect ? 1 : 0));

  // Calculate mean
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Calculate variance
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  const stddev = Math.sqrt(variance);

  // Convert to consistency score (0-1 range)
  // stddev of 0 = perfect consistency (score 1.0)
  // stddev of 0.5 = maximum variance (score 0.0)
  const consistency = Math.max(0, 1 - stddev / 0.5);

  return consistency;
}

/**
 * Calculate retention (10% weight)
 *
 * Accounts for forgetting over time using exponential decay.
 * Formula: exp(-daysSinceLastPractice / 14)
 * Half-life of 14 days
 */
function calculateRetention(lastAttemptDate: Date | null): number {
  if (!lastAttemptDate) return 1.0; // No decay if never practiced

  const now = new Date();
  const daysSinceLastPractice =
    (now.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24);

  // Exponential decay with 14-day half-life
  const retention = Math.exp(-daysSinceLastPractice / 14);

  return retention;
}

/**
 * Determine mastery level from overall score
 */
function determineMasteryLevel(score: number): MasteryLevel {
  if (score >= 0.85) return 'MASTERY';
  if (score >= 0.7) return 'PROFICIENT';
  if (score >= 0.4) return 'DEVELOPING';
  return 'NOVICE';
}

/**
 * Calculate concept mastery score for a student
 *
 * @param userId - Student user ID
 * @param conceptId - Concept ID to calculate mastery for
 * @param prisma - Prisma client
 * @returns Mastery score with breakdown
 */
export async function calculateConceptMastery(
  prisma: PrismaClient,
  userId: string,
  conceptId: string
): Promise<MasteryScore> {
  logger.debug('Calculating concept mastery', { userId, conceptId });

  // Fetch all attempts for this concept
  const pathStepAttempts = await prisma.pathStepAttempt.findMany({
    where: {
      userId,
      step: {
        conceptId,
      },
    },
    select: {
      isCorrect: true,
      timeSeconds: true,
      attemptedAt: true,
    },
    orderBy: {
      attemptedAt: 'asc',
    },
  });

  const attempts: AttemptData[] = pathStepAttempts.map((a) => ({
    isCorrect: a.isCorrect ?? false,
    timeSeconds: a.timeSeconds ?? 120,
    attemptedAt: a.attemptedAt,
  }));

  // If no attempts, return zero mastery
  if (attempts.length === 0) {
    logger.debug('No attempts found for concept', { userId, conceptId });
    return {
      overall: 0,
      recentAccuracy: 0,
      overallAccuracy: 0,
      timeEfficiency: 0,
      consistency: 0,
      retention: 0,
      level: 'NOVICE',
      attemptsUsed: 0,
      lastAttemptDate: null,
    };
  }

  // Get concept average time (for time efficiency calculation)
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { estimatedMinutes: true },
  });

  const conceptAvgTime = concept?.estimatedMinutes
    ? concept.estimatedMinutes * 60
    : 120; // Default 2 minutes

  const lastAttemptDate = attempts[attempts.length - 1].attemptedAt;

  // Calculate each factor
  const recentAccuracy = calculateRecentAccuracy(attempts, 10);
  const overallAccuracy = calculateOverallAccuracy(attempts);
  const timeEfficiency = calculateTimeEfficiency(attempts, conceptAvgTime);
  const consistency = calculateConsistency(attempts, 10);
  const retention = calculateRetention(lastAttemptDate);

  // Calculate weighted overall mastery
  const overall =
    recentAccuracy * 0.4 +
    overallAccuracy * 0.25 +
    timeEfficiency * 0.15 +
    consistency * 0.1 +
    retention * 0.1;

  const level = determineMasteryLevel(overall);

  logger.info('Concept mastery calculated', {
    userId,
    conceptId,
    overall: overall.toFixed(3),
    level,
    attempts: attempts.length,
    breakdown: {
      recentAccuracy: recentAccuracy.toFixed(3),
      overallAccuracy: overallAccuracy.toFixed(3),
      timeEfficiency: timeEfficiency.toFixed(3),
      consistency: consistency.toFixed(3),
      retention: retention.toFixed(3),
    },
  });

  return {
    overall,
    recentAccuracy,
    overallAccuracy,
    timeEfficiency,
    consistency,
    retention,
    level,
    attemptsUsed: attempts.length,
    lastAttemptDate,
  };
}

/**
 * Calculate mastery for all concepts in a student's learning path
 *
 * @param userId - Student user ID
 * @param pathId - Learning path ID
 * @param prisma - Prisma client
 * @returns Map of conceptId -> MasteryScore
 */
export async function calculatePathMastery(
  prisma: PrismaClient,
  userId: string,
  pathId: string
): Promise<Map<string, MasteryScore>> {
  logger.debug('Calculating path mastery', { userId, pathId });

  // Get all concepts in the path
  const pathSteps = await prisma.pathStep.findMany({
    where: {
      pathId,
      conceptId: { not: null },
    },
    select: {
      conceptId: true,
    },
    distinct: ['conceptId'],
  });

  const conceptIds = pathSteps
    .map((s) => s.conceptId)
    .filter((id): id is string => id !== null);

  const masteryMap = new Map<string, MasteryScore>();

  // Calculate mastery for each concept
  for (const conceptId of conceptIds) {
    const mastery = await calculateConceptMastery(prisma, userId, conceptId);
    masteryMap.set(conceptId, mastery);
  }

  logger.info('Path mastery calculated', {
    userId,
    pathId,
    conceptsEvaluated: masteryMap.size,
  });

  return masteryMap;
}

/**
 * Update student profile with latest mastery calculations
 *
 * @param userId - Student user ID
 * @param prisma - Prisma client
 */
export async function updateStudentMastery(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  logger.debug('Updating student mastery summary', { userId });

  // Get all concepts the student has attempted
  const attemptedConcepts = await prisma.pathStepAttempt.findMany({
    where: { userId },
    select: {
      step: {
        select: {
          conceptId: true,
        },
      },
    },
    distinct: ['stepId'],
  });

  const conceptIds = [
    ...new Set(
      attemptedConcepts
        .map((a) => a.step.conceptId)
        .filter((id): id is string => id !== null)
    ),
  ];

  let masteredCount = 0;
  let proficientCount = 0;
  let developingCount = 0;
  let noviceCount = 0;

  // Calculate mastery for each concept
  for (const conceptId of conceptIds) {
    const mastery = await calculateConceptMastery(prisma, userId, conceptId);

    if (mastery.level === 'MASTERY') {
      masteredCount++;
    } else if (mastery.level === 'PROFICIENT') {
      proficientCount++;
    } else if (mastery.level === 'DEVELOPING') {
      developingCount++;
    } else {
      noviceCount++;
    }
  }

  // Update student profile
  await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalConcepts: conceptIds.length,
      masteredConcepts: masteredCount,
      developingConcepts: proficientCount + developingCount,
      noviceConcepts: noviceCount,
    },
    update: {
      totalConcepts: conceptIds.length,
      masteredConcepts: masteredCount,
      developingConcepts: proficientCount + developingCount,
      noviceConcepts: noviceCount,
    },
  });

  logger.info('Student mastery summary updated', {
    userId,
    totalConcepts: conceptIds.length,
    breakdown: {
      mastery: masteredCount,
      proficient: proficientCount,
      developing: developingCount,
      novice: noviceCount,
    },
  });
}
