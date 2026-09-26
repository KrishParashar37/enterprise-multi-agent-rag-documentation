/**
 * Minimal SQL migration runner.
 *
 * Run: npx tsx src/db/migrate.ts
 *
 * Why not `drizzle-kit push`: that command reconciles the schema by *altering*
 * tables, which is unacceptable against the populated database backing this
 * project (504 users / 258 documents / 4802 messages). This runner applies the
 * reviewed, additive statements in src/db/migrations/*.sql in filename order and
 * records them so re-runs are no-ops.
 */

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

/**
 * Split a .sql file into executable statements.
 *
 * Comments are stripped FIRST, then the text is split on `;`. Doing it the other
 * way round silently corrupts statements whenever a comment contains a semicolon
 * (e.g. "in comments; adjust types…"), because the header gets cut mid-sentence.
 *
 * Stripping `-- …` is safe here because these migrations never contain `--`
 * inside a string literal.
 */
function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");

  return withoutComments
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is not set (expected in .env.local).");
    process.exit(1);
  }
  if (!url.startsWith("mysql://")) {
    console.error("❌ This runner targets MySQL. DATABASE_URL is not a mysql:// URL.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // MySQL 8 does not support `ALTER TABLE … ADD COLUMN IF NOT EXISTS` or
  // `CREATE INDEX IF NOT EXISTS` (that is MariaDB / PostgreSQL syntax). Rather
  // than fail on a re-run, skip a statement when the object it would create is
  // already present. This keeps the migration genuinely idempotent.
  const columnExists = async (table: string, column: string) => {
    const [rows] = await conn.query<any[]>(
      `SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
      [table, column],
    );
    return rows.length > 0;
  };

  const indexExists = async (table: string, index: string) => {
    const [rows] = await conn.query<any[]>(
      `SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
      [table, index],
    );
    return rows.length > 0;
  };

  /**
   * Translate a statement written in portable `IF NOT EXISTS` form into either a
   * skip decision or concrete MySQL DDL:
   *   ALTER TABLE t ADD COLUMN IF NOT EXISTS c …  → skipped when `t.c` exists
   *   CREATE INDEX IF NOT EXISTS i ON t (…)      → skipped when `i` exists
   * Returns null when the statement should be skipped.
   */
  const resolveStatement = async (stmt: string): Promise<string | null> => {
    const addCol = stmt.match(
      /^ALTER\s+TABLE\s+`?(\w+)`?\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?/i,
    );
    if (addCol) {
      const [, table, column] = addCol;
      if (await columnExists(table, column)) return null;
      return stmt.replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i, "ADD COLUMN");
    }

    const createIdx = stmt.match(/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s+ON\s+`?(\w+)`?/i);
    if (createIdx) {
      const [, index, table] = createIdx;
      if (await indexExists(table, index)) return null;
      return stmt.replace(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i, "CREATE INDEX");
    }

    // Every other statement (CREATE TABLE IF NOT EXISTS …) is valid MySQL as-is.
    return stmt;
  };

  const [rows] = await conn.query<any[]>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    await conn.end();
    return;
  }

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ↷ ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const statements = splitStatements(sql);
    console.log(`\n▶ ${file} — ${statements.length} statement(s)`);

    for (const stmt of statements) {
      try {
        const resolved = await resolveStatement(stmt);
        if (resolved === null) {
          console.log(`    ↷ already present: ${stmt.replace(/\s+/g, " ").slice(0, 60)}…`);
          continue;
        }
        await conn.query(resolved);
        const label = resolved.replace(/\s+/g, " ").slice(0, 70);
        console.log(`    ✅ ${label}…`);
      } catch (err: any) {
        // Additive statements can legitimately be no-ops on a re-run or when the
        // server predates `IF NOT EXISTS` support for that object type.
        const ignorable = ["ER_DUP_KEYNAME", "ER_DUP_FIELDNAME", "ER_TABLE_EXISTS_ERROR", "ER_DUP_ENTRY"];
        if (ignorable.includes(err?.code)) {
          console.log(`    ↷ skipped (${err.code})`);
          continue;
        }
        console.error(`    ❌ ${err?.code || ""} ${err?.message}`);
        console.error("    Migration aborted. No further statements were run.");
        await conn.end();
        process.exit(1);
      }
    }

    await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    ran++;
    console.log(`  ✔ recorded ${file}`);
  }

  console.log(
    ran > 0 ? `\n✅ Applied ${ran} migration(s).\n` : "\n✅ Database already up to date.\n",
  );
  await conn.end();
}

main().catch((err) => {
  console.error("❌ migrate failed:", err);
  process.exit(1);
});
