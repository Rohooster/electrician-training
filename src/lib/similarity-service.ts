/**
 * Similarity Search Service
 *
 * Find related items and concepts using cosine similarity on embeddings.
 * Enables personalized learning and content recommendations.
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';

const logger = createLogger({ component: 'SimilarityService' });

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / denominator;
}

/**
 * Result for similarity search
 */
export interface SimilarityResult {
  id: string;
  similarity: number;
  item?: {
    stem: string;
    topic: string;
    difficulty: string;
    necArticleRefs: any;
  };
  concept?: {
    name: string;
    category: string;
    description: string;
  };
}

/**
 * Find items similar to a given item
 */
export async function findSimilarItems(
  prisma: PrismaClient,
  itemId: string,
  options?: {
    limit?: number;
    minSimilarity?: number;
    jurisdictionId?: string;
    topic?: string;
    excludeItemId?: boolean;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit || 10;
  const minSimilarity = options?.minSimilarity || 0.5;
  const excludeItemId = options?.excludeItemId !== false;

  logger.debug('Finding similar items', {
    itemId,
    limit,
    minSimilarity,
    jurisdictionId: options?.jurisdictionId,
    topic: options?.topic,
  });

  // Get source item embedding
  const sourceItem = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      embedding: true,
    },
  });

  if (!sourceItem?.embedding?.embedding) {
    logger.warn('Item has no embedding', { itemId });
    throw new Error('Item has no embedding');
  }

  const sourceEmbedding = sourceItem.embedding.embedding as number[];

  // Get all items with embeddings
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      embedding: { isNot: null },
      ...(excludeItemId && { id: { not: itemId } }),
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.topic && { topic: options.topic }),
    },
    include: {
      embedding: true,
    },
  });

  logger.debug('Calculating similarities', {
    sourceItemId: itemId,
    candidateCount: items.length,
  });

  // Calculate similarities
  const similarities: SimilarityResult[] = items
    .map((item) => {
      const embedding = item.embedding?.embedding as number[];
      if (!embedding) return null;

      const similarity = cosineSimilarity(sourceEmbedding, embedding);

      return {
        id: item.id,
        similarity,
        item: {
          stem: item.stem,
          topic: item.topic,
          difficulty: item.difficulty,
          necArticleRefs: item.necArticleRefs,
        },
      };
    })
    .filter((result): result is SimilarityResult =>
      result !== null && result.similarity >= minSimilarity
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  logger.info('Similar items found', {
    sourceItemId: itemId,
    resultsCount: similarities.length,
    topSimilarity: similarities[0]?.similarity.toFixed(3),
  });

  return similarities;
}

/**
 * Find concepts similar to a given concept
 */
export async function findSimilarConcepts(
  prisma: PrismaClient,
  conceptId: string,
  options?: {
    limit?: number;
    minSimilarity?: number;
    jurisdictionId?: string;
    category?: string;
    excludeConceptId?: boolean;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit || 10;
  const minSimilarity = options?.minSimilarity || 0.5;
  const excludeConceptId = options?.excludeConceptId !== false;

  logger.debug('Finding similar concepts', {
    conceptId,
    limit,
    minSimilarity,
  });

  // Get source concept embedding
  const sourceConcept = await prisma.concept.findUnique({
    where: { id: conceptId },
  });

  if (!sourceConcept?.embedding) {
    logger.warn('Concept has no embedding', { conceptId });
    throw new Error('Concept has no embedding');
  }

  const sourceEmbedding = sourceConcept.embedding as number[];

  // Get all concepts with embeddings
  const concepts = await prisma.concept.findMany({
    where: {
      isActive: true,
      embedding: { not: null },
      ...(excludeConceptId && { id: { not: conceptId } }),
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.category && { category: options.category }),
    },
  });

  logger.debug('Calculating concept similarities', {
    sourceConceptId: conceptId,
    candidateCount: concepts.length,
  });

  // Calculate similarities
  const similarities: SimilarityResult[] = concepts
    .map((concept) => {
      const embedding = concept.embedding as number[] | null;
      if (!embedding) return null;

      const similarity = cosineSimilarity(sourceEmbedding, embedding);

      return {
        id: concept.id,
        similarity,
        concept: {
          name: concept.name,
          category: concept.category,
          description: concept.description,
        },
      };
    })
    .filter((result): result is SimilarityResult =>
      result !== null && result.similarity >= minSimilarity
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  logger.info('Similar concepts found', {
    sourceConceptId: conceptId,
    resultsCount: similarities.length,
    topSimilarity: similarities[0]?.similarity.toFixed(3),
  });

  return similarities;
}

/**
 * Find items that match a concept (for personalized learning)
 * Returns items that are semantically similar to the concept
 */
export async function findItemsForConcept(
  prisma: PrismaClient,
  conceptId: string,
  options?: {
    limit?: number;
    minSimilarity?: number;
    jurisdictionId?: string;
    topic?: string;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit || 20;
  const minSimilarity = options?.minSimilarity || 0.6;

  logger.debug('Finding items for concept', {
    conceptId,
    limit,
    minSimilarity,
  });

  // Get concept embedding
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
  });

  if (!concept?.embedding) {
    logger.warn('Concept has no embedding', { conceptId });
    throw new Error('Concept has no embedding');
  }

  const conceptEmbedding = concept.embedding as number[];

  // Get all items with embeddings
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      embedding: { isNot: null },
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.topic && { topic: options.topic }),
    },
    include: {
      embedding: true,
    },
  });

  logger.debug('Calculating item-concept similarities', {
    conceptId,
    conceptName: concept.name,
    candidateCount: items.length,
  });

  // Calculate similarities
  const similarities: SimilarityResult[] = items
    .map((item) => {
      const embedding = item.embedding?.embedding as number[];
      if (!embedding) return null;

      const similarity = cosineSimilarity(conceptEmbedding, embedding);

      return {
        id: item.id,
        similarity,
        item: {
          stem: item.stem,
          topic: item.topic,
          difficulty: item.difficulty,
          necArticleRefs: item.necArticleRefs,
        },
      };
    })
    .filter((result): result is SimilarityResult =>
      result !== null && result.similarity >= minSimilarity
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  logger.info('Items found for concept', {
    conceptId,
    conceptName: concept.name,
    resultsCount: similarities.length,
    topSimilarity: similarities[0]?.similarity.toFixed(3),
  });

  return similarities;
}

