/**
 * Auto-migration: Creates required PostgreSQL tables if they don't exist.
 * This ensures the deployed Railway server can self-heal its database schema.
 */

export async function runAutoMigration(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[AutoMigrate] No DATABASE_URL set, skipping migration");
    return;
  }

  // Skip migration in local development if DB is not a remote URL
  if (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) {
    console.log("[AutoMigrate] Local database detected, skipping auto-migration");
    return;
  }

  try {
    // Dynamic import to avoid issues when pg is not available
    const { default: pg } = await import("pg");
    
    // Try connecting with SSL first (Railway requires it), fall back to no SSL
    let client: InstanceType<typeof pg.Client>;
    try {
      client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
    } catch (sslError) {
      console.log("[AutoMigrate] SSL connection failed, trying without SSL...");
      client = new pg.Client({ connectionString: databaseUrl });
      await client.connect();
    }

    console.log("[AutoMigrate] Connected to database, checking tables...");

    // Create leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "leaderboard" (
        "id" SERIAL PRIMARY KEY,
        "initials" VARCHAR(3) NOT NULL,
        "score" INTEGER NOT NULL,
        "totalProblems" INTEGER NOT NULL,
        "operation" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL DEFAULT 'easy',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[AutoMigrate] ✓ leaderboard table ready");

    // Create speed_leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "speed_leaderboard" (
        "id" SERIAL PRIMARY KEY,
        "initials" VARCHAR(3) NOT NULL,
        "completionTime" INTEGER NOT NULL,
        "totalProblems" INTEGER NOT NULL,
        "operation" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL DEFAULT 'easy',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[AutoMigrate] ✓ speed_leaderboard table ready");

    // Create daily_challenge_leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "daily_challenge_leaderboard" (
        "id" SERIAL PRIMARY KEY,
        "initials" VARCHAR(3) NOT NULL,
        "score" INTEGER NOT NULL,
        "totalProblems" INTEGER NOT NULL,
        "challengeDate" VARCHAR(10) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[AutoMigrate] ✓ daily_challenge_leaderboard table ready");

    // Create users table (needed for auth)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "openId" VARCHAR(64) NOT NULL UNIQUE,
        "name" TEXT,
        "email" VARCHAR(320),
        "loginMethod" VARCHAR(64),
        "role" TEXT NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[AutoMigrate] ✓ users table ready");

    await client.end();
    console.log("[AutoMigrate] All tables verified/created successfully");
  } catch (error) {
    console.error("[AutoMigrate] Migration failed:", error);
    // Don't throw - let the server start even if migration fails
    // The individual DB operations will handle missing tables gracefully
  }
}
