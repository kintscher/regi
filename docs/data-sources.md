# Datenquellen-Inventar – regi

**Stand:** Mai 2026
**Scope:** Regensdorf (BFS 96) inkl. Ortsteile Watt und Adlikon
**Zielgruppe:** Einwohner und Regensdorf-Interessierte
**Methodik:** Alle Quellen geprüft auf automatisierten Bezug (API, RSS, iCal, JSON, strukturiertes HTML). Wo keine API klar dokumentiert ist, wird das offen benannt.

---

## Direktantworten auf die zentralen Fragen

### 1. Hat ePublikation.ch eine öffentlich nutzbare API?
**Ja.** Das technische Backend von ePublikation.ch ist das Amtsblattportal (Betreiber: SECO, Träger: Schweizerischer Gemeindeverband). Es bietet eine dokumentierte REST-API für Import/Export von Publikationen. Dokumentation: `https://amtsblattportal.ch/#!/publish/info/technical-information`. Drittentwickler (z. B. Tamedia/zuonline.ch, das Projekt von Timo Grossenbacher) nutzen sie bereits produktiv, um Gemeinde-Meldungen automatisch weiterzuveröffentlichen. Für Regensdorf existiert eine vorgefilterte Ansicht: `https://www.zuonline.ch/amtliche-publikationen-und-amtsblatt-meldungen-gemeinde-regensdorf-atmpub-7595`.

### 2. Hat regensdorf.ch RSS-Feeds oder strukturierte Endpoints?
**Nein, keine offenen RSS-Feeds gefunden.** Die Site basiert auf einem proprietären CMS (i-web/innosolv). Strukturierte URLs existieren (`/amtpub`, `/abfalldaten`, `/aktuellesinformationen`, `/departemente`), aber HTML-Scraping ist der einzige Weg. Die amtlichen Mitteilungen werden ohnehin via ePublikation.ch zugeliefert – diese sollte man direkt anzapfen statt regensdorf.ch zu scrapen.

### 3. Welcher Anbieter macht den Abfallkalender Regensdorf, und bietet dieser eine API/iCal?
Die Logistik liegt bei der **Bader AG Regensdorf** (`bader-regensdorf.ch`); die Gemeinde publiziert nur ein **PDF** (`regensdorf.ch/_docn/5434825/Regensdorf_Entsorgungskalender_2025._WEB-Version.pdf`). Drittanbieter stellen die Daten in maschinenlesbarer Form bereit: **Localcities** (`localcities.ch/de/entsorgung/regensdorf/277`) und **mycity.ch** (`mycity.ch/?community_id=54&section_id=wastes`). Eine offen dokumentierte API ist von keinem der beiden öffentlich beworben. Im Gegensatz zur Stadt Zürich (ERZ liefert .ics) gibt es für Regensdorf **keinen offiziellen iCal-Endpoint**. Pragmatischer Weg: PDF parsen oder mycity.ch/Localcities scrapen.

### 4. Ist der Furttaler online und hat einen RSS-Feed?
Der **Furttaler** (`furttaler.ch`) ist online, amtliches Publikationsorgan für Boppelsen, Buchs, Dällikon, Dänikon, Hüttikon, Otelfingen und Regensdorf. Verlag: Swiss Regiomedia AG / FZ Furttaler Zeitung AG. **Kein offen beworbener RSS-Feed gefunden.** Mögliche Wege: HTML-Scraping der Startseite (rechtlich heikel wegen Urheberrecht an Snippets) oder kostenpflichtige Medienarchive (Swissdox). Alternative: zuonline.ch hat einen kompletten RSS-Katalog und veröffentlicht regelmässig Furttaler-Inhalte.

### 5. Welche opendata.swiss-Datensätze enthalten Regensdorf-spezifische Daten?
**Keinen Datensatz, der ausschliesslich für Regensdorf publiziert wird.** Die Gemeinde ist aber in zahlreichen kantonalen und nationalen Datensätzen als BFS-Gemeinde 96 enthalten (Wohnbevölkerung, Wahl- und Abstimmungsresultate, Steuerfüsse, Leerwohnungszählung, Pendlerströme, Bodennutzung). Filterbar nach `gemeinde=Regensdorf` oder `bfs_nr=96`. Plus alle Geodaten des Kantons ZH (Bauzonen, Gewässer, Wanderwege) via WMS/WFS und JSON-API. Zentraler Zugang: `https://opendata.swiss/de/dataset?keywords_de=regensdorf` bzw. das Statistikportal `web.statistik.zh.ch/gpv2/?bfs=96`.

---

## A) Amtliches und Gemeinde Regensdorf

### A1 – ePublikation.ch / Amtsblattportal (Kernquelle)
- **Inhalte:** amtliche Mitteilungen (Bauprojekte, Planauflagen, Gerichtliche Verbote, Stimmrechtsbeschwerden, Konkursamt, Gemeindebeschlüsse, Submissionen, Schätzungen, Handelsregister)
- **Format:** REST-API mit JSON; XML- und PDF-Export möglich; Datenmodell pro Publikationsrubrik unterschiedlich
- **Endpoint:** `amtsblattportal.ch/#!/publish/info/technical-information`
- **Auth:** Lesezugriff frei für anonyme Nutzer, ggf. Rate-Limiting; Konto erleichtert Such-Abos
- **Update:** live, sobald die Gemeinde publiziert
- **Recht:** Public-Sector-Information mit rechtlicher Verbindlichkeit; gemäss SECO-Trägerschaft offen nutzbar
- **Granularität:** filterbar nach Gemeinde (BFS 96), Rubrik, Zeitraum
- **Integration:** API-Polling alle 30–60 Minuten mit Filter `tenant=zh` und `rubric/sub-rubric`
- **Priorität:** höchste

