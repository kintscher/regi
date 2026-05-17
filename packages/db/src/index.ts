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
