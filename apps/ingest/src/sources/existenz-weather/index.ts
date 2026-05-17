import { createHash } from "node:crypto";
import { sources, weatherObservations } from "@regi/db/schema";
import type { Env } from "../../env";
import { getDb } from "../../lib/db";
import { putRawAudit } from "../../lib/r2";
import type { SourceRunResult } from "../types";
import { PARAMS, RH_MAX, RH_MIN, STATION, TEMP_MAX, TEMP_MIN } from "./constants";
import { latestEnvelope, type ObservationRow, observationRow } from "./schema";

const API = "https://api.existenz.ch/apiv1/smn/latest";
const SLUG = "weather";
const REVALIDATE_TAG = "source:weather";

// Identity row for the auto-generated /quellen page. MeteoSwiss OGD; the
// mandatory attribution string ("Quelle: MeteoSchweiz") is part of the license
// text so it surfaces in the colophon (CLAUDE.md §7, docs/data-sources.md B3).
const SOURCE = {
  name: "MeteoSchweiz (via Existenz)",
  slug: SLUG,
  url: "https://api.existenz.ch",
  license:
    "MeteoSchweiz OGD — Quelle: MeteoSchweiz (opendatadocs.meteoswiss.ch/general/terms-of-use)",
} as const;

// existenz short code → table column. The only mapping the row derives from.
type Snapshot = {
  tempC: number | null;
  rhPct: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  precipMm: number | null;
  pressureHpa: number | null;
};

function emptySnapshot(): Snapshot {
  return {
    tempC: null,
    rhPct: null,
    windKmh: null,
    gustKmh: null,
    precipMm: null,
    pressureHpa: null,
  };
}

function assign(snap: Snapshot, par: string, val: number): void {
  switch (par) {
    case "tt":
      snap.tempC = val;
      break;
    case "rh":
      snap.rhPct = val;
      break;
    case "ff":
      snap.windKmh = val;
      break;
    case "fx":
      snap.gustKmh = val;
      break;
    case "rr":
      snap.precipMm = val;
      break;
    case "qfe":
      snap.pressureHpa = val;
      break;
    // Unknown codes are ignored, not fatal — same leniency as the Zod strip.
  }
}

/**
 * Canonical raw_hash: SHA-256 over a fixed-order projection of the *stable*
 * fields the row derives from — never the whole response (volatile upstream
 * attribution echo). An upstream value correction at the same observed_at
 * flips the hash and re-upserts (ADR 0009 "Hash-1" pattern).
 */
