import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Pooled connection (DATABASE_URL). The app reads only this; migrations use the
// unpooled URL via drizzle.config.ts. See ADR 0005.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client = neon(databaseUrl);

export const db = drizzle(client, { schema });

// Re-exported so consumers (apps/web) never import drizzle-orm directly
// (ADR 0008, decision D-a). Typed query helpers will later supersede this —
// see the "extract typed query functions into packages/db" follow-up issue.
export { desc, eq } from "drizzle-orm";
