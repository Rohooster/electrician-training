/**
 * Adaptive Assessment Session Manager
 *
 * Orchestrates the complete adaptive assessment process:
 * - Initialize session with configuration
 * - Select next question using IRT
 * - Process student response
 * - Update ability estimate
 * - Check termination criteria
 * - Generate diagnostic report
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../logger';
import {
  IRTItemParams,
  ResponsePattern,
  estimateAbility,
  AbilityEstimate,
  standardError,
} from './irt-engine';
import {
  SelectableItem,
  CoverageConstraints,
  CoverageState,
  selectNextQuestion,
  filterCandidates,
  initializeCoverageState,
  updateCoverageState,
} from './question-selector';

const logger = createLogger({ component: 'AssessmentSession' });

/**
 * Assessment configuration
 */
export interface AssessmentConfig {
  minQuestions: number; // Minimum questions before termination (default: 10)
  maxQuestions: number; // Maximum questions (default: 25)
  seThreshold: number; // SE threshold for termination (default: 0.3)
  startingTheta: number; // Initial ability estimate (default: 0)
  topicCoverage?: Record<string, number>; // {topic: minQuestions}
}

/**
 * Assessment state
 */
export interface AssessmentState {
  assessmentId: string;
  config: AssessmentConfig;
  currentTheta: number;
  currentSE: number;
  questionsAsked: number;
  responses: ResponseHistory[];
  coverage: CoverageState;
  status: 'INITIALIZED' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * Response history entry
 */
export interface ResponseHistory {
  sequence: number;
  itemId: string;
  itemParams: IRTItemParams;
  thetaBefore: number;
  seBefore: number;
  information: number;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSeconds: number;
  thetaAfter: number;
  seAfter: number;
}

/**
 * Next question recommendation
 */
export interface NextQuestionResult {
  item: SelectableItem;
  reason: string;
  information: number;
  currentEstimate: AbilityEstimate;
}

/**
 * Termination check result
 */
export interface TerminationCheck {
  shouldTerminate: boolean;
  reason: string;
  metCriteria: string[];
}

/**
 * Diagnostic report
 */
export interface DiagnosticReport {
  finalAbility: number;
  finalSE: number;
  confidenceInterval95: [number, number]; // θ ± 1.96*SE
  questionsAsked: number;
  topicPerformance: Array<{
    topic: string;
    questionsAsked: number;
    correctCount: number;
    accuracy: number;
    estimatedAbility: number;
  }>;
  weakConcepts: Array<{
    topic: string;
    accuracy: number;
    recommendPractice: boolean;
  }>;
  strongConcepts: Array<{
    topic: string;
    accuracy: number;
  }>;
  estimatedExamScore: number; // Predicted score on actual exam (0-100%)
  readinessLevel: 'NOT_READY' | 'DEVELOPING' | 'READY' | 'EXAM_READY';
}

/**
 * Initialize assessment session
 */
export function initializeSession(
  assessmentId: string,
  config: AssessmentConfig
): AssessmentState {
  logger.info('Initializing assessment session', {
    assessmentId,
    config,
  });

  return {
    assessmentId,
    config,
    currentTheta: config.startingTheta,
    currentSE: 999, // Infinite uncertainty initially
    questionsAsked: 0,
    responses: [],
    coverage: initializeCoverageState(),
    status: 'INITIALIZED',
  };
}

/**
 * Get next question for student
 */
export async function getNextQuestion(
  prisma: PrismaClient,
  state: AssessmentState,
  jurisdictionId: string
): Promise<NextQuestionResult | null> {
  logger.debug('Getting next question', {
    assessmentId: state.assessmentId,
    currentTheta: state.currentTheta.toFixed(2),
    questionsAsked: state.questionsAsked,
  });

  // Get used item IDs
  const usedItemIds = new Set(state.responses.map((r) => r.itemId));

  // Fetch candidate items
  const allItems = await prisma.item.findMany({
    where: {
      jurisdictionId,
      isActive: true,
    },
    select: {
      id: true,
      topic: true,
      cognitive: true,
      difficulty: true,
      necArticleRefs: true,
      irtA: true,
      irtB: true,
      irtC: true,
      timesUsed: true,
    },
  });

  // Filter candidates
  const candidates = filterCandidates(allItems, usedItemIds);

  if (candidates.length === 0) {
    logger.error('No available items for selection', {
      assessmentId: state.assessmentId,
    });
    return null;
  }

  // Prepare coverage constraints
  const constraints: CoverageConstraints = {
    topicMinimums: state.config.topicCoverage
      ? new Map(Object.entries(state.config.topicCoverage))
      : undefined,
  };

  // Select best question
  const selection = selectNextQuestion(
    candidates,
    {
      currentTheta: state.currentTheta,
      currentSE: state.currentSE,
      coverage: state.coverage,
      constraints,
    },
    1000 // Total assessments for exposure control
  );

  if (!selection) {
    return null;
  }

  // Calculate current estimate
  const responsesForEstimate: ResponsePattern[] = state.responses.map((r) => ({
    itemParams: r.itemParams,
    correct: r.isCorrect,
  }));

  const currentEstimate = estimateAbility(responsesForEstimate, {
    initialTheta: state.config.startingTheta,
  });

  return {
    item: selection.item,
    reason: selection.reason,
    information: selection.information,
    currentEstimate,
  };
}

/**
 * Process student response and update state
 */
export function processResponse(
  state: AssessmentState,
  itemId: string,
  itemParams: IRTItemParams,
  selectedAnswer: string,
  correctAnswer: string,
  timeSeconds: number,
  information: number
): AssessmentState {
  const isCorrect = selectedAnswer === correctAnswer;

  logger.info('Processing response', {
    assessmentId: state.assessmentId,
    sequence: state.questionsAsked + 1,
    isCorrect,
    timeSec

onds: timeSeconds,
  });

  // Store pre-response state
  const thetaBefore = state.currentTheta;
  const seBefore = state.currentSE;

  // Add response to history
  const allResponses: ResponsePattern[] = [
    ...state.responses.map((r) => ({
      itemParams: r.itemParams,
      correct: r.isCorrect,
    })),
    { itemParams, correct: isCorrect },
  ];

  // Re-estimate ability with new response
  const newEstimate = estimateAbility(allResponses, {
    initialTheta: state.config.startingTheta,
  });

  // Find item to update coverage
  const item = { id: itemId, topic: 'unknown', cognitive: 'LOOKUP', difficulty: 'MEDIUM' } as any;
  // Note: In real use, this would come from the database query

  // Create response entry
  const responseEntry: ResponseHistory = {
    sequence: state.questionsAsked + 1,
    itemId,
    itemParams,
    thetaBefore,
    seBefore,
    information,
    selectedAnswer,
    isCorrect,
    timeSeconds,
    thetaAfter: newEstimate.theta,
    seAfter: newEstimate.se,
  };

  // Update state
  return {
    ...state,
    currentTheta: newEstimate.theta,
    currentSE: newEstimate.se,
    questionsAsked: state.questionsAsked + 1,
    responses: [...state.responses, responseEntry],
    coverage: updateCoverageState(state.coverage, item),
    status: 'IN_PROGRESS',
  };
}

/**
 * Check if assessment should terminate
 */
export function checkTermination(state: AssessmentState): TerminationCheck {
  const { config, currentSE, questionsAsked, coverage } = state;
  const metCriteria: string[] = [];

  // Check maximum questions
  if (questionsAsked >= config.maxQuestions) {
    return {
      shouldTerminate: true,
      reason: 'Maximum questions reached',
      metCriteria: ['max_questions'],
    };
  }

  // Must ask minimum questions before other criteria
  if (questionsAsked < config.minQuestions) {
    return {
      shouldTerminate: false,
      reason: 'Minimum questions not yet met',
      metCriteria: [],
    };
  }

  metCriteria.push('min_questions');

  // Check SE threshold (ability estimate is precise enough)
  if (currentSE <= config.seThreshold) {
    metCriteria.push('se_threshold');
  }

  // Check topic coverage (if specified)
  let coverageMet = true;
  if (config.topicCoverage) {
    for (const [topic, minCount] of Object.entries(config.topicCoverage)) {
      const currentCount = coverage.topicCounts.get(topic) || 0;
      if (currentCount < minCount) {
        coverageMet = false;
        break;
      }
    }
  }

  if (coverageMet) {
    metCriteria.push('topic_coverage');
  }

  // Terminate if SE threshold met AND coverage met
  const shouldTerminate = metCriteria.includes('se_threshold') && coverageMet;

  return {
    shouldTerminate,
    reason: shouldTerminate
      ? 'Ability estimate converged and coverage satisfied'
      : `Waiting for: ${!metCriteria.includes('se_threshold') ? 'SE convergence' : 'topic coverage'}`,
    metCriteria,
  };
}

/**
 * Generate diagnostic report from completed assessment
 */
export function generateDiagnosticReport(state: AssessmentState): DiagnosticReport {
  logger.info('Generating diagnostic report', {
    assessmentId: state.assessmentId,
    finalTheta: state.currentTheta.toFixed(2),
    finalSE: state.currentSE.toFixed(3),
  });

  // Calculate confidence interval (95% = θ ± 1.96*SE)
  const ci95: [number, number] = [
    state.currentTheta - 1.96 * state.currentSE,
    state.currentTheta + 1.96 * state.currentSE,
  ];

  // Analyze performance by topic
  const topicStats = new Map<string, { correct: number; total: number }>();

  for (const response of state.responses) {
    const topic = 'general'; // Would come from item data in real use
    const stats = topicStats.get(topic) || { correct: 0, total: 0 };
    stats.total++;
    if (response.isCorrect) stats.correct++;
    topicStats.set(topic, stats);
  }

  const topicPerformance = Array.from(topicStats.entries()).map(([topic, stats]) => ({
    topic,
    questionsAsked: stats.total,
    correctCount: stats.correct,
    accuracy: stats.correct / stats.total,
    estimatedAbility: state.currentTheta, // Simplified; would calculate per-topic in real use
  }));

  // Identify weak concepts (accuracy < 0.7)
  const weakConcepts = topicPerformance
    .filter((t) => t.accuracy < 0.7)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
      recommendPractice: true,
    }));

  // Identify strong concepts (accuracy >= 0.85)
  const strongConcepts = topicPerformance
    .filter((t) => t.accuracy >= 0.85)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
    }));

  // Estimate exam score (convert θ to percentage)
  // θ of 0 ≈ 70%, θ of +1 ≈ 85%, θ of -1 ≈ 55%
  const estimatedExamScore = Math.max(0, Math.min(100, 70 + state.currentTheta * 15));

  // Determine readiness level
  let readinessLevel: DiagnosticReport['readinessLevel'];
  if (estimatedExamScore >= 85) {
    readinessLevel = 'EXAM_READY';
  } else if (estimatedExamScore >= 75) {
    readinessLevel = 'READY';
  } else if (estimatedExamScore >= 60) {
    readinessLevel = 'DEVELOPING';
  } else {
    readinessLevel = 'NOT_READY';
  }

  return {
    finalAbility: state.currentTheta,
    finalSE: state.currentSE,
    confidenceInterval95: ci95,
    questionsAsked: state.questionsAsked,
    topicPerformance,
    weakConcepts,
    strongConcepts,
    estimatedExamScore,
    readinessLevel,
  };
}
