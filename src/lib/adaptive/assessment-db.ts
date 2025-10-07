/**
 * Database Operations for Adaptive Assessment
 *
 * Wrapper functions that integrate assessment-session logic with Prisma database
 */

import { PrismaClient } from '@prisma/client';
import { estimateAbility, IRTItemParams, ResponsePattern, itemInformation } from './irt-engine';
import { DiagnosticReport } from './assessment-session';
import { createLogger } from '../logger';

const logger = createLogger({ component: 'AssessmentDB' });

/**
 * Get next question for assessment
 */
export async function getNextQuestion(
  prisma: PrismaClient,
  assessmentId: string,
  jurisdictionId: string,
  currentTheta: number,
  usedItemIds: string[]
) {
  // Get available items
  const items = await prisma.item.findMany({
    where: {
      jurisdictionId,
      isActive: true,
      id: {
        notIn: usedItemIds,
      },
    },
    select: {
      id: true,
      stem: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      correctAnswer: true,
      necArticleRefs: true,
      irtA: true,
      irtB: true,
      irtC: true,
      topic: true,
    },
  });

  if (items.length === 0) {
    return null;
  }

  // Select item with highest information at current theta
  let bestItem = items[0];
  let bestInfo = itemInformation(currentTheta, {
    a: bestItem.irtA,
    b: bestItem.irtB,
    c: bestItem.irtC,
  });

  for (const item of items) {
    const info = itemInformation(currentTheta, {
      a: item.irtA,
      b: item.irtB,
      c: item.irtC,
    });

    if (info > bestInfo) {
      bestInfo = info;
      bestItem = item;
    }
  }

  return bestItem;
}

/**
 * Process response and update assessment
 */
