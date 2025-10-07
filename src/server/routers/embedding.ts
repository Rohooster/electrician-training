/**
 * Embedding Router
 *
 * Procedures for generating and managing OpenAI embeddings for items and concepts.
 * Includes batch processing, progress tracking, and quality monitoring.
 */

import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { createTRPCRouter, adminProcedure } from '../trpc';
import { createLogger } from '@/lib/logger';
import { withLogging } from '../utils/trpc-logger';
import {
  generateItemEmbedding,
  generateItemEmbeddingsBatch,
  generateConceptEmbedding,
  generateConceptEmbeddingsBatch,
  findItemsWithoutEmbeddings,
  findConceptsWithoutEmbeddings,
  type BatchEmbeddingResult,
} from '@/lib/embedding-service';
import { testConnection } from '@/lib/openai-client';
import {
  findSimilarItems,
  findSimilarConcepts,
  findItemsForConcept,
  findConceptsForItem,
} from '@/lib/similarity-service';

const logger = createLogger({ component: 'EmbeddingRouter' });

// Event emitter for progress tracking
const progressEmitter = new EventEmitter();

export const embeddingRouter = createTRPCRouter({
  /**
   * Test OpenAI API connection
   */
  testConnection: adminProcedure.query(async () => {
    return withLogging('testConnection', 'system', async () => {
      logger.info('Testing OpenAI API connection');

      const result = await testConnection();

      if (result.success) {
        logger.info('OpenAI connection successful', {
          model: result.model,
          latency: `${result.latency}ms`,
        });
      } else {
        logger.error('OpenAI connection failed', undefined, {
          error: result.error,
        });
      }

      return result;
    });
  }),

  /**
   * Get embedding statistics
   */
  getStats: adminProcedure
    .input(z.object({
      jurisdictionId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('getEmbeddingStats', ctx.session.user.id, async () => {
        logger.debug('Fetching embedding statistics', { jurisdictionId: input.jurisdictionId });

        const where = input.jurisdictionId ? { jurisdictionId: input.jurisdictionId } : {};

        // Item statistics
        const [
          totalItems,
          itemsWithEmbeddings,
          totalConcepts,
          conceptsWithEmbeddings,
        ] = await Promise.all([
          ctx.prisma.item.count({ where: { ...where, isActive: true } }),
          ctx.prisma.itemEmbedding.count({
            where: {
              item: { ...where, isActive: true },
            },
          }),
          ctx.prisma.concept.count({ where: { ...where, isActive: true } }),
          ctx.prisma.concept.count({
            where: {
              ...where,
              isActive: true,
              embedding: { not: null },
            },
          }),
        ]);

        const stats = {
          items: {
            total: totalItems,
            withEmbeddings: itemsWithEmbeddings,
            withoutEmbeddings: totalItems - itemsWithEmbeddings,
            coverage: totalItems > 0 ? (itemsWithEmbeddings / totalItems) * 100 : 0,
          },
          concepts: {
            total: totalConcepts,
            withEmbeddings: conceptsWithEmbeddings,
            withoutEmbeddings: totalConcepts - conceptsWithEmbeddings,
            coverage: totalConcepts > 0 ? (conceptsWithEmbeddings / totalConcepts) * 100 : 0,
          },
        };

        logger.debug('Embedding statistics calculated', stats);
        return stats;
      }, input);
    }),

  /**
   * Find items without embeddings
   */
  findItemsWithoutEmbeddings: adminProcedure
    .input(z.object({
      jurisdictionId: z.string().optional(),
      topic: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findItemsWithoutEmbeddings', ctx.session.user.id, async () => {
        const itemIds = await findItemsWithoutEmbeddings(ctx.prisma, {
          jurisdictionId: input.jurisdictionId,
          topic: input.topic,
          limit: input.limit,
        });

        logger.info('Found items without embeddings', {
          count: itemIds.length,
          jurisdictionId: input.jurisdictionId,
          topic: input.topic,
        });

        return { itemIds, count: itemIds.length };
      }, input);
    }),

  /**
   * Find concepts without embeddings
   */
  findConceptsWithoutEmbeddings: adminProcedure
    .input(z.object({
      jurisdictionId: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findConceptsWithoutEmbeddings', ctx.session.user.id, async () => {
        const conceptIds = await findConceptsWithoutEmbeddings(ctx.prisma, {
          jurisdictionId: input.jurisdictionId,
          category: input.category,
          limit: input.limit,
        });

        logger.info('Found concepts without embeddings', {
          count: conceptIds.length,
          jurisdictionId: input.jurisdictionId,
          category: input.category,
        });

        return { conceptIds, count: conceptIds.length };
      }, input);
    }),

  /**
   * Generate item embeddings (batch)
   */
  generateItemEmbeddings: adminProcedure
    .input(z.object({
      itemIds: z.array(z.string()).optional(),
      jurisdictionId: z.string().optional(),
      topic: z.string().optional(),
      limit: z.number().default(100),
      model: z.enum(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']).default('text-embedding-3-small'),
    }))
    .mutation(async ({ ctx, input }) => {
      return withLogging('generateItemEmbeddings', ctx.session.user.id, async () => {
        logger.info('Starting item embedding generation', {
          userId: ctx.session.user.id,
          itemIds: input.itemIds?.length || 'auto-detect',
          model: input.model,
        });

        // Get item IDs if not provided
        let itemIds = input.itemIds;
        if (!itemIds || itemIds.length === 0) {
          itemIds = await findItemsWithoutEmbeddings(ctx.prisma, {
            jurisdictionId: input.jurisdictionId,
            topic: input.topic,
            limit: input.limit,
          });

          if (itemIds.length === 0) {
            logger.info('No items need embeddings');
            return {
              successful: [],
              failed: [],
              totalTokens: 0,
              totalCost: 0,
              duration: 0,
              message: 'No items need embeddings',
            };
          }
        }

        logger.info(`Generating embeddings for ${itemIds.length} items`, {
          model: input.model,
        });

        // Generate embeddings with progress tracking
        const result = await generateItemEmbeddingsBatch(
          ctx.prisma,
          itemIds,
          input.model,
          (completed, total) => {
            progressEmitter.emit('progress', {
              type: 'items',
              completed,
              total,
              percent: Math.round((completed / total) * 100),
            });
          }
        );

        logger.info('Item embedding generation complete', {
          successful: result.successful.length,
          failed: result.failed.length,
          totalTokens: result.totalTokens,
          totalCost: `$${result.totalCost.toFixed(6)}`,
          duration: `${result.duration}ms`,
        });

        return {
          ...result,
          message: `Generated ${result.successful.length} embeddings (${result.failed.length} failed)`,
        };
      }, input);
    }),

  /**
   * Generate concept embeddings (batch)
   */
  generateConceptEmbeddings: adminProcedure
    .input(z.object({
      conceptIds: z.array(z.string()).optional(),
      jurisdictionId: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(100),
      model: z.enum(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']).default('text-embedding-3-small'),
    }))
    .mutation(async ({ ctx, input }) => {
      return withLogging('generateConceptEmbeddings', ctx.session.user.id, async () => {
        logger.info('Starting concept embedding generation', {
          userId: ctx.session.user.id,
          conceptIds: input.conceptIds?.length || 'auto-detect',
          model: input.model,
        });

        // Get concept IDs if not provided
        let conceptIds = input.conceptIds;
        if (!conceptIds || conceptIds.length === 0) {
          conceptIds = await findConceptsWithoutEmbeddings(ctx.prisma, {
            jurisdictionId: input.jurisdictionId,
            category: input.category,
            limit: input.limit,
          });

          if (conceptIds.length === 0) {
            logger.info('No concepts need embeddings');
            return {
              successful: [],
              failed: [],
              totalTokens: 0,
              totalCost: 0,
              duration: 0,
              message: 'No concepts need embeddings',
            };
          }
        }

        logger.info(`Generating embeddings for ${conceptIds.length} concepts`, {
          model: input.model,
        });

        // Generate embeddings with progress tracking
        const result = await generateConceptEmbeddingsBatch(
          ctx.prisma,
          conceptIds,
          input.model,
          (completed, total) => {
            progressEmitter.emit('progress', {
              type: 'concepts',
              completed,
              total,
              percent: Math.round((completed / total) * 100),
            });
          }
        );

        logger.info('Concept embedding generation complete', {
          successful: result.successful.length,
          failed: result.failed.length,
          totalTokens: result.totalTokens,
          totalCost: `$${result.totalCost.toFixed(6)}`,
          duration: `${result.duration}ms`,
        });

        return {
          ...result,
          message: `Generated ${result.successful.length} embeddings (${result.failed.length} failed)`,
        };
      }, input);
    }),

  /**
   * Regenerate single item embedding
   */
  regenerateItemEmbedding: adminProcedure
    .input(z.object({
      itemId: z.string(),
      model: z.enum(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']).default('text-embedding-3-small'),
    }))
    .mutation(async ({ ctx, input }) => {
      return withLogging('regenerateItemEmbedding', ctx.session.user.id, async () => {
        logger.info('Regenerating item embedding', {
          itemId: input.itemId,
          model: input.model,
        });

        const result = await generateItemEmbedding(ctx.prisma, input.itemId, input.model);

        logger.info('Item embedding regenerated', {
          itemId: result.id,
          tokens: result.tokens,
          cost: `$${result.cost.toFixed(6)}`,
        });

        return result;
      }, input);
    }),

  /**
   * Regenerate single concept embedding
   */
  regenerateConceptEmbedding: adminProcedure
    .input(z.object({
      conceptId: z.string(),
      model: z.enum(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']).default('text-embedding-3-small'),
    }))
    .mutation(async ({ ctx, input }) => {
      return withLogging('regenerateConceptEmbedding', ctx.session.user.id, async () => {
        logger.info('Regenerating concept embedding', {
          conceptId: input.conceptId,
          model: input.model,
        });

        const result = await generateConceptEmbedding(ctx.prisma, input.conceptId, input.model);

        logger.info('Concept embedding regenerated', {
          conceptId: result.id,
          tokens: result.tokens,
          cost: `$${result.cost.toFixed(6)}`,
        });

        return result;
      }, input);
    }),

  /**
   * Find similar items
   */
  findSimilarItems: adminProcedure
    .input(z.object({
      itemId: z.string(),
      limit: z.number().default(10),
      minSimilarity: z.number().default(0.5),
      jurisdictionId: z.string().optional(),
      topic: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findSimilarItems', ctx.session.user.id, async () => {
        logger.info('Finding similar items', {
          itemId: input.itemId,
          limit: input.limit,
        });

        const results = await findSimilarItems(ctx.prisma, input.itemId, {
          limit: input.limit,
          minSimilarity: input.minSimilarity,
          jurisdictionId: input.jurisdictionId,
          topic: input.topic,
        });

        logger.info('Similar items found', {
          itemId: input.itemId,
          resultsCount: results.length,
        });

        return results;
      }, input);
    }),

  /**
   * Find similar concepts
   */
  findSimilarConcepts: adminProcedure
    .input(z.object({
      conceptId: z.string(),
      limit: z.number().default(10),
      minSimilarity: z.number().default(0.5),
      jurisdictionId: z.string().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findSimilarConcepts', ctx.session.user.id, async () => {
        logger.info('Finding similar concepts', {
          conceptId: input.conceptId,
          limit: input.limit,
        });

        const results = await findSimilarConcepts(ctx.prisma, input.conceptId, {
          limit: input.limit,
          minSimilarity: input.minSimilarity,
          jurisdictionId: input.jurisdictionId,
          category: input.category,
        });

        logger.info('Similar concepts found', {
          conceptId: input.conceptId,
          resultsCount: results.length,
        });

        return results;
      }, input);
    }),

  /**
   * Find items for concept (personalized learning)
   */
  findItemsForConcept: adminProcedure
    .input(z.object({
      conceptId: z.string(),
      limit: z.number().default(20),
      minSimilarity: z.number().default(0.6),
      jurisdictionId: z.string().optional(),
      topic: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findItemsForConcept', ctx.session.user.id, async () => {
        logger.info('Finding items for concept', {
          conceptId: input.conceptId,
          limit: input.limit,
        });

        const results = await findItemsForConcept(ctx.prisma, input.conceptId, {
          limit: input.limit,
          minSimilarity: input.minSimilarity,
          jurisdictionId: input.jurisdictionId,
          topic: input.topic,
        });

        logger.info('Items found for concept', {
          conceptId: input.conceptId,
          resultsCount: results.length,
        });

        return results;
      }, input);
    }),

  /**
   * Find concepts for item (auto-tagging suggestions)
   */
  findConceptsForItem: adminProcedure
    .input(z.object({
      itemId: z.string(),
      limit: z.number().default(5),
      minSimilarity: z.number().default(0.65),
      jurisdictionId: z.string().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return withLogging('findConceptsForItem', ctx.session.user.id, async () => {
        logger.info('Finding concepts for item', {
          itemId: input.itemId,
          limit: input.limit,
        });

        const results = await findConceptsForItem(ctx.prisma, input.itemId, {
          limit: input.limit,
          minSimilarity: input.minSimilarity,
          jurisdictionId: input.jurisdictionId,
          category: input.category,
        });

        logger.info('Concepts found for item', {
          itemId: input.itemId,
          resultsCount: results.length,
        });

        return results;
      }, input);
    }),

  /**
   * Subscribe to embedding generation progress
   */
  onProgress: adminProcedure.subscription(() => {
    return observable<{
      type: 'items' | 'concepts';
      completed: number;
      total: number;
      percent: number;
    }>((emit) => {
      const onProgress = (data: any) => {
        emit.next(data);
      };

      progressEmitter.on('progress', onProgress);

      return () => {
        progressEmitter.off('progress', onProgress);
      };
    });
  }),
});
