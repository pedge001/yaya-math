/**
 * Auto-migration: Creates required PostgreSQL tables if they don't exist.
 * This ensures the deployed Railway server can self-heal its database schema.
 */

/**
 * A column the application requires, plus any older names the same column may
 * still be carrying in an existing deployment.
 */
type ColumnSpec = {
  name: string;
  /** Legacy names for this same column, most likely first. */
  renameFrom?: string[];
  /** Expected `information_schema.data_type`; corrected in place if it differs. */
  type?: string;
  /** Default expression to restore after a type change. */
  defaultExpr?: string;
};

type TableSpec = { table: string; columns: ColumnSpec[] };

/**
 * `CREATE TABLE IF NOT EXISTS` does nothing when the table already exists with
 * the wrong shape — it doesn't compare columns. That is how `speed_leaderboard`
 * sat in production carrying `score` and `operations` while every deploy
 * cheerfully logged "table ready", and every insert and select against it failed
 * with `column "completionTime" does not exist`.
 *
 * These specs are reconciled against the live columns on every boot, so drift is
 * either repaired or reported by name instead of surfacing as a raw Postgres
 * error at request time.
 */
const TABLE_SPECS: TableSpec[] = [
  {
    table: "speed_leaderboard",
    columns: [
      // The live table stored the completion time in a column called "score".
      { name: "completionTime", renameFrom: ["score", "completiontime"] },
      { name: "operation", renameFrom: ["operations"] },
      // Was `date`, which has no time of day — it is the tiebreak for equal
      // times, so every score set on the same day tied and ordered arbitrarily.
      { name: "createdAt", type: "timestamp without time zone", defaultExpr: "NOW()" },
    ],
  },
  {
    table: "leaderboard",
    columns: [
      { name: "operation", renameFrom: ["operations"] },
      { name: "createdAt", type: "timestamp without time zone", defaultExpr: "NOW()" },
    ],
  },
  {
    table: "daily_challenge_leaderboard",
    columns: [
      { name: "createdAt", type: "timestamp without time zone", defaultExpr: "NOW()" },
    ],
  },
];

/**
 * Brings existing tables in line with `TABLE_SPECS`. Renames preserve data;
 * nothing here drops a column.
 *
 * Every identifier interpolated below comes from the hardcoded specs above,
 * never from user input.
 */
export async function reconcileColumns(client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, string>> }> }): Promise<void> {
  for (const spec of TABLE_SPECS) {
    const { rows } = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1;`,
      [spec.table]
    );
    // Table doesn't exist yet — the CREATE TABLE above already handled it.
    if (rows.length === 0) continue;

    const columns = new Map(rows.map((row) => [row.column_name, row.data_type]));

    for (const column of spec.columns) {
      if (!columns.has(column.name)) {
        const legacy = column.renameFrom?.find((name) => columns.has(name));
        if (!legacy) {
          console.error(
            `[AutoMigrate] ✗ ${spec.table}."${column.name}" is missing and no legacy name matched — queries using it will fail`
          );
          continue;
        }
        await client.query(`ALTER TABLE "${spec.table}" RENAME COLUMN "${legacy}" TO "${column.name}";`);
        columns.set(column.name, columns.get(legacy)!);
        columns.delete(legacy);
        console.log(`[AutoMigrate] ✓ ${spec.table}: renamed "${legacy}" → "${column.name}"`);
      }

      if (column.type && columns.get(column.name) !== column.type) {
        await client.query(
          `ALTER TABLE "${spec.table}" ALTER COLUMN "${column.name}" TYPE ${column.type} USING "${column.name}"::${column.type};`
        );
        if (column.defaultExpr) {
          await client.query(
            `ALTER TABLE "${spec.table}" ALTER COLUMN "${column.name}" SET DEFAULT ${column.defaultExpr};`
          );
        }
        columns.set(column.name, column.type);
        console.log(`[AutoMigrate] ✓ ${spec.table}."${column.name}" → ${column.type}`);
      }
    }
  }
}

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
        "userId" VARCHAR(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // Add userId column if table already exists without it
    await client.query(`ALTER TABLE "leaderboard" ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64);`).catch(() => {});
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
        "userId" VARCHAR(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // Add userId column if table already exists without it
    await client.query(`ALTER TABLE "speed_leaderboard" ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64);`).catch(() => {});
    console.log("[AutoMigrate] ✓ speed_leaderboard table ready");

    // Create daily_challenge_leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "daily_challenge_leaderboard" (
        "id" SERIAL PRIMARY KEY,
        "initials" VARCHAR(3) NOT NULL,
        "score" INTEGER NOT NULL,
        "totalProblems" INTEGER NOT NULL,
        "challengeDate" VARCHAR(10) NOT NULL,
        "userId" VARCHAR(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // Add userId column if table already exists without it
    await client.query(`ALTER TABLE "daily_challenge_leaderboard" ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64);`).catch(() => {});
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

    // Creating tables is not enough: an existing table with drifted column names
    // passes CREATE TABLE IF NOT EXISTS untouched.
    await reconcileColumns(client);
    console.log("[AutoMigrate] ✓ columns reconciled");

    await client.end();
    console.log("[AutoMigrate] All tables verified/created successfully");
  } catch (error) {
    console.error("[AutoMigrate] Migration failed:", error);
    // Don't throw - let the server start even if migration fails
    // The individual DB operations will handle missing tables gracefully
  }
}
