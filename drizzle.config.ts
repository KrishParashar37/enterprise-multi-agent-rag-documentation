import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL || "";

export default {
  schema:  "./src/db/schema.ts",
  out:     "./drizzle",
  dialect: "mysql",
  dbCredentials: { url },
} satisfies Config;
