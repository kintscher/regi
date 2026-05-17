// Query & plausibility constants for the Eventfrog source.
// Auth pattern: ADR 0012. Cap pattern: ADR 0009 ("Cap-2" per-source).
// Never inline these as magic numbers at a call site.

/**
 * Regensdorf postal codes — the locality filter (ADR 0012 / SOURCE-STRATEGY).
 * 8105 = Regensdorf + Watt, 8106 = Adlikon b. Regensdorf. BFS 96. Strict zip
 * filter: precision over recall; zip-less events are a documented v1 gap
 * (issue #12, geo-fallback evaluation deferred).
 */
export const REGENSDORF_ZIPS = ["8105", "8106"] as const;

/**
 * Cap-2 (per-source, ADR 0009). Verified 2026-05-17: `zip=8105&zip=8106`
 * returns total = 148 (recurring series inflate this); the *unfiltered*
 * corpus is ≈101 107. The Public API has **no pagination** — `size`/`page`
 * are silently ignored (same unknown-param footgun as ePublikation), so the
 * zip filter is the only volume control. A `total` past this cap means the
 * zip filter did not apply → degrade loudly, persist nothing, freshness not
 * advanced. 2000 leaves generous headroom yet trips far below the 101k
 * fall-through.
 */
export const PLAUSI_TOTAL_MAX = 2000;
