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

Die deterministische Node.js-Suite umfasst jetzt **75 Tests: 75 bestanden, 0 fehlgeschlagen**. Sie prüft:
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

CI-Erweiterungslauf (68 Tests, alle vier Jobs erfolgreich): https://github.com/DotComScouts/app/actions/runs/41026061598

## Produktionsgrenzen

- Die fünf Quellen verändern weder TrendScore noch Kandidatengenerierung.
- Sie verändern keine Sprachrisiko-Bewertung, CSV-Domainexporte oder Domain-Verfügbarkeitsprüfungen.
- Es erfolgt keine automatische Übernahme der Shadow-Belege in die produktive Trendbewertung.
- Der Draft-PR wird nicht gemergt, solange keine ausdrückliche Freigabe vorliegt.


## Adversariale Regressionstests – 30.10.2026

Sechs zusätzliche Grenzfalltests prüfen insbesondere:
- Ein bloßer Workaround-Hinweis wird nicht automatisch als Problembericht gewertet.
- Fehlendes oder nicht genehmigtes Budget zählt nicht als positive Zahlungsbereitschaft.
- Fehlerfreie bzw. ausdrücklich problemfreie Aussagen zählen nicht als Problembeleg.
- Dringlichkeit allein erzeugt keine Nachfrage- oder Kaufabsicht.
- Die Suche nach einer kostenlosen Alternative zählt als Nachfrage, aber nicht als Kaufabsicht.

Die Korrektur der Negationserkennung behebt außerdem doppelt maskierte Regex-Zeichen; API-Timeouts werden als Problemindikator berücksichtigt. Die Regression-Suite wurde anschließend vollständig erneut ausgeführt: **68/68 bestanden**. Der CI-Lauf schloss alle vier Jobs erfolgreich ab (Regression, Browser-Smoke, API-Baseline und Live-API-Smoke).

CI-Lauf: https://github.com/DotComScouts/app/actions/runs/41026061598


## Manuell geprüfte Realwelt-Stichprobe – 30.10.2026

Für einen ersten externen Plausibilitätscheck wurden sechs öffentlich zugängliche MCP-Fehler-/Verbesserungsberichte aus den GitHub-Repositories von OpenAI und Anthropic ausgewählt. Die Kurztexte im Testfixture sind paraphrasiert; die Originalquellen sind direkt verlinkt.

