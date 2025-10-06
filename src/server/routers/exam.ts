/**
 * Exam Router
 *
 * Handles exam form building, sitting lifecycle, and submission.
 * Implements PSI-style exam flow per CIB rules.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { buildExamForm } from '@/lib/exam/form-builder';

export const examRouter = createTRPCRouter({
  /**
   * Build a new exam form for a jurisdiction
   * Selects items based on blueprint weights and target difficulty
   */
  buildForm: protectedProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        name: z.string().optional(),
        targetDifficulty: z.number().min(-3).max(3).optional(), // IRT b-param
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { jurisdictionId, name, targetDifficulty } = input;

      // Verify jurisdiction exists
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

      // Build form using form-builder utility
      const form = await buildExamForm(ctx.prisma, {
        jurisdictionId,
        name: name || `Practice Exam ${new Date().toISOString().split('T')[0]}`,
        targetDifficulty: targetDifficulty || 0, // Default to medium
      });

      return form;
    }),

  /**
   * Get available exam forms for a jurisdiction
   */
  listForms: protectedProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        publishedOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.examForm.findMany({
        where: {
          jurisdictionId: input.jurisdictionId,
          ...(input.publishedOnly && { isPublished: true }),
        },
        include: {
          jurisdiction: true,
          _count: {
            select: { formItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Start an exam sitting
   * Creates ExamSitting record and enforces time limits per RuleSet
   */
  start: protectedProcedure
    .input(
      z.object({
        examFormId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { examFormId } = input;

      // Get form with jurisdiction rules
      const form = await ctx.prisma.examForm.findUnique({
        where: { id: examFormId },
        include: {
          jurisdiction: {
            include: { ruleSet: true },
          },
          formItems: {
            include: { item: true },
            orderBy: { position: 'asc' },
          },
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Exam form not found',
        });
      }

      if (!form.isPublished) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exam form is not published',
        });
      }

      // Check if user has an active sitting for this form
      const existingSitting = await ctx.prisma.examSitting.findFirst({
        where: {
          userId: ctx.user.id,
          examFormId,
          status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        },
      });

      if (existingSitting) {
        // Resume existing sitting
        return existingSitting;
      }

      // Create new sitting
      const sitting = await ctx.prisma.examSitting.create({
        data: {
          userId: ctx.user.id,
          examFormId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          timeLimitMinutes: form.jurisdiction.ruleSet.timeLimitMinutes,
        },
      });

      return sitting;
    }),

  /**
   * Get exam sitting details with items
   */
  getSitting: protectedProcedure
    .input(z.object({ sittingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sitting = await ctx.prisma.examSitting.findUnique({
        where: { id: input.sittingId },
        include: {
          examForm: {
            include: {
              jurisdiction: { include: { ruleSet: true } },
              formItems: {
                include: { item: true },
                orderBy: { position: 'asc' },
              },
            },
          },
          responses: true,
        },
      });

      if (!sitting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Exam sitting not found',
        });
      }

      // Verify ownership
      if (sitting.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this sitting',
        });
      }

      return sitting;
    }),

  /**
   * Submit answer for a question during exam
   */
  submitResponse: protectedProcedure
    .input(
      z.object({
        sittingId: z.string(),
        itemId: z.string(),
        selectedAnswer: z.enum(['A', 'B', 'C', 'D']).nullable(),
        timeSpentSeconds: z.number().optional(),
        flaggedForReview: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sittingId, itemId, selectedAnswer, timeSpentSeconds, flaggedForReview } = input;

      // Verify sitting ownership and status
      const sitting = await ctx.prisma.examSitting.findUnique({
        where: { id: sittingId },
        include: { examForm: { include: { formItems: true } } },
      });

      if (!sitting || sitting.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (sitting.status !== 'IN_PROGRESS') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exam is not in progress',
        });
      }

      // Check time limit
      if (sitting.startedAt) {
        const elapsed = Date.now() - sitting.startedAt.getTime();
        const limit = sitting.timeLimitMinutes * 60 * 1000;
        if (elapsed > limit) {
          await ctx.prisma.examSitting.update({
            where: { id: sittingId },
            data: { status: 'EXPIRED' },
          });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Time limit exceeded',
          });
        }
      }

      // Get correct answer
      const item = await ctx.prisma.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      // Upsert response
      const response = await ctx.prisma.response.upsert({
        where: {
          sittingId_itemId: { sittingId, itemId },
        },
        create: {
          sittingId,
          itemId,
          selectedAnswer,
          isCorrect: selectedAnswer === item.correctAnswer,
          timeSpentSeconds,
          flaggedForReview,
        },
        update: {
          selectedAnswer,
          isCorrect: selectedAnswer === item.correctAnswer,
          timeSpentSeconds,
          flaggedForReview,
          revisionCount: { increment: 1 },
        },
      });

      return response;
    }),

  /**
   * Submit entire exam
   * Calculates score and updates ability estimate
   */
  submit: protectedProcedure
    .input(z.object({ sittingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sittingId } = input;

      const sitting = await ctx.prisma.examSitting.findUnique({
        where: { id: sittingId },
        include: {
          responses: { include: { item: true } },
          examForm: { include: { ruleSet: true, jurisdiction: { include: { ruleSet: true } } } },
        },
      });

      if (!sitting || sitting.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (sitting.status === 'SUBMITTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Exam already submitted',
        });
      }

      // Calculate score
      const totalQuestions = sitting.responses.length;
      const correctCount = sitting.responses.filter((r) => r.isCorrect).length;
      const score = (correctCount / totalQuestions) * 100;

      const passThreshold = sitting.examForm.jurisdiction.ruleSet.passThresholdPercent;
      const passed = score >= passThreshold;

      // Update sitting
      const updated = await ctx.prisma.examSitting.update({
        where: { id: sittingId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          score,
          passed,
        },
      });

      // Update ability snapshot (IRT-lite)
      await updateAbilityEstimate(ctx.prisma, ctx.user.id, sitting.responses);

      return updated;
    }),

  /**
   * Get user's exam history
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.examSitting.findMany({
      where: {
        userId: ctx.user.id,
        status: 'SUBMITTED',
      },
      include: {
        examForm: {
          include: { jurisdiction: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });
  }),
});

/**
 * Update IRT-lite ability estimate based on responses
 */
async function updateAbilityEstimate(
  prisma: any,
  userId: string,
  responses: Array<{ isCorrect: boolean | null; item: { irtB: number | null } }>
) {
  // Simplified IRT: estimate theta based on proportion correct,
  // weighted by item difficulty (irtB)

  const validResponses = responses.filter(
    (r) => r.isCorrect !== null && r.item.irtB !== null
  );

  if (validResponses.length === 0) return;

  const correctCount = validResponses.filter((r) => r.isCorrect).length;
  const totalCount = validResponses.length;
  const proportionCorrect = correctCount / totalCount;

  // Simple theta estimate: logit(p) where p is proportion correct
  // Bounded to [-3, 3] range
  const rawTheta = Math.log(proportionCorrect / (1 - proportionCorrect));
  const theta = Math.max(-3, Math.min(3, rawTheta));

  // Standard error decreases with more items (simplified)
  const standardError = 1 / Math.sqrt(totalCount);

  await prisma.abilitySnapshot.create({
    data: {
      userId,
      theta,
      standardError,
      itemsAnswered: totalCount,
    },
  });
}
