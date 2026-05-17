import { createHash } from "node:crypto";
import { events, sources } from "@regi/db/schema";
import type { Env } from "../../env";
import { getDb } from "../../lib/db";
import { putRawAudit } from "../../lib/r2";
import type { SourceRunResult } from "../types";
import { PLAUSI_TOTAL_MAX, REGENSDORF_ZIPS } from "./constants";
import { type EventItem, eventListItem, listEnvelope } from "./schema";

const API = "https://api.eventfrog.net/public/v1/events";
const SLUG = "eventfrog";
const REVALIDATE_TAG = "source:eventfrog";

// Identity row for the auto-generated /quellen page. Eventfrog Public API:
// event data offered for re-publication; attribution mandatory (ADR 0012).
const SOURCE = {
  name: "Eventfrog",
  slug: SLUG,
  url: "https://eventfrog.ch",
  license: "Veranstaltungsdaten © Eventfrog (eventfrog.ch) — Nutzung gemäss Public-API-Bedingungen",
} as const;

const DESCRIPTION_MAX = 500;

type Candidate = {
  externalId: string;
  groupId: string | null;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  locationName: string | null;
  url: string;
  organizerName: string | null;
  rubricId: number | null;
  imageUrl: string | null;
  rawHash: string;
};

function degraded(skipped: number, filteredOut: number): SourceRunResult {
  return { fetched: 0, persisted: 0, unchanged: 0, skipped, filteredOut, degraded: true };
}

function truncate(s: string): string {
  return s.length <= DESCRIPTION_MAX ? s : s.slice(0, DESCRIPTION_MAX);
}

/** Eventfrog uses the sentinel "0" for "not in a group". NULL is the
 * semantically correct value for "no grouping relation" (ADR 0012). */
function normalizeGroupId(g: string | undefined): string | null {
  return !g || g === "0" ? null : g;
}

/**
 * Canonical raw_hash: SHA-256 over a fixed-order projection of the *stable*
 * fields the row derives from — never the whole response. `modifyDate` is
 * included so a genuine upstream edit flips the hash and re-upserts
 * (ADR 0009 "Hash-1" pattern).
 */
