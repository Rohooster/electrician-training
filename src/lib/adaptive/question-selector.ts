/**
 * Adaptive Question Selection Algorithm
 *
 * Selects the most informative next question for adaptive assessment.
 * Balances maximum information with content coverage constraints.
 *
 * Selection Strategy:
 * 1. Calculate information for each candidate item at current θ
 * 2. Apply exposure control (don't over-use popular items)
 * 3. Apply content constraints (ensure topic coverage)
 * 4. Select item with highest adjusted information
 */

import { Item } from '@prisma/client';
import { createLogger } from '../logger';
import { IRTItemParams, itemInformation } from './irt-engine';

const logger = createLogger({ component: 'QuestionSelector' });

/**
 * Item with IRT parameters for selection
 */
export interface SelectableItem {
  id: string;
  topic: string;
  cognitive: string;
  difficulty: string;
  necArticleRefs: any;
  irtA: number | null;
  irtB: number | null;
  irtC: number | null;
  timesUsed: number;
}

/**
 * Content coverage requirements
 */
export interface CoverageConstraints {
  topicMinimums?: Map<string, number>; // {topic: minQuestions}
  cognitiveMinimums?: Map<string, number>; // {cognitive: minQuestions}
  difficul

tyBalance?: boolean; // Ensure mix of difficulties
}

/**
 * Current coverage state
 */
export interface CoverageState {
  topicCounts: Map<string, number>;
  cognitiveCounts: Map<string, number>;
  difficultyCounts: Map<string, number>;
  totalQuestions: number;
}

/**
 * Selection options
 */
export interface SelectionOptions {
  currentTheta: number; // Current ability estimate
  currentSE: number; // Current standard error
  coverage: CoverageState; // Current coverage
  constraints: CoverageConstraints; // Coverage requirements
  exposureControl?: boolean; // Apply exposure control (default: true)
  randomness?: number; // Randomization factor 0-1 (default: 0)
}

/**
 * Selection result
 */
export interface SelectionResult {
  item: SelectableItem;
  information: number; // Raw information at current θ
  adjustedScore: number; // Score after adjustments
  reason: string; // Explanation for selection
}

/**
 * Get default IRT parameters if not calibrated
 */
function getDefaultIRTParams(difficulty: string): IRTItemParams {
  const difficultyMap: Record<string, number> = {
    EASY: -0.5,
    MEDIUM: 0.0,
    HARD: 0.5,
  };

  return {
    a: 1.0, // Average discrimination
    b: difficultyMap[difficulty] || 0.0,
    c: 0.25, // Standard guessing for 4-option MC
  };
}

/**
 * Get IRT parameters from item
 */
function getIRTParams(item: SelectableItem): IRTItemParams {
  if (item.irtA && item.irtB && item.irtC) {
    return {
      a: item.irtA,
      b: item.irtB,
      c: item.irtC,
    };
  }

  // Use defaults based on difficulty if not calibrated
  return getDefaultIRTParams(item.difficulty);
}

/**
 * Check if coverage constraint is satisfied
 */
