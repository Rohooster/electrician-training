/**
 * Learning Path tRPC Router
 *
 * Provides procedures for:
 * - Generating personalized learning paths
 * - Tracking student progress
 * - Submitting step attempts
 * - Checking milestones and rewards
 * - Getting student statistics
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateLearningPath, type StudentProfile, type DiagnosticReport } from '@/lib/learning-path/path-generator';
import { calculatePathProgress, canAdvanceToNextStep, updateStudentStreak } from '@/lib/learning-path/progress-tracker';
import { calculateConceptMastery } from '@/lib/learning-path/mastery-calculator';
import { checkAndUnlockMilestones, awardStepCompletion, getStudentProgress } from '@/lib/learning-path/milestone-engine';

export const learningPathRouter = router({
  /**
   * Generate personalized learning path from assessment results
   */
  generatePath: protectedProcedure
    .input(
      z.object({
        assessmentId: z.string(),
        jurisdictionId: z.string(),
        pace: z.enum(['SLOW', 'MEDIUM', 'FAST']).default('MEDIUM'),
        dailyGoalMinutes: z.number().min(15).max(240).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { assessmentId, jurisdictionId, pace, dailyGoalMinutes } = input;
      const userId = ctx.user.id;

      // Get assessment results
      const assessment = await ctx.prisma.adaptiveAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          responses: {
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (!assessment || assessment.userId !== userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (!assessment.finalTheta || !assessment.finalSE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Assessment not completed',
        });
      }

      // Build diagnostic report from assessment
      const diagnosticReport: DiagnosticReport = {
        finalAbility: assessment.finalTheta,
        finalSE: assessment.finalSE,
        confidenceInterval95: [
          assessment.finalTheta - 1.96 * assessment.finalSE,
          assessment.finalTheta + 1.96 * assessment.finalSE,
        ],
        questionsAsked: assessment.questionsAsked,
        topicPerformance: [],
        weakConcepts: [],
        strongConcepts: [],
        estimatedExamScore: Math.max(0, Math.min(100, 70 + assessment.finalTheta * 15)),
        readinessLevel: 'DEVELOPING',
      };

      // Get student profile or create
      let studentProfile = await ctx.prisma.studentProfile.findUnique({
        where: { userId },
      });

      if (!studentProfile) {
        studentProfile = await ctx.prisma.studentProfile.create({
          data: {
            userId,
            overallTheta: assessment.finalTheta,
            overallSE: assessment.finalSE,
            pace,
            dailyGoalMinutes,
          },
        });
      }

      const profile: StudentProfile = {
        userId,
        overallTheta: studentProfile.overallTheta,
        pace: pace as 'SLOW' | 'MEDIUM' | 'FAST',
        dailyGoalMinutes,
      };

      // Generate learning path
      const generatedPath = await generateLearningPath(
        ctx.prisma,
        diagnosticReport,
        profile,
        jurisdictionId
      );

      // Create path in database
      const learningPath = await ctx.prisma.learningPath.create({
        data: {
          userId,
          jurisdictionId,
          name: generatedPath.name,
          description: generatedPath.description,
          status: 'ACTIVE',
          estimatedDays: generatedPath.estimatedDays,
          steps: {
            create: generatedPath.steps.map((step) => ({
              sequence: step.sequence,
              type: step.type,
              conceptId: step.conceptId,
              title: step.title,
              description: step.description,
              estimatedMinutes: step.estimatedMinutes,
              requiredAccuracy: step.requiredAccuracy,
              metadata: step.metadata || {},
              status: 'LOCKED',
            })),
          },
          milestones: {
            create: generatedPath.milestones.map((milestone) => ({
              sequence: milestone.sequence,
              title: milestone.title,
              description: milestone.description,
              requiredSteps: milestone.requiredStepIndices,
              rewardType: milestone.rewardType,
              rewardData: milestone.rewardData || {},
              status: 'LOCKED',
            })),
          },
        },
        include: {
          steps: true,
          milestones: true,
        },
      });

      // Unlock first step
      if (learningPath.steps.length > 0) {
        await ctx.prisma.pathStep.update({
          where: { id: learningPath.steps[0].id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return {
        pathId: learningPath.id,
        name: learningPath.name,
        description: learningPath.description,
        estimatedDays: learningPath.estimatedDays,
        stepsCount: learningPath.steps.length,
        milestonesCount: learningPath.milestones.length,
      };
    }),

  /**
   * Get learning path with current progress
   */
  getPath: protectedProcedure
    .input(z.object({ pathId: z.string() }))
    .query(async ({ ctx, input }) => {
      const path = await ctx.prisma.learningPath.findUnique({
        where: { id: input.pathId },
        include: {
          steps: {
            orderBy: { sequence: 'asc' },
            include: {
              concept: true,
            },
          },
          milestones: {
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (!path || path.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Path not found' });
      }

      const progress = await calculatePathProgress(
        ctx.prisma,
        ctx.user.id,
        input.pathId
      );

      return {
        path,
        progress,
      };
    }),

  /**
   * Get detailed progress statistics
   */
  getProgress: protectedProcedure
    .input(z.object({ pathId: z.string() }))
    .query(async ({ ctx, input }) => {
      const progress = await calculatePathProgress(
        ctx.prisma,
        ctx.user.id,
        input.pathId
      );

      return progress;
    }),

  /**
   * Submit step attempt (for practice sets)
   */
  submitAttempt: protectedProcedure
    .input(
      z.object({
        stepId: z.string(),
        itemId: z.string(),
        selectedAnswer: z.string(),
        isCorrect: z.boolean(),
        timeSeconds: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { stepId, itemId, selectedAnswer, isCorrect, timeSeconds } = input;

      // Create attempt record
      const attempt = await ctx.prisma.pathStepAttempt.create({
        data: {
          userId: ctx.user.id,
          stepId,
          itemId,
          selectedAnswer,
          isCorrect,
          timeSeconds,
        },
      });

      // Update streak
      await updateStudentStreak(ctx.prisma, ctx.user.id);

      // Check if step is now complete
      const completionCheck = await canAdvanceToNextStep(
        ctx.prisma,
        ctx.user.id,
        stepId
      );

      // If step complete, award XP and check milestones
      let xpAwarded = 0;
      let leveledUp = false;
      let milestonesUnlocked: any[] = [];

      if (completionCheck.canAdvance) {
        const step = await ctx.prisma.pathStep.findUnique({
          where: { id: stepId },
          select: { pathId: true, status: true },
        });

        if (step && step.status !== 'COMPLETED') {
          // Mark step as completed
          await ctx.prisma.pathStep.update({
            where: { id: stepId },
            data: { status: 'COMPLETED' },
          });

          // Award XP
          const reward = await awardStepCompletion(ctx.prisma, ctx.user.id, stepId);
          xpAwarded = reward.xpAwarded;
          leveledUp = reward.leveledUp;

          // Check milestones
          milestonesUnlocked = await checkAndUnlockMilestones(
            ctx.prisma,
            ctx.user.id,
            step.pathId
          );
        }
      }

      return {
        attemptId: attempt.id,
        isCorrect,
        stepComplete: completionCheck.canAdvance,
        xpAwarded,
        leveledUp,
        milestonesUnlocked: milestonesUnlocked.filter((m) => m.unlocked),
      };
    }),

  /**
   * Mark concept study step as complete
   */
  completeStudyStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const step = await ctx.prisma.pathStep.findUnique({
        where: { id: input.stepId },
        include: {
          path: true,
        },
      });

      if (!step || step.path.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Step not found' });
      }

      if (step.type !== 'CONCEPT_STUDY') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only study steps can be marked complete',
        });
      }

      // Create completion record
      await ctx.prisma.pathStepAttempt.create({
        data: {
          userId: ctx.user.id,
          stepId: input.stepId,
          isCorrect: true,
          timeSeconds: 60,
        },
      });

      // Update step status
      await ctx.prisma.pathStep.update({
        where: { id: input.stepId },
        data: { status: 'COMPLETED' },
      });

      // Award XP
      const reward = await awardStepCompletion(ctx.prisma, ctx.user.id, input.stepId);

      // Check milestones
      const milestonesUnlocked = await checkAndUnlockMilestones(
        ctx.prisma,
        ctx.user.id,
        step.pathId
      );

      return {
        xpAwarded: reward.xpAwarded,
        leveledUp: reward.leveledUp,
        milestonesUnlocked: milestonesUnlocked.filter((m) => m.unlocked),
      };
    }),

  /**
   * Get concept mastery score
   */
  getConceptMastery: protectedProcedure
    .input(z.object({ conceptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const mastery = await calculateConceptMastery(
        ctx.prisma,
        ctx.user.id,
        input.conceptId
      );

      return mastery;
    }),

  /**
   * Get student statistics and achievements
   */
  getStudentStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getStudentProgress(ctx.prisma, ctx.user.id);

    const profile = await ctx.prisma.studentProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    return {
      ...stats,
      currentStreak: profile?.currentStreak || 0,
      longestStreak: profile?.longestStreak || 0,
      totalStudyMinutes: profile?.totalStudyMinutes || 0,
      overallAccuracy: profile?.overallAccuracy || 0,
      estimatedExamScore: profile?.estimatedExamScore || null,
      readinessLevel: profile?.readinessLevel || 'NOT_READY',
    };
  }),

  /**
   * Get all active learning paths for user
   */
  getUserPaths: protectedProcedure.query(async ({ ctx }) => {
    const paths = await ctx.prisma.learningPath.findMany({
      where: {
        userId: ctx.user.id,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        steps: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return paths.map((path) => ({
      id: path.id,
      name: path.name,
      description: path.description,
      status: path.status,
      estimatedDays: path.estimatedDays,
      completedSteps: path.steps.filter((s) => s.status === 'COMPLETED').length,
      totalSteps: path.steps.length,
      progress:
        path.steps.length > 0
          ? (path.steps.filter((s) => s.status === 'COMPLETED').length /
              path.steps.length) *
            100
          : 0,
    }));
  }),
});
