import { db, desc, eq } from "@regi/db";
import { events, publications, sources, wasteCollections } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { DepartureBoard } from "@/components/departure-board/departure-board";
import { fmtDateCH, fmtTimeCH } from "@/components/event-card/format";
import { getWeather } from "@/components/weather-widget/data";
import { WeatherWidget } from "@/components/weather-widget/weather-widget";
import { nextCollections, zurichToday } from "@/lib/sources/regensdorf-waste/next-collection";
import { fetchStationboard } from "@/lib/sources/transport/fetch";

/**
 * «Heute» — the gazette front page (§15, ADR 0014). One continuous column at
 * every breakpoint; six stacked `.dash-section`s reusing the existing
 * primitives unchanged (`.weather` / `.ov` table / `.notice` rows). The
 * dashboard is essentially accent-free: per-row external `↗` links are
 * deliberately absent (§2 forbids accent floods) — the section-jump
 * `Alle anzeigen →` (ink, never accent) is the only navigation affordance.
 * The live ÖV board, body teasers and per-item ext links live on the
 * dedicated routes.
 *
 * Each section owns its own `unstable_cache` query reusing the source's
 * existing tag (the per-page-query pattern, ADR 0008) so revalidation keeps
 * flowing. `/veranstaltungen`'s module-local series-grouping is duplicated
 * here intentionally (hard-stop #3 avoidance; bounded ~30 lines, under the
 * 3-uses extraction threshold).
 */

// "Heute" is by definition day-dependent: the masthead dateline must reflect
// the current Zurich calendar day at request time, not at build time. Force
// dynamic rendering so a static prerender doesn't bake an outdated date.
export const dynamic = "force-dynamic";

// ----- date formatters --------------------------------------------------------

const TZ = "Europe/Zurich";

// Long dateline for the masthead: «Dienstag, 19. Mai 2026». Pinned to
// Europe/Zurich so the displayed day is correct even when the server runs in
// UTC (Vercel) and a request arrives near local midnight.
const datelineFmt = new Intl.DateTimeFormat("de-CH", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Calendar-date helpers for the 7-day waste horizon. UTC noon avoids DST
// roll across day boundaries (same discipline as next-collection.ts).
function isoAddDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
const isoDateFmt = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const isoWeekdayFmt = new Intl.DateTimeFormat("de-CH", {
  weekday: "long",
  timeZone: "UTC",
});
function fmtIsoDate(iso: string): string {
  return isoDateFmt.format(new Date(`${iso}T12:00:00Z`));
}
function fmtIsoWeekday(iso: string): string {
  return isoWeekdayFmt.format(new Date(`${iso}T12:00:00Z`));
}

// ----- cached queries: one per section, reusing existing source tags --------

const getLatestAmtliches = unstable_cache(
  async () => {
    // ePublikation lives under either `epublikation` or `epublikation-test`
    // depending on env (mirrors /amtliches' dual-tag caching). Trivial in-
    // memory filter on a small over-fetch keeps the SQL simple.
    const rows = await db
      .select({
        id: publications.id,
        title: publications.title,
        publishedAt: publications.publishedAt,
        sourceName: sources.name,
        sourceSlug: sources.slug,
      })
      .from(publications)
      .innerJoin(sources, eq(publications.sourceId, sources.id))
      .orderBy(desc(publications.publishedAt))
      .limit(50);
    return rows
      .filter((r) => r.sourceSlug === "epublikation" || r.sourceSlug === "epublikation-test")
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        title: r.title,
        publishedAt: r.publishedAt.toISOString(),
        sourceName: r.sourceName,
      }));
  },
  ["dash/amtliches/v1"],
  { tags: ["source:epublikation", "source:epublikation-test"], revalidate: 1800 },
);

const getLatestGemeinde = unstable_cache(
  async () => {
    const rows = await db
      .select({
        id: publications.id,
        title: publications.title,
        publishedAt: publications.publishedAt,
        sourceName: sources.name,
      })
      .from(publications)
      .innerJoin(sources, eq(publications.sourceId, sources.id))
      .where(eq(sources.slug, "regensdorf-news"))
      .orderBy(desc(publications.publishedAt))
      .limit(3);
    return rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() }));
  },
  ["dash/gemeinde/v1"],
  { tags: ["source:regensdorf-news"], revalidate: 1800 },
);

type DashEvent = {
  key: string;
  title: string;
  next: string;
  locationName: string | null;
};

