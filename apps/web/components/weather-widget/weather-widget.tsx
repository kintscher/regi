import type { WeatherData } from "./data";
import { describe, fmtDateTimeCH, fmtInt, fmtPrecip, fmtTemp } from "./format";
import { RelativeTime } from "./relative-time";

const STATION_LABEL = "Station Zürich-Affoltern";
const ATTRIBUTION = "Quelle: MeteoSchweiz";
const FALLBACK_URL = "https://api.existenz.ch";

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Editorial weather strip — a print-broadsheet weather box, not a card: large
 * mono figure, terse sans descriptor, a hairline-ruled data row. An instance
 * of the «Amtsblatt, neu gesetzt» system (docs/design-system.md), reusing
 * .tag/.ext/.empty unchanged. Server Component; takes already-fetched,
 * cache-bounded data (CLAUDE.md §4).
 */
export function WeatherWidget({ data }: { data: WeatherData }) {
  const o = data.observations[0];
  const url = data.source?.url ?? FALLBACK_URL;
  const host = hostOf(url);

  if (!o) {
    return (
      <section className="weather weather--empty" aria-label="Aktuelles Wetter">
        <div className="empty">
          <p>Noch keine Wetterdaten.</p>
          <p className="empty__hint">
            Diese Anzeige wird automatisch aktualisiert, sobald Messwerte vorliegen.
          </p>
        </div>
      </section>
    );
  }

  const desc = describe(o);

  return (
    <section className="weather" aria-label={`Aktuelles Wetter, ${STATION_LABEL}`}>
      <p className="weather__eyebrow">
        <span className="tag" translate="no">
          {STATION_LABEL}
        </span>
      </p>

      <div className="weather__now">
        <p className="weather__temp">
          {fmtTemp(o.tempC)}
          {o.tempC !== null ? <span className="weather__unit">°C</span> : null}
        </p>
        {desc ? <p className="weather__desc">{desc}</p> : null}
        <p className="weather__time">
          <time className="weather__stamp" dateTime={o.observedAt}>
            {/* server-rendered absolute value — the source of truth */}
            {fmtDateTimeCH(o.observedAt)}
          </time>
          <RelativeTime iso={o.observedAt} />
        </p>
      </div>

      <dl className="weather__params">
        <div className="weather__param">
          <dt>Feuchte</dt>
          <dd>{fmtInt(o.rhPct)} %</dd>
        </div>
        <div className="weather__param">
          <dt>Wind</dt>
          <dd>
            {fmtInt(o.windKmh)} km/h
            {o.gustKmh !== null ? (
              <span className="weather__sub"> Böen {fmtInt(o.gustKmh)}</span>
            ) : null}
          </dd>
        </div>
        <div className="weather__param">
          <dt>Luftdruck</dt>
          <dd>{fmtInt(o.pressureHpa)} hPa</dd>
        </div>
        <div className="weather__param">
          <dt>Niederschlag</dt>
          <dd>{fmtPrecip(o.precipMm)} mm</dd>
        </div>
      </dl>

      <footer className="weather__foot">
        <span className="tag" translate="no">
          {ATTRIBUTION}
        </span>
        <span className="weather__sep" aria-hidden="true">
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
          {host ?? "Datenquelle"}
          <span className="ext__glyph" aria-hidden="true">
            ↗
          </span>
        </a>
      </footer>
    </section>
  );
}
