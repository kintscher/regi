// Plausibility bound for the regensdorf-waste source (embedded-JSON scraping,
// ADR 0013). Never inline as a magic number at a call site (ADR 0009).

/**
 * Cap-2 (per-source, ADR 0009 / ADR 0013). Like regensdorf-news this is a
 * fixed server-rendered island, not a filtered API — so this is the
 * contract-drift sanity gate, not an unfiltered-fallthrough guard. A
 * structural change that inflates the row count must trip this and degrade
 * (no persist, freshness not advanced) rather than import garbage.
 *
 * Empirically grounded: verified 2026-05-18 the `#icmsTable-abfallsammlung`
 * island on /abfalldaten carries 20 special collection dates spanning
 * 20.05.2026 … 30.12.2026 (~7 months forward). 300 leaves generous headroom
 * for a fuller annual calendar yet trips far before any plausible drift
 * artefact. Cap-1 (the global 5000 guard) is subsumed (300 < 5000).
 */
export const PLAUSI_WASTE_MAX = 300;
