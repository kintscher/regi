import { db, desc } from "@regi/db";
import { sources } from "@regi/db/schema";
import { unstable_cache } from "next/cache";

/**
 * /quellen — auto-generated source register (§16 page-prose intro +
 * existing `.notices` list grammar). The legally-mandatory transparency
 * page: every source rendered with its name, license verbatim, last
 * successful sync and polling cadence — driven by the `sources` table so
 * nothing drifts when a source is added, renamed or relicensed.
 *
 * Cached against ALL source revalidate tags: any worker sync (or a
 * manual revalidate) refreshes /quellen too, so the last-sync column is
 * never more than one ingest run stale. Dev/test sources (slug suffix
 * `-test`) are filtered out — the page is the public source register,
 * not a debug dashboard.
 */

const POLL_FREQ: Record<string, string> = {
  epublikation: "30 Min.",
  "regensdorf-news": "60 Min.",
  weather: "30 Min.",
  eventfrog: "60 Min.",
  "regensdorf-waste": "24 Std.",
  transport: "Live, auf Abruf",
};

const getSources = unstable_cache(
  async () => {
    const rows = await db
      .select({
        id: sources.id,
        name: sources.name,
        slug: sources.slug,
        url: sources.url,
        license: sources.license,
        lastSyncedAt: sources.lastSyncedAt,
      })
      .from(sources)
      .orderBy(desc(sources.lastSyncedAt));
    return rows
      .filter((r) => !r.slug.endsWith("-test"))
      .map((r) => ({
        ...r,
        lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null,
      }));
  },
  ["quellen/list/v1"],
  {
    tags: [
      "source:epublikation",
      "source:epublikation-test",
      "source:regensdorf-news",
      "source:weather",
      "source:eventfrog",
      "source:regensdorf-waste",
    ],
    revalidate: 3600,
  },
);

const dateTimeFmt = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function fmtSync(iso: string): string {
  // «19.05.2026, 14.30» — CH editorial time uses dot, not colon.
  return dateTimeFmt.format(new Date(iso)).replace(":", ".");
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export default async function QuellenPage() {
  const items = await getSources();

  const count = new Intl.NumberFormat("de-CH").format(items.length);
  const countLabel = items.length === 1 ? "1 Quelle" : `${count} Quellen`;

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Quellen</h1>
        <p className="page__meta">{countLabel}</p>
      </header>

      <div className="page__prose">
        <p>
          regi aggregiert öffentliche Schweizer Datenquellen. Alle Inhalte stammen direkt von den
          hier aufgeführten Stellen.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>Noch keine Quellen registriert.</p>
          <p className="empty__hint">
            Diese Liste wird automatisch befüllt, sobald die Worker laufen.
          </p>
        </div>
      ) : (
        <ol className="notices">
          {items.map((src) => {
            const freq = POLL_FREQ[src.slug] ?? "—";
            const host = hostOf(src.url);
            const gutter = src.lastSyncedAt ? fmtSync(src.lastSyncedAt) : "Live";
            return (
              <li key={src.id}>
                <article className="notice">
                  {/* "Live" sources have no real date — use <span> not <time>.
                      <time> requires a valid datetime in content or dateTime
                      per HTML spec, and the gutter class styles either tag. */}
                  {src.lastSyncedAt ? (
                    <time className="notice__date" dateTime={src.lastSyncedAt}>
                      {gutter}
                    </time>
                  ) : (
                    <span className="notice__date">{gutter}</span>
                  )}
                  <div className="notice__main">
                    <h2 className="notice__title" translate="no">
                      {src.name}
                    </h2>
                    <p className="notice__body">{src.license}</p>
                    <footer className="notice__foot">
                      <span className="tag" translate="no">
                        {freq}
                      </span>
                      <span className="notice__sep" aria-hidden="true">
                        ·
                      </span>
                      <a
                        className="ext"
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={
                          host
                            ? `Datenquelle bei ${host} (öffnet in neuem Tab)`
                            : "Datenquelle (öffnet in neuem Tab)"
                        }
                      >
                        {host ?? "Quelle"}
                        <span className="ext__glyph" aria-hidden="true">
                          ↗
                        </span>
                      </a>
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