### A2 – Amtsblatt Kanton Zürich
- **Inhalte:** kantonale Bekanntmachungen, gerichtliche Verfügungen, Konzessionen
- **Format:** über dieselbe Amtsblattportal-API verfügbar
- **Recht:** offen
- **Integration:** Subset-Query der A1-API mit `cantons=ZH`

### A3 – SHAB (Schweizerisches Handelsamtsblatt)
- **URL:** `shab.ch`
- **Inhalte:** Handelsregister, Konkurse, Stiftungsänderungen
- **Format:** über dieselbe Amtsblattportal-Plattform via REST-API
- **Filter:** nach Sitz, BFS-Nr.
- **Update:** täglich
- **Granularität:** Firmen mit Sitz in 8105 Watt / 8106 Adlikon / 8105 Regensdorf gut filterbar

### A4 – regensdorf.ch
Keine RSS-Feeds, keine offene API. Strukturierte URLs `/aktuellesinformationen`, `/amtpub`, `/abfalldaten`, `/entsorgungurecycling`, `/zahlenundfakten`, `/departemente`. HTML-Scraping der Übersichtsseiten max. 2×/Tag. Weil die wichtigsten Inhalte aus ePublikation gespeist werden, lohnt sich Scraping vor allem für Tagungstermine des Gemeinderats, Online-Schalter-Hinweise sowie eigene News (selten gepflegt). robots.txt vor Scraping prüfen; Texte sind amtliche Information (urheberrechtsfrei nach URG Art. 5, sofern keine eigene Schöpfungshöhe).

### A5 – Werkbetriebe Regensdorf
Keine eigene API. Tarife und Störungen werden auf regensdorf.ch publiziert (Scraping). Allenfalls Stromqualitäts-/Versorgungsdaten via Pronovo (Herkunftsnachweise) als Open Data – nicht regensdorf-spezifisch.

### A6 – Schulkreis Regensdorf
Die Schulgemeinde publiziert via `schule-regensdorf.ch` (separates Web). Keine API/RSS bekannt. Schulferien sind via **OpenHolidays API** (`openholidaysapi.org`) für den Kanton Zürich vollständig als REST/JSON verfügbar – ideal.

### A7 – Kirchgemeinden (ref./kath.)
Reformierte Kirchgemeinde Regensdorf-Buchs-Dällikon und kath. Pfarrei Heilig Geist haben eigene Websites. RSS/API nicht standardisiert; die Reformierten ZH publizieren teilweise via `zh.ref.ch` (Scraping). Lösung: einzelne Webseiten per HTML-Scraping mit niedriger Frequenz (1×/Tag).

### A8 – Gemeinderats- und Parlaments-Sitzungen/Protokolle
Regensdorf hat ein Gemeindeparlament; Sitzungstermine und genehmigte Protokolle werden auf regensdorf.ch publiziert (PDF). Protokoll-PDFs sind via direkter URL erreichbar, aber nicht strukturiert. Beschlüsse mit rechtlichem Charakter erscheinen parallel in ePublikation.

### A9 – Abstimmungs- und Wahlresultate
**Statistisches Amt ZH** liefert offizielle Resultate gemeindescharf via `wahlen.zh.ch` und via `opendata.swiss` (CSV/JSON). Recht: Open Government Data, CC-BY-Lizenz. Update: am Abstimmungssonntag stündlich aktualisiert. Granularität: BFS 96 Regensdorf. **Integration:** Polling am Abstimmungstag im 15-Minuten-Takt, sonst archivisch.

### A10 – Baugesuche
Werden in ePublikation.ch publiziert (siehe A1), Rubrik «Bauwesen». Zusätzlich GIS-ZH mit Bauzonen, kantonalen Planungen via WMS/WFS (`maps.zh.ch`) – kartografische Darstellung möglich. Baurekursgericht-Entscheide via `zh.ch/de/gerichte-notariate/baurekursgericht.html` (Scraping).

---

## B) Service-Daten für Einwohner

### B1 – Abfallkalender
Siehe Frage 3 oben. **Beste Lösung:** PDF von regensdorf.ch jährlich einlesen und in iCal/JSON konvertieren (deterministischer Rhythmus: Kehricht, Grüngut, Papier, Karton, Sonderabfall, Häckseldienst nach Routen Nord/Süd). Alternativ Scraping `mycity.ch/?community_id=54&section_id=wastes`. Update: 1×/Jahr (Kalender) plus Ausnahmen via ePublikation. Recht: PDF der Gemeinde ist amtlich nutzbar. **Integration:** Jahresbasis-Parsing, plus tägliches Polling auf Verschiebungen.

### B2 – ÖV-Abfahrten (Bahnhof Regensdorf-Watt, Buslinien 451–491)
**Transport API** auf `transport.opendata.ch` (REST/JSON, inoffiziell aber stabil, Backend search.ch).
- **Stationboard:** `https://transport.opendata.ch/v1/stationboard?station=Regensdorf-Watt&limit=20`
- **Verbindungen:** `/v1/connections?from=…&to=…`
- **Auth:** keine, aber Rate-Limit; bei produktiver Nutzung App-Identifikation empfohlen
- **Update:** Echtzeit (Solldaten + Verspätungen)
- **Recht:** Open Data (HRDF/INFO+ Daten der SBB)
- **Granularität:** pro Haltestelle (Regensdorf-Watt, Regensdorf Zentrum, Adlikon, Watt, Wisacher, etc.)
- **Offizielle Alternative:** `opentransportdata.swiss` mit GTFS/GTFS-RT Bulkdaten
- **Priorität:** Top

