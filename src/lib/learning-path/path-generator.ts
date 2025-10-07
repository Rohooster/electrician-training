/**
 * Learning Path Generator
 *
 * Creates personalized learning paths from adaptive assessment results.
 * Integrates:
 * - Phase 1: Prerequisite graph for concept ordering
 * - Phase 2: Embedding similarity for item selection
 * - Phase 3: Diagnostic report for weak concept identification
 */

import { PrismaClient, Concept } from '@prisma/client';
import { createLogger } from '../logger';
import { getPrerequisiteChain, topologicalSort, type ConceptNode } from '../concept-graph';
import { findItemsForConcept } from '../similarity-service';
import type { DiagnosticReport } from '../adaptive/assessment-session';

const logger = createLogger({ component: 'PathGenerator' });

/**
 * Student profile data for path generation
 */
export interface StudentProfile {
  userId: string;
  overallTheta: number; // Ability estimate from assessment
  pace: 'SLOW' | 'MEDIUM' | 'FAST';
  dailyGoalMinutes: number;
}

/**
 * Path generation options
 */
export interface PathGenerationOptions {
  itemsPerConcept?: number; // Default: 10
  requiredAccuracy?: number; // Default: 0.75
  includeMilestones?: boolean; // Default: true
  difficultyBuffer?: number; // Default: 0.5 (±0.5θ from student ability)
}

/**
 * Generated path structure
 */
export interface GeneratedPath {
  name: string;
  description: string;
  estimatedDays: number;
  estimatedMinutes: number;
  steps: PathStep[];
  milestones: PathMilestone[];
}

/**
 * Path step definition
 */
export interface PathStep {
  sequence: number;
  type: 'CONCEPT_STUDY' | 'PRACTICE_SET' | 'CHECKPOINT' | 'ASSESSMENT';
  conceptId?: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  requiredAccuracy?: number;
  itemIds?: string[]; // For PRACTICE_SET
  metadata?: any;
}

/**
 * Path milestone definition
 */
export interface PathMilestone {
  sequence: number;
  title: string;
  description: string;
  requiredStepIndices: number[];
  rewardType: 'BADGE' | 'UNLOCK_EXAM' | 'CERTIFICATE';
  rewardData: any;
}

/**
 * Generate personalized learning path from diagnostic report
 *
 * @param prisma - Prisma client
 * @param diagnosticReport - Results from adaptive assessment
 * @param studentProfile - Student preferences and ability
 * @param jurisdictionId - Jurisdiction for content filtering
 * @param options - Path generation options
 * @returns Generated learning path
 */
