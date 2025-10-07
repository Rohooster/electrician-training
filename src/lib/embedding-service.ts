/**
 * Embedding Service
 *
 * Generate and manage embeddings for items and concepts.
 * Handles text preparation, batch processing, and storage.
 */

import { PrismaClient, Item, Concept } from '@prisma/client';
import { generateEmbedding, generateEmbeddingsBatch, EmbeddingModel } from './openai-client';
import { createLogger } from './logger';

const logger = createLogger({ component: 'EmbeddingService' });

export interface EmbeddingResult {
  id: string;
  embedding: number[];
  tokens: number;
  cost: number;
}

export interface BatchEmbeddingResult {
  successful: EmbeddingResult[];
  failed: Array<{ id: string; error: string }>;
  totalTokens: number;
  totalCost: number;
  duration: number;
}

/**
 * Prepare text for item embedding
 * Combines stem, explanation, and NEC references for rich semantic content
 */
export function prepareItemText(item: {
  stem: string;
  explanation?: string | null;
  necArticleRefs?: any;
}): string {
  const parts: string[] = [];

  // Question stem (primary content)
  parts.push(item.stem);

  // Explanation (reasoning and context)
  if (item.explanation) {
    parts.push(`\nExplanation: ${item.explanation}`);
  }

  // NEC references (code context)
  if (item.necArticleRefs && Array.isArray(item.necArticleRefs) && item.necArticleRefs.length > 0) {
    parts.push(`\nNEC References: ${item.necArticleRefs.join(', ')}`);
  }

  return parts.join('');
}

/**
 * Prepare text for concept embedding
 * Combines name, description, and NEC references
 */
export function prepareConceptText(concept: {
  name: string;
  description: string;
  necArticleRefs?: any;
}): string {
  const parts: string[] = [];

  // Concept name
  parts.push(concept.name);

  // Description (learning objectives)
  parts.push(`\n${concept.description}`);

  // NEC references (code context)
  if (concept.necArticleRefs && Array.isArray(concept.necArticleRefs) && concept.necArticleRefs.length > 0) {
    parts.push(`\nCovers NEC: ${concept.necArticleRefs.join(', ')}`);
  }

  return parts.join('');
}

/**
 * Generate embedding for a single item
 */
export async function generateItemEmbedding(
  prisma: PrismaClient,
  itemId: string,
  model: EmbeddingModel = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  logger.info('Generating embedding for item', { itemId, model });

  // Fetch item
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      stem: true,
      explanation: true,
      necArticleRefs: true,
    },
  });

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  // Prepare text
  const text = prepareItemText(item);
  logger.debug('Prepared item text', {
    itemId,
    textLength: text.length,
    preview: text.substring(0, 100),
  });

  // Generate embedding
  const result = await generateEmbedding(text, model);

  // Store in database
  await prisma.itemEmbedding.upsert({
    where: { itemId },
    create: {
      itemId,
      embedding: result.embedding,
      embeddingModel: model,
      embeddingSource: 'stem_explanation_nec',
    },
    update: {
      embedding: result.embedding,
      embeddingModel: model,
      embeddingSource: 'stem_explanation_nec',
      updatedAt: new Date(),
    },
  });

  logger.info('Item embedding stored', {
    itemId,
    tokens: result.tokens,
    cost: `$${result.cost.toFixed(6)}`,
  });

  return {
    id: itemId,
    embedding: result.embedding,
    tokens: result.tokens,
    cost: result.cost,
  };
}

/**
 * Generate embeddings for multiple items in batch
 */
export async function generateItemEmbeddingsBatch(
  prisma: PrismaClient,
  itemIds: string[],
  model: EmbeddingModel = 'text-embedding-3-small',
  onProgress?: (completed: number, total: number) => void
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();

  logger.info('Starting batch item embedding generation', {
    itemCount: itemIds.length,
    model,
  });

  // Fetch all items
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: {
      id: true,
      stem: true,
      explanation: true,
      necArticleRefs: true,
    },
  });

  if (items.length === 0) {
    logger.warn('No items found for embedding generation', { itemIds });
    return {
      successful: [],
      failed: [],
      totalTokens: 0,
      totalCost: 0,
      duration: Date.now() - startTime,
    };
  }

  logger.debug('Items fetched', { count: items.length });

  // Prepare texts (maintain order with item IDs)
  const texts = items.map((item) => prepareItemText(item));
  const itemMap = new Map(items.map((item, i) => [i, item.id]));

  // Generate embeddings
  const result = await generateEmbeddingsBatch(texts, model, onProgress);

  // Store successful embeddings
  const successful: EmbeddingResult[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const emb of result.embeddings) {
    const itemId = itemMap.get(emb.index)!;

    try {
      await prisma.itemEmbedding.upsert({
        where: { itemId },
        create: {
          itemId,
          embedding: emb.embedding,
          embeddingModel: model,
          embeddingSource: 'stem_explanation_nec',
        },
        update: {
          embedding: emb.embedding,
          embeddingModel: model,
          embeddingSource: 'stem_explanation_nec',
          updatedAt: new Date(),
        },
      });

      successful.push({
        id: itemId,
        embedding: emb.embedding,
        tokens: 0, // Estimated in batch
        cost: 0, // Calculated at batch level
      });
    } catch (error: any) {
      logger.error('Failed to store embedding', error, { itemId });
      failed.push({
        id: itemId,
        error: error.message || 'Database error',
      });
    }
  }

  // Add OpenAI errors
  for (const error of result.errors) {
    const itemId = itemMap.get(error.index)!;
    failed.push({
      id: itemId,
      error: error.error,
    });
  }

  const duration = Date.now() - startTime;

  logger.info('Batch item embedding generation complete', {
    successful: successful.length,
    failed: failed.length,
    totalTokens: result.totalTokens,
    totalCost: `$${result.totalCost.toFixed(6)}`,
    duration: `${duration}ms`,
  });

  return {
    successful,
    failed,
    totalTokens: result.totalTokens,
    totalCost: result.totalCost,
    duration,
  };
}