### B3 – Wetter (MeteoSwiss)
Seit Mai 2025 schrittweise Open Government Data. Bezug aktuell via Datei-Download über die **Federal Spatial Data Infrastructure (FSDI)**: STAC-API auf `data.geo.admin.ch/collections` (z. B. `ch.meteoschweiz.ogd-smn` für SwissMetNet-Bodenstationen, `ch.meteoschweiz.ogd-forecast-…` für Modelldaten). Format: NetCDF, GRIB, CSV, OGC API Features. Ein Pull-API (OGC API Features/EDR) wird laut MeteoSwiss-Roadmap **frühestens im 2. Quartal 2026** verfügbar. Authentifizierung: keine. Recht: frei nutzbar, Quellenangabe «Source: MeteoSwiss» Pflicht. Nächste SwissMetNet-Station Zürich/Affoltern (ZH-AF) ist nur wenige Kilometer entfernt.

**Praktischer Tipp:** Für eine niedrigschwellige Live-Anzeige existiert das inoffizielle, von Christian Studer betriebene `api.existenz.ch` mit Wetterdaten der nächstgelegenen MeteoSwiss-Stationen (JSON, CORS, 5-Minuten-Refresh; nicht-kommerzielle Nutzung explizit erlaubt). Dokumentation: `https://api.existenz.ch/`.

### B4 – Verkehrslage A1/Gubrist
Das ASTRA betreibt `viasuisse.ch` und liefert Echtzeitmeldungen über DATEX II auf `data.geo.admin.ch` / `opentransportdata.swiss` (Verkehrslage-Feed des Bundes). Webcams Gubrist: ASTRA stellt Standbilder bereit. Update: 1–5 Minuten. Recht: OGD. Granularität: Stau- und Baustellenmeldungen sind streckenscharf, lokal relevant für A1/A20.

### B5 – E-Auto-Ladestationen
**ich-tanke-strom.ch** des Bundesamtes für Energie (BFE) bietet eine Open-Data-Liste aller öffentlichen Ladepunkte mit Standort, Stecker, Leistung, teilweise Belegung. CSV/JSON via opendata.swiss. Recht: OGD, frei nutzbar. Alternativ OpenChargeMap-API (`openchargemap.io/site/develop/api` – freier API-Key).

### B6 – Tankstellenpreise
In der Schweiz **keine staatliche offene Datenbank**. comparis/carfax aggregieren, aber ohne offene API. Nur via Web-Scraping oder kostenpflichtige Datenfeeds. **Lücke.**

### B7 – Apotheken-Notdienst
`apotheken.zh.ch` (Apothekerverband Kanton Zürich) listet Notdienste, aber **ohne offen dokumentierte API**. HTML-Scraping möglich, niedrige Frequenz (1×/Tag).

### B8 – Spital Limmattal Wartezeiten
Keine öffentliche API bekannt. **Lücke.**

---

## C) Lokale und regionale Presse

### C1 – Furttaler
`furttaler.ch`: kein RSS-Feed gefunden; HTML-Scraping technisch möglich, urheberrechtlich aber heikel (Snippets > Stichwort sind geschützt). Empfehlung: nur **Titel und Permalink** spiegeln, nie ganze Texte. Update: wöchentlich (Freitag).

### C2 – Zürcher Unterländer / zuonline.ch
Bietet einen vollständigen **RSS-Katalog** (`zuonline.ch/rss-346733169567`). Themenspezifische Feeds und insbesondere die fertige Regensdorf-Aggregationsseite `zuonline.ch/amtliche-publikationen-…-regensdorf-atmpub-7595` sind sehr nützlich, allerdings Tamedia-Paywall für Volltexte. Auch Tagesanzeiger und Berner Zeitung führen identische Aggregationsseiten (Tamedia-Netzwerk). **Integration:** RSS-Polling alle 2 h, nur Titel/Anrisstexte verlinken.

### C3 – Limmattaler Zeitung / CH Media
RSS pro Themen-Tag verfügbar (`limmattalerzeitung.ch`); Filter auf «Regensdorf» möglich. Update: kontinuierlich.

### C4 – 20 Minuten / Blick / Nau.ch
Bieten allgemeine News-RSS-Feeds, kein offizieller Ortsfilter. Scraping der Themen-/Tag-Seiten (`blick.ch/themen/regensdorf`, `nau.ch/ort/regensdorf`) liefert pragmatisch lokale Treffer; Update täglich.

### C5 – SRF News / TeleZüri / Tele Top
SRF bietet öffentliche RSS-Feeds pro Region (`srf.ch/feed/rss`). TeleZüri keine offene API, aber Themen-Seiten scrapebar.

### C6 – NZZ / Tages-Anzeiger
RSS-Feeds nur für Hauptressorts, regionale Filter eingeschränkt; Bezahlschranke für Volltexte. Nur Titel/Lead anzeigen.

