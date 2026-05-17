# Initial Prompt – regi (erste Claude Code Session)

> Diesen Prompt beim allerersten Start in Claude Code reinkopieren, **nachdem** `CLAUDE.md` und `docs/data-sources.md` im Repo liegen.

---

## Mission

Ich starte das Projekt **regi** – eine Aggregator-Plattform für die Gemeinde Regensdorf ZH. Du wirst der Hauptentwickler, ich reviewe und entscheide bei Architektur-Weggabelungen. Ziel ist eine produktionsreife, rechtskonforme, schnelle Site, die ohne manuelle Inhaltspflege auskommt.

---

## Schritt 1 – Lesen (bevor du irgendetwas anderes tust)

Lies in dieser Reihenfolge vollständig:

1. `CLAUDE.md` im Repo-Root – das ist deine Constitution, nicht Verhandlungsbasis
2. `docs/data-sources.md` – der Quellen-Katalog mit allen technischen Details
3. Falls unsicher welche Skills verfügbar sind: `/find-skills` aufrufen

Nichts ausführen. Keine Files erstellen. Kein `pnpm install`. Kein Code.

---

## Schritt 2 – Antworten in vier Teilen

Antworte mir mit den folgenden vier Blöcken. Wenn ein Block leer bleibt, sag es explizit – nicht raten, nicht ausschmücken.

### A. Verständnis-Check (3–5 Sätze)
Fasse das Projekt in deinen eigenen Worten zusammen: Was wird gebaut, für wen, mit welchem Stack, in welcher Phasenlogik. Wenn deine Zusammenfassung an irgendeiner Stelle von `CLAUDE.md` abweicht, ist mein Prompt fehlerhaft – sag es mir.

### B. Detail-Plan für die ersten drei Schritte aus `CLAUDE.md` Sektion 11
Für jeden der ersten drei Schritte:
- Welche Befehle führst du genau aus
- Welche Files entstehen
- Welche Entscheidungen müssen **vor** Ausführung fallen (Naming, Konventionen, Versionen)
- Was sind die Risiken / Stolpersteine
- Welche der installierten Skills (falls überhaupt) sind in diesem Schritt relevant

### C. Offene Fragen an mich
Alles, was nicht aus `CLAUDE.md` oder `docs/data-sources.md` eindeutig hervorgeht. Mindestens prüfen:
- Sind Vercel-, Cloudflare-, Neon-Konten vorhanden, und unter welchem Namespace?
- Ist `regi.ch` registriert? Falls nicht: blockiert das den Start oder können wir mit `regi.app` weiter?
- Erwartetes Tempo: Wochenendprojekt (MVP in 2–3 Wochenenden) oder gestrecktes Side-Project?
- Wie willst du Reviews machen – pro PR, Daily Build, ad hoc?
- Welche Sentry-/Axiom-/Plausible-Accounts existieren oder müssen erstellt werden?
- Wann genau soll `/frontend-design` aufgerufen werden – sofort nach DB-Setup (Schritt 4) oder erst wenn die erste Seite mit Mock-Daten steht?
- Gibt es vorhandene Brand-Assets (Wappen-Vektor, Schriften-Lizenzen) oder muss alles neu beschafft werden?
- Welche Anthropic/Claude-API-Keys bestehen – relevant für eine spätere "Frag regi"-Funktion?

Stell die Fragen scharf und einzeln, keine offenen Sammelfragen.

### D. Annahmen, die ich bestätigen muss
Liste **explizit** auf, was du als gegeben akzeptierst, damit ich widersprechen kann, bevor du startest. Beispiele für die Form:
- "Ich gehe davon aus, dass das Repo `regi-web` lokal noch nicht existiert und ich es im aktuellen Verzeichnis anlege."
- "Ich gehe davon aus, dass ich Next.js in der aktuellen stable Major-Version installiere und dies in einem ADR festhalte."
- "Ich gehe davon aus, dass die Datenbank-Schemas in einer eigenen Migration entstehen, nicht als `db push`."

---

## Schritt 3 – Was du explizit nicht machen sollst

- Keine Code-Files erstellen
- Keine Package-Installationen
- Keine Design-Entscheidungen treffen oder vorwegnehmen (Farben, Schriften, Layout) – das macht `/frontend-design` später
- Keine "Verbesserungsvorschläge zur `CLAUDE.md`" einbringen, ausser du findest einen handfesten Widerspruch oder eine Lücke (dann als einzelne nummerierte Punkte am Ende)
- Keine Ausführung von Schritt 1 aus `CLAUDE.md` Sektion 11, bevor ich grünes Licht für A–D gegeben habe
- Keinen Smalltalk

---

## Schritt 4 – Wann du anfangen darfst

Erst wenn ich auf alle Punkte in B, C, D explizit geantwortet habe, fängst du mit Schritt 1 aus `CLAUDE.md` Sektion 11 an. Jeder Schritt wird einzeln committed (Conventional Commits), jede Architektur-Entscheidung wird als ADR in `docs/decisions/<NNNN>-<slug>.md` festgehalten.

Bei jeder ernsthaften Weggabelung während der Implementierung: `/advisor` aufrufen oder mich direkt fragen, nicht raten.

---

## Erinnerung

- Sprache: Code/Commits/Issues Englisch, UI und unsere Kommunikation hier auf Hochdeutsch
- Stack ist verbindlich (siehe `CLAUDE.md` Sektion 2). Falls du einen besseren Weg siehst: ADR-Vorschlag, kein Alleingang.
- Pipeline vor Inhalt vor Politur (`CLAUDE.md` Sektion 11, letzter Satz).
- Skills aktiv aufrufen, nicht improvisieren. Wenn UI-Arbeit ansteht: `/frontend-design` → `/impeccable` → `/web-design-guidelines`.

Los.
