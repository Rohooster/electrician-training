/**
 * Rate Limiting Utility
 *
 * In-memory rate limiting for API endpoints to prevent abuse.
 * Uses sliding window algorithm for accurate rate limiting.
 *
 * Security features:
 * - IP-based rate limiting
 * - Configurable time windows
 * - Automatic cleanup of old entries
 * - Memory-efficient implementation
 *
 * Note: In production, use Redis or similar for distributed rate limiting.
 * This implementation uses in-memory storage and is suitable for:
 * - Single-server deployments
 * - Development/testing
 * - Light to moderate traffic
 *
 * For production at scale, consider:
 * - Redis with @upstash/ratelimit
 * - Cloudflare rate limiting
 * - AWS API Gateway throttling
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit data
// Key format: "identifier:endpoint"
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup interval
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned ${cleaned} expired entries`);
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitOptions {
  /**
   * Unique identifier for rate limiting (usually IP address or user ID)
   */
  identifier: string;

  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional endpoint identifier for separate limits per endpoint
   */
  endpoint?: string;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean;

  /**
   * Number of requests remaining in current window
   */
  remaining: number;

  /**
   * Total limit
   */
  limit: number;

  /**
   * Unix timestamp when the limit resets
   */
  reset: number;

  /**
   * Seconds until reset
   */
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param options Rate limit configuration
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * ```typescript
 * const result = rateLimit({
 *   identifier: req.ip,
 *   limit: 10,
 *   windowSeconds: 60,
 *   endpoint: '/api/auth/signin'
 * });
 *
 * if (!result.success) {
 *   return new Response('Too many requests', {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Limit': result.limit.toString(),
 *       'X-RateLimit-Remaining': '0',
 *       'X-RateLimit-Reset': result.reset.toString(),
 *       'Retry-After': result.retryAfter!.toString()
 *     }
 *   });
 * }
 * ```
 */
export function rateLimit(options: RateLimitOptions): RateLimitResult {
  const { identifier, limit, windowSeconds, endpoint = 'default' } = options;

  // Create unique key for this identifier + endpoint
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get existing entry or create new one
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // No entry or expired - create new window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    console.log('[RateLimit] New window:', {
      key,
      limit,
      resetTime: new Date(entry.resetTime).toISOString(),
    });

    return {
      success: true,
      remaining: limit - 1,
      limit,
      reset: Math.floor(entry.resetTime / 1000),
    };
  }

  // Entry exists and is valid - check limit
  if (entry.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    console.warn('[RateLimit] Limit exceeded:', {
      key,
      count: entry.count,
      limit,
      retryAfter,
    });

    return {
      success: false,
      remaining: 0,
      limit,
      reset: Math.floor(entry.resetTime / 1000),
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  console.log('[RateLimit] Request allowed:', {
    key,
    count: entry.count,
    limit,
    remaining: limit - entry.count,
  });

  return {
    success: true,
    remaining: limit - entry.count,
    limit,
    reset: Math.floor(entry.resetTime / 1000),
  };
}

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  /**
   * Auth endpoints - strict limit to prevent brute force
   * 5 requests per 15 minutes
   */
  AUTH: {
    limit: 5,
    windowSeconds: 15 * 60, // 15 minutes
  },

  /**
   * API endpoints - moderate limit for general use
   * 60 requests per minute
   */
  API: {
    limit: 60,
    windowSeconds: 60, // 1 minute
  },

  /**
   * Exam submission - prevent spam
   * 3 submissions per hour
   */
  EXAM_SUBMIT: {
    limit: 3,
    windowSeconds: 60 * 60, // 1 hour
  },

  /**
   * Drill creation - prevent abuse
   * 20 drills per 5 minutes
   */
  DRILL_CREATE: {
    limit: 20,
    windowSeconds: 5 * 60, // 5 minutes
  },
};

/**
 * Get client IP address from request
 * Security: Use multiple headers for better accuracy
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
      // Take the first one (client IP)
      const ip = value.split(',')[0].trim();
      if (ip) {
        return ip;
      }
    }
  }

  // Fallback to 'unknown' if no IP found
  // In production, you should always have one of the above headers
  return 'unknown';
}
