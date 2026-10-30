# DotComScouts Beta 98.28 – Quellenvergleich und Regressionstest

## Stand und Umfang

- Getestet wird ausschließlich der Beta-Zweig `beta-98.27-test-suite-ci`.
- Master V98 bleibt unverändert.
- Die GitHub-Pages-Live-Testversion bleibt bis zum Abschluss der neuen Prüfung auf dem vorherigen freigegebenen Teststand.
- Fünf ergänzende Quellen laufen im normalen Trend-Suchlauf ausschließlich im Shadow-Modus: Hugging Face, npm Registry, Stack Exchange, DEV Community und Bluesky.
- Pro Quelle werden bis zu drei geeignete Trendbegriffe abgefragt. Die Quellenjobs laufen unabhängig; einzelne Abfragefehler stoppen die übrigen Quellen nicht.

## Erster echter Vergleichslauf

Der Chromium-Browserlauf vom 30.10.2026 hat den normalen Suchlauf mit drei Trendbegriffen gegen die öffentlichen APIs ausgeführt:

| Kennzahl | Ergebnis |
|---|---:|
| Rohbelege | 42 |
| Eindeutige Belege | 40 |
| Entfernte Dubletten | 2 |
| Eindeutige Belege mit mindestens 50 % Trefferquote zum jeweiligen Suchbegriff | 31 |
| Identifizierbare Autoren | 19 |

Quellenverteilung der eindeutigen Belege:
- npm Registry: 12
- Bluesky: 28
- Hugging Face: 0
- Stack Exchange: 0
- DEV Community: 0

Bei DEV Community trat für einen Suchbegriff HTTP 429 (Rate-Limit) auf. Die übrigen Abfragen liefen. Das frühere Statusmodell hätte diesen Teilfehler als vollständig erfolgreichen Quellenlauf gezählt. Das ist korrigiert: Die Diagnose unterscheidet nun abgeschlossene Adapter von erfolgreichen Einzelabfragen und weist Rohbelege, eindeutige Belege, relevante Belege sowie Teilfehler je Quelle aus.

Die erste Klassifikation ordnete alle 40 Belege als `other` ein. Das lag unter anderem daran, dass Registry-Datensätze nicht die sprachlichen Formulierungen einer Produktankündigung enthalten. Modell- und Paketdatensätze werden deshalb als Produkt-/Projektinventar klassifiziert. Das ist kein Nachfrage- oder Launchnachweis.

## Korrekturen im Beta-Code

- Relevanz wird gegen genau den Suchbegriff bewertet, mit dem die jeweilige Quelle einen Beleg abgerufen hat – nicht gegen die Wortmenge aller Suchbegriffe zusammen.
- Registry-Modelle und -Pakete werden als Produkt-/Projektinventar gekennzeichnet.
- Teilfehler einzelner Suchbegriffe werden gezählt und in der Quellenübersicht ausgewiesen.
- Die Quellenübersicht trennt Rohbelege, eindeutige Belege und Treffer mit mindestens 50 Prozent Suchbegriff-Overlap.
- URL-Dubletten entfernen bekannte Tracking-Parameter, bewahren aber inhaltlich relevante Query-Parameter und Quellenattribution.

## Kategorien und Grenzen

Die Kategorien sind heuristische Textlabels, keine semantische KI-Klassifikation:
- problem – konkreter technischer Fehler oder Problembericht
- demand – explizite Suche nach einer Lösung
- product – Produkt-/Projektinventar oder erkennbare Veröffentlichung
- tutorial – Anleitung oder Lerninhalt
- promotion – Werbung oder Veranstaltungspromotion
- discussion – Meinung oder allgemeine Diskussion
- other – keine eindeutige Zuordnung

Ein Suchwunsch ist kein bestätigter Fehler. Downloads, Popularität, Likes und Antwortzahlen sind keine unabhängigen Nachfragebelege. Die fünf Quellen liefern zudem unterschiedliche Datentypen; ihre Rohzahlen sind deshalb nicht unmittelbar als gleichwertige Marktsignale vergleichbar. Kurze Titel und fehlende Beschreibungen begrenzen die regelbasierte Klassifikation.

## Regressionstests

Die deterministische Node.js-Suite umfasst jetzt 55 Tests. Sie prüft:
- API-Fehler, leere und fehlerhafte Antworten sowie Wiederherstellung der Bedienelemente
- Trennung von Problem, Nachfrage, Produktinventar, Veröffentlichung, Werbung und Diskussion
- englische, deutsche und spanische Testbeispiele
- URL-Normalisierung, Tracking-Dubletten und Erhalt bedeutungsvoller Suchparameter
- Relevanzberechnung pro tatsächlicher Suchanfrage
- Teilfehlerdiagnostik pro Quelle
- Isolation der Shadow-Quellen von Trendbewertung, Domain-Ergebnissen und Verfügbarkeitsprüfung

Der Browser-Smoke-Test läuft jetzt gegen die lokale Beta-Datei im CI-Runner und gibt die echte Quellenvergleichszeile aus. Die öffentlichen API-Smoke-Tests prüfen zusätzlich die Erreichbarkeit und Antwortstruktur der Schnittstellen.

## Produktionsgrenzen

- Die fünf Quellen verändern weder TrendScore noch Kandidatengenerierung.
- Sie verändern keine Sprachrisiko-Bewertung, CSV-Domainexporte oder Domain-Verfügbarkeitsprüfungen.
- Es erfolgt keine automatische Übernahme der Shadow-Belege in die produktive Trendbewertung.
- Der Draft-PR wird nicht gemergt, solange keine ausdrückliche Freigabe vorliegt.
