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
import { createLogger } from '@/lib/logger';
import { withLogging } from '../utils/trpc-logger';

const logger = createLogger({ component: 'AdminRouter' });

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

      logger.info('Starting bulk item import', {
        userId: ctx.session.user.id,
        jurisdictionId,
        codeEditionId,
        itemCount: items.length,
      });

      try {
        // Bulk create items
        const created = await logger.time(
          'Bulk create items',
          () =>
            ctx.prisma.item.createMany({
              data: items.map((item) => ({
                ...item,
                jurisdictionId,
                codeEditionId,
                necArticleRefs: item.necArticleRefs,
                cecAmendmentRefs: item.cecAmendmentRefs || [],
              })),
            }),
          { action: 'importItems' }
        );

        logger.info('Successfully imported items', {
          userId: ctx.session.user.id,
          count: created.count,
          jurisdictionId,
        });

        return {
          count: created.count,
          message: `Successfully imported ${created.count} items`,
        };
      } catch (error) {
        logger.error('Failed to import items', error as Error, {
          userId: ctx.session.user.id,
          jurisdictionId,
          itemCount: items.length,
        });
        throw error;
      }
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
   * Get items for review/editing with search
   */
  listItems: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string().optional(),
        topic: z.string().optional(),
        cognitive: z.nativeEnum(CognitiveType).optional(),
        difficulty: z.nativeEnum(DifficultyLevel).optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return withLogging(
        'listItems',
        ctx.session.user.id,
        async () => {
          const { jurisdictionId, topic, cognitive, difficulty, isActive, search, limit, offset } = input;

          logger.debug('Building search query', {
            filters: { jurisdictionId, topic, cognitive, difficulty, isActive, search },
            pagination: { limit, offset },
          });

          // Build search condition
          const searchCondition = search
            ? {
                OR: [
                  { stem: { contains: search, mode: 'insensitive' as const } },
                  { optionA: { contains: search, mode: 'insensitive' as const } },
                  { optionB: { contains: search, mode: 'insensitive' as const } },
                  { optionC: { contains: search, mode: 'insensitive' as const } },
                  { optionD: { contains: search, mode: 'insensitive' as const } },
                  { explanation: { contains: search, mode: 'insensitive' as const } },
                ],
              }
            : {};

          const items = await ctx.prisma.item.findMany({
            where: {
              ...(jurisdictionId && { jurisdictionId }),
              ...(topic && { topic }),
              ...(cognitive && { cognitive }),
              ...(difficulty && { difficulty }),
              ...(isActive !== undefined && { isActive }),
              ...searchCondition,
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
              ...(jurisdictionId && { jurisdictionId }),
              ...(topic && { topic }),
              ...(cognitive && { cognitive }),
              ...(difficulty && { difficulty }),
              ...(isActive !== undefined && { isActive }),
              ...searchCondition,
            },
          });

          logger.debug('Query results', { itemsFound: items.length, total, page: Math.floor(offset / limit) + 1 });

          return { items, total };
        },
        input
      );
    }),

  /**
   * Get single item by ID
   */
  getItem: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.item.findUnique({
        where: { id: input.id },
        include: {
          jurisdiction: true,
          codeEdition: true,
          embedding: true,
          concepts: {
            include: {
              concept: true,
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Item not found',
        });
      }

      return item;
    }),

  /**
   * Create new item
   */
  createItem: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        codeEditionId: z.string(),
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
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'createItem',
        ctx.session.user.id,
        async () => {
          logger.info('Creating new item', {
            topic: input.topic,
            cognitive: input.cognitive,
            difficulty: input.difficulty,
            jurisdictionId: input.jurisdictionId,
          });

          const item = await ctx.prisma.item.create({
            data: {
              ...input,
              necArticleRefs: input.necArticleRefs,
              cecAmendmentRefs: input.cecAmendmentRefs || [],
            },
          });

          logger.info('Item created successfully', {
            itemId: item.id,
            topic: item.topic,
          });

          return item;
        },
        input
      );
    }),

  /**
   * Delete item
   */
  deleteItem: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'deleteItem',
        ctx.session.user.id,
        async () => {
          logger.warn('Deleting item', { itemId: input.id });

          // Get item details before deletion for logging
          const item = await ctx.prisma.item.findUnique({
            where: { id: input.id },
            select: { id: true, topic: true, cognitive: true, stem: true },
          });

          if (!item) {
            logger.error('Item not found for deletion', undefined, { itemId: input.id });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Item not found',
            });
          }

          await ctx.prisma.item.delete({
            where: { id: input.id },
          });

          logger.warn('Item deleted successfully', {
            itemId: input.id,
            topic: item.topic,
            stemPreview: item.stem.substring(0, 50),
          });

          return { success: true };
        },
        input
      );
    }),

  /**
   * Get unique topics across all items
   */
  getTopics: adminProcedure
    .input(z.object({ jurisdictionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.item.findMany({
        where: {
          ...(input.jurisdictionId && { jurisdictionId: input.jurisdictionId }),
          isActive: true,
        },
        select: {
          topic: true,
        },
        distinct: ['topic'],
        orderBy: {
          topic: 'asc',
        },
      });

      return items.map((item) => item.topic);
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

  /**
   * Get embedding statistics
   */
  getEmbeddingStats: adminProcedure.query(async ({ ctx }) => {
    const totalItems = await ctx.prisma.item.count({
      where: { isActive: true },
    });

    const itemsWithEmbeddings = await ctx.prisma.item.count({
      where: {
        isActive: true,
        embedding: {
          isNot: null,
        },
      },
    });

    return {
      totalItems,
      itemsWithEmbeddings,
      itemsWithoutEmbeddings: totalItems - itemsWithEmbeddings,
    };
  }),

  /**
   * Generate embeddings for items without them
   * @deprecated Use embedding.generateItemEmbeddings instead
   * Kept for backwards compatibility with existing UI
   */
  generateEmbeddings: adminProcedure
    .input(
      z.object({
        batchSize: z.number().default(50),
        itemIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'generateEmbeddings',
        ctx.session.user.id,
        async () => {
          logger.warn('Using deprecated generateEmbeddings procedure', {
            hint: 'Use embedding.generateItemEmbeddings instead',
          });

          // Redirect to new embedding router functionality
          // This is kept for backwards compatibility
          return {
            count: 0,
            message: 'Please use the new embedding router: embedding.generateItemEmbeddings',
          };
        },
        input
      );
    }),

  /**
   * Get dashboard statistics
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalItems, totalConcepts, itemsNeedingEmbeddings] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.item.count({ where: { isActive: true } }),
      ctx.prisma.concept.count({ where: { isActive: true } }),
      ctx.prisma.item.count({
        where: {
          isActive: true,
          embedding: null,
        },
      }),
    ]);

    // Get activity stats from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeUsers30d, examsCompleted30d, drillsCompleted30d] = await Promise.all([
      ctx.prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      ctx.prisma.examAttempt.count({
        where: {
          startedAt: {
            gte: thirtyDaysAgo,
          },
          status: 'COMPLETED',
        },
      }),
      ctx.prisma.drillSession.count({
        where: {
          startedAt: {
            gte: thirtyDaysAgo,
          },
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalUsers,
      totalItems,
      totalConcepts,
      totalPaths: 0, // Will be implemented when learning paths are built
      itemsNeedingEmbeddings,
      activeUsers30d,
      examsCompleted30d,
      drillsCompleted30d,
    };
  }),
});
