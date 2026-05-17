import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Build a Drizzle client from a pooled Neon connection string (ADR 0005).
 *
 * Side-effect-free and platform-agnostic on purpose: it takes the connection
 * string only — never a runtime env object, never `process.env`. This is the
 * entry a Cloudflare Worker imports (`@regi/db/client`), because a Worker has
 * no ambient `process.env` at module load while `@regi/db` (index) reads it at
 * the top level and throws. See ADR 0009 (decision Db-2).
 */
export function createDb(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}