/**
 * Generate embedding for a single concept
 */
export async function generateConceptEmbedding(
  prisma: PrismaClient,
  conceptId: string,
  model: EmbeddingModel = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  logger.info('Generating embedding for concept', { conceptId, model });

  // Fetch concept
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      id: true,
      name: true,
      description: true,
      necArticleRefs: true,
    },
  });

  if (!concept) {
    throw new Error(`Concept not found: ${conceptId}`);
  }

  // Prepare text
  const text = prepareConceptText(concept);
  logger.debug('Prepared concept text', {
    conceptId,
    textLength: text.length,
    preview: text.substring(0, 100),
  });

  // Generate embedding
  const result = await generateEmbedding(text, model);

  // Store in database
  await prisma.concept.update({
    where: { id: conceptId },
    data: {
      embedding: result.embedding,
      updatedAt: new Date(),
    },
  });

  logger.info('Concept embedding stored', {
    conceptId,
    tokens: result.tokens,
    cost: `$${result.cost.toFixed(6)}`,
  });

  return {
    id: conceptId,
    embedding: result.embedding,
    tokens: result.tokens,
    cost: result.cost,
  };
}

/**
 * Generate embeddings for multiple concepts in batch
 */
export async function generateConceptEmbeddingsBatch(
  prisma: PrismaClient,
  conceptIds: string[],
  model: EmbeddingModel = 'text-embedding-3-small',
  onProgress?: (completed: number, total: number) => void
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();

  logger.info('Starting batch concept embedding generation', {
    conceptCount: conceptIds.length,
    model,
  });

  // Fetch all concepts
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    select: {
      id: true,
      name: true,
      description: true,
      necArticleRefs: true,
    },
  });

  if (concepts.length === 0) {
    logger.warn('No concepts found for embedding generation', { conceptIds });
    return {
      successful: [],
      failed: [],
      totalTokens: 0,
      totalCost: 0,
      duration: Date.now() - startTime,
    };
  }

  logger.debug('Concepts fetched', { count: concepts.length });

  // Prepare texts
  const texts = concepts.map((concept) => prepareConceptText(concept));
  const conceptMap = new Map(concepts.map((concept, i) => [i, concept.id]));

  // Generate embeddings
  const result = await generateEmbeddingsBatch(texts, model, onProgress);

  // Store successful embeddings
  const successful: EmbeddingResult[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const emb of result.embeddings) {
    const conceptId = conceptMap.get(emb.index)!;

    try {
      await prisma.concept.update({
        where: { id: conceptId },
        data: {
          embedding: emb.embedding,
          updatedAt: new Date(),
        },
      });

      successful.push({
        id: conceptId,
        embedding: emb.embedding,
        tokens: 0,
        cost: 0,
      });
    } catch (error: any) {
      logger.error('Failed to store embedding', error, { conceptId });
      failed.push({
        id: conceptId,
        error: error.message || 'Database error',
      });
    }
  }

  // Add OpenAI errors
  for (const error of result.errors) {
    const conceptId = conceptMap.get(error.index)!;
    failed.push({
      id: conceptId,
      error: error.error,
    });
  }

  const duration = Date.now() - startTime;

  logger.info('Batch concept embedding generation complete', {
    successful: successful.length,
    failed: failed.length,
    totalTokens: result.totalTokens,
    totalCost: `$${result.totalCost.toFixed(6)}`,
    duration: `${duration}ms`,
  });

  return {
    successful,
    failed,
    totalTokens: result.totalTokens,
    totalCost: result.totalCost,
    duration,
  };
}

/**
 * Find items without embeddings
 */
export async function findItemsWithoutEmbeddings(
  prisma: PrismaClient,
  options?: {
    jurisdictionId?: string;
    topic?: string;
    limit?: number;
  }
): Promise<string[]> {
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
      embedding: null,
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.topic && { topic: options.topic }),
    },
    select: { id: true },
    take: options?.limit,
  });

  return items.map((item) => item.id);
}

/**
 * Find concepts without embeddings
 */
export async function findConceptsWithoutEmbeddings(
  prisma: PrismaClient,
  options?: {
    jurisdictionId?: string;
    category?: string;
    limit?: number;
  }
): Promise<string[]> {
  const concepts = await prisma.concept.findMany({
    where: {
      isActive: true,
      embedding: null,
      ...(options?.jurisdictionId && { jurisdictionId: options.jurisdictionId }),
      ...(options?.category && { category: options.category }),
    },
    select: { id: true },
    take: options?.limit,
  });

  return concepts.map((concept) => concept.id);
}
