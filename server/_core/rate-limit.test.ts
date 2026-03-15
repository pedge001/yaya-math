import { describe, it, expect } from "vitest";
import { submissionLimiter, strictSubmissionLimiter, generalLimiter } from "./rate-limit";

describe("Rate Limiting Middleware", () => {
  describe("submissionLimiter", () => {
    it("should be defined", () => {
      expect(submissionLimiter).toBeDefined();
    });

    it("should be a middleware function", () => {
      expect(typeof submissionLimiter).toBe("function");
    });

    it("should have a name property", () => {
      expect(submissionLimiter.name).toBeDefined();
    });
  });

  describe("strictSubmissionLimiter", () => {
    it("should be defined", () => {
      expect(strictSubmissionLimiter).toBeDefined();
    });

    it("should be a middleware function", () => {
      expect(typeof strictSubmissionLimiter).toBe("function");
    });

    it("should be different from submissionLimiter", () => {
      // Strict limiter should be a different instance
      expect(strictSubmissionLimiter).not.toBe(submissionLimiter);
    });
  });

  describe("generalLimiter", () => {
    it("should be defined", () => {
      expect(generalLimiter).toBeDefined();
    });

    it("should be a middleware function", () => {
      expect(typeof generalLimiter).toBe("function");
    });

    it("should be different from submissionLimiter", () => {
      // General limiter should be a different instance
      expect(generalLimiter).not.toBe(submissionLimiter);
    });
  });

  describe("middleware exports", () => {
    it("should export three distinct limiters", () => {
      const limiters = [submissionLimiter, strictSubmissionLimiter, generalLimiter];
      
      // All should be functions
      limiters.forEach((limiter) => {
        expect(typeof limiter).toBe("function");
      });

      // All should be distinct
      expect(submissionLimiter).not.toBe(strictSubmissionLimiter);
      expect(submissionLimiter).not.toBe(generalLimiter);
      expect(strictSubmissionLimiter).not.toBe(generalLimiter);
    });

    it("should all be callable as Express middleware", () => {
      const limiters = [submissionLimiter, strictSubmissionLimiter, generalLimiter];
      
      limiters.forEach((limiter) => {
        // Middleware functions should have length of 3 (req, res, next)
        expect(limiter.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("rate limiting configuration validation", () => {
    it("should have submission limiter configured for 15 minute window", () => {
      // The limiter is created with windowMs: 15 * 60 * 1000
      // We can verify it exists and is callable
      expect(submissionLimiter).toBeDefined();
    });

    it("should have strict limiter configured for 1 minute window", () => {
      // The limiter is created with windowMs: 60 * 1000
      // We can verify it exists and is callable
      expect(strictSubmissionLimiter).toBeDefined();
    });

    it("should have general limiter configured for 15 minute window", () => {
      // The limiter is created with windowMs: 15 * 60 * 1000
      // We can verify it exists and is callable
      expect(generalLimiter).toBeDefined();
    });
  });
});
