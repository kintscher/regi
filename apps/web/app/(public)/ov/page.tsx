import { DepartureBoard } from "@/components/departure-board/departure-board";
import { fmtTimeCH } from "@/components/departure-board/format";
import { LiveRefresh } from "@/components/departure-board/live-refresh";
import { fetchStationboard } from "@/lib/sources/transport/fetch";

// On-demand, no persistence (ADR 0011): RSC fetches live; the Next data cache
// (revalidate 30 s, in fetch.ts) shields the upstream API; <LiveRefresh>
// re-renders this RSC every 60 s for the live feel. No DB read — the
// /quellen attribution row is seeded statically (pnpm db:seed:sources).
const SOURCE_URL = "https://transport.opendata.ch";

export default async function OvPage() {
  const board = await fetchStationboard();

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Abfahrten</h1>
        <p className="page__meta">Bahnhof Regensdorf-Watt</p>
      </header>

      {board.ok ? (
        <p className="ov__status">
          {/* aria-live announces only the absolute time, which changes on a
              real 60 s refresh — not the 10 s visual tick (that is the
              aria-hidden child). Polite, meaningful, not spammy. */}
          <span aria-live="polite">
            Aktualisiert{" "}
            <time className="ov__stamp" dateTime={board.fetchedAt}>
              {fmtTimeCH(board.fetchedAt)} Uhr
            </time>
          </span>
          <LiveRefresh fetchedAt={board.fetchedAt} />
        </p>
      ) : null}

      {!board.ok ? (
        <div className="empty">
          <p>Abfahrten momentan nicht verfügbar.</p>
          <p className="empty__hint">
            Die Verbindung zur Fahrplanquelle ist unterbrochen. Diese Anzeige versucht es
            automatisch erneut.
          </p>
        </div>
      ) : board.departures.length === 0 ? (
        <div className="empty">
          <p>Keine Abfahrten in nächster Zeit.</p>
          <p className="empty__hint">
            Diese Anzeige wird automatisch aktualisiert, sobald wieder Verbindungen anstehen.
          </p>
        </div>
      ) : (
        <DepartureBoard departures={board.departures} />
      )}

      <footer className="ov__colophon">
        <span className="tag" translate="no">
          Quelle: transport.opendata.ch
        </span>
        <span className="ov__sep" aria-hidden="true">
          ·
        </span>
        <span className="ov__live">Live, auf Abruf</span>
        <span className="ov__sep" aria-hidden="true">
          ·
        </span>
        <a
          className="ext"
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Datenquelle bei transport.opendata.ch (öffnet in neuem Tab)"
        >
          transport.opendata.ch
          <span className="ext__glyph" aria-hidden="true">
            ↗
          </span>
        </a>
      </footer>
    </main>
  );
}
