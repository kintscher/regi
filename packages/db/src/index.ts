import { createDb } from "./client";

// Module-load instance for the app: pooled DATABASE_URL (ADR 0005). apps/web
// imports this; migrations use the unpooled URL via drizzle.config.ts. The
// Worker must NOT import from here — this top-level read throws without an
// ambient process.env. It uses `@regi/db/client` instead. See ADR 0009 (Db-2).
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const db = createDb(databaseUrl);

// Re-exported so consumers (apps/web) never import drizzle-orm directly
// (ADR 0008, decision D-a). Typed query helpers will later supersede this —
// see the "extract typed query functions into packages/db" follow-up issue.
export { desc, eq } from "drizzle-orm";
