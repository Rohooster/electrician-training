/**
 * Assessment tRPC Router
 *
 * Provides endpoints for adaptive assessment:
 * - Start new assessment
 * - Submit responses
 * - Get next question
 * - Complete assessment
 * - Get diagnostic report
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  initializeAssessmentSession,
  processResponse,
  getNextQuestion,
  checkTermination,
  generateDiagnosticReport,
} from '@/lib/adaptive/assessment-db';

/**
 * Start a new adaptive assessment
 */
export const assessmentRouter = createTRPCRouter({
  /**
   * Initialize new assessment session
   */
  start: publicProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        config: z
          .object({
            minQuestions: z.number().optional(),
            maxQuestions: z.number().optional(),
            seThreshold: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { jurisdictionId, config } = input;

      // Get jurisdiction to verify it exists
      const jurisdiction = await ctx.prisma.jurisdiction.findUnique({
        where: { id: jurisdictionId },
        include: { ruleSet: true },
      });

      if (!jurisdiction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Jurisdiction not found',
        });
      }

      // Create assessment record
      const assessment = await initializeAssessmentSession(
        ctx.prisma,
        ctx.user?.id,
        jurisdictionId,
        {
          minQuestions: config?.minQuestions || 15,
          maxQuestions: config?.maxQuestions || 20,
          seThreshold: config?.seThreshold || 0.3,
        }
      );

      const sessionConfig = {
        minQuestions: config?.minQuestions || 15,
        maxQuestions: config?.maxQuestions || 20,
        seThreshold: config?.seThreshold || 0.3,
      };

      // Get first question
      const firstQuestion = await getNextQuestion(
        ctx.prisma,
        assessment.id,
        jurisdictionId,
        0.0, // starting theta
        []
      );

      if (!firstQuestion) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No questions available for assessment',
        });
      }

      return {
        assessmentId: assessment.id,
        config: sessionConfig,
        firstQuestion: {
          itemId: firstQuestion.id,
          stem: firstQuestion.stem,
          optionA: firstQuestion.optionA,
          optionB: firstQuestion.optionB,
          optionC: firstQuestion.optionC,
          optionD: firstQuestion.optionD,
          necArticleRefs: firstQuestion.necArticleRefs,
          sequence: 0,
        },
      };
    }),

  /**
   * Submit response and get next question
   */
  submitResponse: publicProcedure
    .input(
      z.object({
        assessmentId: z.string(),
        itemId: z.string(),
        selectedAnswer: z.enum(['A', 'B', 'C', 'D']),
        timeSeconds: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { assessmentId, itemId, selectedAnswer, timeSeconds } = input;

      // Get assessment
      const assessment = await ctx.prisma.adaptiveAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          responses: {
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (!assessment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (assessment.status === 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Assessment already completed',
        });
      }

      // Get item details
      const item = await ctx.prisma.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Item not found',
        });
      }

      // Check if correct
      const isCorrect = selectedAnswer === item.correctAnswer;

      // Process response and update theta
      const responseData = await processResponse(
        ctx.prisma,
        assessmentId,
        itemId,
        selectedAnswer,
        isCorrect,
        timeSeconds,
        {
          a: item.irtA,
          b: item.irtB,
          c: item.irtC,
        }
      );

      // Check if should terminate
      const termination = await checkTermination(
        ctx.prisma,
        assessmentId,
        {
          minQuestions: 15,
          maxQuestions: 20,
          seThreshold: 0.3,
          startingTheta: 0.0,
        }
      );

      if (termination.shouldTerminate) {
        // Complete assessment
        await ctx.prisma.adaptiveAssessment.update({
          where: { id: assessmentId },
          data: {
            status: 'COMPLETED',
            finalTheta: responseData.thetaAfter,
            finalSE: responseData.seAfter,
          },
        });

        return {
          complete: true,
          reason: termination.reason,
          currentTheta: responseData.thetaAfter,
          currentSE: responseData.seAfter,
          questionsAsked: responseData.questionsAsked,
        };
      }

      // Get next question
      const nextQuestion = await getNextQuestion(
        ctx.prisma,
        assessmentId,
        assessment.jurisdictionId,
        responseData.thetaAfter,
        assessment.responses.map((r) => r.itemId)
      );

      if (!nextQuestion) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No more questions available',
        });
      }

      return {
        complete: false,
        isCorrect,
        currentTheta: responseData.thetaAfter,
        currentSE: responseData.seAfter,
        questionsAsked: responseData.questionsAsked,
        nextQuestion: {
          itemId: nextQuestion.id,
          stem: nextQuestion.stem,
          optionA: nextQuestion.optionA,
          optionB: nextQuestion.optionB,
          optionC: nextQuestion.optionC,
          optionD: nextQuestion.optionD,
          necArticleRefs: nextQuestion.necArticleRefs,
          sequence: responseData.questionsAsked,
        },
      };
    }),

  /**
   * Get assessment state
   */
  getAssessment: publicProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.adaptiveAssessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          responses: {
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (!assessment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      return {
        id: assessment.id,
        status: assessment.status,
        currentTheta: assessment.currentTheta,
        currentSE: assessment.currentSE,
        questionsAsked: assessment.questionsAsked,
        responses: assessment.responses,
        createdAt: assessment.createdAt,
      };
    }),

  /**
   * Get diagnostic report
   */
  getReport: publicProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.adaptiveAssessment.findUnique({
        where: { id: input.assessmentId },
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

      if (!assessment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (assessment.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Assessment not yet completed',
        });
      }

      // Generate diagnostic report
      const report = await generateDiagnosticReport(ctx.prisma, assessment.id);

      return report;
    }),

  /**
   * Get user's assessment history
   */
  getUserAssessments: protectedProcedure.query(async ({ ctx }) => {
    const assessments = await ctx.prisma.adaptiveAssessment.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        jurisdiction: true,
      },
    });

    return assessments.map((a) => ({
      id: a.id,
      jurisdiction: a.jurisdiction.name,
      status: a.status,
      finalTheta: a.finalTheta,
      questionsAsked: a.questionsAsked,
      createdAt: a.createdAt,
    }));
  }),
});
