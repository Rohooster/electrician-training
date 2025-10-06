/**
 * Admin Router
 *
 * Content management for items, templates, and rules.
 * Admin-only procedures for seeding and updating exam content.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../trpc';
import { CognitiveType, DifficultyLevel } from '@prisma/client';

export const adminRouter = createTRPCRouter({
  /**
   * Import items from JSON/CSV
   */
  importItems: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        codeEditionId: z.string(),
        items: z.array(
          z.object({
            stem: z.string(),
            optionA: z.string(),
            optionB: z.string(),
            optionC: z.string(),
            optionD: z.string(),
            correctAnswer: z.enum(['A', 'B', 'C', 'D']),
            explanation: z.string().optional(),
            vendorStyle: z.string().default('PSI'),
            topic: z.string(),
            cognitive: z.nativeEnum(CognitiveType),
            difficulty: z.nativeEnum(DifficultyLevel).default('MEDIUM'),
            necArticleRefs: z.array(z.string()),
            cecAmendmentRefs: z.array(z.string()).optional(),
            irtA: z.number().optional(),
            irtB: z.number().optional(),
            irtC: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { jurisdictionId, codeEditionId, items } = input;

      // Bulk create items
      const created = await ctx.prisma.item.createMany({
        data: items.map((item) => ({
          ...item,
          jurisdictionId,
          codeEditionId,
          necArticleRefs: item.necArticleRefs,
          cecAmendmentRefs: item.cecAmendmentRefs || [],
        })),
      });

      return {
        count: created.count,
        message: `Successfully imported ${created.count} items`,
      };
    }),

  /**
   * Update single item
   */
  updateItem: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          stem: z.string().optional(),
          optionA: z.string().optional(),
          optionB: z.string().optional(),
          optionC: z.string().optional(),
          optionD: z.string().optional(),
          correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
          explanation: z.string().optional(),
          topic: z.string().optional(),
          cognitive: z.nativeEnum(CognitiveType).optional(),
          difficulty: z.nativeEnum(DifficultyLevel).optional(),
          necArticleRefs: z.array(z.string()).optional(),
          cecAmendmentRefs: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const updated = await ctx.prisma.item.update({
        where: { id },
        data,
      });

      return updated;
    }),

  /**
   * Bulk retag items (useful when code edition changes)
   */
  bulkRetag: adminProcedure
    .input(
      z.object({
        itemIds: z.array(z.string()),
        necArticleRefs: z.array(z.string()).optional(),
        cecAmendmentRefs: z.array(z.string()).optional(),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { itemIds, necArticleRefs, cecAmendmentRefs, topic } = input;

      const updated = await ctx.prisma.item.updateMany({
        where: { id: { in: itemIds } },
        data: {
          ...(necArticleRefs && { necArticleRefs }),
          ...(cecAmendmentRefs && { cecAmendmentRefs }),
          ...(topic && { topic }),
        },
      });

      return {
        count: updated.count,
        message: `Updated ${updated.count} items`,
      };
    }),

  /**
   * Update jurisdiction rules
   */
  updateRules: adminProcedure
    .input(
      z.object({
        ruleSetId: z.string(),
        data: z.object({
          questionCount: z.number().optional(),
          timeLimitMinutes: z.number().optional(),
          passThresholdPercent: z.number().optional(),
          allowedCodeBooks: z.array(z.string()).optional(),
          allowedCalculator: z.boolean().optional(),
          allowTabbing: z.boolean().optional(),
          allowHighlighting: z.boolean().optional(),
          retakeWaitDays: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ruleSetId, data } = input;

      const updated = await ctx.prisma.ruleSet.update({
        where: { id: ruleSetId },
        data,
      });

      return updated;
    }),

  /**
   * Get items for review/editing
   */
  listItems: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        topic: z.string().optional(),
        cognitive: z.nativeEnum(CognitiveType).optional(),
        isActive: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { jurisdictionId, topic, cognitive, isActive, limit, offset } = input;

      const items = await ctx.prisma.item.findMany({
        where: {
          jurisdictionId,
          ...(topic && { topic }),
          ...(cognitive && { cognitive }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          jurisdiction: true,
          codeEdition: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await ctx.prisma.item.count({
        where: {
          jurisdictionId,
          ...(topic && { topic }),
          ...(cognitive && { cognitive }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return { items, total };
    }),

  /**
   * Get item statistics by topic
   */
  getItemStats: adminProcedure
    .input(z.object({ jurisdictionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.item.groupBy({
        by: ['topic', 'cognitive', 'difficulty'],
        where: {
          jurisdictionId: input.jurisdictionId,
          isActive: true,
        },
        _count: true,
      });

      return items;
    }),
});
