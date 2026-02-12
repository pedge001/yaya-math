import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leaderboard table for tracking high scores.
 * No user authentication required - uses initials instead.
 */
export const leaderboard = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  score: int("score").notNull(),
  totalProblems: int("totalProblems").notNull(),
  operation: mysqlEnum("operation", ["addition", "subtraction", "multiplication", "division"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = typeof leaderboard.$inferInsert;

/**
 * Speed mode leaderboard for tracking fastest completion times.
 */
export const speedLeaderboard = mysqlTable("speed_leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  completionTime: int("completionTime").notNull(), // Time in seconds
  totalProblems: int("totalProblems").notNull(),
  operation: mysqlEnum("operation", ["addition", "subtraction", "multiplication", "division"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpeedLeaderboardEntry = typeof speedLeaderboard.$inferSelect;
export type InsertSpeedLeaderboardEntry = typeof speedLeaderboard.$inferInsert;

/**
 * Daily challenge leaderboard - resets every 24 hours.
 */
export const dailyChallengeLeaderboard = mysqlTable("daily_challenge_leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  initials: varchar("initials", { length: 3 }).notNull(),
  score: int("score").notNull(),
  totalProblems: int("totalProblems").notNull(),
  challengeDate: varchar("challengeDate", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyChallengeEntry = typeof dailyChallengeLeaderboard.$inferSelect;
export type InsertDailyChallengeEntry = typeof dailyChallengeLeaderboard.$inferInsert;
