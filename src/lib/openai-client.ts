/**
 * OpenAI Client
 *
 * Production-ready OpenAI client with:
 * - Retry logic with exponential backoff
 * - Rate limiting (3000 RPM)
 * - Error handling
 * - Cost tracking
 * - Secure API key management
 */

import OpenAI from 'openai';
import { createLogger } from './logger';

const logger = createLogger({ component: 'OpenAIClient' });

// Validate API key exists
if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY environment variable is not set', undefined, {
    hint: 'Add OPENAI_API_KEY to your .env file',
  });
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 3000, // OpenAI tier 1 limit
  tokensPerMinute: 1000000, // OpenAI tier 1 limit
  safetyMargin: 0.8, // Use 80% of limit to be safe
};

// Cost tracking (prices per 1K tokens)
const PRICING = {
  'text-embedding-3-small': 0.00002,
  'text-embedding-3-large': 0.00013,
  'text-embedding-ada-002': 0.0001,
} as const;

export type EmbeddingModel = keyof typeof PRICING;

// Rate limiter state
let requestCount = 0;
let tokenCount = 0;
let windowStart = Date.now();

/**
 * Reset rate limiter window every minute
 */
function checkRateLimitWindow() {
  const now = Date.now();
  const elapsed = now - windowStart;

  if (elapsed >= 60000) {
    // Reset every minute
    logger.debug('Rate limit window reset', {
      requestsInLastMinute: requestCount,
      tokensInLastMinute: tokenCount,
    });
    requestCount = 0;
    tokenCount = 0;
    windowStart = now;
  }
}

/**
 * Wait if rate limit would be exceeded
 */
async function waitForRateLimit(estimatedTokens: number) {
  checkRateLimitWindow();

  const maxRequests = RATE_LIMIT.requestsPerMinute * RATE_LIMIT.safetyMargin;
  const maxTokens = RATE_LIMIT.tokensPerMinute * RATE_LIMIT.safetyMargin;

  if (requestCount >= maxRequests || tokenCount + estimatedTokens >= maxTokens) {
    const waitTime = 60000 - (Date.now() - windowStart) + 1000; // Wait until next window + 1s buffer
    logger.warn('Rate limit approaching, waiting', {
      requestCount,
      tokenCount,
      waitTimeMs: waitTime,
    });
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    checkRateLimitWindow(); // Reset after waiting
  }

  requestCount++;
  tokenCount += estimatedTokens;
}

/**
 * Estimate token count for text
 * Rough approximation: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for tokens
 */
export function calculateCost(tokens: number, model: EmbeddingModel): number {
  const costPer1K = PRICING[model];
  return (tokens / 1000) * costPer1K;
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 401 || error.status === 400) {
        logger.error('Non-retryable OpenAI error', error, {
          status: error.status,
          message: error.message,
        });
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn('OpenAI request failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        error: error.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error('OpenAI request failed after retries', lastError!, {
    maxRetries,
  });
  throw lastError;
}

/**
 * Generate a single embedding for text
 */
export async function generateEmbedding(
  text: string,
  model: EmbeddingModel = 'text-embedding-3-small'
): Promise<{
  embedding: number[];
  tokens: number;
  cost: number;
}> {
  const tokens = estimateTokens(text);

  logger.debug('Generating embedding', {
    model,
    textLength: text.length,
    estimatedTokens: tokens,
  });

  // Rate limiting
  await waitForRateLimit(tokens);

  // Generate embedding with retry
  const response = await retryWithBackoff(async () => {
    return await openai.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    });
  });

  const actualTokens = response.usage.total_tokens;
  const cost = calculateCost(actualTokens, model);

  logger.debug('Embedding generated', {
    model,
    actualTokens,
    cost: `$${cost.toFixed(6)}`,
  });

  return {
    embedding: response.data[0].embedding,
    tokens: actualTokens,
    cost,
  };
}

