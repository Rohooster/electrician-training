/**
 * Concept Router
 *
 * Manages learning concepts - the foundation of personalized learning.
 * Handles CRUD, prerequisites (DAG), item linking, and graph operations.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, adminProcedure } from '../trpc';
import { DifficultyLevel } from '@prisma/client';
import { createLogger } from '@/lib/logger';
import { withLogging } from '../utils/trpc-logger';
import {
  wouldCreateCycle,
  getPrerequisiteChain,
  topologicalSort,
  validateGraph,
  toVisualizationFormat,
  ConceptNode,
} from '@/lib/concept-graph';

const logger = createLogger({ component: 'ConceptRouter' });

export const conceptRouter = createTRPCRouter({
  /**
   * List concepts with filters and pagination
   */
  listConcepts: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.nativeEnum(DifficultyLevel).optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
        hasItems: z.boolean().optional(), // Filter by concepts with/without items
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return withLogging(
        'listConcepts',
        ctx.session.user.id,
        async () => {
          const { jurisdictionId, category, difficulty, isActive, search, hasItems, limit, offset } = input;

          logger.debug('Building concept query', {
            filters: { jurisdictionId, category, difficulty, isActive, search, hasItems },
            pagination: { limit, offset },
          });

          // Build search condition
          const searchCondition = search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { slug: { contains: search, mode: 'insensitive' as const } },
                  { description: { contains: search, mode: 'insensitive' as const } },
                ],
              }
            : {};

          // Build hasItems filter
          const hasItemsCondition = hasItems !== undefined
            ? hasItems
              ? { items: { some: {} } }
              : { items: { none: {} } }
            : {};

          const concepts = await ctx.prisma.concept.findMany({
            where: {
              ...(jurisdictionId && { jurisdictionId }),
              ...(category && { category }),
              ...(difficulty && { difficultyLevel: difficulty }),
              ...(isActive !== undefined && { isActive }),
              ...searchCondition,
              ...hasItemsCondition,
            },
            include: {
              jurisdiction: true,
              _count: {
                select: {
                  items: true,
                  prerequisites: true,
                  dependents: true,
                },
              },
            },
            orderBy: { name: 'asc' },
            take: limit,
            skip: offset,
          });

          const total = await ctx.prisma.concept.count({
            where: {
              ...(jurisdictionId && { jurisdictionId }),
              ...(category && { category }),
              ...(difficulty && { difficultyLevel: difficulty }),
              ...(isActive !== undefined && { isActive }),
              ...searchCondition,
              ...hasItemsCondition,
            },
          });

          logger.debug('Query results', { conceptsFound: concepts.length, total });

          return { concepts, total };
        },
        input
      );
    }),

  /**
   * Get single concept with full details
   */
  getConcept: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return withLogging(
        'getConcept',
        ctx.session.user.id,
        async () => {
          const concept = await ctx.prisma.concept.findUnique({
            where: { id: input.id },
            include: {
              jurisdiction: true,
              items: {
                include: {
                  item: {
                    select: {
                      id: true,
                      stem: true,
                      topic: true,
                      cognitive: true,
                      difficulty: true,
                      necArticleRefs: true,
                    },
                  },
                },
              },
              prerequisites: {
                include: {
                  prerequisite: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
              dependents: {
                include: {
                  concept: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
            },
          });

          if (!concept) {
            logger.error('Concept not found', undefined, { conceptId: input.id });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Concept not found',
            });
          }

          logger.debug('Concept retrieved', {
            conceptId: concept.id,
            slug: concept.slug,
            itemCount: concept.items.length,
            prerequisiteCount: concept.prerequisites.length,
          });

          return concept;
        },
        input
      );
    }),

  /**
   * Create new concept
   */
  createConcept: adminProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
        name: z.string().min(3).max(200),
        description: z.string().min(10),
        necArticleRefs: z.array(z.string()),
        category: z.string(),
        difficultyLevel: z.nativeEnum(DifficultyLevel).default('MEDIUM'),
        estimatedMinutes: z.number().min(5).max(180).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'createConcept',
        ctx.session.user.id,
        async () => {
          logger.info('Creating new concept', {
            slug: input.slug,
            name: input.name,
            category: input.category,
          });

          // Check for duplicate slug
          const existing = await ctx.prisma.concept.findUnique({
            where: { slug: input.slug },
          });

          if (existing) {
            logger.warn('Duplicate slug detected', { slug: input.slug });
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Concept with slug "${input.slug}" already exists`,
            });
          }

          const concept = await ctx.prisma.concept.create({
            data: {
              ...input,
              necArticleRefs: input.necArticleRefs,
            },
          });

          logger.info('Concept created successfully', {
            conceptId: concept.id,
            slug: concept.slug,
          });

          return concept;
        },
        input
      );
    }),

  /**
   * Update concept
   */
  updateConcept: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
          name: z.string().min(3).max(200).optional(),
          description: z.string().min(10).optional(),
          necArticleRefs: z.array(z.string()).optional(),
          category: z.string().optional(),
          difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
          estimatedMinutes: z.number().min(5).max(180).optional(),
          isActive: z.boolean().optional(),
          embedding: z.any().optional(), // JSON array of numbers
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'updateConcept',
        ctx.session.user.id,
        async () => {
          logger.info('Updating concept', { conceptId: input.id });

          // If slug is being changed, check for duplicates
          if (input.data.slug) {
            const existing = await ctx.prisma.concept.findFirst({
              where: {
                slug: input.data.slug,
                NOT: { id: input.id },
              },
            });

            if (existing) {
              logger.warn('Duplicate slug in update', { slug: input.data.slug });
              throw new TRPCError({
                code: 'CONFLICT',
                message: `Concept with slug "${input.data.slug}" already exists`,
              });
            }
          }

          const updated = await ctx.prisma.concept.update({
            where: { id: input.id },
            data: input.data,
          });

          logger.info('Concept updated successfully', {
            conceptId: updated.id,
            slug: updated.slug,
          });

          return updated;
        },
        input
      );
    }),

  /**
   * Delete concept (with safety checks)
   */
  deleteConcept: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'deleteConcept',
        ctx.session.user.id,
        async () => {
          logger.warn('Deleting concept', { conceptId: input.id });

          // Check if concept is used in active learning paths
          const activePaths = await ctx.prisma.learningPath.count({
            where: {
              status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
              steps: {
                some: {
                  conceptId: input.id,
                },
              },
            },
          });

          if (activePaths > 0) {
            logger.error('Cannot delete concept - used in active paths', undefined, {
              conceptId: input.id,
              activePathCount: activePaths,
            });
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: `Cannot delete concept - it is used in ${activePaths} active learning path(s)`,
            });
          }

          // Get concept details for logging
          const concept = await ctx.prisma.concept.findUnique({
            where: { id: input.id },
            select: { id: true, slug: true, name: true },
          });

          if (!concept) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Concept not found',
            });
          }

          // Delete (cascade will handle prerequisites and item links)
          await ctx.prisma.concept.delete({
            where: { id: input.id },
          });

          logger.warn('Concept deleted successfully', {
            conceptId: input.id,
            slug: concept.slug,
          });

          return { success: true };
        },
        input
      );
    }),

  /**
   * Add prerequisite relationship with cycle detection
   */
  addPrerequisite: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        prerequisiteId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'addPrerequisite',
        ctx.session.user.id,
        async () => {
          const { conceptId, prerequisiteId } = input;

          logger.info('Adding prerequisite', { conceptId, prerequisiteId });

          // Fetch all concepts for cycle detection
          const allConcepts = await ctx.prisma.concept.findMany({
            select: {
              id: true,
              slug: true,
              name: true,
              prerequisites: {
                select: {
                  prerequisiteId: true,
                },
              },
            },
          });

          // Convert to graph format
          const conceptNodes: ConceptNode[] = allConcepts.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            prerequisites: c.prerequisites.map(p => p.prerequisiteId),
          }));

          // Check for cycles
          if (wouldCreateCycle(conceptId, prerequisiteId, conceptNodes)) {
            logger.error('Cycle detected - cannot add prerequisite', undefined, {
              conceptId,
              prerequisiteId,
            });
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: 'Cannot add prerequisite - would create circular dependency',
            });
          }

          // Check if relationship already exists
          const existing = await ctx.prisma.conceptPrerequisite.findFirst({
            where: {
              conceptId,
              prerequisiteId,
            },
          });

          if (existing) {
            logger.warn('Prerequisite relationship already exists', { conceptId, prerequisiteId });
            return existing;
          }

          // Create relationship
          const prerequisite = await ctx.prisma.conceptPrerequisite.create({
            data: {
              conceptId,
              prerequisiteId,
            },
          });

          logger.info('Prerequisite added successfully', {
            conceptId,
            prerequisiteId,
            relationshipId: prerequisite.id,
          });

          return prerequisite;
        },
        input
      );
    }),

  /**
   * Remove prerequisite relationship
   */
  removePrerequisite: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        prerequisiteId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'removePrerequisite',
        ctx.session.user.id,
        async () => {
          logger.info('Removing prerequisite', input);

          await ctx.prisma.conceptPrerequisite.deleteMany({
            where: {
              conceptId: input.conceptId,
              prerequisiteId: input.prerequisiteId,
            },
          });

          logger.info('Prerequisite removed successfully', input);

          return { success: true };
        },
        input
      );
    }),

  /**
   * Get full prerequisite chain for a concept (topologically sorted)
   */
  getPrerequisiteChain: adminProcedure
    .input(z.object({ conceptId: z.string() }))
    .query(async ({ ctx, input }) => {
      return withLogging(
        'getPrerequisiteChain',
        ctx.session.user.id,
        async () => {
          logger.debug('Computing prerequisite chain', input);

          const allConcepts = await ctx.prisma.concept.findMany({
            select: {
              id: true,
              slug: true,
              name: true,
              category: true,
              difficultyLevel: true,
              prerequisites: {
                select: {
                  prerequisiteId: true,
                },
              },
            },
          });

          const conceptNodes: ConceptNode[] = allConcepts.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            prerequisites: c.prerequisites.map(p => p.prerequisiteId),
          }));

          const chain = getPrerequisiteChain(input.conceptId, conceptNodes);

          logger.debug('Prerequisite chain computed', {
            conceptId: input.conceptId,
            chainLength: chain.length,
          });

          // Map back to full concept data
          const conceptMap = new Map(allConcepts.map(c => [c.id, c]));
          const fullChain = chain.map(node => conceptMap.get(node.id)!).filter(Boolean);

          return fullChain;
        },
        input
      );
    }),

  /**
   * Link items to concept
   */
  linkItems: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        itemIds: z.array(z.string()),
        isPrimary: z.boolean().default(true),
        weight: z.number().min(0).max(1).default(1.0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'linkItems',
        ctx.session.user.id,
        async () => {
          const { conceptId, itemIds, isPrimary, weight } = input;

          logger.info('Linking items to concept', {
            conceptId,
            itemCount: itemIds.length,
            isPrimary,
            weight,
          });

          // Create links (skip duplicates)
          const links = await Promise.all(
            itemIds.map(itemId =>
              ctx.prisma.conceptItem.upsert({
                where: {
                  conceptId_itemId: {
                    conceptId,
                    itemId,
                  },
                },
                create: {
                  conceptId,
                  itemId,
                  isPrimary,
                  weight,
                },
                update: {
                  isPrimary,
                  weight,
                },
              })
            )
          );

          logger.info('Items linked successfully', {
            conceptId,
            linkedCount: links.length,
          });

          return { count: links.length };
        },
        input
      );
    }),

  /**
   * Unlink items from concept
   */
  unlinkItems: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        itemIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'unlinkItems',
        ctx.session.user.id,
        async () => {
          logger.info('Unlinking items from concept', input);

          const deleted = await ctx.prisma.conceptItem.deleteMany({
            where: {
              conceptId: input.conceptId,
              itemId: { in: input.itemIds },
            },
          });

          logger.info('Items unlinked successfully', {
            conceptId: input.conceptId,
            unlinkedCount: deleted.count,
          });

          return { count: deleted.count };
        },
        input
      );
    }),

  /**
   * Bulk tag items by topic
   */
  bulkTagByTopic: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        topic: z.string(),
        isPrimary: z.boolean().default(true),
        weight: z.number().min(0).max(1).default(1.0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'bulkTagByTopic',
        ctx.session.user.id,
        async () => {
          logger.info('Bulk tagging by topic', {
            conceptId: input.conceptId,
            topic: input.topic,
          });

          // Find all items with this topic
          const items = await ctx.prisma.item.findMany({
            where: {
              topic: input.topic,
              isActive: true,
            },
            select: { id: true },
          });

          logger.debug('Found items for topic', {
            topic: input.topic,
            itemCount: items.length,
          });

          // Link them
          const links = await Promise.all(
            items.map(item =>
              ctx.prisma.conceptItem.upsert({
                where: {
                  conceptId_itemId: {
                    conceptId: input.conceptId,
                    itemId: item.id,
                  },
                },
                create: {
                  conceptId: input.conceptId,
                  itemId: item.id,
                  isPrimary: input.isPrimary,
                  weight: input.weight,
                },
                update: {
                  isPrimary: input.isPrimary,
                  weight: input.weight,
                },
              })
            )
          );

          logger.info('Bulk tag by topic completed', {
            conceptId: input.conceptId,
            topic: input.topic,
            linkedCount: links.length,
          });

          return { count: links.length };
        },
        input
      );
    }),

  /**
   * Bulk tag items by NEC article
   */
  bulkTagByNEC: adminProcedure
    .input(
      z.object({
        conceptId: z.string(),
        necArticle: z.string(),
        isPrimary: z.boolean().default(true),
        weight: z.number().min(0).max(1).default(1.0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'bulkTagByNEC',
        ctx.session.user.id,
        async () => {
          logger.info('Bulk tagging by NEC article', {
            conceptId: input.conceptId,
            necArticle: input.necArticle,
          });

          // Find all items that reference this NEC article
          const items = await ctx.prisma.item.findMany({
            where: {
              isActive: true,
              necArticleRefs: {
                hasSome: [input.necArticle],
              },
            },
            select: { id: true },
          });

          logger.debug('Found items for NEC article', {
            necArticle: input.necArticle,
            itemCount: items.length,
          });

          // Link them
          const links = await Promise.all(
            items.map(item =>
              ctx.prisma.conceptItem.upsert({
                where: {
                  conceptId_itemId: {
                    conceptId: input.conceptId,
                    itemId: item.id,
                  },
                },
                create: {
                  conceptId: input.conceptId,
                  itemId: item.id,
                  isPrimary: input.isPrimary,
                  weight: input.weight,
                },
                update: {
                  isPrimary: input.isPrimary,
                  weight: input.weight,
                },
              })
            )
          );

          logger.info('Bulk tag by NEC completed', {
            conceptId: input.conceptId,
            necArticle: input.necArticle,
            linkedCount: links.length,
          });

          return { count: links.length };
        },
        input
      );
    }),

  /**
   * Get concept graph for visualization
   */
  getConceptGraph: adminProcedure
    .input(z.object({ jurisdictionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return withLogging(
        'getConceptGraph',
        ctx.session.user.id,
        async () => {
          logger.debug('Fetching concept graph', input);

          const concepts = await ctx.prisma.concept.findMany({
            where: {
              jurisdictionId: input.jurisdictionId,
              isActive: true,
            },
            select: {
              id: true,
              slug: true,
              name: true,
              category: true,
              difficultyLevel: true,
              prerequisites: {
                select: {
                  prerequisiteId: true,
                },
              },
            },
          });

          const conceptNodes: ConceptNode[] = concepts.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            prerequisites: c.prerequisites.map(p => p.prerequisiteId),
          }));

          const graph = toVisualizationFormat(conceptNodes);

          // Add metadata
          const enrichedNodes = graph.nodes.map(node => {
            const concept = concepts.find(c => c.id === node.id);
            return {
              ...node,
              category: concept?.category,
              difficulty: concept?.difficultyLevel,
            };
          });

          logger.debug('Concept graph generated', {
            nodeCount: enrichedNodes.length,
            edgeCount: graph.edges.length,
          });

          return {
            nodes: enrichedNodes,
            edges: graph.edges,
          };
        },
        input
      );
    }),

  /**
   * Validate concept graph
   */
  validateConceptGraph: adminProcedure
    .input(z.object({ jurisdictionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return withLogging(
        'validateConceptGraph',
        ctx.session.user.id,
        async () => {
          logger.info('Validating concept graph', input);

          const concepts = await ctx.prisma.concept.findMany({
            where: {
              jurisdictionId: input.jurisdictionId,
            },
            select: {
              id: true,
              slug: true,
              name: true,
              prerequisites: {
                select: {
                  prerequisiteId: true,
                },
              },
            },
          });

          const conceptNodes: ConceptNode[] = concepts.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            prerequisites: c.prerequisites.map(p => p.prerequisiteId),
          }));

          const validation = validateGraph(conceptNodes);

          logger.info('Graph validation complete', {
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
          });

          return validation;
        },
        input
      );
    }),

  /**
   * Get concept statistics
   */
  getConceptStats: adminProcedure
    .input(z.object({ jurisdictionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return withLogging(
        'getConceptStats',
        ctx.session.user.id,
        async () => {
          const [
            totalConcepts,
            activeConcepts,
            conceptsWithItems,
            conceptsWithEmbeddings,
            conceptsWithPrerequisites,
          ] = await Promise.all([
            ctx.prisma.concept.count({
              where: { jurisdictionId: input.jurisdictionId },
            }),
            ctx.prisma.concept.count({
              where: { jurisdictionId: input.jurisdictionId, isActive: true },
            }),
            ctx.prisma.concept.count({
              where: {
                jurisdictionId: input.jurisdictionId,
                items: { some: {} },
              },
            }),
            ctx.prisma.concept.count({
              where: {
                jurisdictionId: input.jurisdictionId,
                embedding: { not: null },
              },
            }),
            ctx.prisma.concept.count({
              where: {
                jurisdictionId: input.jurisdictionId,
                prerequisites: { some: {} },
              },
            }),
          ]);

          // Get concepts by category
          const conceptsByCategory = await ctx.prisma.concept.groupBy({
            by: ['category'],
            where: {
              jurisdictionId: input.jurisdictionId,
              isActive: true,
            },
            _count: true,
          });

          return {
            totalConcepts,
            activeConcepts,
            conceptsWithItems,
            conceptsWithoutItems: totalConcepts - conceptsWithItems,
            conceptsWithEmbeddings,
            conceptsWithoutEmbeddings: totalConcepts - conceptsWithEmbeddings,
            conceptsWithPrerequisites,
            conceptsWithoutPrerequisites: totalConcepts - conceptsWithPrerequisites,
            byCategory: conceptsByCategory,
          };
        },
        input
      );
    }),
});
