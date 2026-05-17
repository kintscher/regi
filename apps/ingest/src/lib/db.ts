import { createDb } from "@regi/db/client";

/**
 * Worker DB handle: built from the env binding inside a handler, never from a
 * module-load process.env. Imports the side-effect-free `@regi/db/client`
 * subpath, not `@regi/db` (ADR 0009, decision Db-2).
 */
export function getDb(connectionString: string) {
  return createDb(connectionString);
}