/**
 * Generate embeddings for multiple texts in a batch
 * OpenAI supports up to 2048 inputs per request
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: EmbeddingModel = 'text-embedding-3-small',
  onProgress?: (completed: number, total: number) => void
): Promise<{
  embeddings: Array<{ text: string; embedding: number[]; index: number }>;
  totalTokens: number;
  totalCost: number;
  errors: Array<{ index: number; text: string; error: string }>;
}> {
  const batchSize = 20; // Conservative batch size
  const batches: string[][] = [];

  // Split into batches
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }

  logger.info('Starting batch embedding generation', {
    totalTexts: texts.length,
    batchCount: batches.length,
    batchSize,
    model,
  });

  const results: Array<{ text: string; embedding: number[]; index: number }> = [];
  const errors: Array<{ index: number; text: string; error: string }> = [];
  let totalTokens = 0;
  let totalCost = 0;
  let completed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    try {
      const tokens = batch.reduce((sum, text) => sum + estimateTokens(text), 0);

      logger.debug('Processing batch', {
        batchIndex: batchIndex + 1,
        batchSize: batch.length,
        estimatedTokens: tokens,
      });

      // Rate limiting
      await waitForRateLimit(tokens);

      // Generate embeddings with retry
      const response = await retryWithBackoff(async () => {
        return await openai.embeddings.create({
          model,
          input: batch,
          encoding_format: 'float',
        });
      });

      // Store results
      for (let i = 0; i < response.data.length; i++) {
        const globalIndex = batchIndex * batchSize + i;
        results.push({
          text: batch[i],
          embedding: response.data[i].embedding,
          index: globalIndex,
        });
      }

      const batchTokens = response.usage.total_tokens;
      const batchCost = calculateCost(batchTokens, model);

      totalTokens += batchTokens;
      totalCost += batchCost;
      completed += batch.length;

      logger.debug('Batch completed', {
        batchIndex: batchIndex + 1,
        tokens: batchTokens,
        cost: `$${batchCost.toFixed(6)}`,
        completed,
        total: texts.length,
      });

      // Call progress callback
      if (onProgress) {
        onProgress(completed, texts.length);
      }
    } catch (error: any) {
      logger.error('Batch failed', error, {
        batchIndex: batchIndex + 1,
        batchSize: batch.length,
      });

      // Record errors for each item in failed batch
      for (let i = 0; i < batch.length; i++) {
        const globalIndex = batchIndex * batchSize + i;
        errors.push({
          index: globalIndex,
          text: batch[i],
          error: error.message || 'Unknown error',
        });
      }

      completed += batch.length;
      if (onProgress) {
        onProgress(completed, texts.length);
      }
    }

    // Small delay between batches (extra safety)
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  logger.info('Batch embedding generation complete', {
    totalTexts: texts.length,
    successful: results.length,
    failed: errors.length,
    totalTokens,
    totalCost: `$${totalCost.toFixed(6)}`,
  });

  return {
    embeddings: results,
    totalTokens,
    totalCost,
    errors,
  };
}

/**
 * Test OpenAI API connectivity
 */
export async function testConnection(): Promise<{
  success: boolean;
  model: string;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    logger.info('Testing OpenAI API connection');

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'test',
    });

    const latency = Date.now() - startTime;

    logger.info('OpenAI API connection successful', {
      latency: `${latency}ms`,
      dimensions: response.data[0].embedding.length,
    });

    return {
      success: true,
      model: 'text-embedding-3-small',
      latency,
    };
  } catch (error: any) {
    logger.error('OpenAI API connection failed', error);

    return {
      success: false,
      model: 'text-embedding-3-small',
      latency: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus() {
  checkRateLimitWindow();

  const maxRequests = RATE_LIMIT.requestsPerMinute * RATE_LIMIT.safetyMargin;
  const maxTokens = RATE_LIMIT.tokensPerMinute * RATE_LIMIT.safetyMargin;

  return {
    requests: {
      used: requestCount,
      limit: maxRequests,
      remaining: maxRequests - requestCount,
      percentUsed: (requestCount / maxRequests) * 100,
    },
    tokens: {
      used: tokenCount,
      limit: maxTokens,
      remaining: maxTokens - tokenCount,
      percentUsed: (tokenCount / maxTokens) * 100,
    },
    windowStart: new Date(windowStart),
    windowEnd: new Date(windowStart + 60000),
  };
}
