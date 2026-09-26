/**
 * Connectivity smoke test for the DB layer.
 *
 * Run: npx tsx src/db/check.ts
 *
 * Verifies, against the configured DATABASE_URL:
 *   - the pool connects and honours the bounded settings
 *   - every table declared in schema.ts actually exists and is queryable
 *   - basic counts come back, so we can tell demo mode from a real database
 *
 * Exits non-zero if the database is unreachable, because "silently fell back to
 * mock data" is exactly the failure this project needs to surface loudly.
 */

// dotenv MUST run before ./index is imported: that module reads DATABASE_URL at
// module scope. (Next.js loads .env.local itself; plain `tsx` scripts do not.)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDB, getPool, getDBType, hasDB, pingDB, QUERY_TIMEOUT_MS } from "./index";
import {
  users, documents, conversations, messages, agentRuns, evaluations,
  notifications, documentChunks, retrievalResults, chatFeedback,
  documentProcessingJobs, auditLogs, userSettings, documentPermissions,
} from "./schema";
import { count } from "drizzle-orm";

const TABLES = {
  users, documents, conversations, messages, agentRuns, evaluations,
  notifications, documentChunks, retrievalResults, chatFeedback,
  documentProcessingJobs, auditLogs, userSettings, documentPermissions,
};

async function main() {
  console.log(`\n── DB check (dialect: ${process.env.DATABASE_URL?.split(":")[0] ?? "none"}) ──`);

  const ping = await pingDB();
  console.log(`ping: ok=${ping.ok} mode=${ping.mode}${ping.error ? ` error=${ping.error}` : ""}`);
  console.log(`query timeout: ${QUERY_TIMEOUT_MS}ms`);

  if (!ping.ok) {
    console.error("\n❌ Database unreachable — the app will run in demo mode.");
    process.exit(1);
  }

  const db = await getDB();
  const pool = await getPool();
  if (!db || !pool) {
    console.error("\n❌ getDB()/getPool() returned null despite a successful ping.");
    process.exit(1);
  }
  console.log(`hasDB(): ${hasDB()}`);

  let failures = 0;
  console.log("\n── Table sweep ──");
  for (const [name, table] of Object.entries(TABLES)) {
    try {
      const [row] = await (db as any).select({ n: count() }).from(table);
      console.log(`  ✅ ${name.padEnd(26)} ${String(row.n).padStart(7)} rows`);
    } catch (err: any) {
      failures++;
      console.error(`  ❌ ${name.padEnd(26)} ${err?.message || err}`);
    }
  }

  console.log("\n── Pool health ──");
  if (getDBType() === "mysql") {
    const [rows] = await pool.query("SHOW STATUS LIKE 'Threads_connected'");
    const [maxRows] = await pool.query("SELECT @@max_connections AS m");
    console.log(`  server max_connections: ${maxRows[0]?.m}`);
    console.log(`  server threads_connected: ${rows[0]?.Value}`);
  }

  if (failures > 0) {
    console.error(`\n❌ ${failures} table(s) failed. Run the migration before using the app.`);
    process.exit(1);
  }
  console.log("\n✅ All tables reachable.\n");
  await pool.end?.();
}

main().catch((err) => {
  console.error("❌ check failed:", err);
  process.exit(1);
});