export async function generateLearningPath(
  prisma: PrismaClient,
  diagnosticReport: DiagnosticReport,
  studentProfile: StudentProfile,
  jurisdictionId: string,
  options?: PathGenerationOptions
): Promise<GeneratedPath> {
  const itemsPerConcept = options?.itemsPerConcept ?? 10;
  const requiredAccuracy = options?.requiredAccuracy ?? 0.75;
  const includeMilestones = options?.includeMilestones ?? true;
  const difficultyBuffer = options?.difficultyBuffer ?? 0.5;

  logger.info('Generating learning path', {
    userId: studentProfile.userId,
    weakConcepts: diagnosticReport.weakConcepts.length,
    studentAbility: studentProfile.overallTheta.toFixed(2),
  });

  // 1. Identify weak concepts (accuracy < 70%)
  const weakTopics = diagnosticReport.weakConcepts.map((wc) => wc.topic);

  if (weakTopics.length === 0) {
    logger.info('No weak concepts identified, student is exam-ready');
    return createExamReadyPath(studentProfile);
  }

  // 2. Fetch concepts for weak topics
  const concepts = await prisma.concept.findMany({
    where: {
      jurisdictionId,
      topic: { in: weakTopics },
      isActive: true,
    },
    include: {
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
      dependents: {
        include: {
          concept: true,
        },
      },
    },
  });

  logger.debug('Fetched concepts for weak topics', {
    conceptCount: concepts.length,
    topics: [...new Set(concepts.map((c) => c.topic))],
  });

  // 3. Build prerequisite chains for each weak concept
  const allConceptNodes: ConceptNode[] = await buildConceptNodes(prisma, jurisdictionId);
  const conceptsToLearn: ConceptNode[] = [];
  const seenIds = new Set<string>();

  for (const concept of concepts) {
    const chain = getPrerequisiteChain(concept.id, allConceptNodes);

    for (const node of chain) {
      if (!seenIds.has(node.id)) {
        conceptsToLearn.push(node);
        seenIds.add(node.id);
      }
    }
  }

  logger.debug('Built prerequisite chains', {
    conceptsToLearn: conceptsToLearn.length,
  });

  // 4. Topological sort to ensure prerequisites first
  const orderedConcepts = topologicalSort(conceptsToLearn);

  logger.info('Concepts ordered topologically', {
    count: orderedConcepts.length,
    firstThree: orderedConcepts.slice(0, 3).map((c) => c.name),
  });

  // 5. Generate steps for each concept
  const steps: PathStep[] = [];
  let sequence = 0;

  for (const conceptNode of orderedConcepts) {
    // Fetch full concept data
    const fullConcept = await prisma.concept.findUnique({
      where: { id: conceptNode.id },
    });

    if (!fullConcept) continue;

    // Step 1: Concept Study
    steps.push({
      sequence: sequence++,
      type: 'CONCEPT_STUDY',
      conceptId: fullConcept.id,
      title: `Study: ${fullConcept.name}`,
      description: fullConcept.description,
      estimatedMinutes: fullConcept.estimatedMinutes,
    });

    // Step 2: Practice Set
    // Find practice items using embedding similarity (Phase 2)
    const practiceItems = await findItemsForConcept(prisma, fullConcept.id, {
      limit: itemsPerConcept,
      minSimilarity: 0.65,
      jurisdictionId,
    });

    if (practiceItems.length > 0) {
      const itemIds = practiceItems.map((item) => item.id);

      steps.push({
        sequence: sequence++,
        type: 'PRACTICE_SET',
        conceptId: fullConcept.id,
        title: `Practice: ${fullConcept.name}`,
        description: `Complete ${itemIds.length} practice questions to reinforce your understanding`,
        estimatedMinutes: itemIds.length * 2, // 2 min per question
        requiredAccuracy,
        itemIds,
      });

      logger.debug('Added practice set', {
        concept: fullConcept.name,
        itemCount: itemIds.length,
      });
    } else {
      logger.warn('No practice items found for concept', {
        conceptId: fullConcept.id,
        conceptName: fullConcept.name,
      });
    }

    // Add checkpoint every 3 concepts
    if (steps.length > 0 && steps.length % 6 === 0) {
      const lastSixIndices = Array.from(
        { length: 6 },
        (_, i) => steps.length - 6 + i
      );

      steps.push({
        sequence: sequence++,
        type: 'CHECKPOINT',
        title: `Checkpoint ${Math.floor(steps.length / 6)}`,
        description: 'Review your progress and ensure mastery before continuing',
        estimatedMinutes: 15,
        requiredAccuracy: 0.80, // Slightly higher for checkpoints
        metadata: { requiredSteps: lastSixIndices },
      });
    }
  }

  // 6. Add final assessment
  steps.push({
    sequence: sequence++,
    type: 'ASSESSMENT',
    title: 'Final Knowledge Check',
    description: 'Comprehensive assessment to validate your readiness',
    estimatedMinutes: 20,
  });

  // 7. Generate milestones
  const milestones: PathMilestone[] = [];

  if (includeMilestones) {
    // Milestone at 25% completion
    const milestone25Idx = Math.floor(steps.length * 0.25);
    milestones.push({
      sequence: 0,
      title: 'Getting Started',
      description: "You have completed 25% of your learning path!",
      requiredStepIndices: Array.from({ length: milestone25Idx }, (_, i) => i),
      rewardType: 'BADGE',
      rewardData: { badgeId: 'early-progress', badgeName: 'Quick Learner' },
    });

    // Milestone at 50% completion
    const milestone50Idx = Math.floor(steps.length * 0.5);
    milestones.push({
      sequence: 1,
      title: 'Halfway There',
      description: "You have completed 50% of your learning path! Keep going!",
      requiredStepIndices: Array.from({ length: milestone50Idx }, (_, i) => i),
      rewardType: 'UNLOCK_EXAM',
      rewardData: { examType: 'PRACTICE_EXAM' },
    });

    // Milestone at 100% completion
    milestones.push({
      sequence: 2,
      title: 'Path Completed!',
      description: "Congratulations! You have completed your entire learning path.",
      requiredStepIndices: Array.from({ length: steps.length }, (_, i) => i),
      rewardType: 'CERTIFICATE',
      rewardData: { certificateType: 'PATH_COMPLETION' },
    });
  }

  // 8. Calculate timeline based on student pace
  const totalMinutes = steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

  // Adjust daily goal based on pace
  const paceMultipliers = { SLOW: 0.7, MEDIUM: 1.0, FAST: 1.3 };
  const adjustedDailyMinutes =
    studentProfile.dailyGoalMinutes * paceMultipliers[studentProfile.pace];

  const estimatedDays = Math.ceil(totalMinutes / adjustedDailyMinutes);

  // 9. Create path summary
  const pathName = `Personalized Path: ${orderedConcepts.length} Concepts`;
  const pathDescription = `This learning path was created based on your assessment results. You will study ${orderedConcepts.length} concepts, starting with fundamentals and building to more advanced topics. Estimated completion: ${estimatedDays} days at your current pace.`;

  logger.info('Learning path generated', {
    userId: studentProfile.userId,
    concepts: orderedConcepts.length,
    steps: steps.length,
    milestones: milestones.length,
    estimatedDays,
    totalMinutes,
  });

  return {
    name: pathName,
    description: pathDescription,
    estimatedDays,
    estimatedMinutes: totalMinutes,
    steps,
    milestones,
  };
}

