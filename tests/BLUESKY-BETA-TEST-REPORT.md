# DotComScouts Beta 98.28 – Quellenvergleich und Regressionstest

## Stand und Umfang

- Getestet wird ausschließlich der Beta-Zweig `beta-98.27-test-suite-ci`.
- Master V98 bleibt unverändert.
- Die aktualisierte GitHub-Pages-Live-Testversion wird nach dem erfolgreichen Beta-Testlauf auf den geprüften Stand gebracht.
- Fünf ergänzende Quellen laufen im normalen Trend-Suchlauf ausschließlich im Shadow-Modus: Hugging Face, npm Registry, Stack Exchange, DEV Community und Bluesky.
- Pro Quelle werden bis zu drei geeignete Trendbegriffe abgefragt. Fünf Adapter laufen parallel; die Suchbegriffe werden je Adapter nacheinander abgefragt.

## Echter Quellenvergleich – 30.10.2026

Der Chromium-Lauf gegen die lokale Beta-Datei hat den normalen Suchlauf mit drei automatisch ermittelten Trendbegriffen gegen öffentliche APIs ausgeführt.

| Kennzahl | Ergebnis |
|---|---:|
| Adapter abgeschlossen | 5 von 5 |
| Einzelabfragen erfolgreich | 15 von 15 |
| Rohbelege | 42 |
| Eindeutige Belege | 40 |
| Entfernte Dubletten | 2 |
| Eindeutige Belege mit mindestens 50 % Trefferquote zum jeweiligen Suchbegriff | 31 |
| Identifizierbare Autoren | 19 |

Quellenverteilung im normalen Suchlauf:

| Quelle | Rohbelege | Eindeutige Belege | Davon mindestens 50 % relevant |
|---|---:|---:|---:|
| Hugging Face | 0 | 0 | 0 |
| npm Registry | 12 | 12 | 6 |
| Stack Exchange | 0 | 0 | 0 |
| DEV Community | 0 | 0 | 0 |
| Bluesky | 30 | 28 | 25 |
| **Gesamt** | **42** | **40** | **31** |

Kategorien der 40 eindeutigen Belege:
- Produkt-/Projektinventar: 12 (npm-Pakete)
- Sonstige, nicht eindeutig klassifizierte Beiträge: 28 (Bluesky)
- Konkrete Problemberichte: 0
- Explizite Nachfrage-/Lösungssuche: 0
- Tutorials, Werbung und allgemeine Diskussion: 0

**Interpretation:** In diesem konkreten Suchlauf lieferten npm und Bluesky die verwertbaren Datensätze. Die drei anderen Adapter wurden technisch erfolgreich aufgerufen, lieferten für diese Suchbegriffe aber keine Belege. 31 Datensätze hatten einen Token-Overlap von mindestens 50 Prozent. Das ist nur eine lexikalische Relevanzheuristik – kein Nachweis von Marktinteresse. Insbesondere wurden keine konkreten Problem- oder Nachfragebelege erkannt. Daraus folgt nicht, dass es keine Nachfrage gibt; die Stichprobe und die regelbasierte Klassifikation sind dafür zu begrenzt.

Die separaten Panel-Smoke-Tests waren ebenfalls erfolgreich: Hugging Face lieferte 40 Projekte (6 nach Filter angezeigt), npm 20 Pakete, Stack Exchange 20 Fragen, DEV Community 20 Artikel und Bluesky 49 Posts. Diese Panelabfragen sind unabhängige Testabfragen und nicht mit der Quellenverteilung des normalen Suchlaufs gleichzusetzen.

## Teilfehler und Diagnosekorrektur

In einem vorherigen Vergleichslauf trat bei einer DEV-Community-Abfrage HTTP 429 (Rate-Limit) auf. Das frühere Statusmodell hätte den Adapter trotz dieses einzelnen Fehlers als vollständig erfolgreich gezählt. Die Diagnose unterscheidet jetzt abgeschlossene Adapter von erfolgreichen Einzelabfragen und weist Teilfehler je Quelle aus. Im dokumentierten Wiederholungslauf waren alle 15 Einzelabfragen erfolgreich.

## Korrekturen im Beta-Code