**Rechtlicher Hinweis Presse:** Reine Schlagzeilen sind in der Schweiz nach Lehrmeinung nicht urheberrechtlich geschützt; Anrisstexte schon. Bei Presse-RSS-Feeds nur Titel, Datum, Quelle, Link anzeigen – nicht den vollen Text reproduzieren. robots.txt-Konformität ist DSG/URG-rechtlich nicht zwingend, aber im Schweizer Aggregator-Streit (Tamedia vs. NewsAggregator) wurde robots.txt-Compliance als Argument gewertet.

---

## D) Vereine und Gemeinschaft

Die meisten Vereine in Regensdorf (Schwingclub, Schützenverein, Turnverein Regensdorf, Naturschutzverein NVR, Pfadi, Cevi, Jubla, Musikgesellschaft, Furttaler Bühne) führen einfache CMS-Sites **ohne API/RSS**. **Lücke**; nur HTML-Scraping einzelner Vereinsseiten mit niedriger Frequenz. Veranstaltungen werden aber erfasst, wenn Vereine sie auf Eventfrog publizieren (siehe G1) – dann sind sie strukturiert verfügbar. Politische Parteien (lokale SVP/SP/FDP/Grüne/GLP) publizieren via Mutterpartei-Websites; keine kommunale API.

---

## E) Sport (Regensdorfer Vereine)

### E1 – FC Regensdorf
Klubseite `fcregensdorf.ch`. Spielplan/Resultate werden zentral vom **Schweizerischen Fussballverband (SFV) / Fussballverband Region Zürich (FVRZ)** geführt. Match Center: `matchcenter.football.ch`. Vereinsseite: `fvrz.ch/.../verein-fvrz.aspx/v-1499/` (FC Regensdorf 2 = Vereins-ID 1499; das erste Team hat ID 11040). **Keine offizielle JSON-API**, aber sehr strukturiertes HTML – Scraping einfach. ClubCorner-Daten ebenfalls über `club.football.ch`. Update: nach Spieltagen. Recht: SFV-Daten sind nicht explizit OGD; Wiederveröffentlichung von Spielplänen und Ergebnissen ist Praxis (z. B. Transfermarkt, Sofascore).

### E2 – Weitere Verbände
Swiss Handball (`handball.ch`), Swiss Volley, Swiss Athletics führen je eigene Match-Center mit Vereinsseiten – durchgängig HTML-Scraping. Falls Regensdorf-Vereine angemeldet sind, lokale Resultate scrapebar.

### E3 – EHC Kloten (nahegelegen)
Spielplan über Swiss Ice Hockey (`sihf.ch`); ebenfalls HTML-Scraping.

---

## F) Gastronomie und Geschäfte

### F1 – Google Places API (Places API New)
Beste POI-Quelle. Endpoint `https://places.googleapis.com/v1/places:searchNearby`. Bounding-Box Regensdorf: ca. lat 47.43–47.45, lon 8.45–8.50. Liefert Restaurants, Cafés, Geschäfte mit Öffnungszeiten, Bewertungen, Fotos. Authentifizierung: API-Key, **kostenpflichtig** (monatliches Gratiskontingent ausreichend für Aggregator mit Caching). Recht: kommerzielle Lizenz mit Auflagen, insb. Pflicht zur Verlinkung zurück zu Google und Verbot, Daten dauerhaft zu cachen (max. 30 Tage für die meisten Felder).

### F2 – OpenStreetMap Overpass API
Endpoint `https://overpass-api.de/api/interpreter`. Query nach `amenity=restaurant`, `shop=*`, `tourism=*` in Bounding-Box von Regensdorf. Format: JSON/XML. Authentifizierung: keine, aber Fair-Use (eigene Instanz für Produktion empfohlen). Recht: ODbL – Attribution «© OpenStreetMap-Mitwirkende» Pflicht, Share-Alike bei abgeleiteten Datensätzen. **Top-Priorität für Open-Data-Setup.**

### F3 – local.ch / search.ch
Branchenverzeichnis. **Keine offen lizenzierte API für Drittentwickler**; Scraping vertraglich unerwünscht. **Faktische Lücke.**

### F4 – Yelp Fusion API
API-Key nötig, kommerzielle Lizenz; Datendichte in Regensdorf ist gering. Eher zweitrangig.

### F5 – TripAdvisor Content API
Stark eingeschränkt, Partner-Programm. Praktisch nicht offen nutzbar.

### F6 – Foursquare/Swarm
Foursquare Places API (FSQ): kommerziell, API-Key, Free Tier ausreichend. POI-Daten und Tipps. Lokal mässig dicht.

### F7 – Lunch-Menüs
**lunchgate.ch / lunch-check.ch** publizieren Tagesmenüs, keine offizielle API. Einzelne Restaurants haben Website-Menüs (Scraping pro Restaurant aufwendig). **Lücke** für strukturierten Mittagstisch-Aggregator.

### F8 – Hotels
booking.com / Expedia: API nur für Affiliates/Partner. Für eine simple Anzeige der Hotels mit Adressen reicht Google Places oder OSM (F1/F2).

---

## G) Kultur und Veranstaltungen

### G1 – Eventfrog (Top-Quelle)
`eventfrog.ch` ist der grösste Veranstaltungskalender der Deutschschweiz mit über 20'000 Events. Offene **REST-API** für Drittentwickler, dokumentiert auf `eventfrog.ch/de/kooperationen/api-schnittstelle.html`. Such-/Filterfunktionen nach Ort, Region, Kategorie, Datum. Authentifizierung: Registrierung als Partner. Recht: Datenbankrecht von Eventfrog, aber explizite Partner-Nutzung für Städte/Medien/Tourismusregionen vorgesehen (Beispiel: Stadt Bülach). Update: Echtzeit. Granularität: Filter auf Ort Regensdorf direkt möglich. **Empfehlung:** API-Polling stündlich, plus iFrame-Fallback. **Top-Priorität.**

