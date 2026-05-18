import { db, desc, eq } from "@regi/db";
import { sources, wasteCollections } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import { createLoader, type SearchParams } from "nuqs/server";
import { tourParser } from "@/components/tour-filter/parser";
import { TourFilter } from "@/components/tour-filter/tour-filter";
import { nextCollections, zurichToday } from "@/lib/sources/regensdorf-waste/next-collection";

// Tag-based caching (CLAUDE.md §4): the ingest webhook invalidates
// "source:regensdorf-waste" on a clean persist; the 1-hour revalidate matches
// the worker cron as a safety net. Volume is tiny (20 rows) so the date
// window + tour facette filter in memory — RSC reads the DB directly, no
// extra query operators (ADR 0008; query extraction is the deferred Issue
// #3). The regular weekly pickups are NOT in the DB: they are computed from
// the static source rules (Fork 5, ./lib/sources/regensdorf-waste).
const getSpecials = unstable_cache(
  async () => {
    const rows = await db
      .select({
        externalId: wasteCollections.externalId,
        wasteType: wasteCollections.wasteType,
        collectionDate: wasteCollections.collectionDate,
        routeNames: wasteCollections.routeNames,
        sourceName: sources.name,
        sourceUrl: sources.url,
      })
      .from(wasteCollections)
      .innerJoin(sources, eq(wasteCollections.sourceId, sources.id))
      .where(eq(sources.slug, "regensdorf-waste"))
      .orderBy(desc(wasteCollections.collectionDate));
    return rows;
  },
  ["abfall/specials/v1"],
  { tags: ["source:regensdorf-waste"], revalidate: 3600 },
);

const loadSearchParams = createLoader({ tour: tourParser });

// Calendar-date helpers. A Date pinned to UTC noon + formatting in UTC keeps
// the calendar day stable regardless of where the server runs (mirrors the
// next-collection.ts timezone discipline).
function isoAddDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const dateFmt = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const weekdayFmt = new Intl.DateTimeFormat("de-CH", { weekday: "long", timeZone: "UTC" });

function fmtDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T12:00:00Z`));
}
function fmtWeekday(iso: string): string {
  return weekdayFmt.format(new Date(`${iso}T12:00:00Z`));
}

const KIND_LABEL = { gruengut: "Grüngut", kehricht: "Kehricht" } as const;
const TOUR_LABEL = { nord: "Tour Nord", sued: "Tour Süd" } as const;

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export default async function AbfallPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [rows, { tour }] = await Promise.all([getSpecials(), loadSearchParams(searchParams)]);

  const today = zurichToday();
  const horizon = isoAddDays(today, 30);

  // Regular weekly collections (computed, not stored). Filter by tour.
  const next = nextCollections(today).filter((c) => !tour || c.tour === tour);

  // Special collections within the 30-day window. Tour match is on the
  // published route_names text (avoids an unverified id→tour mapping); a
  // non-tour row (e.g. "Werkhof Regensdorf" Sonderabfall) is not route-bound
  // and stays visible under any tour filter — it applies to everyone.
  const tourWord = tour === "nord" ? "Nord" : tour === "sued" ? "Süd" : null;
  const specials = rows
    .filter((r) => r.collectionDate >= today && r.collectionDate <= horizon)
    .filter((r) => !tourWord || r.routeNames.includes(tourWord) || !r.routeNames.includes("Tour"))
    .sort((a, b) => (a.collectionDate < b.collectionDate ? -1 : 1));

  const sourceName = rows[0]?.sourceName ?? "Gemeinde Regensdorf";
  const sourceUrl = rows[0]?.sourceUrl ?? "https://www.regensdorf.ch/abfalldaten";
  const sourceHost = hostOf(sourceUrl);

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Abfall</h1>
        <p className="page__meta">Stand: {fmtDate(today)}</p>
      </header>

      <TourFilter active={tour} />

      <section className="abfall__section" aria-labelledby="abfall-next">
        <h2 id="abfall-next" className="abfall__sectionhead">
          Nächste Abfuhren
        </h2>
        <ol className="notices">
          {next.map((c) => (
            <li key={`${c.kind}-${c.tour}`}>
              <article className="notice">
                <time className="notice__date" dateTime={c.date}>
                  {fmtDate(c.date)}
                </time>
                <div className="notice__main">
                  <h3 className="notice__title">{KIND_LABEL[c.kind]}</h3>
                  <p className="abfall__meta">
                    <span className="abfall__weekday">{fmtWeekday(c.date)}</span>
                    <span className="notice__sep" aria-hidden="true">
                      ·
                    </span>
                    {TOUR_LABEL[c.tour]}
                    {c.shifted ? (
                      <>
                        <span className="notice__sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="abfall__shift">verschoben (Feiertag)</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="abfall__section" aria-labelledby="abfall-special">
        <h2 id="abfall-special" className="abfall__sectionhead">
          Kommende Spezialtermine
          {/* U+00A0 between 30 and Tage: number+unit must not break (WIG;
              matches the app's editorial-typography practice) */}
          <span className="abfall__sectionnote">{"nächste 30\u00A0Tage"}</span>
        </h2>
        {specials.length === 0 ? (
          <div className="empty">
            <p>Keine Spezialtermine in den nächsten 30 Tagen.</p>
            <p className="empty__hint">
              Diese Liste wird automatisch aktualisiert, sobald die Gemeinde neue Sammeltermine
              publiziert.
            </p>
          </div>
        ) : (
          <ol className="notices">
            {specials.map((s) => (
              <li key={s.externalId}>
                <article className="notice">
                  <time className="notice__date" dateTime={s.collectionDate}>
                    {fmtDate(s.collectionDate)}
                  </time>
                  <div className="notice__main">
                    <h3 className="notice__title">{s.wasteType}</h3>
                    <p className="abfall__meta">
                      <span className="abfall__weekday">{fmtWeekday(s.collectionDate)}</span>
                    </p>
                    <footer className="notice__foot">
                      <span className="tag" translate="no">
                        {s.routeNames}
                      </span>
                      <span className="notice__sep" aria-hidden="true">
                        ·
                      </span>
                      <a
                        className="ext"
                        href={`https://www.regensdorf.ch/_rte/anlass/${s.externalId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={
                          sourceHost
                            ? `Sammeltermin bei ${sourceHost} öffnen (öffnet in neuem Tab)`
                            : "Sammeltermin öffnen (öffnet in neuem Tab)"
                        }
                      >
                        Termin öffnen
                        <span className="ext__glyph" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    </footer>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="abfall__colophon">
        <span className="tag" translate="no">
          Quelle: {sourceName}
        </span>
        <span className="notice__sep" aria-hidden="true">
          ·
        </span>
        <a
          className="ext"
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={
            sourceHost
              ? `Datenquelle bei ${sourceHost} (öffnet in neuem Tab)`
              : "Datenquelle (öffnet in neuem Tab)"
          }
        >
          via {sourceHost ?? "Datenquelle"}
          <span className="ext__glyph" aria-hidden="true">
            ↗
          </span>
        </a>
      </footer>
    </main>
  );
}
