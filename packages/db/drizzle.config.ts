import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside Next, so .env.local is not auto-loaded. cwd is
// packages/db when invoked via `pnpm --filter @regi/db ...` (the sanctioned
// path); the shared secrets live at the repo root. Node's native loader keeps
// this dependency-free. In CI the vars are injected by the environment, so a
// missing file is fine. See ADR 0008.
if (existsSync("../../.env.local")) {
  process.loadEnvFile("../../.env.local");
}

// Migrations need the direct (unpooled) connection — the pooler does not
// expose the full Postgres wire protocol. See ADR 0005.
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED is not set (required for migrations)");
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
