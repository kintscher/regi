// Plausibility bound for the regensdorf-news source (embedded-JSON scraping,
// ADR 0013). Never inline as a magic number at a call site (ADR 0009).

/**
 * Cap-2 (per-source, ADR 0009 / ADR 0013). regensdorf-news is NOT a filtered
 * API with a 2.7M unfiltered fall-through (ePublikation's Cap-1 class) — it is
 * a fixed server-rendered island. This bound is the contract-drift sanity gate
 * (ADR 0013 mitigations): a structural change that inflates the row count must
 * trip this and degrade (no persist, freshness not advanced) rather than
 * import garbage.
 *
 * Empirically grounded: verified 2026-05-18 the `#informationList`
 * `data-entities` island on /aktuellesinformationen carries 61 rows spanning
 * ~10 months (2025-07 … 2026-05), peak 19/month. 500 leaves generous spike
 * headroom yet trips far before any plausible drift artefact. Cap-1 (the
 * global 5000 guard) is subsumed here (500 < 5000); kept implicit because the
 * unfiltered-API failure mode does not exist for this source class.
 */
export const PLAUSI_NEWS_MAX = 500;
