import { describe, it, expect, beforeEach, vi } from "vitest";
import { retryWithBackoff, getRetryAfterDelay } from "./retry-with-backoff";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful execution", () => {
    it("should return success on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await retryWithBackoff(fn);

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(1);
      expect(result.totalDelayMs).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should return data from successful execution", async () => {
      const testData = { id: 1, name: "test" };
      const fn = vi.fn().mockResolvedValue(testData);
      const result = await retryWithBackoff(fn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });
  });

  describe("retry on failure", () => {
    it("should retry on 429 error", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      const result = await retryWithBackoff(fn, { initialDelayMs: 10, maxDelayMs: 100 });

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on network error", async () => {
      const error = new Error("Network error");
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      const result = await retryWithBackoff(fn, { initialDelayMs: 10, maxDelayMs: 100 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable error", async () => {
      const error = new Error("Invalid input");
      const fn = vi.fn().mockRejectedValue(error);

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should respect maxAttempts", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const fn = vi.fn().mockRejectedValue(error);

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should accumulate delay across retries", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.totalDelayMs).toBeGreaterThan(0);
    });
  });

  describe("custom retry predicate", () => {
    it("should use custom isRetryable predicate", async () => {
      const error = new Error("Custom error");
      const isRetryable = vi.fn().mockReturnValue(true);
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      const result = await retryWithBackoff(fn, {
        isRetryable,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result.success).toBe(true);
      expect(isRetryable).toHaveBeenCalledWith(error);
    });

    it("should not retry if custom predicate returns false", async () => {
      const error = new Error("Custom error");
      const isRetryable = vi.fn().mockReturnValue(false);
      const fn = vi.fn().mockRejectedValue(error);

      const result = await retryWithBackoff(fn, { isRetryable });

      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("onRetry callback", () => {
    it("should call onRetry callback before each retry", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      await retryWithBackoff(fn, {
        onRetry,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1, // attempt number
        expect.any(Number), // delay
        error // error
      );
    });

    it("should pass correct attempt number to onRetry", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      await retryWithBackoff(fn, {
        onRetry,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Number), error);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Number), error);
    });
  });

  describe("exponential backoff", () => {
    it("should increase delay with each retry", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const delays: number[] = [];
      const onRetry = vi.fn((attempt, delay) => {
        delays.push(delay);
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      await retryWithBackoff(fn, {
        onRetry,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0,
      });

      // With jitterFactor = 0, delays should be predictable
      expect(delays.length).toBe(2);
      expect(delays[0]).toBeLessThanOrEqual(delays[1]);
    });

    it("should respect maxDelayMs", async () => {
      const error = new Error("Too Many Requests");
      (error as any).data = { httpStatus: 429 };

      const delays: number[] = [];
      const onRetry = vi.fn((attempt, delay) => {
        delays.push(delay);
      });

      const fn = vi.fn().mockRejectedValue(error);

      await retryWithBackoff(fn, {
        onRetry,
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 500,
        backoffMultiplier: 10,
        jitterFactor: 0,
      });

      // All delays should be <= maxDelayMs
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(500);
      });
    });
  });
});

describe("getRetryAfterDelay", () => {
  it("should extract retryAfter from error data", () => {
    const error = new Error("Rate limited");
    (error as any).data = { retryAfter: 60 };

    const delay = getRetryAfterDelay(error);
    expect(delay).toBe(60000); // 60 seconds in milliseconds
  });

  it("should return undefined if retryAfter not present", () => {
    const error = new Error("Some error");
    const delay = getRetryAfterDelay(error);
    expect(delay).toBeUndefined();
  });

  it("should handle non-Error objects", () => {
    const delay = getRetryAfterDelay("not an error");
    expect(delay).toBeUndefined();
  });
});