### G2 – Ticketcorner / Starticket
Keine offenen APIs für Drittentwickler; Listen über die Websites scrapebar, rechtlich grenzwertig.

### G3 – Cineman.ch / Kitag / Pathé
Kino-Programme: `cineman.ch` hat keine offen dokumentierte API, aber strukturierte URLs pro Kino/Datum. Für Regensdorf relevant: Pathé Dietlikon, Kitag Spreitenbach (beide in der Nähe). HTML-Scraping pro Tag.

### G4 – Eventbrite / Meetup / Facebook Events
Eventbrite-API: Schweiz mässig genutzt, eher Tech-Events. Meetup-API: nur eingeschränkt für eigene Gruppen. Facebook-Events-API ist seit dem App-Review-Lockdown 2018/2019 für externe Aggregatoren **faktisch geschlossen**.

### G5 – Bibliothek Regensdorf
Die Bibliothek nutzt typischerweise das winMedio/Bibliotheksverbund-Kantonsbibliothek-Zürich-Backend; OPAC ist über `winmedio.net`-Endpunkte verfügbar, aber keine standardisierte JSON-API. Veranstaltungen werden via regensdorf.ch publiziert (Scraping).

### G6 – Forum Regensdorf / Mehrzweckhalle
Wenn dort durchgeführte Veranstaltungen auf Eventfrog oder Ticketcorner sind, kommen sie über G1.

### G7 – Migros Kulturprozent / Klubschule
Veranstaltungen: `migros-kulturprozent.ch`/`klubschule.ch` haben Volltextsuchen, aber keine offene API; Scraping mit Geo-Filter möglich.

---

## H) Freizeit, Outdoor, Sehenswürdigkeiten

### H1 – SchweizMobil
`schweizmobil.ch`/`map.schweizmobil.ch` (Wanderland, Veloland). Daten der nationalen Routen sind als WMS/WFS auf `data.geo.admin.ch` (Bundesgeodaten) frei verfügbar. Recht: OGD swisstopo. Für lokale Routen rund um Adlikon, Watt, Katzensee, Altburg-Wald nutzbar.

### H2 – swisstopo / geo.admin.ch
REST-API `api3.geo.admin.ch/rest/services/ech/SearchServer` plus alle Karten als WMTS/WMS. Sehenswürdigkeiten, POI, Adressregister. Recht: OGD, frei. **Top-Quelle für Kartenmaterial.**

### H3 – MySwitzerland.com / Zürich Tourismus
Schweiz Tourismus betreibt die Plattform `discover.swiss` (kommerzielles Tourismus-Daten-Hub) mit API – Authentifizierung und Partnervertrag nötig. Für Regensdorf liefert sie wenig spezifisches; Zürich-Tourismus-Daten sind potenziell verwendbar.

### H4 – Wikipedia/Wikidata
Wikidata-Eintrag für Regensdorf: **Q64205**. SPARQL-Endpoint `https://query.wikidata.org/sparql`. Liefert Geo-Koordinaten, Einwohnerzahl, historische Daten, verknüpfte Sehenswürdigkeiten. Recht: CC0. **Sehr nützlich für strukturierte Faktenbox.** Wikipedia-Artikel als CC-BY-SA per REST-API `https://de.wikipedia.org/api/rest_v1/page/summary/Regensdorf`.

### H5 – Wikimedia Commons
Bilder zu Regensdorf via Commons-API (`commons.wikimedia.org/w/api.php`). Recht: pro Bild prüfen (meist CC-BY-SA oder CC0). Granularität: Kategorie «Regensdorf» und «Watt, Regensdorf».

### H6 – Komoot/Wikiloc/Strava
Strava-Segment-API: API-Key, Free Tier ausreichend für öffentliche Segmente. Komoot-Highlights: keine offen dokumentierte API. Wikiloc: Premium-API. Für Wanderaggregation aufwändig.

### H7 – Badewasserqualität Katzensee
**AWEL Kanton Zürich** publiziert Badewasserqualität als Open Data auf `awel.zh.ch` bzw. `opendata.swiss`; einzelne Stationen mit Messwerten (E. coli, intestinale Enterokokken). Update: wöchentlich in Badesaison. Strandbad Katzensee gehört zur Stadt Zürich, ist aber direkt an der Regensdorfer Gemeindegrenze.

---

## I) Bildung und Schule

### I1 – OpenHolidays API
`https://openholidaysapi.org` liefert REST/JSON für Schulferien und Feiertage der Schweiz inkl. Kanton ZH. Recht: CC-BY 4.0. Update: bei Bedarf jährlich. **Empfehlung:** tägliches Polling oder Cache pro Schuljahr.

### I2 – Bildungsdirektion ZH
Ferienkalender als OGD: `https://www.zh.ch/de/bildung.html` – Termine im PDF; ergänzt durch I1.

### I3 – Schulkreis Regensdorf
Eigene Site `schule-regensdorf.ch`. Keine API; Scraping für aktuelle Mitteilungen (Schliessungen wegen Krankheit, etc.).

### I4 – Bibliothek Regensdorf
Siehe G5.

---

## J) Wirtschaft und Gewerbe

