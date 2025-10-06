/**
 * Calculation Router
 *
 * Generates and executes parametric electrical calculations.
 * All calcs cite NEC articles and show step-by-step solutions.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { generateCalculation } from '@/lib/calc/calc-engine';

export const calcRouter = createTRPCRouter({
  /**
   * List available calculation templates
   */
  listTemplates: publicProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.calcTemplate.findMany({
        where: {
          jurisdictionId: input.jurisdictionId,
          ...(input.category && { category: input.category }),
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    }),

  /**
   * Generate a calculation problem with solution
   */
  generate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        seed: z.number().optional(), // For deterministic generation
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { templateId, seed } = input;

      const template = await ctx.prisma.calcTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Generate calculation using template
      const result = generateCalculation(template, seed);

      return result;
    }),

  /**
   * Validate user's calculation answer
   */
  validate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        seed: z.number(),
        userAnswer: z.number(),
        tolerance: z.number().default(0.01), // 1% tolerance
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { templateId, seed, userAnswer, tolerance } = input;

      const template = await ctx.prisma.calcTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Regenerate to get correct answer
      const result = generateCalculation(template, seed);

      const correctAnswer = result.finalAnswer;
      const diff = Math.abs(userAnswer - correctAnswer);
      const percentDiff = diff / correctAnswer;

      const isCorrect = percentDiff <= tolerance;

      return {
        isCorrect,
        userAnswer,
        correctAnswer,
        percentDiff: percentDiff * 100,
        explanation: result.steps,
      };
    }),

  /**
   * Get calc practice history
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    // This would require a CalcAttempt model, simplified for now
    return [];
  }),
});
