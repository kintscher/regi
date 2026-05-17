/** One departure as the board consumes it (already shaped from the external
 * contract by fetch.ts — the page never sees raw JSON). */
export type Departure = {
  key: string; // stable list key for this render
  line: string; // e.g. «S6», «B 71» — display label
  category: string | null; // raw category, for any styling hook
  to: string | null; // destination
  scheduled: string | null; // ISO, scheduled departure
  prognosis: string | null; // ISO, real-time predicted departure (if any)
  delayMin: number | null; // minutes late (0 = on time, null = unknown)
  platform: string | null;
};

export type StationboardResult = {
  stationName: string;
  departures: Departure[];
  fetchedAt: string; // ISO — when this render fetched (freshness signal)
  ok: boolean; // false → upstream unreachable; render a graceful state
};