### J1 – Zefix (Handelsregister)
Offizielle REST-API auf `https://www.zefix.admin.ch/ZefixPublicREST/api/v1/` mit JSON. Authentifizierung: für allgemeine Suche keine, einzelne Endpoints registrierungspflichtig. Recht: offene Bekanntmachung, Open Government Data. Filter: nach BFS-Gemeinde (96) oder PLZ (8105, 8106). Update: täglich. **Top-Quelle für Firmenlisten in Regensdorf.**

### J2 – Konkursamt
Über A1 (ePublikation/SHAB).

### J3 – Stellenbörsen
jobs.ch, jobup, jobsuchmaschine.ch, Indeed: jobs.ch hat eine restriktive Affiliate-API, Indeed Publisher-API (eingeschränkt). Offen nutzbar ist die **Bundes-API für offene Stellen der Bundesverwaltung** sowie das vom SECO betriebene `job-room.ch` mit RAV-Stellen – Letzteres ist über opendata.swiss als Bulk-Dump verfügbar. Filter auf PLZ-Bereich Regensdorf möglich.

### J4 – Immobilien (homegate, immoscout24, comparis)
Keine offen dokumentierten APIs für Drittentwickler. **Faktische Lücke.** Workaround: RSS einzelner Suchen funktioniert teilweise nicht mehr; Scraping ist vertraglich untersagt. Statistische Eckdaten via **BFS Leerwohnungszählung** und **Raiffeisen-Indizes** (deren öffentliches Gemeindecockpit `raiffeisen.ch/.../gemeindeinfo.regensdorf.html` ist scrapebar, aber nicht offen lizenziert).

---

## K) Statistik und Hintergrund

### K1 – Statistisches Amt Kanton Zürich
Statistikportal «Zürcher Gemeinden in Zahlen» (`zh.ch/de/politik-staat/gemeinden/gemeindeportraet.html`, neu: `web.statistik.zh.ch/gpv2/?bfs=96`) liefert >300 Indikatoren pro Gemeinde. Open Data via `zh.ch/de/politik-staat/opendata.html`. Format: CSV, JSON, plus JSON-API-Endpoint für den Metadatenkatalog. Recht: OGD, freie Nutzung. Update: jährlich/quartalsweise je nach Indikator. **Top-Quelle für Faktenbox.**

### K2 – BFS / opendata.swiss
Bundesamt für Statistik mit STAT-TAB API (`pxweb`-Standard). Filter auf BFS-Gemeinde-Nr. 96. Endpoint-Beispiele: `https://www.pxweb.bfs.admin.ch/api/v1/de/`. Recht: OGD. **Hohe Verlässlichkeit.**

### K3 – GIS-ZH
`https://maps.zh.ch/apidoc` dokumentiert URL-Parameter und REST-API der kantonalen Geo-Dienste. WMS/WFS/WCS für alle offenen Geodaten. Filter pro Gemeinde geometrisch möglich.

---

## L) Verkehr und Mobilität

### L1 – ÖV
Siehe B2.

### L2 – ASTRA Verkehrsdaten (A1, Gubrist)
Über `data.geo.admin.ch` (DATEX II) und `opentransportdata.swiss` (Strassenlage-Feed). Recht: OGD.

### L3 – ZVV-Linieninfos / Störungen
ZVV hat einen Push-Service; offizielle Echtzeit-Störungsfeeds sind über opentransportdata.swiss als SIRI-SX bezogen. Authentifizierung: API-Manager-Registrierung kostenlos.

### L4 – Mobility CarSharing
Liste der Standorte als Open Data über `mobility.ch` (Public Endpoint, JSON); einzelne Standorte in Regensdorf identifizierbar.

### L5 – PubliBike / E-Trotti-Sharing
PubliBike-Stationenliste: GBFS-Feed (`gbfs.publibike.ch/gbfs.json`). Voi/Tier: GBFS, sofern in der Stadt Zürich; in Regensdorf operativ nicht stark.

### L6 – E-Auto-Ladestationen
Siehe B5.

### L7 – Parkhaus-Belegung
Keine Regensdorf-spezifische Live-Daten bekannt. Allenfalls APCOA/Q-Park via deren Apps – keine offene API.

---

## M) Sicherheit und Notfall

### M1 – Alertswiss
Inhalte: Alarme, Warnungen, Informationen (Trinkwasser, Brände, Naturgefahren). Format: Webseite `alert.swiss`, App, sowie ein **Alertswiss NewsML-Kanal** seit Mai 2021 für Privatradios. Eine offen dokumentierte JSON-API für externe Aggregatoren ist nicht öffentlich beworben; auf Anfrage beim BABS kann der NewsML-Feed bezogen werden. Recht: amtliche Information, frei nutzbar. **Integration:** für Drittentwickler aktuell Web-Scraping `alert.swiss` mit Geo-Filter Kanton ZH, plus separat ein Antragsprozess für den NewsML-Feed.

### M2 – MeteoSwiss Unwetterwarnungen
Als Teil der MeteoSwiss-OGD (B3); zudem in der MeteoSwiss-App integriert. Endpoint via FSDI STAC.

### M3 – Hochwasser-Warnungen
BAFU `hydrodaten.admin.ch` mit Echtzeit-Pegeldaten als REST/JSON. Furtbach hat Messstation; Katzensee ist stehendes Gewässer ohne Echtzeitdaten.

