import rateLimit from "express-rate-limit";
import type { Request } from "express";

/**
 * Rate limiting configuration for leaderboard submission endpoints.
 * Prevents spam and abuse while allowing legitimate users to submit scores.
 */

// Custom key generator that properly handles IPv6 addresses
const createKeyGenerator = () => {
  return (req: Request) => {
    // Get the client IP address, handling proxies and IPv6
    let ip = req.ip;
    
    // If behind a proxy, try x-forwarded-for
    if (!ip || ip === "::1") {
      const forwarded = req.get("x-forwarded-for");
      if (forwarded) {
        // Take the first IP if multiple are present
        ip = forwarded.split(",")[0].trim();
      }
    }
    
    // Fallback to unknown if no IP found
    return ip || "unknown";
  };
};

const keyGenerator = createKeyGenerator();

// Submission rate limiter: 10 submissions per 15 minutes per IP
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: "Too many submissions. Please wait before submitting again.",
    retryAfter: 900, // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and privacy policy
    return req.path === "/" || req.path === "/api/health" || req.path === "/privacy";
  },
  keyGenerator,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many submissions. Please wait before submitting again.",
      retryAfter: 900,
    });
  },
});

// Strict rate limiter for rapid-fire submissions: 3 per minute per IP
export const strictSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: {
    error: "Rapid submission detected. Please wait before submitting again.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Rapid submission detected. Please wait before submitting again.",
      retryAfter: 60,
    });
  },
});

// General API rate limiter: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/" || req.path === "/api/health";
  },
  keyGenerator,
});
