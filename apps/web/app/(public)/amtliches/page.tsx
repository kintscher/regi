import { db, desc, eq } from "@regi/db";
import { publications, sources } from "@regi/db/schema";

// Reads the live Neon dev branch on every request. A tag-based caching
// strategy follows with the ingestion worker (CLAUDE.md §4); this page exists
// only to validate the RSC → Drizzle → Neon pipeline end-to-end (§11.4) and is
// now the design-system master template (docs/design-system.md, ADR 0003).
export const dynamic = "force-dynamic";

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
  // leftJoin sources for the Source-Tag (disambiguation) and External-Link.
  // There is no per-item deep-link column yet, so the link targets the source
  // homepage; per-item URLs arrive with real ingestion (docs/design-system.md).
  const items = await db
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

  const count = new Intl.NumberFormat("de-CH").format(items.length);
  // U+00A0 keeps the count glued to its noun (Swiss editorial typography).
  const countLabel = items.length === 1 ? "1 Mitteilung" : `${count} Mitteilungen`;

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Amtliche Mitteilungen</h1>
        <p className="page__meta">{countLabel}</p>
      </header>

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
                  <time className="notice__date" dateTime={item.publishedAt.toISOString()}>
                    {dateFormat.format(item.publishedAt)}
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
