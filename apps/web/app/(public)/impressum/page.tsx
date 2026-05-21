/**
 * /impressum — non-commercial private side-project. UWG Art. 3 Abs. 1 Bst. s
 * (elektronischer Geschäftsverkehr) does not apply: no goods, no services,
 * no advertising. The page provides contact + transparency only. The
 * "Stand: …" stamp tracks the revision date, NOT today's date — bump it
 * deliberately when the text changes.
 */

export const metadata = {
  title: "Impressum – regi",
};

const STAND = "21.05.2026";

export default function ImpressumPage() {
  return (
    <main className="page">
      <header className="page__head">
        <h1 className="page__title">Impressum</h1>
      </header>

      <div className="page__prose">
        <h2>Anbieter</h2>
        <p>
          regi ist ein privates, nicht-kommerzielles Side-Project. Es werden keine Waren oder
          Leistungen angeboten, keine Werbung geschaltet, keine personenbezogenen Daten gesammelt.
        </p>
        <p>
          Aus diesem Grund fällt regi nicht unter die Impressumspflicht nach UWG Art. 3 Abs. 1 Bst.
          s (elektronischer Geschäftsverkehr). Die folgenden Angaben dienen der Transparenz und
          Erreichbarkeit.
        </p>

        <h2>Kontakt</h2>
        <p>
          <a href="mailto:yannik@kintscher.ai">yannik@kintscher.ai</a>
        </p>

        <h2>Sitz</h2>
        <p>Schweiz</p>

        <h2>Quellcode</h2>
        <p>
          Der Code ist öffentlich auf{" "}
          <a
            href="https://github.com/kintscher/regi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Quellcode auf github.com/kintscher/regi (öffnet in neuem Tab)"
          >
            github.com/kintscher/regi
          </a>{" "}
          (MIT-Lizenz). Datenquellen siehe <a href="/quellen">Quellen</a>.
        </p>

        <p className="page__meta">Stand: {STAND}</p>
      </div>
    </main>
  );
}
