import { getWeather } from "@/components/weather-widget/data";
import {
  fmtDateCH,
  fmtInt,
  fmtPrecip,
  fmtTemp,
  fmtTimeCH,
} from "@/components/weather-widget/format";
import { WeatherWidget } from "@/components/weather-widget/weather-widget";

// RSC reads the DB directly via the cached data layer (CLAUDE.md §4). The
// widget reuses observations[0]; the log below lists the rest. Both share one
// cache entry (getWeather(10), tag "source:weather").

const FALLBACK_URL = "https://api.existenz.ch";

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export default async function WetterPage() {
  const data = await getWeather(10);
  const url = data.source?.url ?? FALLBACK_URL;
  const host = hostOf(url);

  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Wetter</h1>
        <p className="page__meta">Station Zürich-Affoltern</p>
      </header>

      <WeatherWidget data={data} />

      {data.observations.length > 0 ? (
        <section aria-labelledby="weather-log-head">
          <h2 id="weather-log-head" className="weather__loghead">
            Letzte Messungen
          </h2>
          <ol className="notices">
            {data.observations.map((o) => (
              <li key={o.observedAt}>
                <article className="notice">
                  <time className="notice__date" dateTime={o.observedAt}>
                    {fmtDateCH(o.observedAt)}
                  </time>
                  <div className="notice__main">
                    <p className="weather__logline">
                      <span className="weather__logtime">{fmtTimeCH(o.observedAt)}</span>
                      <span className="weather__sep" aria-hidden="true">
                        ·
                      </span>
                      {fmtTemp(o.tempC)} °C
                      <span className="weather__sep" aria-hidden="true">
                        ·
                      </span>
                      {fmtInt(o.rhPct)} %
                      <span className="weather__sep" aria-hidden="true">
                        ·
                      </span>
                      Wind {fmtInt(o.windKmh)} km/h
                      <span className="weather__sep" aria-hidden="true">
                        ·
                      </span>
                      {fmtInt(o.pressureHpa)} hPa
                      <span className="weather__sep" aria-hidden="true">
                        ·
                      </span>
                      {fmtPrecip(o.precipMm)} mm
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="weather__colophon">
        <span className="tag" translate="no">
          Quelle: MeteoSchweiz
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
          via {host ?? "Datenquelle"}
          <span className="ext__glyph" aria-hidden="true">
            ↗
          </span>
        </a>
      </footer>
    </main>
  );
}