- Relevanz wird gegen genau den Suchbegriff bewertet, mit dem die jeweilige Quelle einen Beleg abgerufen hat – nicht gegen die Wortmenge aller Suchbegriffe zusammen.
- Registry-Modelle und -Pakete werden als Produkt-/Projektinventar gekennzeichnet. Das ist kein Nachfrage- oder Launchnachweis.
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

Ein Suchwunsch ist kein bestätigter Fehler. Downloads, Popularität, Likes und Antwortzahlen sind keine unabhängigen Nachfragebelege. Die fünf Quellen liefern unterschiedliche Datentypen; ihre Rohzahlen sind deshalb nicht unmittelbar als gleichwertige Marktsignale vergleichbar. Kurze Titel und fehlende Beschreibungen begrenzen die regelbasierte Klassifikation.

## Regressionstests

Die deterministische Node.js-Suite umfasst jetzt **62 Tests: 62 bestanden, 0 fehlgeschlagen**. Sie prüft:
- API-Fehler, leere und fehlerhafte Antworten sowie Wiederherstellung der Bedienelemente
- Trennung von Problem, Nachfrage, Produktinventar, Veröffentlichung, Werbung und Diskussion
- englische, deutsche und spanische Testbeispiele
- Negationserkennung, damit verneinte Fehler- und Nachfrageaussagen nicht als positive Signale zählen
- getrennte Zusatzsignale für Dringlichkeit, Workarounds, Budget-/Zahlungsbereitschaft und daraus abgeleitete Kaufabsicht
- URL-Normalisierung, Tracking-Dubletten und Erhalt bedeutungsvoller Suchparameter
- Relevanzberechnung pro tatsächlicher Suchanfrage
- Teilfehlerdiagnostik pro Quelle
- Isolation der Shadow-Quellen von Trendbewertung, Domain-Ergebnissen und Verfügbarkeitsprüfung

Der Browser-Smoke-Test lief gegen die lokale Beta-Datei im CI-Runner, rief alle fünf Adapter im normalen Suchlauf auf und gab die obige Quellenvergleichszeile aus. Die fünf separaten Quellenpanels und die öffentlichen API-Smoke-Tests waren ebenfalls erfolgreich.

CI-Lauf: https://github.com/DotComScouts/app/actions/runs/41020584120

## Erweiterte Signaltrennung – 30.10.2026

Die separate Klassifikationsbibliothek `lib/shadow-evidence.js` wurde um vier Zusatzmerkmale erweitert:
- `urgency`: explizite Dringlichkeit oder Blockade
- `workaroundSignal`: Hinweis auf einen manuellen oder temporären Umweg
- `budgetSignal`: Budget-, Preis- oder Zahlungsbereitschaftssprache
- `buyingIntent`: nur dann wahr, wenn explizite Lösungssuche und ein Budget-/Zahlungssignal gemeinsam vorliegen

Zusätzlich prüft die Heuristik auf unmittelbar vorausgehende Negationen. Verneinte Aussagen wie „does not crash“ sollen dadurch nicht als positiver Fehlerbeleg gewertet werden. Werbe-/Promotionsbeiträge bleiben von diesen Zusatzsignalen ausgeschlossen.

Diese Regeln sind deterministische Textheuristiken. Sie können Negationen, Ironie, Kontext, implizite Nachfrage und mehrsprachige Formulierungsvarianten weiterhin falsch einordnen. `buyingIntent` ist daher ein Indiz, kein bestätigter Kauf oder Marktumsatz. Die Erweiterung ist in der separaten Bibliothek getestet und noch nicht in die produktive Trendbewertung eingebunden.

CI-Erweiterungslauf: https://github.com/DotComScouts/app/actions/runs/41021333922

## Produktionsgrenzen

- Die fünf Quellen verändern weder TrendScore noch Kandidatengenerierung.
- Sie verändern keine Sprachrisiko-Bewertung, CSV-Domainexporte oder Domain-Verfügbarkeitsprüfungen.
- Es erfolgt keine automatische Übernahme der Shadow-Belege in die produktive Trendbewertung.
- Der Draft-PR wird nicht gemergt, solange keine ausdrückliche Freigabe vorliegt.