### M4 – Polizeimeldungen Kapo Zürich
Mediencommuniqués auf `zh.ch/de/sicherheit-justiz/kantonspolizei.html` bzw. Newsroom. Es existiert ein offen dokumentierter **RSS-Feed des Newsrooms Kanton Zürich** (`zh.ch/de/news.rss` und ressortspezifische Varianten). Granularität: kantonsweit, Filter nach Gemeinde im Titel scrapebar. Update: live. Recht: amtliche Information.

### M5 – Erdbeben
Schweizerischer Erdbebendienst SED (`seismo.ethz.ch`): offene REST-API `http://www.seismo.ethz.ch/fdsnws/event/1/` (FDSN-Standard). Recht: frei. Format: QuakeML/JSON. Granularität: Geo-Filter auf Region möglich.

### M6 – Luftqualität
NABEL (Bundes-Messnetz) und AWEL Kanton ZH (`awel.zh.ch`/`luftqualitaet.zh.ch`) bieten Stundenwerte als Open Data (CSV/JSON) auf `opendata.swiss`. Nächstgelegene Stationen: Zürich-Stampfenbachstrasse, Dübendorf-Empa.

### M7 – Pollen / UV
MeteoSwiss als Teil der OGD-Veröffentlichung (B3), Pollendaten via aha! Allergiezentrum (keine offene API).

---

## N) Bilder und Medien

### N1 – Wikimedia Commons
Siehe H5.

### N2 – Flickr
API mit Geo-Search (`flickr.photos.search` mit lat/lon/radius). API-Key gratis. Recht: pro Foto-Lizenz prüfen (oft CC-BY).

### N3 – Webcams
MeteoSwiss-Webcams: keine in Regensdorf direkt. ASTRA Gubrist-Webcam: Standbild-URL prüfen (`viasuisse.ch` bzw. `astra.admin.ch`). Lokale, von Privatleuten betriebene Webcams (z. B. `webcam.ch`-Verzeichnis) keine API.

---

## O) Real-Time und Live-Daten

Erdbeben (M5), Luftqualität (M6), Pollen/UV (M7) bereits abgedeckt. Zusätzlich:

### O1 – Solarstrahlung / Photovoltaik-Potenzial
swisstopo `sonnendach.ch` als offene Datenbank pro Dach – statisch, einmal pro Adresse abrufbar.

### O2 – Strompreise/Stromtarife Regensdorf
ElCom-Tarifvergleich via `strompreis.elcom.admin.ch`, Daten als OGD. Werkbetriebe Regensdorf sind dort hinterlegt.

---

## Priorisierte Top-15-Quellen

| Rang | Quelle | Kategorie | Aufwand | Mehrwert | Frequenz |
|-----:|--------|-----------|---------|----------|----------|
| 1 | **ePublikation.ch / Amtsblattportal REST-API** | Amtliches A1 | gering | sehr hoch | 30 min |
| 2 | **Transport API (transport.opendata.ch)** | ÖV B2 | sehr gering | sehr hoch | live/auf Abruf |
| 3 | **Eventfrog REST-API** | Kultur G1 | gering | sehr hoch | stündlich |
| 4 | **Statistik Kanton Zürich + opendata.swiss (BFS 96)** | Statistik K1/K2 | gering | hoch | jährlich/auf Abruf |
| 5 | **OpenHolidays API (Ferien/Feiertage ZH)** | Bildung I1 | sehr gering | hoch | jährlich |
| 6 | **Newsroom Kanton ZH RSS (inkl. Kapo)** | Sicherheit M4 | sehr gering | hoch | 30 min |
| 7 | **OSM Overpass API (POIs Regensdorf)** | F2/H | gering | hoch | wöchentlich |
| 8 | **Wikidata Q64205 + Wikipedia-API** | Hintergrund H4 | sehr gering | mittel | monatlich |
| 9 | **Zefix REST-API (Firmen 8105/8106)** | Wirtschaft J1 | gering | hoch | täglich |
| 10 | **swisstopo geo.admin.ch / GIS-ZH WMS** | Karten H2 | mittel | hoch | statisch |
| 11 | **api.existenz.ch (Wetter-Stationen ZH)** | Wetter B3 | sehr gering | hoch | 5 min |
| 12 | **Abstimmungs-Resultate Statistisches Amt ZH** | Politik A9 | gering | hoch | event-getrieben |
| 13 | **zuonline.ch RSS + Aggregationsseite Regensdorf** | Presse C2 | sehr gering | hoch | 2 h |
| 14 | **FVRZ / matchcenter.football.ch (Scraping FC Regensdorf)** | Sport E1 | mittel | mittel | nach Spieltagen |
| 15 | **hydrodaten.admin.ch (Furtbach-Pegel)** + Alertswiss-Scraping | Sicherheit M2/M3 | gering | mittel | 15 min |

---

## Lücken (kein automatisierter Bezug möglich)

- **Tankstellenpreise** – keine offene Datenquelle in CH
- **Spital-Wartezeiten Limmattal** – keine API
- **Apotheken-Notdienst ZH** – nur via Scraping, keine API
- **Immobilien-Inserate Regensdorf in Echtzeit** – homegate/immoscout-APIs nicht offen
- **local.ch / search.ch Branchendaten** – rechtlich blockiert
- **Lunch-Menüs einzelner Restaurants** – keine flächige Quelle
- **Facebook Events** – seit 2018 weitgehend geschlossen
- **Vereinstermine** (Schwingclub, Turnverein, etc.) – nur wenn auf Eventfrog
- **Schulkreis Regensdorf interne Mitteilungen** – kein RSS
- **Live-Webcam Regensdorf** – keine bekannte
- **Parkhaus-Belegung Regensdorf-Watt** – keine offene API
- **Furttaler Volltexte** – RSS-frei, urheberrechtlich geschützt

