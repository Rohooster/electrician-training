/**
 * Trainer Router
 *
 * Handles NEC Navigator drills - timed code lookup exercises.
 * Tracks navigation paths, article accuracy, and lookup efficiency.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { generateDrill } from '@/lib/trainer/drill-generator';

export const trainerRouter = createTRPCRouter({
  /**
   * Get next drill for user
   * Uses adaptive selection based on topic mastery
   */
  nextDrill: protectedProcedure
    .input(
      z.object({
        jurisdictionId: z.string(),
        drillType: z
          .enum(['ARTICLE_LOOKUP', 'TABLE_LOOKUP', 'INDEX_NAVIGATION'])
          .default('ARTICLE_LOOKUP'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { jurisdictionId, drillType } = input;

      // Get user's topic mastery to identify weak areas
      const topicMastery = await ctx.prisma.topicMastery.findMany({
        where: { userId: ctx.user.id },
        orderBy: { masteryPercent: 'asc' },
        take: 5, // Focus on 5 weakest topics
      });

      const weakTopics = topicMastery.map((t) => t.topic);

      // Generate drill from weak topics or random if no history
      const drill = await generateDrill(ctx.prisma, {
        jurisdictionId,
        drillType,
        preferredTopics: weakTopics.length > 0 ? weakTopics : undefined,
      });

      // Create drill record
      const created = await ctx.prisma.drill.create({
        data: {
          userId: ctx.user.id,
          drillType,
          prompt: drill.prompt,
          targetArticle: drill.targetArticle,
          targetTable: drill.targetTable,
          targetSection: drill.targetSection,
          status: 'IN_PROGRESS',
        },
      });

      return created;
    }),

  /**
   * Get drill by ID
   */
  getDrill: protectedProcedure
    .input(
      z.object({
        drillId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const drill = await ctx.prisma.drill.findUnique({
        where: { id: input.drillId },
      });

      if (!drill || drill.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Drill not found or access denied',
        });
      }

      return drill;
    }),

  /**
   * Submit drill response with navigation path
   */
  submitDrill: protectedProcedure
    .input(
      z.object({
        drillId: z.string(),
        navigationPath: z.array(z.string()), // ["Index", "Conductors", "310.16", ...]
        foundArticle: z.string(),
        foundTable: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { drillId, navigationPath, foundArticle, foundTable } = input;

      const drill = await ctx.prisma.drill.findUnique({
        where: { id: drillId },
      });

      if (!drill || drill.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (drill.status !== 'IN_PROGRESS') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Drill already completed',
        });
      }

      // Calculate time spent
      const timeSpent = Math.floor(
        (Date.now() - drill.startedAt.getTime()) / 1000
      );

      // Grade accuracy
      const isCorrect = foundArticle === drill.targetArticle;
      const articleMissBy = isCorrect
        ? 0
        : calculateArticleDistance(foundArticle, drill.targetArticle);

      // Calculate path efficiency (simpler path = higher score)
      const optimalPathLength = 3; // Index -> Article -> Table
      const efficiency = Math.max(
        0,
        1 - (navigationPath.length - optimalPathLength) / 10
      );

      // Update drill
      const updated = await ctx.prisma.drill.update({
        where: { id: drillId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          timeSpentSeconds: timeSpent,
          navigationPath,
          isCorrect,
          articleMissBy,
          efficiency,
        },
      });

      // Update topic mastery
      await updateTopicMastery(ctx.prisma, ctx.user.id, {
        // Extract topic from article (simplified)
        topic: getTopicFromArticle(drill.targetArticle),
        isCorrect,
        timeSpent,
        lookupTime: timeSpent,
      });

      return updated;
    }),

  /**
   * Get user's drill history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.drill.findMany({
        where: {
          userId: ctx.user.id,
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
        take: input.limit,
      });
    }),

  /**
   * Get drill statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const drills = await ctx.prisma.drill.findMany({
      where: {
        userId: ctx.user.id,
        status: 'COMPLETED',
      },
    });

    const total = drills.length;
    const correct = drills.filter((d) => d.isCorrect).length;
    const avgTime =
      drills.reduce((sum, d) => sum + (d.timeSpentSeconds || 0), 0) / total || 0;
    const avgEfficiency =
      drills.reduce((sum, d) => sum + (d.efficiency || 0), 0) / total || 0;

    return {
      total,
      correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      avgTimeSeconds: avgTime,
      avgEfficiency,
    };
  }),
});

/**
 * Calculate distance between two articles
 * e.g., "310.16" vs "310.15" = 1
 */
function calculateArticleDistance(found: string, target: string): number {
  const foundParts = found.split('.').map(Number);
  const targetParts = target.split('.').map(Number);

  // If base article is different, return large distance
  if (foundParts[0] !== targetParts[0]) {
    return Math.abs(foundParts[0] - targetParts[0]);
  }

  // Same article, different subsection
  if (foundParts.length > 1 && targetParts.length > 1) {
    return Math.abs(foundParts[1] - targetParts[1]);
  }

  return 0;
}

/**
 * Extract topic from article reference
 * Simplified mapping
 */
function getTopicFromArticle(article: string): string {
  const base = parseInt(article.split('.')[0]);

  if (base === 100) return 'definitions_general';
  if (base >= 210 && base <= 230) return 'branch_feeder_service';
  if (base === 310) return 'conductor_sizing';
  if (base === 240) return 'ocpd';
  if (base === 250) return 'grounding_bonding';
  if (base === 430 || base === 450) return 'motors_transformers';
  if (base === 314) return 'boxes_enclosures';
  if (base >= 500) return 'special_occupancies';

  return 'definitions_general';
}

/**
 * Update topic mastery based on drill performance
 */
async function updateTopicMastery(
  prisma: any,
  userId: string,
  data: {
    topic: string;
    isCorrect: boolean;
    timeSpent: number;
    lookupTime: number;
  }
) {
  const { topic, isCorrect, timeSpent, lookupTime } = data;

  const existing = await prisma.topicMastery.findUnique({
    where: { userId_topic: { userId, topic } },
  });

  if (existing) {
    // Update existing mastery
    const newTotal = existing.totalAttempts + 1;
    const newCorrect = existing.correctCount + (isCorrect ? 1 : 0);
    const newMastery = (newCorrect / newTotal) * 100;

    // Exponential moving average for time metrics
    const alpha = 0.3;
    const newAvgTime =
      alpha * timeSpent + (1 - alpha) * (existing.avgTimeSeconds || timeSpent);
    const newAvgLookup =
      alpha * lookupTime + (1 - alpha) * (existing.avgLookupTime || lookupTime);

    await prisma.topicMastery.update({
      where: { id: existing.id },
      data: {
        totalAttempts: newTotal,
        correctCount: newCorrect,
        masteryPercent: newMastery,
        avgTimeSeconds: newAvgTime,
        avgLookupTime: newAvgLookup,
        lookupAccuracy: (newCorrect / newTotal) * 100,
        lastPracticed: new Date(),
      },
    });
  } else {
    // Create new mastery record
    await prisma.topicMastery.create({
      data: {
        userId,
        topic,
        totalAttempts: 1,
        correctCount: isCorrect ? 1 : 0,
        masteryPercent: isCorrect ? 100 : 0,
        avgTimeSeconds: timeSpent,
        avgLookupTime: lookupTime,
        lookupAccuracy: isCorrect ? 100 : 0,
      },
    });
  }
}
