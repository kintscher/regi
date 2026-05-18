import { db, desc, eq } from "@regi/db";
import { publications, sources } from "@regi/db/schema";
import { unstable_cache } from "next/cache";
import { createLoader, type SearchParams } from "nuqs/server";
import { CategoryFilter } from "@/components/category-filter/category-filter";
import { kategorieParser } from "@/components/category-filter/parser";

// Tag-based caching (CLAUDE.md §4), same discipline as /amtliches & /veran-
// staltungen: the ingest webhook invalidates "source:regensdorf-news" on a
// clean persist; the 30-min revalidate matches the worker cron as a safety
// net. The FULL set is cached once (static key); the category facette filters
// in memory afterwards so one cache entry serves every view and the pill
// counts always reflect the source totals (volume ~61 — ADR 0008, no extra
// query operators; query extraction is the deferred Issue #3).
const getNews = unstable_cache(
  async () => {
    const rows = await db
      .select({
        id: publications.id,
        externalId: publications.externalId,
        title: publications.title,
        category: publications.category,
        url: publications.url,
        publishedAt: publications.publishedAt,
        sourceName: sources.name,
        sourceUrl: sources.url,
      })
      .from(publications)
      .innerJoin(sources, eq(publications.sourceId, sources.id))
      .where(eq(sources.slug, "regensdorf-news"))
      .orderBy(desc(publications.publishedAt));
    return rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() }));
  },
  ["gemeinde/list/v1"],
  { tags: ["source:regensdorf-news"], revalidate: 1800 },
);

const loadSearchParams = createLoader({ kategorie: kategorieParser });

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

export default async function GemeindePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [items, { kategorie }] = await Promise.all([getNews(), loadSearchParams(searchParams)]);

  const FALLBACK_URL = "https://www.regensdorf.ch/aktuellesinformationen";
  const sourceName = items[0]?.sourceName ?? "Gemeinde Regensdorf";
  const sourceUrl = items[0]?.sourceUrl ?? FALLBACK_URL;
  const sourceHost = hostOf(sourceUrl);

  const counts = {
    all: items.length,
    pressemitteilungen: items.filter((i) => i.category === "pressemitteilungen").length,
    news: items.filter((i) => i.category === "news").length,
  };
  const visible = kategorie ? items.filter((i) => i.category === kategorie) : items;

  const count = new Intl.NumberFormat("de-CH").format(visible.length);
  // U+00A0 keeps the count glued to its noun (Swiss editorial typography).
  const countLabel = visible.length === 1 ? "1 Mitteilung" : `${count} Mitteilungen`;

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Gemeinde Regensdorf</h1>
        <p className="page__meta">{countLabel}</p>
      </header>

      <CategoryFilter active={kategorie} counts={counts} />

      {visible.length === 0 ? (
        <div className="empty">
          <p>Keine Mitteilungen in dieser Kategorie.</p>
          <p className="empty__hint">
            Diese Liste wird automatisch aktualisiert, sobald die Gemeinde neue Mitteilungen
            publiziert.
          </p>
        </div>
      ) : (
        <ol className="notices">
          {visible.map((item) => {
            const href = item.url ?? item.sourceUrl;
            const host = href ? hostOf(href) : null;
            return (
              <li key={item.id}>
                <article className="notice">
                  <time className="notice__date" dateTime={item.publishedAt}>
                    {dateFormat.format(new Date(item.publishedAt))}
                  </time>
                  <div className="notice__main">
                    <h2 className="notice__title">{item.title}</h2>
                    <footer className="notice__foot">
                      {item.sourceName ? (
                        <span className="tag" translate="no">
                          {item.sourceName}
                        </span>
                      ) : null}
                      {item.sourceName && href ? (
                        <span className="notice__sep" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      {href ? (
                        <a
                          className="ext"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={
                            host
                              ? `Mitteilung bei ${host} öffnen (öffnet in neuem Tab)`
                              : "Mitteilung öffnen (öffnet in neuem Tab)"
                          }
                        >
                          Mitteilung öffnen
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

      <footer className="gemeinde__colophon">
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
