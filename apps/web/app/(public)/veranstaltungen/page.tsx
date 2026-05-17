import { db, eq } from "@regi/db";
import { events, sources } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import { EventCard } from "@/components/event-card/event-card";
import type { EventGroup } from "@/components/event-card/format";

// Tag-based caching (CLAUDE.md §4), same discipline as /amtliches getNotices:
// the ingest webhook invalidates "source:eventfrog" on a clean persist; the
// 1-hour revalidate matches the worker's poll cadence. Volume is tiny (~150
// rows), so upcoming-filter + series-grouping are done in memory — RSC reads
// the DB directly, no extra query operators (ADR 0008). Query extraction into
// @regi/db is deferred (Issue #3 — only at 3+ reusable queries).

type SourceMeta = { name: string; url: string };

const FALLBACK_URL = "https://eventfrog.ch";

const getEventGroups = unstable_cache(
  async (): Promise<{ groups: EventGroup[]; source: SourceMeta | null }> => {
    const rows = await db
      .select({
        externalId: events.externalId,
        groupId: events.groupId,
        title: events.title,
        startAt: events.startAt,
        locationName: events.locationName,
        organizerName: events.organizerName,
        url: events.url,
        sourceSlug: sources.slug,
        sourceName: sources.name,
        sourceUrl: sources.url,
      })
      .from(events)
      .innerJoin(sources, eq(events.sourceId, sources.id));

    const now = Date.now();
    const upcoming = rows.filter((r) => r.sourceSlug === "eventfrog" && r.startAt.getTime() >= now);

    // Group by the source-native series id; ungrouped events stand alone
    // (ADR 0012 amendment). One card per key.
    const byKey = new Map<string, typeof upcoming>();
    for (const r of upcoming) {
      const key = r.groupId ?? `solo:${r.externalId}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.push(r);
      else byKey.set(key, [r]);
    }

    const groups: EventGroup[] = [];
    for (const [key, occ] of byKey) {
      occ.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      const head = occ[0];
      const tail = occ[occ.length - 1];
      if (!head || !tail) continue; // unreachable: a bucket always has ≥1
      groups.push({
        key,
        title: head.title,
        url: head.url, // link the next occurrence
        locationName: head.locationName,
        organizerName: head.organizerName,
        next: head.startAt.toISOString(),
        last: tail.startAt.toISOString(),
        furtherCount: occ.length - 1,
      });
    }
    // Soonest first (next upcoming on top).
    groups.sort((a, b) => Date.parse(a.next) - Date.parse(b.next));

    const src = await db
      .select({ name: sources.name, url: sources.url })
      .from(sources)
      .where(eq(sources.slug, "eventfrog"))
      .limit(1);

    return { groups, source: src[0] ?? null };
  },
  ["veranstaltungen/list/v1"],
  { tags: ["source:eventfrog"], revalidate: 3600 },
);

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export default async function VeranstaltungenPage() {
  const { groups, source } = await getEventGroups();
  const url = source?.url ?? FALLBACK_URL;
  const host = hostOf(url);

  const count = new Intl.NumberFormat("de-CH").format(groups.length);
  // U+00A0 keeps the count glued to its noun (Swiss editorial typography).
  const countLabel = groups.length === 1 ? "1 Veranstaltung" : `${count} Veranstaltungen`;

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Veranstaltungen</h1>
        <p className="page__meta">{countLabel}</p>
      </header>

      {groups.length === 0 ? (
        <div className="empty">
          <p>Keine Veranstaltungen angekündigt.</p>
          <p className="empty__hint">
            Diese Liste wird automatisch aktualisiert, sobald neue Veranstaltungen vorliegen.
          </p>
        </div>
      ) : (
        <ol className="notices">
          {groups.map((group) => (
            <EventCard key={group.key} group={group} />
          ))}
        </ol>
      )}

      <footer className="event__colophon">
        <span className="tag" translate="no">
          Quelle: Eventfrog
        </span>
        <span className="event__sep" aria-hidden="true">
          ·
        </span>
        <a
          className="ext"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={
            host
              ? `Datenquelle bei ${host} (öffnet in neuem Tab)`
              : "Datenquelle (öffnet in neuem Tab)"
          }
        >
          via {host ?? "Datenquelle"}
          <span className="ext__glyph" aria-hidden="true">
            ↗
          </span>
        </a>
      </footer>
    </main>
  );
}
