/**
 * IRT (Item Response Theory) Calculation Engine
 *
 * Implements 3-Parameter Logistic (3PL) model for adaptive testing.
 * Provides ability estimation, information calculation, and parameter estimation.
 *
 * Mathematical Foundation:
 * - P(θ) = c + (1-c) / (1 + exp(-a(θ - b)))
 * - I(θ) = a² * (P(θ) - c)² * (1 - P(θ)) / ((1 - c)² * P(θ))
 *
 * Where:
 *   θ (theta) = Student ability (-3 to +3 scale)
 *   a = Item discrimination (0.5-2.5, higher = more discriminative)
 *   b = Item difficulty (-3 to +3, higher = more difficult)
 *   c = Guessing parameter (0-0.5, typically 0.25 for 4-option MC)
 */

import { createLogger } from '../logger';

const logger = createLogger({ component: 'IRTEngine' });

/**
 * Item parameters for IRT model
 */
export interface IRTItemParams {
  a: number; // Discrimination (0.5-2.5)
  b: number; // Difficulty (-3 to +3)
  c: number; // Guessing (0-0.5)
}

/**
 * Response pattern for ability estimation
 */
export interface ResponsePattern {
  itemParams: IRTItemParams;
  correct: boolean;
}

/**
 * Ability estimate with uncertainty
 */
export interface AbilityEstimate {
  theta: number; // Ability estimate
  se: number; // Standard error
  responses: number; // Number of responses used
}

/**
 * Calculate probability of correct response using 3PL model
 *
 * @param theta - Student ability (-3 to +3)
 * @param params - Item parameters {a, b, c}
 * @returns Probability of correct response (0-1)
 */
export function probabilityCorrect(theta: number, params: IRTItemParams): number {
  const { a, b, c } = params;

  // Logistic component
  const exponent = -a * (theta - b);
  const logistic = 1 / (1 + Math.exp(exponent));

  // 3PL formula: c + (1-c) * logistic
  const probability = c + (1 - c) * logistic;

  return Math.max(0, Math.min(1, probability)); // Clamp to [0, 1]
}

/**
 * Calculate item information at given ability level
 *
 * Information quantifies how much an item contributes to ability estimation.
 * Higher information = more precise estimate after this item.
 *
 * @param theta - Student ability
 * @param params - Item parameters
 * @returns Information value (0+, typically 0-2)
 */
export function itemInformation(theta: number, params: IRTItemParams): number {
  const { a, c } = params;
  const p = probabilityCorrect(theta, params);

  // Prevent division by zero
  if (p <= c || p >= 1) {
    return 0;
  }

  // 3PL information formula
  const numerator = a * a * Math.pow(p - c, 2) * (1 - p);
  const denominator = Math.pow(1 - c, 2) * p;

  return numerator / denominator;
}

/**
 * Calculate test information (sum of item informations)
 *
 * @param theta - Student ability
 * @param items - Array of item parameters
 * @returns Total information
 */
export function testInformation(theta: number, items: IRTItemParams[]): number {
  return items.reduce((sum, item) => sum + itemInformation(theta, item), 0);
}

/**
 * Calculate standard error of ability estimate
 *
 * SE(θ) = 1 / sqrt(I(θ))
 *
 * Lower SE = more precise estimate
 *
 * @param theta - Student ability
 * @param items - Array of item parameters from administered items
 * @returns Standard error (0+, typically 0.2-1.0)
 */
export function standardError(theta: number, items: IRTItemParams[]): number {
  const info = testInformation(theta, items);

  if (info <= 0) {
    return 999; // Infinite uncertainty with no information
  }

  return 1 / Math.sqrt(info);
}

/**
 * Estimate ability using Maximum Likelihood Estimation (MLE)
 *
 * Finds theta that maximizes likelihood of observed response pattern.
 * Uses Newton-Raphson iterative method.
 *
 * @param responses - Response pattern (items and correctness)
 * @param options - Estimation options
 * @returns Ability estimate with standard error
 */
