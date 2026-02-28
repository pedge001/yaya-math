import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leaderboard table for tracking high scores.
 * No user authentication required - uses initials instead.
 */
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  score: integer("score").notNull(),
  totalProblems: integer("totalProblems").notNull(),
  operation: text("operation").notNull(), // 'addition' | 'subtraction' | 'multiplication' | 'division'
  difficulty: text("difficulty").default("easy").notNull(), // 'easy' | 'medium' | 'hard'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboard.$inferInsert;

/**
 * Speed mode leaderboard for tracking fastest completion times.
 */
export const speedLeaderboard = pgTable("speed_leaderboard", {
  id: serial("id").primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  completionTime: integer("completionTime").notNull(), // Time in seconds
  totalProblems: integer("totalProblems").notNull(),
  operation: text("operation").notNull(), // 'addition' | 'subtraction' | 'multiplication' | 'division'
  difficulty: text("difficulty").default("easy").notNull(), // 'easy' | 'medium' | 'hard'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpeedLeaderboardEntry = typeof speedLeaderboard.$inferSelect;
export type InsertSpeedLeaderboardEntry = typeof speedLeaderboard.$inferInsert;

/**
 * Daily challenge leaderboard - resets every 24 hours.
 */
export const dailyChallengeLeaderboard = pgTable("daily_challenge_leaderboard", {
  id: serial("id").primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  score: integer("score").notNull(),
  totalProblems: integer("totalProblems").notNull(),
  challengeDate: varchar("challengeDate", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyChallengeEntry = typeof dailyChallengeLeaderboard.$inferSelect;
export type InsertDailyChallengeEntry = typeof dailyChallengeLeaderboard.$inferInsert;
