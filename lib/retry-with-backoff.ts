/**
 * Retry utility with exponential backoff for handling transient failures.
 * Specifically designed to handle rate limit (429) errors gracefully.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor to randomize delays (0-1, default: 0.1) */
  jitterFactor?: number;
  /** Custom predicate to determine if error is retryable (default: checks for 429 status) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback fired before each retry attempt */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Default predicate to determine if an error is retryable.
 * Returns true for 429 (Too Many Requests) and network errors.
 */
function defaultIsRetryable(error: unknown): boolean {
  // Check for 429 status code
  if (error instanceof Error) {
    // tRPC error format
    if ("data" in error && typeof error.data === "object" && error.data !== null) {
      const data = error.data as Record<string, unknown>;
      if (data.httpStatus === 429) {
        return true;
      }
    }
    
    // Check error message for rate limit indicators
    if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
      return true;
    }
    
    // Network errors are retryable
    if (
      error.message.includes("Network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND")
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter.
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitterFactor: number
): number {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
  
  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);
  
  return Math.max(0, cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with exponential backoff retry logic.
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Result object with success status, data, error, and retry metadata
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => submitScore(data),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 * 
 * if (result.success) {
 *   console.log("Submitted after", result.attempts, "attempts");
 * } else {
 *   console.error("Failed after retries:", result.error);
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitterFactor = 0.1,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastError: unknown;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable and if we have attempts left
      if (!isRetryable(error) || attempt === maxAttempts - 1) {
        return {
          success: false,
          error,
          attempts: attempt + 1,
          totalDelayMs,
        };
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitterFactor
      );

      totalDelayMs += delay;

      // Fire callback before retry
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should not reach here, but return failure just in case
  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalDelayMs,
  };
}

/**
 * Extract retry-after delay from error response.
 * Returns delay in milliseconds, or undefined if not available.
 */
export function getRetryAfterDelay(error: unknown): number | undefined {
  if (error instanceof Error) {
    // Check for retryAfter in tRPC error data
    if ("data" in error && typeof error.data === "object" && error.data !== null) {
      const data = error.data as Record<string, unknown>;
      if (typeof data.retryAfter === "number") {
        // retryAfter is in seconds, convert to milliseconds
        return data.retryAfter * 1000;
      }
    }

    // Check error message for retry-after value
    const match = error.message.match(/retry[_-]?after[:\s]+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10) * 1000;
    }
  }

  return undefined;
}