| Fall | Quelle | Manuelle Einordnung | Klassifikation |
|---|---|---|---|
| MCP-Startup-Timeout und irreführende UX | [openai/codex#35611](https://github.com/openai/codex/issues/35611) | Problem + konkreter UX-Feature-Wunsch | problem ✓, featureRequest ✓ |
| Tool-Call-Timeout wird nicht durchgesetzt | [anthropics/claude-code#53641](https://github.com/anthropics/claude-code/issues/53641) | Problembericht | problem ✓ |
| Stdio-Aufruf läuft nach einer Sekunde in Timeout | [anthropics/claude-code#62121](https://github.com/anthropics/claude-code/issues/62121) | Problembericht | problem ✓ |
| Optionaler MCP-Server blockiert neue Unterhaltungen | [openai/codex#29416](https://github.com/openai/codex/issues/29416) | Problembericht | problem ✓ |
| Konfigurierbarer Timeout für lange HTTP-Aufrufe | [anthropics/claude-code#52441](https://github.com/anthropics/claude-code/issues/52441) | Problem + expliziter Feature-Wunsch | problem ✓, featureRequest ✓ |
| HTTP-Authentifizierung hängt bis zum Verbindungs-Timeout | [anthropics/claude-code#76459](https://github.com/anthropics/claude-code/issues/76459) | Problembericht | problem ✓ |

Ergebnis für diese gezielt ausgewählte Stichprobe:
- Problemberichte erkannt: **6/6**
- Explizite Feature-Wünsche separat erkannt: **2/2** der manuell so markierten Fälle
- Allgemeine Lösungssuche (demandIntent) fälschlich ausgelöst: **0/6**
- Kaufabsicht abgeleitet: **0/6**

Die Stichprobe ist klein, technisch eng umrissen und durch GitHub-Issue-Suche selektionsverzerrt. Sie misst daher weder allgemeine Klassifikationspräzision noch Marktnachfrage. Insbesondere sind Fehlerberichte und Feature-Wünsche keine unabhängigen Nachfragesignale. Die Ergebnisse sind ein Plausibilitätscheck, kein repräsentativer Benchmark.

## Anpassung nach Realwelt-Stichprobe

- Problem-Erkennung ergänzt um reale Formulierungen wie „timed out“, „hangs indefinitely“, „not enforced“ und „slow to respond“.
- Ein neues Signal featureRequest trennt explizite Funktionswünsche von allgemeiner Lösungssuche. Feature-Wünsche werden **nicht** automatisch als Nachfrage oder Kaufabsicht gezählt.
- Sechs reproduzierbare Realwelt-Testfälle sowie ein Negationstest für verneinte Feature-Wünsche wurden in tests/real-world-evidence.test.js aufgenommen und in die CI-Suite integriert.

Aktueller CI-Lauf: **75/75 deterministische Tests bestanden**; Browser-Smoke, API-Baseline und Live-API-Smoke ebenfalls erfolgreich: https://github.com/DotComScouts/app/actions/runs/41027547157


## Aktueller Stand: Evidence-Strength-Scoring – 30.10.2026

Die Klassifikationsbibliothek berechnet jetzt pro Problemcluster einen transparenten `evidenceScore` von 0 bis 100. Berücksichtigt werden unabhängige Problemberichte, explizite Lösungssuche, Bestätigung über mehrere Quellen, explizite Zahlungsbereitschaft und Dringlichkeit. Feature-Wünsche werden separat erfasst und erzeugen allein keine Nachfragepunkte. Wiederholungen derselben Person und URL-Dubletten erhöhen die unabhängigen Zähler nicht.

Der Wert misst ausschließlich die Stärke der beobachteten Belege. Er ist **keine** validierte Wahrscheinlichkeit für Umsatz oder Markterfolg. Die Schwellenwerte sind vorläufige Sortierhilfen. Die Logik bleibt in der isolierten Bibliothek und ist nicht mit der produktiven Trendbewertung verbunden.

Neue Regressionstests decken Einzelautor-Wiederholungen, unabhängige Mehrquellen-Belege, Feature-Wünsche ohne Nachfrage, Promotion-Ausschluss und URL-Deduplizierung ab.

**Aktuelle Verifikation:** 80/80 deterministische Tests bestanden. Browser-Smoke, API-Baseline und Live-API-Smoke ebenfalls erfolgreich. CI-Lauf 187: https://github.com/DotComScouts/app/actions/runs/41028193635


## Beta 98.29 – sichtbare Marktbeobachtung mit fünf Zusatzquellen – 30.10.2026

Die fünf öffentlichen Zusatzquellen werden im normalen Trend-Suchlauf nicht mehr nur im Statusprotokoll erfasst. Ein eigener Bereich „Marktbeobachtung aus fünf Zusatzquellen“ zeigt nach dem Suchlauf:
- Anzahl erfolgreich abgefragter Quellen und eindeutige Belege
- erkannte Problemberichte und explizite Lösungssuche
- Abrufstatus und Trefferzahl je Quelle, einschließlich Teilfehlern
- bis zu zwölf nach lexikalischem Themenbezug sortierte Fundstellen mit Original-Link, Quelle, Autor, Datum und Resonanz, soweit vorhanden

Die Ansicht ist in Deutsch, Englisch, Spanisch und Französisch beschriftet. Die bestehenden fünf Quellenadapter bleiben im normalen Suchlauf parallel und fehlertolerant. Ein Ausfall oder Teilfehler einer Zusatzquelle soll den normalen Domain-Suchlauf nicht abbrechen.

**Wichtige Abgrenzung:** Die Kategorien in der sichtbaren Ansicht sind heuristische Textklassifikationen. Trefferzahl, Resonanz, Problembericht und Lösungssuche sind keine validierten Marktgrößen oder Kaufabsichten. Die Zusatzquellen verändern weiterhin weder TrendScore noch Domain-Kandidaten, Sprachrisiko, CSV-Domainexporte oder Verfügbarkeitsprüfungen. Die neue Ansicht ist ein Live-Beobachtungsinstrument, kein automatischer Ranking-Faktor.

Neue Regressionstests prüfen die sichtbare Ansicht, Mehrsprachigkeit und die unveränderte Trennung vom Domain-Workflow. **83/83 deterministische Tests bestanden.** Browser-Smoke in Chromium, Live-API-Smoke und Source-API-Baseline-Smoke ebenfalls erfolgreich.

CI-Lauf Beta 98.29: https://github.com/DotComScouts/app/actions/runs/41032631176
