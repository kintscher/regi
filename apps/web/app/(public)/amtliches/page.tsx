import { db, desc, eq } from "@regi/db";
import { publications, sources } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import { getWeather } from "@/components/weather-widget/data";
import { WeatherWidget } from "@/components/weather-widget/weather-widget";

// Tag-based caching (CLAUDE.md §4): the list is cached and invalidated by the
// ingest webhook (revalidateTag "source:epublikation" /
// "source:epublikation-test"), with a 30-minute time-based safety net if a
// webhook is missed. Design-system master template (docs/design-system.md,
// ADR 0003).
const getNotices = unstable_cache(
  async () => {
    // leftJoin sources for the Source-Tag (disambiguation) and External-Link.
    // No per-item deep-link column yet, so the link targets the source
    // homepage; per-item URLs arrive later (docs/design-system.md).
    const rows = await db
      .select({
        id: publications.id,
        title: publications.title,
        body: publications.body,
        publishedAt: publications.publishedAt,
        sourceName: sources.name,
        sourceUrl: sources.url,
      })
      .from(publications)
      .leftJoin(sources, eq(publications.sourceId, sources.id))
      .orderBy(desc(publications.publishedAt))
      .limit(50);
    // unstable_cache serialises via JSON; return publishedAt as an ISO string
    // so it survives the cache boundary unambiguously (a Date round-trips to a
    // string anyway — making it explicit avoids a latent bug).
    return rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() }));
  },
  ["amtliches/list/v1"],
  { tags: ["source:epublikation", "source:epublikation-test"], revalidate: 1800 },
);

const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export default async function AmtlichesPage() {
  // Independent cache entries (tags source:epublikation* / source:weather);
  // fetched in parallel so the weather strip never serialises behind the list.
  const [items, weather] = await Promise.all([getNotices(), getWeather(1)]);

  const count = new Intl.NumberFormat("de-CH").format(items.length);
  // U+00A0 keeps the count glued to its noun (Swiss editorial typography).
  const countLabel = items.length === 1 ? "1 Mitteilung" : `${count} Mitteilungen`;

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Amtliche Mitteilungen</h1>
        <p className="page__meta">{countLabel}</p>
      </header>

      <WeatherWidget data={weather} />

      {items.length === 0 ? (
        <div className="empty">
          <p>Keine Mitteilungen vorhanden.</p>
          <p className="empty__hint">
            Diese Liste wird automatisch aktualisiert, sobald neue amtliche Publikationen vorliegen.
          </p>
        </div>
      ) : (
        <ol className="notices">
          {items.map((item) => {
            const host = item.sourceUrl ? hostOf(item.sourceUrl) : null;
            return (
              <li key={item.id}>
                <article className="notice">
                  <time className="notice__date" dateTime={item.publishedAt}>
                    {dateFormat.format(new Date(item.publishedAt))}
                  </time>
                  <div className="notice__main">
                    <h2 className="notice__title">{item.title}</h2>
                    {item.body ? <p className="notice__body">{item.body}</p> : null}
                    <footer className="notice__foot">
                      {item.sourceName ? (
                        <span className="tag" translate="no">
                          {item.sourceName}
                        </span>
                      ) : null}
                      {item.sourceName && item.sourceUrl ? (
                        <span className="notice__sep" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      {item.sourceUrl ? (
                        <a
                          className="ext"
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={
                            host
                              ? `Originalquelle bei ${host} (öffnet in neuem Tab)`
                              : "Originalquelle (öffnet in neuem Tab)"
                          }
                        >
                          Zur Quelle
                          <span className="ext__glyph" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      ) : null}
                    </footer>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
