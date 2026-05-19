/**
 * /impressum — UWG Art. 3 minimal-compliance imprint for a non-commercial
 * private side-project. The strict commercial-Impressum requirements
 * (Handelsregister-Nr., MwSt-ID, vollständige Anschrift) do not apply;
 * a verantwortliche Person + Kontakt is sufficient and stated as such.
 * Static content; the "Stand: …" stamp tracks the revision date, NOT
 * today's date — bump it deliberately when the text changes.
 */

export const metadata = {
  title: "Impressum – regi",
};

const STAND = "19.05.2026";

export default function ImpressumPage() {
  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Impressum</h1>
      </header>

      <div className="page__prose">
        <p>
          regi ist ein privates Side-Project, nicht-kommerziell, ohne Gewinnabsicht. Diese Seite
          erfüllt die minimalen Transparenzanforderungen nach UWG Art. 3.
        </p>

        <dl>
          <dt>Verantwortlich</dt>
          <dd>
            <address>
              Yannik Kintscher
              <br />
              8105 Regensdorf ZH
            </address>
          </dd>

          <dt>Kontakt</dt>
          <dd>
            <a href="mailto:yannik@kintscher.ai">yannik@kintscher.ai</a>
          </dd>

          <dt>Rechtsform</dt>
          <dd>Privatperson; keine MwSt-Nummer, kein Handelsregister-Eintrag.</dd>
        </dl>

        <p className="page__meta">Stand: {STAND}</p>
      </div>
    </main>
  );
}
