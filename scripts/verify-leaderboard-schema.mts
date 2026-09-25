/**
 * Regression check for the speed leaderboard schema repair.
 *
 * Recreates the exact column shape production drifted into — `score` instead of
 * `completionTime`, `operations` instead of `operation`, `createdAt` as `date` —
 * then runs reconcileColumns() over it and exercises the real insert and select
 * from server/db.ts against the result.
 *
 * Needs a throwaway Postgres on port 55432:
 *
 *   docker run -d --name yaya-pg-test -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=yaya -p 55432:5432 postgres:17
 *   pnpm verify:schema
 *   docker rm -f yaya-pg-test
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import { speedLeaderboard } from "../drizzle/schema.js";
import { reconcileColumns } from "../server/_core/auto-migrate.js";

const URL = "postgres://postgres:test@127.0.0.1:55432/yaya";
const client = new pg.Client({ connectionString: URL });
await client.connect();

// Production's shape, verbatim from its information_schema.
await client.query(`DROP TABLE IF EXISTS "speed_leaderboard";`);
await client.query(`
  CREATE TABLE "speed_leaderboard" (
    "id" SERIAL PRIMARY KEY,
    "initials" VARCHAR(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "totalProblems" INTEGER NOT NULL,
    "operations" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "createdAt" DATE NOT NULL DEFAULT CURRENT_DATE,
    "userId" VARCHAR(64)
  );
`);
await client.query(
  `INSERT INTO "speed_leaderboard" ("initials","score","totalProblems","operations","difficulty") VALUES ('OLD',77,10,'addition','easy');`
);

const shape = async () => {
  const { rows } = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='speed_leaderboard' ORDER BY ordinal_position;`
  );
  return rows.map((r: any) => `${r.column_name}:${r.data_type}`);
};

console.log("BEFORE:", (await shape()).join("  "));
await reconcileColumns(client as any);
const after = await shape();
console.log("AFTER :", after.join("  "));
await reconcileColumns(client as any); // must be a no-op; it runs on every boot
const afterTwice = await shape();

const pool = new pg.Pool({ connectionString: URL });
const db = drizzle(pool);

// The exact insert that failed in production with "column completionTime does not exist".
await db.insert(speedLeaderboard).values({ initials: "ZEE", completionTime: 193, totalProblems: 10, operation: "addition", difficulty: "easy", userId: null });
await db.insert(speedLeaderboard).values({ initials: "JME", completionTime: 52, totalProblems: 10, operation: "addition", difficulty: "easy", userId: null });

// The exact select from getTop10SpeedLeaderboard.
const rows = await db.select().from(speedLeaderboard)
  .where(and(
    eq(speedLeaderboard.operation, "addition"),
    eq(speedLeaderboard.difficulty, "easy"),
    eq(speedLeaderboard.totalProblems, 10),
  ))
  .orderBy(speedLeaderboard.completionTime, speedLeaderboard.createdAt)
  .limit(10);

console.log("BOARD :", rows.map((r) => `${r.initials}=${r.completionTime}s`).join(", "));

const has = (n: string) => after.some((c) => c.startsWith(n + ":"));
const checks: [string, boolean][] = [
  ["score renamed to completionTime", has("completionTime") && !has("score")],
  ["operations renamed to operation", has("operation") && !has("operations")],
  ["createdAt widened to timestamp", after.includes("createdAt:timestamp without time zone")],
  ["reconcile is idempotent", after.join() === afterTwice.join()],
  ["insert now succeeds", rows.length === 3],
  ["ordered fastest first", rows.map((r) => r.completionTime).join() === "52,77,193"],
  ["legacy row survived the rename", rows.some((r) => r.initials === "OLD" && r.completionTime === 77)],
  ["createdAt carries time of day", rows[0]?.createdAt instanceof Date && (rows[0].createdAt as Date).getUTCHours() !== 0],
];

console.log();
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
await pool.end();
await client.end();
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