const getNextEvents = unstable_cache(
  async (): Promise<DashEvent[]> => {
    const rows = await db
      .select({
        externalId: events.externalId,
        groupId: events.groupId,
        title: events.title,
        startAt: events.startAt,
        locationName: events.locationName,
        sourceSlug: sources.slug,
      })
      .from(events)
      .innerJoin(sources, eq(events.sourceId, sources.id));

    const now = Date.now();
    const upcoming = rows.filter((r) => r.sourceSlug === "eventfrog" && r.startAt.getTime() >= now);

    // Group by source-native series id (ADR 0012 amendment); mirrors the
    // /veranstaltungen rule (intentional duplication, ADR 0008 per-page-
    // query pattern; extraction is the deferred 3+-uses follow-up).
    const byKey = new Map<string, typeof upcoming>();
    for (const r of upcoming) {
      const key = r.groupId ?? `solo:${r.externalId}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.push(r);
      else byKey.set(key, [r]);
    }

    const groups: DashEvent[] = [];
    for (const [key, occ] of byKey) {
      occ.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      const head = occ[0];
      if (!head) continue;
      groups.push({
        key,
        title: head.title,
        next: head.startAt.toISOString(),
        locationName: head.locationName,
      });
    }
    groups.sort((a, b) => Date.parse(a.next) - Date.parse(b.next));
    return groups.slice(0, 3);
  },
  ["dash/events/v1"],
  { tags: ["source:eventfrog"], revalidate: 3600 },
);

const getNextWasteSpecials = unstable_cache(
  async () => {
    const rows = await db
      .select({
        externalId: wasteCollections.externalId,
        wasteType: wasteCollections.wasteType,
        collectionDate: wasteCollections.collectionDate,
        routeNames: wasteCollections.routeNames,
      })
      .from(wasteCollections)
      .innerJoin(sources, eq(wasteCollections.sourceId, sources.id))
      .where(eq(sources.slug, "regensdorf-waste"))
      .orderBy(desc(wasteCollections.collectionDate));
    return rows;
  },
  ["dash/waste-specials/v1"],
  { tags: ["source:regensdorf-waste"], revalidate: 3600 },
);

const WASTE_KIND_LABEL = { gruengut: "Grüngut", kehricht: "Kehricht" } as const;
const WASTE_TOUR_LABEL = { nord: "Tour Nord", sued: "Tour Süd" } as const;

// ----- per-section async bodies (each one its own Suspense boundary) --------

async function WetterBody() {
  const data = await getWeather(1);
  return <WeatherWidget data={data} />;
}

async function AbfahrtenBody() {
  // 5-row glance snapshot; the data-cache (30 s, in fetch.ts) shields the
  // upstream community API. No <LiveRefresh>, no .ov__status freshness line
  // — those are the /ov page's job (ADR 0011 live board).
  const board = await fetchStationboard(5);
  if (!board.ok) {
    // No path-as-text hint ("Live-Daten auf /ov.") — reads as "slash o v" to
    // screen readers and the section head's "Alle Abfahrten →" already
    // provides the route. WIG: empty-state copy without SR-noisy paths.
    return <p className="dash-section__empty">Abfahrten momentan nicht verfügbar.</p>;
  }
  if (board.departures.length === 0) {
    return <p className="dash-section__empty">Keine Abfahrten in nächster Zeit.</p>;
  }
  return <DepartureBoard departures={board.departures} />;
}

async function AbfallBody() {
  const today = zurichToday();
  const horizonIso = isoAddDays(today, 7);

  const specials = (await getNextWasteSpecials()).filter(
    (s) => s.collectionDate >= today && s.collectionDate <= horizonIso,
  );
  const regular = nextCollections(today).filter((c) => c.date <= horizonIso);

  type Row =
    | {
        kind: "regular";
        key: string;
        date: string;
        title: string;
        weekday: string;
        tour: string;
        shifted: boolean;
      }
    | {
        kind: "special";
        key: string;
        date: string;
        title: string;
        weekday: string;
        routeNames: string;
      };

  const rows: Row[] = [
    ...regular.map<Row>((c) => ({
      kind: "regular",
      key: `r-${c.kind}-${c.tour}-${c.date}`,
      date: c.date,
      title: WASTE_KIND_LABEL[c.kind],
      weekday: fmtIsoWeekday(c.date),
      tour: WASTE_TOUR_LABEL[c.tour],
      shifted: c.shifted,
    })),
    ...specials.map<Row>((s) => ({
      kind: "special",
      key: `s-${s.externalId}`,
      date: s.collectionDate,
      title: s.wasteType,
      weekday: fmtIsoWeekday(s.collectionDate),
      routeNames: s.routeNames,
    })),
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (rows.length === 0) {
    return <p className="dash-section__empty">Keine Abfuhren in den nächsten 7 Tagen.</p>;
  }

  return (
    <ol className="notices">
      {rows.map((r) => (
        <li key={r.key}>
          <article className="notice">
            <time className="notice__date" dateTime={r.date}>
              {fmtIsoDate(r.date)}
            </time>
            <div className="notice__main">
              <h3 className="notice__title">{r.title}</h3>
              <p className="abfall__meta">
                <span className="abfall__weekday">{r.weekday}</span>
                {r.kind === "regular" ? (
                  <>
                    <span className="notice__sep" aria-hidden="true">
                      ·
                    </span>
                    {r.tour}
                    {r.shifted ? (
                      <>
                        <span className="notice__sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="abfall__shift">verschoben (Feiertag)</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="notice__sep" aria-hidden="true">
                      ·
                    </span>
                    {r.routeNames}
                  </>
                )}
              </p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

async function AmtlichesBody() {
  const items = await getLatestAmtliches();
  if (items.length === 0) {
    return <p className="dash-section__empty">Keine amtlichen Mitteilungen vorhanden.</p>;
  }
  return (
    <ol className="notices">
      {items.map((it) => (
        <li key={it.id}>
          <article className="notice">
            <time className="notice__date" dateTime={it.publishedAt}>
              {fmtDateCH(it.publishedAt)}
            </time>
            <div className="notice__main">
              <h3 className="notice__title">{it.title}</h3>
              {it.sourceName ? (
                <p className="abfall__meta">
                  <span className="tag" translate="no">
                    {it.sourceName}
                  </span>
                </p>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

async function GemeindeBody() {
  const items = await getLatestGemeinde();
  if (items.length === 0) {
    return <p className="dash-section__empty">Noch keine Gemeinde-Mitteilungen.</p>;
  }
  return (
    <ol className="notices">
      {items.map((it) => (
        <li key={it.id}>
          <article className="notice">
            <time className="notice__date" dateTime={it.publishedAt}>
              {fmtDateCH(it.publishedAt)}
            </time>
            <div className="notice__main">
              <h3 className="notice__title">{it.title}</h3>
              {it.sourceName ? (
                <p className="abfall__meta">
                  <span className="tag" translate="no">
                    {it.sourceName}
                  </span>
                </p>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

async function VeranstaltungenBody() {
  const groups = await getNextEvents();
  if (groups.length === 0) {
    return <p className="dash-section__empty">Keine Veranstaltungen angekündigt.</p>;
  }
  return (
    <ol className="notices">
      {groups.map((g) => (
        <li key={g.key}>
          <article className="notice">
            <time className="notice__date" dateTime={g.next}>
              {fmtDateCH(g.next)}
            </time>
            <div className="notice__main">
              <h3 className="notice__title">{g.title}</h3>
              <p className="event__meta">
                <span className="event__time">{fmtTimeCH(g.next)} Uhr</span>
                {g.locationName ? (
                  <>
                    <span className="event__sep" aria-hidden="true">
                      ·
                    </span>
                    {g.locationName}
                  </>
                ) : null}
              </p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

// ----- the one section shell, used six times ------------------------------

function SectionShell({
  id,
  title,
  note,
  href,
  moreLabel,
  loadingHint,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  href: string;
  moreLabel: string;
  loadingHint: string;
  children: React.ReactNode;
}) {
  const headId = `dash-${id}-head`;
  return (
    <section className="dash-section" aria-labelledby={headId}>
      <div className="dash-section__head">
        <h2 id={headId} className="dash-section__title">
          {title}
          {note ? <span className="dash-section__note">{note}</span> : null}
        </h2>
        <Link className="dash-section__more" href={href}>
          {moreLabel}
          <span className="dash-section__more-glyph" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
      <Suspense fallback={<p className="dash-section__empty">{loadingHint}</p>}>
        {children}
      </Suspense>
    </section>
  );
}

// ----- the page -----------------------------------------------------------

export default function HeutePage() {
  const today = new Date();
  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Heute</h1>
        <p className="page__meta">{datelineFmt.format(today)}</p>
      </header>

      <SectionShell
        id="wetter"
        title="Wetter"
        href="/wetter"
        moreLabel="Zur Wetterseite"
        loadingHint="Wird geladen …"
      >
        <WetterBody />
      </SectionShell>

      <SectionShell
        id="abfahrten"
        title="Abfahrten"
        note="Bahnhof Regensdorf-Watt"
        href="/ov"
        moreLabel="Alle Abfahrten"
        loadingHint="Abfahrten werden geladen …"
      >
        <AbfahrtenBody />
      </SectionShell>

      <SectionShell
        id="abfall"
        title="Abfall"
        note={"nächste 7 Tage"}
        href="/abfall"
        moreLabel="Abfallkalender"
        loadingHint="Abfuhren werden geladen …"
      >
        <AbfallBody />
      </SectionShell>

      <SectionShell
        id="amtliches"
        title="Amtliches"
        href="/amtliches"
        moreLabel="Alle amtlichen Mitteilungen"
        loadingHint="Mitteilungen werden geladen …"
      >
        <AmtlichesBody />
      </SectionShell>

      <SectionShell
        id="gemeinde"
        title="Gemeinde"
        href="/gemeinde"
        moreLabel="Alle Gemeinde-Mitteilungen"
        loadingHint="Mitteilungen werden geladen …"
      >
        <GemeindeBody />
      </SectionShell>

      <SectionShell
        id="veranstaltungen"
        title="Veranstaltungen"
        href="/veranstaltungen"
        moreLabel="Alle Veranstaltungen"
        loadingHint="Veranstaltungen werden geladen …"
      >
        <VeranstaltungenBody />
      </SectionShell>
    </main>
  );
}