export async function processResponse(
  prisma: PrismaClient,
  assessmentId: string,
  itemId: string,
  selectedAnswer: string,
  isCorrect: boolean,
  timeSeconds: number,
  itemParams: IRTItemParams
) {
  // Get current assessment state
  const assessment = await prisma.adaptiveAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      responses: {
        orderBy: { sequence: 'asc' },
        include: {
          item: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Calculate item information at current theta
  const info = itemInformation(assessment.currentTheta, itemParams);

  // Create response record
  const sequence = assessment.questionsAsked;
  await prisma.adaptiveResponse.create({
    data: {
      assessmentId,
      itemId,
      sequence,
      selectedAnswer,
      isCorrect,
      timeSeconds,
      thetaBefore: assessment.currentTheta,
      seBefore: assessment.currentSE,
      itemInfo: info,
      thetaAfter: assessment.currentTheta, // Will update after calculation
      seAfter: assessment.currentSE, // Will update after calculation
      paramA: itemParams.a,
      paramB: itemParams.b,
      paramC: itemParams.c,
    },
  });

  // Build response pattern for IRT estimation
  const responses: ResponsePattern[] = [
    ...assessment.responses.map((r) => ({
      itemParams: {
        a: r.item.irtA,
        b: r.item.irtB,
        c: r.item.irtC,
      },
      correct: r.isCorrect,
    })),
    {
      itemParams,
      correct: isCorrect,
    },
  ];

  // Estimate new ability
  const estimate = estimateAbility(responses, { initialTheta: 0.0 });

  // Update assessment
  await prisma.adaptiveAssessment.update({
    where: { id: assessmentId },
    data: {
      currentTheta: estimate.theta,
      currentSE: estimate.se,
      questionsAsked: sequence + 1,
    },
  });

  // Update the response with thetaAfter and seAfter
  await prisma.adaptiveResponse.updateMany({
    where: {
      assessmentId,
      sequence,
    },
    data: {
      thetaAfter: estimate.theta,
      seAfter: estimate.se,
    },
  });

  return {
    thetaAfter: estimate.theta,
    seAfter: estimate.se,
    questionsAsked: sequence + 1,
  };
}

/**
 * Check if assessment should terminate
 */
export async function checkTermination(
  prisma: PrismaClient,
  assessmentId: string,
  config: {
    minQuestions: number;
    maxQuestions: number;
    seThreshold: number;
    startingTheta: number;
  }
) {
  const assessment = await prisma.adaptiveAssessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const reasons: string[] = [];

  // Check max questions
  if (assessment.questionsAsked >= config.maxQuestions) {
    return {
      shouldTerminate: true,
      reason: `Maximum questions reached (${config.maxQuestions})`,
      metCriteria: ['max_questions'],
    };
  }

  // Check if we've reached minimum and SE is good
  if (assessment.questionsAsked >= config.minQuestions) {
    if (assessment.currentSE <= config.seThreshold) {
      return {
        shouldTerminate: true,
        reason: `Sufficient precision achieved (SE: ${assessment.currentSE.toFixed(3)})`,
        metCriteria: ['min_questions', 'se_threshold'],
      };
    }
  }

  return {
    shouldTerminate: false,
    reason: 'Continue assessment',
    metCriteria: [],
  };
}

/**
 * Generate diagnostic report from completed assessment
 */
export async function generateDiagnosticReport(
  prisma: PrismaClient,
  assessmentId: string
): Promise<DiagnosticReport> {
  const assessment = await prisma.adaptiveAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      responses: {
        orderBy: { sequence: 'asc' },
        include: {
          item: {
            include: {
              concepts: {
                include: {
                  concept: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assessment || assessment.status !== 'COMPLETED') {
    throw new Error('Assessment not completed');
  }

  // Calculate topic performance
  const topicPerf = new Map<string, { correct: number; total: number }>();

  for (const response of assessment.responses) {
    const topic = response.item.topic;
    if (!topicPerf.has(topic)) {
      topicPerf.set(topic, { correct: 0, total: 0 });
    }
    const perf = topicPerf.get(topic)!;
    perf.total++;
    if (response.isCorrect) {
      perf.correct++;
    }
  }

  const topicPerformance = Array.from(topicPerf.entries()).map(
    ([topic, perf]) => ({
      topic,
      questionsAsked: perf.total,
      correctCount: perf.correct,
      accuracy: perf.correct / perf.total,
      estimatedAbility: assessment.finalTheta || 0,
    })
  );

  // Identify weak and strong concepts
  const weakConcepts = topicPerformance
    .filter((t) => t.accuracy < 0.6)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
      recommendPractice: true,
    }));

  const strongConcepts = topicPerformance
    .filter((t) => t.accuracy >= 0.8)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
    }));

  // Estimate exam score (linear transformation from theta)
  const estimatedExamScore = Math.max(
    0,
    Math.min(100, 70 + (assessment.finalTheta || 0) * 15)
  );

  // Determine readiness level
  let readinessLevel: 'NOT_READY' | 'DEVELOPING' | 'READY' | 'EXAM_READY' =
    'NOT_READY';
  if (estimatedExamScore >= 85) {
    readinessLevel = 'EXAM_READY';
  } else if (estimatedExamScore >= 75) {
    readinessLevel = 'READY';
  } else if (estimatedExamScore >= 60) {
    readinessLevel = 'DEVELOPING';
  }

  return {
    finalAbility: assessment.finalTheta || 0,
    finalSE: assessment.finalSE || 1.0,
    confidenceInterval95: [
      (assessment.finalTheta || 0) - 1.96 * (assessment.finalSE || 1.0),
      (assessment.finalTheta || 0) + 1.96 * (assessment.finalSE || 1.0),
    ],
    questionsAsked: assessment.questionsAsked,
    topicPerformance,
    weakConcepts,
    strongConcepts,
    estimatedExamScore,
    readinessLevel,
  };
}

/**
 * Initialize assessment session in database
 */
export async function initializeAssessmentSession(
  prisma: PrismaClient,
  userId: string | undefined,
  jurisdictionId: string,
  config: {
    minQuestions?: number;
    maxQuestions?: number;
    seThreshold?: number;
  }
) {
  return await prisma.adaptiveAssessment.create({
    data: {
      userId,
      jurisdictionId,
      status: 'IN_PROGRESS',
      currentTheta: 0.0,
      currentSE: 1.0,
      questionsAsked: 0,
    },
  });
}