export function estimateAbility(
  responses: ResponsePattern[],
  options?: {
    initialTheta?: number;
    maxIterations?: number;
    convergence?: number;
  }
): AbilityEstimate {
  const initialTheta = options?.initialTheta ?? 0;
  const maxIterations = options?.maxIterations ?? 20;
  const convergence = options?.convergence ?? 0.001;

  if (responses.length === 0) {
    return { theta: initialTheta, se: 999, responses: 0 };
  }

  logger.debug('Estimating ability', {
    responsesCount: responses.length,
    initialTheta,
  });

  let theta = initialTheta;
  let iteration = 0;

  // Newton-Raphson iteration
  while (iteration < maxIterations) {
    let logLikelihoodDerivative = 0; // First derivative (slope)
    let logLikelihoodSecondDerivative = 0; // Second derivative (curvature)

    for (const response of responses) {
      const { itemParams, correct } = response;
      const { a, c } = itemParams;
      const p = probabilityCorrect(theta, itemParams);

      // Prevent numerical issues
      if (p <= c || p >= 1) continue;

      // First derivative: dL/dθ
      const pStar = (p - c) / (1 - c);
      const weight = a * (1 - p) / p;

      if (correct) {
        logLikelihoodDerivative += weight;
      } else {
        logLikelihoodDerivative -= (a * pStar) / (1 - pStar);
      }

      // Second derivative: d²L/dθ²
      logLikelihoodSecondDerivative -= a * a * pStar * (1 - pStar) / Math.pow(1 - c, 2);
    }

    // Newton-Raphson update
    const delta = -logLikelihoodDerivative / logLikelihoodSecondDerivative;
    theta += delta;

    iteration++;

    // Check convergence
    if (Math.abs(delta) < convergence) {
      break;
    }

    // Prevent runaway
    theta = Math.max(-3, Math.min(3, theta));
  }

  // Calculate standard error
  const itemParams = responses.map((r) => r.itemParams);
  const se = standardError(theta, itemParams);

  logger.debug('Ability estimated', {
    theta: theta.toFixed(3),
    se: se.toFixed(3),
    iterations: iteration,
    responses: responses.length,
  });

  return { theta, se, responses: responses.length };
}

/**
 * Update ability estimate with new response (incremental update)
 *
 * More efficient than re-estimating from scratch.
 *
 * @param currentEstimate - Current ability estimate
 * @param newResponse - New response to incorporate
 * @returns Updated ability estimate
 */
export function updateAbilityWithResponse(
  currentEstimate: AbilityEstimate,
  newResponse: ResponsePattern
): AbilityEstimate {
  // For now, use full re-estimation
  // TODO: Implement incremental Bayesian update for efficiency
  const allResponses: ResponsePattern[] = [];

  // We don't have access to previous responses here,
  // so this is a placeholder. In practice, the session manager
  // would call estimateAbility with full response history.

  return estimateAbility([newResponse], {
    initialTheta: currentEstimate.theta,
  });
}

/**
 * Get expected score at given ability level
 *
 * Useful for predicting exam performance.
 *
 * @param theta - Student ability
 * @param items - Test items
 * @returns Expected score (0-1 as proportion correct)
 */
export function expectedScore(theta: number, items: IRTItemParams[]): number {
  const totalProbability = items.reduce((sum, item) => {
    return sum + probabilityCorrect(theta, item);
  }, 0);

  return totalProbability / items.length;
}

/**
 * Calibrate item parameters from response data (basic estimation)
 *
 * Note: Full IRT calibration requires specialized statistical methods.
 * This provides a simple initial estimate.
 *
 * @param responses - Response data {studentAbility, correct}[]
 * @returns Estimated item parameters
 */
export function calibrateItem(
  responses: Array<{ studentAbility: number; correct: boolean }>
): IRTItemParams {
  if (responses.length < 10) {
    logger.warn('Insufficient data for item calibration', {
      responsesCount: responses.length,
    });
    // Return default parameters
    return { a: 1.0, b: 0.0, c: 0.25 };
  }

  // Calculate p-value (proportion correct)
  const correctCount = responses.filter((r) => r.correct).length;
  const pValue = correctCount / responses.length;

  // Estimate difficulty (b) from p-value
  // Using inverse logit approximation
  const b = -Math.log(pValue / (1 - pValue));

  // Estimate discrimination (a) from point-biserial correlation
  const meanAbilityCorrect =
    responses.filter((r) => r.correct).reduce((sum, r) => sum + r.studentAbility, 0) /
    correctCount;

  const meanAbilityIncorrect =
    responses
      .filter((r) => !r.correct)
      .reduce((sum, r) => sum + r.studentAbility, 0) /
    (responses.length - correctCount);

  const discrimination = Math.abs(meanAbilityCorrect - meanAbilityIncorrect);
  const a = Math.max(0.5, Math.min(2.5, discrimination));

  // Use standard guessing parameter for 4-option MC
  const c = 0.25;

  logger.info('Item calibrated', {
    responsesCount: responses.length,
    pValue: pValue.toFixed(3),
    a: a.toFixed(2),
    b: b.toFixed(2),
    c,
  });

  return { a, b, c };
}

/**
 * Validate item parameters
 *
 * @param params - Item parameters to validate
 * @returns true if valid, false otherwise
 */
export function validateItemParams(params: IRTItemParams): boolean {
  const { a, b, c } = params;

  if (a < 0.1 || a > 3.0) return false; // Discrimination must be positive
  if (b < -4 || b > 4) return false; // Difficulty should be reasonable
  if (c < 0 || c > 0.5) return false; // Guessing must be valid probability

  return true;
}