function canonicalRawHash(stationCode: string, observedAtIso: string, s: Snapshot): string {
  const canonical = JSON.stringify([
    stationCode,
    observedAtIso,
    s.tempC,
    s.rhPct,
    s.windKmh,
    s.gustKmh,
    s.precipMm,
    s.pressureHpa,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

function degraded(skipped: number, filteredOut: number): SourceRunResult {
  return { fetched: 0, persisted: 0, unchanged: 0, skipped, filteredOut, degraded: true };
}

export async function runExistenzWeather(env: Env): Promise<SourceRunResult> {
  const url = `${API}?locations=${STATION}&parameters=${PARAMS.join(",")}`;
  const res = await fetch(url, { headers: { "user-agent": env.REGI_USER_AGENT } });
  if (!res.ok) {
    // Surfaces to the orchestrator's per-source try/catch — one bad source
    // never aborts the cron run (CLAUDE.md §4).
    throw new Error(`existenz-weather: HTTP ${res.status}`);
  }
  const rawBody = await res.text();
  const envelope = latestEnvelope.parse(JSON.parse(rawBody));

  // Parse each payload row independently; a single malformed reading is
  // skipped, not fatal. Keep only this station's rows (filteredOut otherwise).
  let skipped = 0;
  let filteredOut = 0;
  const rows: ObservationRow[] = [];
  for (const raw of envelope.payload) {
    const parsed = observationRow.safeParse(raw);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    if (parsed.data.loc !== STATION) {
      filteredOut++;
      continue;
    }
    rows.push(parsed.data);
  }

  if (rows.length === 0) {
    console.error(`existenz-weather degraded: no ${STATION} rows in payload; no persist`);
    return degraded(skipped, filteredOut);
  }

  // "latest" can carry more than one reading time; take the freshest snapshot
  // and fold its parameters into one row.
  const observedTs = Math.max(...rows.map((r) => r.timestamp));
  const snap = emptySnapshot();
  for (const r of rows) {
    if (r.timestamp === observedTs) assign(snap, r.par, r.val);
  }

  // Temperature is the core signal; without it the snapshot is meaningless.
  // Out-of-bounds tt/rh means the feed is degraded — degrade loudly, persist
  // nothing, do not advance freshness (ADR 0009 contract).
  if (snap.tempC === null) {
    console.error("existenz-weather degraded: no tt at latest timestamp; no persist");
    return degraded(skipped, filteredOut);
  }
  if (snap.tempC < TEMP_MIN || snap.tempC > TEMP_MAX) {
    console.error(`existenz-weather degraded: tt=${snap.tempC} out of bounds; no persist`);
    return degraded(skipped, filteredOut);
  }
  if (snap.rhPct !== null && (snap.rhPct < RH_MIN || snap.rhPct > RH_MAX)) {
    console.error(`existenz-weather degraded: rh=${snap.rhPct} out of bounds; no persist`);
    return degraded(skipped, filteredOut);
  }

  const fetched = rows.length;
  const observedAt = new Date(observedTs * 1000);
  const observedAtIso = observedAt.toISOString();
  const rawHash = canonicalRawHash(STATION, observedAtIso, snap);

  // Append-only byte-faithful audit trail (CLAUDE.md §7, ADR 0009). Written
  // only on a non-degraded run, mirroring the ePublikation ordering.
  const auditKey = await putRawAudit(env.RAW, SLUG, rawBody);

  const db = getDb(env.DATABASE_URL);

  // Idempotent identity upsert (ADR 0009). last_synced_at is set only after a
  // clean persist below — a degraded/failed run never advances freshness.
  const ensured = await db
    .insert(sources)
    .values(SOURCE)
    .onConflictDoUpdate({
      target: sources.slug,
      set: { name: SOURCE.name, url: SOURCE.url, license: SOURCE.license },
    })
    .returning({ id: sources.id });
  const sourceId = ensured[0]?.id;
  if (!sourceId) throw new Error("existenz-weather: ensureSource returned no id");

  // Pre-fetch this source's known hashes keyed by the natural unique
  // (station_code, observed_at); decide insert/update/skip in memory. An
  // unchanged reading is never rewritten → no revalidate churn (ADR 0009).
  const existingRows = await db.query.weatherObservations.findMany({
    columns: { stationCode: true, observedAt: true, rawHash: true },
    where: (t, { eq }) => eq(t.sourceId, sourceId),
  });
  const known = new Map(
    existingRows.map((r) => [`${r.stationCode}|${r.observedAt.toISOString()}`, r.rawHash]),
  );

  let persisted = 0;
  let unchanged = 0;
  if (known.get(`${STATION}|${observedAtIso}`) === rawHash) {
    unchanged = 1;
  } else {
    await db
      .insert(weatherObservations)
      .values({
        sourceId,
        stationCode: STATION,
        observedAt,
        tempC: snap.tempC,
        rhPct: snap.rhPct,
        windKmh: snap.windKmh,
        gustKmh: snap.gustKmh,
        precipMm: snap.precipMm,
        pressureHpa: snap.pressureHpa,
        rawHash,
      })
      .onConflictDoUpdate({
        target: [weatherObservations.stationCode, weatherObservations.observedAt],
        set: {
          tempC: snap.tempC,
          rhPct: snap.rhPct,
          windKmh: snap.windKmh,
          gustKmh: snap.gustKmh,
          precipMm: snap.precipMm,
          pressureHpa: snap.pressureHpa,
          rawHash,
          updatedAt: new Date(),
        },
      });
    persisted = 1;
  }

  // Advance freshness only on a clean run (slug-upsert avoids needing a
  // where-operator import; the worker never imports the @regi/db index).
  await db
    .insert(sources)
    .values({ ...SOURCE, lastSyncedAt: new Date() })
    .onConflictDoUpdate({ target: sources.slug, set: { lastSyncedAt: new Date() } });

  console.log(
    `existenz-weather: fetched=${fetched} persisted=${persisted} unchanged=${unchanged} ` +
      `skipped=${skipped} filteredOut=${filteredOut} observedAt=${observedAtIso} audit=${auditKey}`,
  );

  return { fetched, persisted, unchanged, skipped, filteredOut, degraded: false };
}

export { REVALIDATE_TAG, SLUG };
