// Plausibility & pagination bounds for the ePublikation source.
// All values cite ADR 0009 ("Cap-1" global, "Cap-2" per-source). Never inline
// these as magic numbers at a call site.

/**
 * Cap-1 (global, ADR 0009). Worst-case sanity guard for unknown API drift,
 * conceptually applicable to any source: the ePublikation read API silently
 * returns the global corpus (~2.7M) when a filter is unrecognised. Anything
 * beyond this is unambiguously the unfiltered fall-through.
 */
export const PLAUSI_CAP = 5000;

/**
 * Cap-2 (per-source, ADR 0009 amendment). Empirically grounded: verified
 * 2026-05-17 the production query
 * `keyword=Regensdorf&cantons=ZH&publicationStates=PUBLISHED` over a 30-day
 * window returns total=168 (191 without `cantons`). 1000 leaves generous
 * spike headroom yet trips long before Cap-1 and far before the 2.7M
 * fall-through, so it is the operative degraded gate for this source.
 */
export const PLAUSI_TOTAL_MAX = 1000;

/** Hard cap on pagination loops (rate discipline, ADR 0010). At total≈168 and
 * PAGE_SIZE=100 the loop ends on an empty page well before this. */
export const MAX_PAGES = 10;

/** Page size for the listing query. */
export const PAGE_SIZE = 100;

/** Sliding ingest window: re-query the last N days every run and upsert
 * idempotently. Volume is tiny, so no cursor — robust to corrections and
 * backfill (INGEST-PLAN §0). */
export const WINDOW_DAYS = 30;
