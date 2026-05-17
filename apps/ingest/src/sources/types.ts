/**
 * Outcome of one source run. The orchestrator (index.ts) uses `degraded` and
 * `persisted` to decide whether to fire the revalidate webhook — only a clean
 * run that actually wrote rows should invalidate caches (ADR 0009).
 */
export interface SourceRunResult {
  /** Items received from the API (after pagination, before any filtering). */
  fetched: number;
  /** Rows inserted or updated (new + content-changed). */
  persisted: number;
  /** Rows whose canonical raw_hash was unchanged — intentionally not written. */
  unchanged: number;
  /** Items dropped because they failed Zod validation. */
  skipped: number;
  /** Items dropped by the Regensdorf post-filter (municipalityId !== "96"). */
  filteredOut: number;
  /** True if a plausibility cap tripped: nothing was persisted, freshness
   * timestamp not advanced. */
  degraded: boolean;
}
