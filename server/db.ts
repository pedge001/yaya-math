import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { dailyChallengeLeaderboard, InsertDailyChallengeEntry, InsertLeaderboardEntry, InsertSpeedLeaderboardEntry, InsertUser, leaderboard, speedLeaderboard, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using onConflictDoUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get top 10 leaderboard entries ordered by score (descending)
 * @param operation - Optional filter by operation type
 * @param difficulty - Optional filter by difficulty level
 */
export async function getTop10Leaderboard(operation?: "addition" | "subtraction" | "multiplication" | "division", difficulty?: "easy" | "medium" | "hard") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leaderboard: database not available");
    return [];
  }

  try {
    let query = db.select().from(leaderboard);
    
    if (operation) {
      query = query.where(eq(leaderboard.operation, operation)) as any;
    }
    
    if (difficulty) {
      query = query.where(eq(leaderboard.difficulty, difficulty)) as any;
    }
    
    const results = await query
      .orderBy(desc(leaderboard.score), leaderboard.createdAt)
      .limit(10);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get leaderboard:", error);
    return [];
  }
}

/**
 * Add a new leaderboard entry
 */
export async function addLeaderboardEntry(entry: InsertLeaderboardEntry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add leaderboard entry: database not available");
    return { success: false, error: "Database not available" };
  }

  try {
    await db.insert(leaderboard).values(entry);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to add leaderboard entry:", error);
    return { success: false, error: "Failed to add entry" };
  }
}

/**
 * Get top 10 speed leaderboard entries ordered by completion time (ascending)
 * @param operation - Optional filter by operation type
 * @param difficulty - Optional filter by difficulty level
 */
export async function getTop10SpeedLeaderboard(operation?: "addition" | "subtraction" | "multiplication" | "division", difficulty?: "easy" | "medium" | "hard") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get speed leaderboard: database not available");
    return [];
  }

  try {
    let query = db.select().from(speedLeaderboard);
    
    if (operation) {
      query = query.where(eq(speedLeaderboard.operation, operation)) as any;
    }
    
    if (difficulty) {
      query = query.where(eq(speedLeaderboard.difficulty, difficulty)) as any;
    }
    
    const results = await query
      .orderBy(speedLeaderboard.completionTime, speedLeaderboard.createdAt)
      .limit(10);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get speed leaderboard:", error);
    return [];
  }
}

/**
 * Add a new speed leaderboard entry
 */
export async function addSpeedLeaderboardEntry(entry: InsertSpeedLeaderboardEntry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add speed leaderboard entry: database not available");
    return { success: false, error: "Database not available" };
  }

  try {
    await db.insert(speedLeaderboard).values(entry);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to add speed leaderboard entry:", error);
    return { success: false, error: "Failed to add entry" };
  }
}

/**
 * Get today's daily challenge leaderboard (top 10)
 */
export async function getTodaysDailyChallengeLeaderboard() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get daily challenge leaderboard: database not available");
    return [];
  }

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const results = await db
      .select()
      .from(dailyChallengeLeaderboard)
      .where(eq(dailyChallengeLeaderboard.challengeDate, today))
      .orderBy(desc(dailyChallengeLeaderboard.score), dailyChallengeLeaderboard.createdAt)
      .limit(10);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get daily challenge leaderboard:", error);
    return [];
  }
}

/**
 * Add a new daily challenge entry
 */
export async function addDailyChallengeEntry(entry: InsertDailyChallengeEntry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add daily challenge entry: database not available");
    return { success: false, error: "Database not available" };
  }

  try {
    await db.insert(dailyChallengeLeaderboard).values(entry);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to add daily challenge entry:", error);
    return { success: false, error: "Failed to add entry" };
  }
}

/**
 * Reset all leaderboard tables (for admin use)
 */
export async function resetAllLeaderboards() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot reset leaderboards: database not available");
    return { success: false, error: "Database not available" };
  }

  try {
    await db.delete(leaderboard);
    await db.delete(speedLeaderboard);
    await db.delete(dailyChallengeLeaderboard);
    
    console.log("[Database] All leaderboards reset successfully");
    return { success: true, message: "All leaderboards reset successfully" };
  } catch (error) {
    console.error("[Database] Failed to reset leaderboards:", error);
    return { success: false, error: "Failed to reset leaderboards" };
  }
}