/**
 * Find concepts that match an item (for auto-tagging suggestions)
 */
export async function findConceptsForItem(
  prisma: PrismaClient,
  itemId: string,
  options?: {
    limit?: number;
    minSimilarity?: number;
    jurisdictionId?: string;
    category?: string;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit || 5;
  const minSimilarity = options?.minSimilarity || 0.65;

  logger.debug('Finding concepts for item', {
    itemId,
    limit,
    minSimilarity,
  });

  // Get item embedding
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      embedding: true,
    },
  });

  if (!item?.embedding?.embedding) {
    logger.warn('Item has no embedding', { itemId });
    throw new Error('Item has no embedding');
  }

  const itemEmbedding = item.embedding.embedding as number[];

  // Get all concepts with embeddings
  const concepts = await prisma.concept.findMany({
    where: {
      isActive: true,
      embedding: { not: null },
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.category && { category: options.category }),
    },
  });

  logger.debug('Calculating concept-item similarities', {
    itemId,
    itemTopic: item.topic,
    candidateCount: concepts.length,
  });

  // Calculate similarities
  const similarities: SimilarityResult[] = concepts
    .map((concept) => {
      const embedding = concept.embedding as number[] | null;
      if (!embedding) return null;

      const similarity = cosineSimilarity(itemEmbedding, embedding);

      return {
        id: concept.id,
        similarity,
        concept: {
          name: concept.name,
          category: concept.category,
          description: concept.description,
        },
      };
    })
    .filter((result): result is SimilarityResult =>
      result !== null && result.similarity >= minSimilarity
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  logger.info('Concepts found for item', {
    itemId,
    itemTopic: item.topic,
    resultsCount: similarities.length,
    topSimilarity: similarities[0]?.similarity.toFixed(3),
  });

  return similarities;
}

/**
 * Batch find similar items for multiple items
 * Useful for building recommendation systems
 */
export async function batchFindSimilarItems(
  prisma: PrismaClient,
  itemIds: string[],
  options?: {
    limit?: number;
    minSimilarity?: number;
  }
): Promise<Map<string, SimilarityResult[]>> {
  logger.info('Batch finding similar items', {
    itemCount: itemIds.length,
    limit: options?.limit,
  });

  const results = new Map<string, SimilarityResult[]>();

  for (const itemId of itemIds) {
    try {
      const similar = await findSimilarItems(prisma, itemId, options);
      results.set(itemId, similar);
    } catch (error) {
      logger.error('Failed to find similar items', error as Error, { itemId });
      results.set(itemId, []);
    }
  }

  logger.info('Batch similarity search complete', {
    itemCount: itemIds.length,
    successCount: results.size,
  });

  return results;
}
