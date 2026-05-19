/**
 * /datenschutz — revDSG-compliant privacy notice. v1 ships with no cookies,
 * no analytics, no newsletter and no personal-data collection; the text
 * documents the actual technical surface honestly (hosting providers and
 * outgoing HTTP requests to data sources) rather than the usual placeholder
 * cookie-banner-fiction. The "Stand: …" stamp tracks the revision date.
 *
 * Deliberately NOT mentioned in v1: any AI/LLM provider — regi does not use
 * one yet, and inventing a future usage in a privacy notice would mislead.
 * When that changes, this page changes first.
 */

export const metadata = {
  title: "Datenschutz – regi",
};

const STAND = "19.05.2026";

export default function DatenschutzPage() {
  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Datenschutz</h1>
      </header>

      <div className="page__prose">
        <p>
          regi sammelt aktuell keine personenbezogenen Daten. Es werden keine Cookies gesetzt, keine
          Analytics betrieben und keine Newsletter angeboten.
        </p>

        <h2>Hosting und Technik</h2>
        <p>regi wird auf folgender Infrastruktur betrieben:</p>
        <dl>
          <dt>Frontend</dt>
          <dd>Vercel (Region nach Konfiguration, primär Europa)</dd>

          <dt>Datenbezug</dt>
          <dd>Cloudflare Workers (Edge, weltweit verteilt)</dd>

          <dt>Datenbank</dt>
          <dd>Neon Postgres (Frankfurt, EU)</dd>
        </dl>
        <p>
          Diese Anbieter sehen technisch bedingte Verbindungsdaten (IP-Adresse, Zeitstempel,
          User-Agent). Wir greifen darauf nicht zu und werten sie nicht aus.
        </p>

        <h2>Externe Datenquellen</h2>
        <p>
          Zur Aktualisierung der Inhalte ruft regi periodisch öffentliche Datenquellen ab. Diese
          Anfragen enthalten einen identifizierbaren User-Agent inklusive Kontakt-Adresse, so dass
          Quellen den Datenverkehr zuordnen können. Die volle Liste der angefragten Quellen mit
          Lizenzen findet sich auf <a href="/quellen">Quellen</a>.
        </p>

        <h2>Kontakt</h2>
        <p>
          Für Datenschutz-Anfragen: <a href="mailto:yannik@kintscher.ai">yannik@kintscher.ai</a>.
        </p>

        <p className="page__meta">Stand: {STAND}</p>
      </div>
    </main>
  );
}