/**
 * Build concept nodes for graph operations
 */
async function buildConceptNodes(
  prisma: PrismaClient,
  jurisdictionId: string
): Promise<ConceptNode[]> {
  const concepts = await prisma.concept.findMany({
    where: { jurisdictionId, isActive: true },
    include: {
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
    },
  });

  return concepts.map((concept) => ({
    id: concept.id,
    name: concept.name,
    slug: concept.slug,
    category: concept.category,
    topic: concept.topic || 'general',
    prerequisites: concept.prerequisites.map((p) => p.prerequisiteId),
  }));
}

/**
 * Create exam-ready path for students who passed assessment
 */
function createExamReadyPath(studentProfile: StudentProfile): GeneratedPath {
  return {
    name: 'Exam Preparation Track',
    description: 'Your assessment shows you are ready for the exam! This path focuses on exam strategy and full-length practice tests.',
    estimatedDays: 7,
    estimatedMinutes: 300,
    steps: [
      {
        sequence: 0,
        type: 'CONCEPT_STUDY',
        title: 'Exam Strategy & Tips',
        description: 'Learn proven test-taking strategies for the electrician exam',
        estimatedMinutes: 30,
      },
      {
        sequence: 1,
        type: 'ASSESSMENT',
        title: 'Full Practice Exam #1',
        description: 'Complete timed practice exam under real conditions',
        estimatedMinutes: 120,
      },
      {
        sequence: 2,
        type: 'CONCEPT_STUDY',
        title: 'Review Weak Areas',
        description: 'Review any topics you struggled with in practice exam',
        estimatedMinutes: 60,
      },
      {
        sequence: 3,
        type: 'ASSESSMENT',
        title: 'Full Practice Exam #2',
        description: 'Final practice exam to validate readiness',
        estimatedMinutes: 120,
      },
    ],
    milestones: [
      {
        sequence: 0,
        title: 'Exam Ready!',
        description: 'You have completed your exam preparation. Schedule your exam!',
        requiredStepIndices: [0, 1, 2, 3],
        rewardType: 'CERTIFICATE',
        rewardData: { certificateType: 'EXAM_READY' },
      },
    ],
  };
}
