/**
 * tRPC Logging Utilities
 *
 * Helper functions for consistent logging in tRPC procedures
 */

import { createLogger } from '@/lib/logger';

/**
 * Wrap a tRPC procedure with automatic logging
 */
export async function withLogging<T>(
  procedureName: string,
  userId: string,
  fn: () => Promise<T>,
  inputData?: any
): Promise<T> {
  const logger = createLogger({ component: 'tRPC', action: procedureName });

  logger.info(`Starting ${procedureName}`, {
    userId,
    input: inputData,
  });

  try {
    const result = await logger.time(`Execute ${procedureName}`, fn, { userId });

    logger.info(`Completed ${procedureName}`, {
      userId,
      success: true,
    });

    return result;
  } catch (error) {
    logger.error(`Failed ${procedureName}`, error as Error, {
      userId,
      input: inputData,
    });
    throw error;
  }
}
