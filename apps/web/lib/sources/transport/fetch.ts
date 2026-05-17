import { stationboardEntry, stationboardResponse } from "./schema";
import type { Departure, StationboardResult } from "./types";

// On-demand fetch (ADR 0011): RSC calls this; the Next data cache
// (revalidate 30s) shields the community API from hammering — worst case
// ≈2 upstream requests/min regardless of traffic. No persistence, no R2.
// transport.opendata.ch resolves the station by name; id 8503526 is the
// Regensdorf-Watt rail stop (kept here for reference, not needed).

const STATION = "Regensdorf-Watt";
const ENDPOINT = "https://transport.opendata.ch/v1/stationboard";
const UA = "regi/1.0 (+https://regi.ch; contact: yannik@kintscher.ai)";
const REVALIDATE_SECONDS = 30;

function lineLabel(category: string | null, number: string | null): string {
  if (!category) return number ?? "—";
  if (!number) return category;
  // compact for short rail codes (S6, IR36), spaced otherwise (B 71, NFO 12)
  return /^[A-Za-z]{1,3}$/.test(category) && category.length <= 2
    ? `${category}${number}`
    : `${category} ${number}`;
}

export async function fetchStationboard(limit = 12): Promise<StationboardResult> {
  const fetchedAt = new Date().toISOString();
  const base: Omit<StationboardResult, "departures" | "ok"> = {
    stationName: STATION,
    fetchedAt,
  };

  try {
    const url = `${ENDPOINT}?station=${encodeURIComponent(STATION)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { "user-agent": process.env.REGI_USER_AGENT ?? UA },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return { ...base, departures: [], ok: false };
    }
    const parsed = stationboardResponse.parse(await res.json());
    const stationName = parsed.station?.name ?? STATION;

    const departures: Departure[] = [];
    parsed.stationboard.forEach((raw, i) => {
      const e = stationboardEntry.safeParse(raw);
      if (!e.success) return; // skip a single malformed entry, not fatal
      const { stop } = e.data;
      departures.push({
        key: `${e.data.name ?? "x"}-${stop.departureTimestamp ?? i}`,
        line: lineLabel(e.data.category ?? null, e.data.number ?? null),
        category: e.data.category ?? null,
        to: e.data.to ?? null,
        scheduled: stop.departure ?? null,
        prognosis: stop.prognosis?.departure ?? null,
        delayMin: stop.delay ?? null,
        platform: stop.platform ?? null,
      });
    });

    return { ...base, stationName, departures, ok: true };
  } catch {
    // Informal upstream — never throw into the page; render a graceful state.
    return { ...base, departures: [], ok: false };
  }
}