function canonicalRawHash(c: Omit<Candidate, "rawHash">, modifyDate: string | undefined): string {
  const canonical = JSON.stringify([
    c.externalId,
    c.groupId,
    c.title,
    c.description,
    c.startAt.toISOString(),
    c.endAt ? c.endAt.toISOString() : null,
    c.locationName,
    c.url,
    c.rubricId,
    modifyDate ?? null,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

function mapItem(e: EventItem): Candidate | null {
  // Public aggregator: never surface an explicitly hidden / unpublished /
  // cancelled event. Omitted flags default permissive (the Public API only
  // returns public events); only an explicit negative excludes.
  if (e.visible === false || e.published === false || e.cancelled === true) return null;

  const title = e.title.de?.trim();
  if (!title) return null; // title is NOT NULL and the primary reading

  const startAt = new Date(e.begin);
  if (Number.isNaN(startAt.getTime())) return null;
  let endAt: Date | null = null;
  if (e.end) {
    const d = new Date(e.end);
    endAt = Number.isNaN(d.getTime()) ? null : d;
  }

  const descRaw = e.shortDescription?.de?.trim();
  const base = {
    externalId: e.id,
    groupId: normalizeGroupId(e.groupId),
    title,
    description: descRaw ? truncate(descRaw) : null,
    startAt,
    endAt,
    locationName: e.locationAlias?.de?.trim() || null,
    url: e.url,
    organizerName: e.organizerName?.trim() || null,
    rubricId: e.rubricId ?? null,
    imageUrl: e.emblemToShow?.url ?? null,
  };
  return { ...base, rawHash: canonicalRawHash(base, e.modifyDate) };
}

export async function runEventfrog(env: Env): Promise<SourceRunResult> {
  // ADR 0012: a missing key degrades loudly, never crashes the cron. The key
  // value is never logged (not even a prefix/length).
  if (!env.EVENTFROG_API_KEY) {
    console.error("eventfrog degraded: EVENTFROG_API_KEY not set; no persist");
    return degraded(0, 0);
  }

  const p = new URLSearchParams();
  for (const zip of REGENSDORF_ZIPS) p.append("zip", zip); // repeatable (form/explode)
  const res = await fetch(`${API}?${p.toString()}`, {
    headers: {
      authorization: `Bearer ${env.EVENTFROG_API_KEY}`,
      "user-agent": env.REGI_USER_AGENT,
    },
  });

  // ADR 0012: 429 / any non-2xx → degrade, persist nothing, do NOT advance
  // freshness. No in-invocation backoff — the next hourly cron is the retry.
  if (!res.ok) {
    console.error(`eventfrog degraded: HTTP ${res.status}; no persist (next cron retries)`);
    return degraded(0, 0);
  }

  const rawBody = await res.text();
  const envelope = listEnvelope.parse(JSON.parse(rawBody));

  // Cap-2 (ADR 0009): the zip filter is the only volume control (no
  // pagination). A total this large means the filter did not apply.
  if (envelope.totalNumberOfResources > PLAUSI_TOTAL_MAX) {
    console.error(
      `eventfrog degraded: total=${envelope.totalNumberOfResources} > ` +
        `PLAUSI_TOTAL_MAX=${PLAUSI_TOTAL_MAX}; no persist`,
    );
    return degraded(0, 0);
  }

  let skipped = 0;
  let filteredOut = 0;
  let fetched = 0;
  const candidates: Candidate[] = [];
  for (const raw of envelope.events) {
    fetched++;
    const parsed = eventListItem.safeParse(raw);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const cand = mapItem(parsed.data);
    if (!cand) {
      filteredOut++;
      continue;
    }
    candidates.push(cand);
  }

  // Append-only byte-faithful audit trail (CLAUDE.md §7, ADR 0009). The
  // response body carries no credential (the key is a request header).
  const auditKey = await putRawAudit(env.RAW, SLUG, rawBody);

  const db = getDb(env.DATABASE_URL);

  // Idempotent identity upsert (ADR 0009). last_synced_at set only after a
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
  if (!sourceId) throw new Error("eventfrog: ensureSource returned no id");

  // Pre-fetch this source's known hashes; decide insert/update/skip in
  // memory. An unchanged event is never rewritten → no revalidate churn
  // (ADR 0009 "Hash-1").
  const existingRows = await db.query.events.findMany({
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
      .insert(events)
      .values({
        sourceId,
        externalId: c.externalId,
        groupId: c.groupId,
        title: c.title,
        description: c.description,
        startAt: c.startAt,
        endAt: c.endAt,
        locationName: c.locationName,
        url: c.url,
        organizerName: c.organizerName,
        rubricId: c.rubricId,
        imageUrl: c.imageUrl,
        rawHash: c.rawHash,
      })
      .onConflictDoUpdate({
        target: [events.sourceId, events.externalId],
        set: {
          groupId: c.groupId,
          title: c.title,
          description: c.description,
          startAt: c.startAt,
          endAt: c.endAt,
          locationName: c.locationName,
          url: c.url,
          organizerName: c.organizerName,
          rubricId: c.rubricId,
          imageUrl: c.imageUrl,
          rawHash: c.rawHash,
          updatedAt: new Date(),
        },
      });
    persisted++;
  }

  // Advance freshness only on a clean run (slug-upsert avoids needing a
  // where-operator import; the worker never imports the @regi/db index).
  await db
    .insert(sources)
    .values({ ...SOURCE, lastSyncedAt: new Date() })
    .onConflictDoUpdate({ target: sources.slug, set: { lastSyncedAt: new Date() } });

  console.log(
    `eventfrog: fetched=${fetched} persisted=${persisted} unchanged=${unchanged} ` +
      `skipped=${skipped} filteredOut=${filteredOut} total=${envelope.totalNumberOfResources} ` +
      `audit=${auditKey}`,
  );

  return { fetched, persisted, unchanged, skipped, filteredOut, degraded: false };
}

export { REVALIDATE_TAG, SLUG };
