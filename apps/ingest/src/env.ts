/**
 * Worker bindings. Vars/secrets come from apps/ingest/.dev.vars locally
 * (symlink → repo-root .env.local) and `wrangler secret put` in production.
 * A Worker has no ambient process.env; env is passed into each handler and
 * threaded explicitly (ADR 0009, decision Db-2).
 */
export interface Env {
  DATABASE_URL: string;
  SITE_URL: string;
  INGEST_REVALIDATE_SECRET: string;
  REGI_USER_AGENT: string;
  // Source-specific API key (ADR 0012). Typed `string` = the deploy contract
  // (`wrangler secret put EVENTFROG_API_KEY`); the eventfrog source guards a
  // missing value at runtime and degrades rather than crashing.
  EVENTFROG_API_KEY: string;
  RAW: R2Bucket;
}
