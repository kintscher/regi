import { createHash } from "node:crypto";
import { type WasteRow, wasteIsland, wasteRow } from "./schema";

/**
 * Pure extraction for the regensdorf-waste embedded-JSON island (ADR 0013).
 * No I/O — deterministic on its string input, unit-testable in isolation
 * once a harness exists (CLAUDE.md §4 "Parser in parse.ts"; test harness is
 * the deferred Issue #18).
 *
 * NOTE: `decodeHtmlEntities` + `extractIslandJson` are intentionally
 * duplicated from the regensdorf-news parser. ADR 0009 keeps sources
 * independent (a source is a directory + a registry line — no cross-source
 * imports); CLAUDE.md §9 forbids refactoring shipped Source-5 code
 * en-passant. Extracting a shared `lib/embedded-json.ts` and migrating both
 * is a single-topic follow-up (tracked), not this PR.
 */

export type WasteCandidate = {
  externalId: string;
  wasteType: string;
  collectionDate: string; // YYYY-MM-DD (a calendar date — no time/zone)
  routeIds: string[];
  routeNames: string;
  rawHash: string;
};

const NAMED: Record<string, string> = {
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decodeHtmlEntities(s: string): string {
  let out = s;
  for (const [ent, ch] of Object.entries(NAMED)) out = out.split(ent).join(ch);
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)));
  out = out.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number.parseInt(d, 10)));
  return out.split("&amp;").join("&");
}

/**
 * Locate a DataTables island by its stable id and return the
 * HTML-entity-decoded JSON string, or null if absent (caller degrades, ADR
 * 0013). Generalised over the table id (this source's is
 * `icmsTable-abfallsammlung`).
 */
export function extractIslandJson(html: string, tableId: string): string | null {
  const tag = html.match(new RegExp(`<table\\b[^>]*\\bid="${tableId}"[^>]*>`));
  if (!tag) return null;
  const attr = tag[0].match(/\bdata-entities="([^"]*)"/);
  if (!attr || attr[1] === undefined) return null;
  return decodeHtmlEntities(attr[1]);
}

const ISLAND_ID = "icmsTable-abfallsammlung";

/** Extract + JSON.parse + envelope-validate. Returns the raw row array, or
 * null on absent/unparseable island (→ degrade). */
export function parseWasteIsland(html: string): unknown[] | null {
  const json = extractIslandJson(html, ISLAND_ID);
  if (json === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const env = wasteIsland.safeParse(parsed);
  if (!env.success) return null;
  return env.data.data;
}

// Single documented field regexes (ADR 0013). After JSON.parse the `name`
// value is `<a href="/_rte/anlass/<id>">Kartonsammlung </a>` (real quotes).
const NAME_RE = /<a\s+href="\/_rte\/anlass\/\d+"[^>]*>([\s\S]*?)<\/a>/i;
// _anlassDate is DD.MM.YYYY wrapped in responsive <span>s — take the first.
const DATE_RE = /\b(\d{2})\.(\d{2})\.(\d{4})\b/;

function cleanText(inner: string): string {
  return decodeHtmlEntities(inner.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/** DD.MM.YYYY → YYYY-MM-DD, or null if not a real calendar date. UTC-noon
 * round-trip rejects e.g. 32.13.2026 without any timezone influence. */
function toIsoDate(d: string, m: string, y: string): string | null {
  const yy = Number(y);
  const mm = Number(m);
  const dd = Number(d);
  const probe = new Date(Date.UTC(yy, mm - 1, dd, 12));
  if (
    probe.getUTCFullYear() !== yy ||
    probe.getUTCMonth() !== mm - 1 ||
    probe.getUTCDate() !== dd
  ) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

/**
 * Canonical raw_hash: SHA-256 over a fixed-order projection of the stable
 * fields the row derives from (ADR 0009 "Hash-1"). routeIds are sorted so a
 * pure reordering upstream is not a spurious change; a genuine route, type or
 * date change does flip it (ADR 0013).
 */
export function canonicalRawHash(p: {
  externalId: string;
  wasteType: string;
  collectionDate: string;
  routeIds: string[];
  routeNames: string;
}): string {
  const canonical = JSON.stringify([
    p.externalId,
    p.wasteType,
    p.collectionDate,
    [...p.routeIds].sort(),
    p.routeNames,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Map one validated island row to a waste-collection candidate. Returns null
 * when identity/type/date cannot be derived — that item is skipped+counted
 * per-item, never fatal (ADR 0009).
 */
export function mapRow(row: WasteRow): WasteCandidate | null {
  const externalId = row.id.trim();
  if (externalId === "") return null;

  const nameMatch = row.name.match(NAME_RE);
  if (!nameMatch || nameMatch[1] === undefined) return null;
  const wasteType = cleanText(nameMatch[1]);
  if (wasteType === "") return null;

  const dm = row._anlassDate.match(DATE_RE);
  if (!dm || dm[1] === undefined || dm[2] === undefined || dm[3] === undefined) return null;
  const collectionDate = toIsoDate(dm[1], dm[2], dm[3]);
  if (collectionDate === null) return null;

  const routeIds = row.abfallkreisIds;
  const routeNames = row.abfallkreisNameList.trim();
  const rawHash = canonicalRawHash({
    externalId,
    wasteType,
    collectionDate,
    routeIds,
    routeNames,
  });
  return { externalId, wasteType, collectionDate, routeIds, routeNames, rawHash };
}

/** Per-item strict validation (ADR 0013). null = drift/garbage for this row
 * → skipped+counted by the caller. */
export function validateRow(raw: unknown): WasteRow | null {
  const r = wasteRow.safeParse(raw);
  return r.success ? r.data : null;
}
