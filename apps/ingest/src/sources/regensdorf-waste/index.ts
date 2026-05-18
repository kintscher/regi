import { sources, wasteCollections } from "@regi/db/schema";
import type { Env } from "../../env";
import { getDb } from "../../lib/db";
import { putRawAudit } from "../../lib/r2";
import type { SourceRunResult } from "../types";
import { PLAUSI_WASTE_MAX } from "./constants";
import { mapRow, parseWasteIsland, validateRow, type WasteCandidate } from "./parse";

const PAGE_URL = "https://www.regensdorf.ch/abfalldaten";
const SLUG = "regensdorf-waste";
const REVALIDATE_TAG = "source:regensdorf-waste";

// Identity row for the auto-generated /quellen page. Same municipal primary
// source as regensdorf-news (separate slug — different data model, ADR 0013);
// amtliches Werk, free under URG Art. 5. License string operator-fixed.
const SOURCE = {
  name: "Gemeinde Regensdorf",
  slug: SLUG,
  url: PAGE_URL,
  license: "Gemeinde Regensdorf — primärquelle, URG Art. 5 (amtliches Werk)",
} as const;

const DEGRADED: SourceRunResult = {
  fetched: 0,
  persisted: 0,
  unchanged: 0,
  skipped: 0,
  filteredOut: 0,
  degraded: true,
};

export async function runRegensdorfWaste(env: Env): Promise<SourceRunResult> {
  const res = await fetch(PAGE_URL, { headers: { "user-agent": env.REGI_USER_AGENT } });
  if (!res.ok) {
    // Surfaces to the orchestrator's per-source try/catch (CLAUDE.md §4).
    throw new Error(`regensdorf-waste: HTTP ${res.status}`);
  }
  const rawBody = await res.text();
  const auditKey = await putRawAudit(env.RAW, SLUG, rawBody);

  const rows = parseWasteIsland(rawBody);
  if (rows === null) {
    console.error("regensdorf-waste degraded: #icmsTable-abfallsammlung island absent/unparseable");
    return DEGRADED;
  }
  const fetched = rows.length;
  if (fetched === 0) {
    console.error(`regensdorf-waste degraded: island present but empty (audit=${auditKey})`);
    return DEGRADED;
  }
  if (fetched > PLAUSI_WASTE_MAX) {
    console.error(
      `regensdorf-waste degraded: rows=${fetched} > PLAUSI_WASTE_MAX=${PLAUSI_WASTE_MAX}; no persist`,
    );
    return DEGRADED;
  }

  let skipped = 0;
  const candidates: WasteCandidate[] = [];
  for (const raw of rows) {
    const row = validateRow(raw); // strict per-item (ADR 0013)
    if (!row) {
      skipped++;
      continue;
    }
    const cand = mapRow(row);
    if (!cand) {
      skipped++;
      continue;
    }
    candidates.push(cand);
  }

  if (candidates.length === 0) {
    console.error(
      `regensdorf-waste degraded: ${fetched} rows, 0 valid (systematic drift; audit=${auditKey})`,
    );
    return DEGRADED;
  }

  const db = getDb(env.DATABASE_URL);

  const ensured = await db
    .insert(sources)
    .values(SOURCE)
    .onConflictDoUpdate({
      target: sources.slug,
      set: { name: SOURCE.name, url: SOURCE.url, license: SOURCE.license },
    })
    .returning({ id: sources.id });
  const sourceId = ensured[0]?.id;
  if (!sourceId) throw new Error("regensdorf-waste: ensureSource returned no id");

  const existingRows = await db.query.wasteCollections.findMany({
    columns: { externalId: true, rawHash: true },
    where: (t, { eq }) => eq(t.sourceId, sourceId),
  });
  const known = new Map(existingRows.map((r) => [r.externalId, r.rawHash]));

  let persisted = 0;
  let unchanged = 0;
  for (const c of candidates) {
    if (known.get(c.externalId) === c.rawHash) {
      unchanged++;
      continue;
    }
    await db
      .insert(wasteCollections)
      .values({
        sourceId,
        externalId: c.externalId,
        wasteType: c.wasteType,
        collectionDate: c.collectionDate,
        routeIds: c.routeIds,
        routeNames: c.routeNames,
        rawHash: c.rawHash,
      })
      .onConflictDoUpdate({
        target: [wasteCollections.sourceId, wasteCollections.externalId],
        set: {
          wasteType: c.wasteType,
          collectionDate: c.collectionDate,
          routeIds: c.routeIds,
          routeNames: c.routeNames,
          rawHash: c.rawHash,
          updatedAt: new Date(),
        },
      });
    persisted++;
  }

  await db
    .insert(sources)
    .values({ ...SOURCE, lastSyncedAt: new Date() })
    .onConflictDoUpdate({ target: sources.slug, set: { lastSyncedAt: new Date() } });

  console.log(
    `regensdorf-waste: fetched=${fetched} persisted=${persisted} unchanged=${unchanged} ` +
      `skipped=${skipped} audit=${auditKey}`,
  );

  return { fetched, persisted, unchanged, skipped, filteredOut: 0, degraded: false };
}

export { REVALIDATE_TAG, SLUG };
