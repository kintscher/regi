// Plausibility & polling constants for the Existenz weather source.
// No ADR cited: this is a clean Cron source, not a pattern break — the
// reusable mechanic (ensureSource, raw_hash idempotency, degrade-loudly) is
// governed by ADR 0009. Never inline these as magic numbers at a call site.

/**
 * Nearest SwissMetNet station to Regensdorf: Zürich/Affoltern, ~3.9 km.
 * Verified 2026-05-17 against the Existenz station list (KLO ~7.5 km is the
 * documented fallback, not implemented in v1).
 */
export const STATION = "REH";

/**
 * Existenz short parameter codes, requested in one call (long-format payload,
 * one row per parameter): air temp °C, rel. humidity %, wind speed km/h, gust
 * km/h, precipitation mm/10min, pressure hPa.
 */
export const PARAMS = ["tt", "rh", "ff", "fx", "rr", "qfe"] as const;

/**
 * Sanity bounds for the Zürich region. A `tt`/`rh` reading outside these means
 * the feed is degraded: persist nothing, do not advance the freshness signal
 * (same degrade-loudly contract as ADR 0009).
 */
export const TEMP_MIN = -50;
export const TEMP_MAX = 50;
export const RH_MIN = 0;
export const RH_MAX = 100;
