import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db.js";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leaderboard: router({
    getTop10: publicProcedure
      .input(
        z.object({
          operation: z.enum(["addition", "subtraction", "multiplication", "division"]).optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getTop10Leaderboard(input.operation, input.difficulty);
      }),
    submitScore: publicProcedure
      .input(
        z.object({
          initials: z.string().length(3).toUpperCase(),
          score: z.number().int().min(0).max(50),
          totalProblems: z.number().int().min(1),
          operation: z.enum(["addition", "subtraction", "multiplication", "division"]),
          difficulty: z.enum(["easy", "medium", "hard"]),
        })
      )
      .mutation(async ({ input }) => {
        return await db.addLeaderboardEntry(input);
      }),
  }),

  speedLeaderboard: router({
    getTop10: publicProcedure
      .input(
        z.object({
          operation: z.enum(["addition", "subtraction", "multiplication", "division"]).optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getTop10SpeedLeaderboard(input.operation, input.difficulty);
      }),
    submitTime: publicProcedure
      .input(
        z.object({
          initials: z.string().length(3).toUpperCase(),
          completionTime: z.number().int().min(1),
          totalProblems: z.number().int().min(1),
          operation: z.enum(["addition", "subtraction", "multiplication", "division"]),
          difficulty: z.enum(["easy", "medium", "hard"]),
        })
      )
      .mutation(async ({ input }) => {
        return await db.addSpeedLeaderboardEntry(input);
      }),
  }),

  dailyChallenge: router({
    getTodaysLeaderboard: publicProcedure.query(async () => {
      return await db.getTodaysDailyChallengeLeaderboard();
    }),
    submitScore: publicProcedure
      .input(
        z.object({
          initials: z.string().length(3).toUpperCase(),
          score: z.number().int().min(0).max(20),
          totalProblems: z.number().int().min(1),
          challengeDate: z.string().length(10), // YYYY-MM-DD
        })
      )
      .mutation(async ({ input }) => {
        return await db.addDailyChallengeEntry(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
