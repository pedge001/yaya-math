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
        })
      )
      .query(async ({ input }) => {
        return await db.getTop10Leaderboard(input.operation);
      }),
    submitScore: publicProcedure
      .input(
        z.object({
          initials: z.string().length(3).toUpperCase(),
          score: z.number().int().min(0).max(50),
          totalProblems: z.number().int().min(1),
          operation: z.enum(["addition", "subtraction", "multiplication", "division"]),
        })
      )
      .mutation(async ({ input }) => {
        return await db.addLeaderboardEntry(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