Diese Lücken sollten gezielt durch Kooperationen mit den jeweiligen Quellen (Gemeinde, Furttaler-Redaktion, Vereinsdachverbänden) und – wenn unumgänglich – durch eine minimale manuelle Pflege-Ebene geschlossen werden.

---

## Rechtliche Aspekte (Schweizer Recht)

### Urheberrecht (URG)
Amtliche Texte (Gesetze, Verordnungen, amtliche Mitteilungen) sind nach Art. 5 URG urheberrechtlich frei. Das gilt für alle Inhalte aus ePublikation.ch, Amtsblatt, Kapo-Communiqués, Bundesgerichts-Entscheide. Für Presse-Texte gilt voller Urheberschutz; Titel sind im Allgemeinen nicht geschützt, kurze Anrisse können geschützt sein. Praxis: nur Titel + Link + Datum + Quelle anzeigen, niemals den ganzen Artikel spiegeln. Bildmaterial nie ohne explizite Lizenzbestätigung übernehmen.

### Datenbankrecht / Schutz von Sammelwerken
Die Schweiz kennt – anders als die EU mit der Datenbank-Richtlinie – kein eigenständiges Sui-generis-Datenbankrecht. Gegen das systematische Auslesen kommerzieller Datenbanken (local.ch, homegate) kann jedoch UWG (unlauterer Wettbewerb, Art. 5 lit. c) greifen. Vorsicht.

### Datenschutz (revDSG, in Kraft seit September 2023)
Ein Aggregator, der nur öffentlich publizierte Daten anzeigt, verarbeitet selten Personendaten in heikler Form. Achtung bei Baugesuchen (Adressen, ggf. Bauherr-Namen) und bei amtlichen Publikationen mit Personenbezug (Gerichtliche Verbote, Schuldbetreibungen): Verarbeitung ist zulässig, weil die Quelle selbst öffentlich macht, aber Indexierung über Google sollte für Detail-Seiten via `noindex` ausgeschlossen werden, um nicht eine «zweite Stigmatisierung» zu schaffen (Praxis vieler Schweizer Behörden).

### robots.txt-Compliance
Rechtlich nicht zwingend, aber gerichtlich (Tamedia vs. NewsAggregator-Fälle) als Indiz für Lauterkeit gewertet. **Empfehlung: alle robots.txt der Quellen respektieren.**

### Open-Data-Lizenzen
opendata.swiss verwendet überwiegend CC-BY und «Freie Nutzung» – Quellenangabe Pflicht. Bei swisstopo OGD und MeteoSwiss OGD ist die Quellenangabe explizit gefordert. OSM (ODbL) erfordert Attribution und Share-Alike abgeleiteter Datensätze (nicht aber abgeleiteter Anzeige).

### Praxis-Empfehlungen für rechtssichere Architektur
1. Eigener Footer mit `/quellen`-Seite, die jede genutzte Datenquelle inkl. Lizenz nennt
2. Beim ersten Crawl der robots.txt der jeweiligen Domain ablegen und nachhalten
3. Bei Presse-Quellen: Headline + bis zu 200 Zeichen Anriss + Link, kein eigenes Caching der Volltexte
4. Ein User-Agent mit aussagekräftigem Namen und Kontakt-Mail (`regi/1.0 (+https://regi.ch; contact: yannik@kintscher.ai)`)
5. Bei kommerziellen APIs (Google Places, Yelp, Foursquare): Caching-Vorgaben strikt einhalten und Logos/Attributionen anzeigen

---

## Empfohlene Architektur in Stichworten

- Backend als Polling-Worker pro Quelle mit individuellen Frequenzen (Cron oder Event-Queue)
- Eine relationale DB für strukturierte Inhalte (Events, Publikationen, Statistik-Indikatoren) plus Volltext-Index (z. B. Postgres FTS oder Meilisearch) für News-Snippets
- Caching-Schicht mit ETag-Respekt und Conditional GETs, vor allem für OSM Overpass und Transport API
- Frontend: regionale Wetter-/ÖV-Widgets via Existenz.ch und Transport API, Eventkalender mit Eventfrog, amtliche Mitteilungen direkt aus ePublikation, Karten via swisstopo Tiles
- Heartbeat-Monitoring pro Quelle, weil informelle APIs (Existenz.ch, Transport API, FVRZ-Scraping) ohne Vorwarnung ändern können
- Versionierung der gefetchten Rohdaten in einem Object Store (`regi-raw` in Cloudflare R2), damit Quellenänderungen rückverfolgbar sind und ein Audit-Trail rechtlich abgesichert ist

Mit dieser Auswahl von rund 15 verlässlichen, technisch sauber erschliessbaren Quellen lässt sich ein automatisierter, qualitativ hochwertiger und rechtskonformer Aggregator für Regensdorf bauen, der ohne manuelle Inhaltspflege auskommt. Die strategisch wichtigste Investition liegt in der sauberen Anbindung von **ePublikation.ch, Transport API und Eventfrog** – diese drei Quellen decken zusammen den Grossteil des alltäglichen Informationsbedarfs ab und stehen offen, dokumentiert und mit klarer rechtlicher Grundlage zur Verfügung.
