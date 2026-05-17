import { db, desc, eq } from "@regi/db";
import { sources, weatherObservations } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import type { WeatherObservation } from "./format";

// Tag-based caching (CLAUDE.md §4), same discipline as /amtliches getNotices:
// the ingest webhook invalidates "source:weather" on a clean persist; the
// 15-minute revalidate is a safety net matching the worker's poll cadence.
// One query function, cache-keyed by `limit` so /amtliches (1) and /wetter
// (10) don't collide. Two cheap selects; query extraction into @regi/db is
// deferred (Issue #3 — only at 3+ reusable queries).

export type WeatherSource = { name: string; url: string };

export type WeatherData = {
  observations: WeatherObservation[]; // newest first
  source: WeatherSource | null;
};

export function getWeather(limit: number): Promise<WeatherData> {
  return unstable_cache(
    async (): Promise<WeatherData> => {
      const rows = await db
        .select({
          observedAt: weatherObservations.observedAt,
          tempC: weatherObservations.tempC,
          rhPct: weatherObservations.rhPct,
          windKmh: weatherObservations.windKmh,
          gustKmh: weatherObservations.gustKmh,
          precipMm: weatherObservations.precipMm,
          pressureHpa: weatherObservations.pressureHpa,
        })
        .from(weatherObservations)
        .orderBy(desc(weatherObservations.observedAt))
        .limit(limit);

      const src = await db
        .select({ name: sources.name, url: sources.url })
        .from(sources)
        .where(eq(sources.slug, "weather"))
        .limit(1);

      return {
        // ISO across the JSON cache boundary (a Date round-trips to string
        // anyway — explicit avoids a latent bug, as in /amtliches).
        observations: rows.map((r) => ({ ...r, observedAt: r.observedAt.toISOString() })),
        source: src[0] ?? null,
      };
    },
    ["weather/list/v1", String(limit)],
    { tags: ["source:weather"], revalidate: 900 },
  )();
}
