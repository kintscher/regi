import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside Next, so .env.local is not auto-loaded. Node's
// native loader keeps this dependency-free. In CI the vars are injected by the
// environment, so a missing file is fine.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Migrations need the direct (unpooled) connection — the pooler does not
// expose the full Postgres wire protocol. See ADR 0005.
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED is not set (required for migrations)");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
