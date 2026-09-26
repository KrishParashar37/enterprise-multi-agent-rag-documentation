import * as schema from "./schema";

// Next.js injects .env.local automatically, but standalone scripts (`tsx`, tests)
// do not — and this module reads DATABASE_URL at module scope. Load it here so the
// dialect and pool configuration are correct in every runtime.
// `dotenv` never overwrites variables that are already set.
if (!process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: ".env.local", quiet: true });
  } catch {
    // dotenv is optional at runtime; Next.js provides the vars in the app.
  }
}

const databaseUrl = process.env.DATABASE_URL || "";
const isMySQL = databaseUrl.startsWith("mysql://");
const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");

// ── Capacity guardrails (plan item 47) ──────────────
// Deliberately modest: an unbounded pool against a shared server is the fastest
// way to exhaust its connection limit.
const POOL_MAX = Number(process.env.DB_POOL_MAX || 10);
const POOL_IDLE_MS = Number(process.env.DB_POOL_IDLE_MS || 30_000);
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5_000);
export const QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || 15_000);

type DBMode = "mysql" | "postgres" | "none";

let lastError: string | null = null;

async function createDB() {
  if (!databaseUrl) return null;
  try {
    if (isMySQL) {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const mysql = await import("mysql2/promise");
      const pool = mysql.createPool({
        uri: databaseUrl,
        waitForConnections: true,
        connectionLimit: POOL_MAX,
        maxIdle: POOL_MAX,
        idleTimeout: POOL_IDLE_MS,
        queueLimit: POOL_MAX * 20,
        connectTimeout: CONNECT_TIMEOUT_MS,
        enableKeepAlive: true,
        ssl: { rejectUnauthorized: false },
      });
      // Server-side statement timeout so one runaway query cannot hold a slot.
      try {
        await pool.query("SET SESSION max_execution_time = ?", [QUERY_TIMEOUT_MS]);
      } catch {
        // Older MySQL / restricted grants: the session var is best-effort.
      }
      return { db: drizzle(pool, { schema, mode: "default" }), pool, mode: "mysql" as DBMode };
    }
    if (isPostgres) {
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { Pool } = await import("pg");
      // Bounded pool + server-side statement timeout (plan item 47). 
      // removed: superseded by pgPool // new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
      const pgPool = new Pool({
        connectionString: databaseUrl,
        max: POOL_MAX,
        idleTimeoutMillis: POOL_IDLE_MS,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
        statement_timeout: QUERY_TIMEOUT_MS, // bounded
        ssl: { rejectUnauthorized: false },
      });
      return { db: drizzle(pgPool, { schema }), pool: pgPool, mode: "postgres" as DBMode };
    }
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.warn("DB driver init failed:", lastError);
  }
  return null;
}

// Singleton — survives Next.js dev hot-reload.
const globalForDb = globalThis as typeof globalThis & {
  __db?: any;
  __pool?: any;
  __dbReady?: boolean;
  __dbMode?: DBMode;
  __dbError?: string | null;
  __dbPromise?: Promise<void> | null;
};

async function init() {
  if (!globalForDb.__dbPromise) {
    globalForDb.__dbPromise = (async () => {
      const result = await createDB();
      if (result) {
        globalForDb.__db = result.db;
        globalForDb.__pool = result.pool;
        globalForDb.__dbMode = result.mode;
        globalForDb.__dbReady = true;
        console.log(`✅ Database connected (${result.mode})`);
      } else {
        globalForDb.__dbReady = false;
        globalForDb.__dbError = lastError;
        console.warn("⚠️ Database unavailable — running in demo mode (mock data)");
      }
    })();
  }
  return globalForDb.__dbPromise;
}

// Kick off the connection at import time so the first request is not cold.
if (databaseUrl) void init();

/**
 * Await the connection and return the Drizzle instance (or null).
 * Prefer this inside API routes: the legacy `db` export below is always null.
 */
export async function getDB(): Promise<any> {
  if (!databaseUrl) return null;
  await init();
  return globalForDb.__db ?? null;
}

export async function getPool(): Promise<any> {
  await getDB();
  return globalForDb.__pool ?? null;
}

/**
 * Legacy synchronous accessor kept only so existing `import { db }` statements
 * still compile. It is always null by design — call `getDB()` in routes.
 */
export const db: any = null;

/**
 * Returns true only if the database is actually connected and ready.
 * When false, query functions return mock data and label it `source: "mock"`.
 */
export function hasDB(): boolean {
  return globalForDb.__dbReady === true && !!globalForDb.__db;
}

export function getDBType(): DBMode {
  return globalForDb.__dbMode ?? (isMySQL ? "mysql" : isPostgres ? "postgres" : "none");
}

export function getDBError(): string | null {
  return lastError ?? globalForDb.__dbError ?? null;
}

/** Liveness probe for /api/health — never throws. */
export async function pingDB(): Promise<{ ok: boolean; mode: DBMode; error?: string }> {
  const mode = getDBType();
  try {
    const pool = await getPool();
    if (!pool) return { ok: false, mode, error: getDBError() ?? "not configured" };
    if (mode === "mysql") {
      const conn = await pool.getConnection();
      try { await conn.query("SELECT 1"); } finally { conn.release(); }
    } else {
      await pool.query("SELECT 1");
    }
    return { ok: true, mode };
  } catch (err: any) {
    return { ok: false, mode, error: err?.message || String(err) };
  }
}
