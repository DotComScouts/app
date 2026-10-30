# DotComScouts Beta 98.28 – Quellenvergleich und Regressionstest

## Stand und Umfang

- Getestet wird ausschließlich der Beta-Zweig `beta-98.27-test-suite-ci`.
- Master V98 bleibt unverändert.
- Die GitHub-Pages-Live-Testversion wurde bereits separat auf Beta 98.28 aktualisiert; der neue Stand wird erst nach erfolgreicher Prüfung ausgerollt.
- Fünf ergänzende Quellen laufen im normalen Trend-Suchlauf ausschließlich im Shadow-Modus: Hugging Face, npm Registry, Stack Exchange, DEV Community und Bluesky.
- Pro Quelle werden bis zu drei geeignete Trendbegriffe abgefragt. Die Quellenjobs laufen unabhängig; ein Fehler einer Quelle soll die übrigen Quellen nicht stoppen.

## Korrektur im Quellenvergleich

Die Relevanz eines Belegs wird jetzt gegen genau den Suchbegriff bewertet, mit dem die jeweilige Quelle ihn abgerufen hat. Zuvor wurde die Trefferquote gegen die zusammengeführte Wortmenge aller Suchbegriffe berechnet. Bei mehreren unterschiedlichen Begriffen konnte das einen tatsächlich passenden Beleg unnötig abwerten.

Bei URL-Dubletten bleiben unterschiedliche Suchparameter erhalten, sofern sie inhaltlich relevant sind; bekannte Tracking-Parameter werden entfernt. Zusammengeführte Belege behalten Quellen-, Suchbegriff- und Autorenattribution. Die Quellenübersicht weist je Quelle eindeutige Belege, Belege mit mindestens 50 Prozent Trefferquote und die beobachteten Evidenzkategorien aus.

Die Kategorien sind heuristische Textlabels, keine semantische KI-Klassifikation:
- problem – konkreter technischer Fehler oder Problembericht
- demand – explizite Suche nach einer Lösung
- product – Produkt- oder Projektveröffentlichung
- tutorial – Anleitung oder Lerninhalt
- promotion – Werbung oder Veranstaltungspromotion
- discussion – Meinung oder allgemeine Diskussion
- other – keine eindeutige Zuordnung

Ein Suchwunsch wird nicht als bestätigter Fehler gewertet. Engagement-Metriken werden nicht mit Problem- oder Nachfragebelegen gleichgesetzt. Die Klassifikation bleibt eine regelbasierte Näherung und kann bei kurzen Titeln, fremdsprachigen Formulierungen und API-Datensätzen ohne Beschreibung falsch oder unvollständig sein.

## Regressionstests

Die deterministische Node.js-Suite umfasst nach dieser Änderung 54 Tests. Sie prüft unter anderem:
- API-Fehler, leere und fehlerhafte Antworten sowie Wiederherstellung der Bedienelemente
- Trennung von konkretem Problem, Nachfrage, Produktmeldung, Werbung und Diskussion
- englische, deutsche und spanische Testbeispiele
- URL-Normalisierung, Tracking-Dubletten und Erhalt bedeutungsvoller Suchparameter
- Relevanzberechnung pro tatsächlich verwendeter Suchanfrage
- Isolation der fünf Shadow-Quellen von Trendbewertung, Domain-Ergebnissen und Verfügbarkeitsprüfung

## Grenzen des Vergleichs

Die Live-API-Smoke-Tests prüfen Erreichbarkeit und Antwortstruktur. Ein erfolgreicher Browserlauf belegt, dass der normale Suchlauf die fünf Adapter aufruft; er belegt nicht, dass jeder einzelne Datensatz inhaltlich relevant ist. Die Relevanzquote ist ein einfacher Token-Overlap-Indikator und keine Qualitätsbewertung des Marktsignals.

Die Quellen liefern zudem unterschiedliche Datentypen: Modelle, Pakete, Fragen, Artikel und Kurzbeiträge sind nicht ohne Weiteres als gleichwertige Nachfragebelege vergleichbar. Insbesondere Downloads, Popularität, Likes und Antwortzahlen dürfen nicht als unabhängige Nachfrage interpretiert werden.

## Produktionsgrenzen

- Die fünf Quellen verändern weder TrendScore noch Kandidatengenerierung.
- Sie verändern keine Sprachrisiko-Bewertung, CSV-Domainexporte oder Domain-Verfügbarkeitsprüfungen.
- Es erfolgt keine automatische Übernahme der Shadow-Belege in die produktive Trendbewertung.
- Der Draft-PR wird nicht gemergt, solange keine ausdrückliche Freigabe vorliegt.