function isCoverageSatisfied(
  coverage: CoverageState,
  constraints: CoverageConstraints
): boolean {
  // Check topic minimums
  if (constraints.topicMinimums) {
    for (const [topic, minCount] of constraints.topicMinimums) {
      const currentCount = coverage.topicCounts.get(topic) || 0;
      if (currentCount < minCount) {
        return false;
      }
    }
  }

  // Check cognitive minimums
  if (constraints.cognitiveMinimums) {
    for (const [cognitive, minCount] of constraints.cognitiveMinimums) {
      const currentCount = coverage.cognitiveCounts.get(cognitive) || 0;
      if (currentCount < minCount) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get priority topics that need more coverage
 */
function getPriorityTopics(
  coverage: CoverageState,
  constraints: CoverageConstraints
): Set<string> {
  const priorities = new Set<string>();

  if (constraints.topicMinimums) {
    for (const [topic, minCount] of constraints.topicMinimums) {
      const currentCount = coverage.topicCounts.get(topic) || 0;
      if (currentCount < minCount) {
        priorities.add(topic);
      }
    }
  }

  return priorities;
}

/**
 * Calculate exposure control penalty
 *
 * Items used frequently should be de-prioritized to ensure fairness.
 */
function exposurePenalty(timesUsed: number, totalAssessments: number): number {
  if (totalAssessments === 0) return 1.0;

  const exposureRate = timesUsed / totalAssessments;

  // Apply penalty if over-exposed (used in >20% of assessments)
  if (exposureRate > 0.2) {
    return 0.5; // 50% penalty
  }

  if (exposureRate > 0.15) {
    return 0.75; // 25% penalty
  }

  return 1.0; // No penalty
}

/**
 * Select next question for adaptive assessment
 *
 * @param candidates - Pool of available items
 * @param options - Selection options (ability, coverage, constraints)
 * @param totalAssessments - Total assessments administered (for exposure control)
 * @returns Selected item with metadata
 */
export function selectNextQuestion(
  candidates: SelectableItem[],
  options: SelectionOptions,
  totalAssessments: number = 1000
): SelectionResult | null {
  const {
    currentTheta,
    coverage,
    constraints,
    exposureControl = true,
    randomness = 0,
  } = options;

  if (candidates.length === 0) {
    logger.warn('No candidate items available for selection');
    return null;
  }

  logger.debug('Selecting next question', {
    candidates: candidates.length,
    currentTheta: currentTheta.toFixed(2),
    totalQuestions: coverage.totalQuestions,
  });

  // Get priority topics that need coverage
  const priorityTopics = getPriorityTopics(coverage, constraints);

  // Score each candidate
  const scoredCandidates = candidates.map((item) => {
    const params = getIRTParams(item);
    const info = itemInformation(currentTheta, params);

    let adjustedScore = info;

    // Boost priority topics (2x multiplier)
    if (priorityTopics.has(item.topic)) {
      adjustedScore *= 2.0;
      logger.debug('Priority topic boost', { itemId: item.id, topic: item.topic });
    }

    // Apply exposure control penalty
    if (exposureControl) {
      const penalty = exposurePenalty(item.timesUsed, totalAssessments);
      adjustedScore *= penalty;
    }

    // Add randomness if requested (helps prevent deterministic patterns)
    if (randomness > 0) {
      const randomFactor = 1 + (Math.random() - 0.5) * randomness;
      adjustedScore *= randomFactor;
    }

    return {
      item,
      information: info,
      adjustedScore,
      reason: priorityTopics.has(item.topic)
        ? `Priority topic: ${item.topic}`
        : 'Maximum information',
    };
  });

  // Sort by adjusted score (highest first)
  scoredCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

  const selected = scoredCandidates[0];

  logger.info('Question selected', {
    itemId: selected.item.id,
    topic: selected.item.topic,
    difficulty: selected.item.difficulty,
    information: selected.information.toFixed(3),
    adjustedScore: selected.adjustedScore.toFixed(3),
    reason: selected.reason,
  });

  return selected;
}

/**
 * Filter candidates based on constraints
 *
 * Removes items that shouldn't be considered (already used, wrong jurisdiction, etc.)
 */
export function filterCandidates(
  allItems: SelectableItem[],
  usedItemIds: Set<string>,
  options?: {
    jurisdictionId?: string;
    excludeTopics?: string[];
    onlyTopics?: string[];
  }
): SelectableItem[] {
  return allItems.filter((item) => {
    // Don't reuse items
    if (usedItemIds.has(item.id)) return false;

    // Filter by topic if specified
    if (options?.excludeTopics && options.excludeTopics.includes(item.topic)) {
      return false;
    }

    if (options?.onlyTopics && !options.onlyTopics.includes(item.topic)) {
      return false;
    }

    return true;
  });
}

/**
 * Initialize coverage state
 */
export function initializeCoverageState(): CoverageState {
  return {
    topicCounts: new Map(),
    cognitiveCounts: new Map(),
    difficultyCounts: new Map(),
    totalQuestions: 0,
  };
}

/**
 * Update coverage state after question is administered
 */
export function updateCoverageState(
  state: CoverageState,
  item: SelectableItem
): CoverageState {
  const newState = {
    topicCounts: new Map(state.topicCounts),
    cognitiveCounts: new Map(state.cognitiveCounts),
    difficultyCounts: new Map(state.difficultyCounts),
    totalQuestions: state.totalQuestions + 1,
  };

  // Update counts
  newState.topicCounts.set(item.topic, (state.topicCounts.get(item.topic) || 0) + 1);
  newState.cognitiveCounts.set(
    item.cognitive,
    (state.cognitiveCounts.get(item.cognitive) || 0) + 1
  );
  newState.difficultyCounts.set(
    item.difficulty,
    (state.difficultyCounts.get(item.difficulty) || 0) + 1
  );

  return newState;
}
