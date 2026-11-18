# CNC OS

Persönliche Werkstattverwaltung für Anfrage, Kalkulation, Arbeitsvorbereitung, Fertigung und Auslieferung. Statische Web-App für GitHub Pages, ohne Build-Schritt.

## Ablauf

1. Anfrage mit Kunde, Stückzahl und Termin anlegen.
2. Im Auftrag Material, Maschine, Bearbeitungszeit und Rüstzeit kalkulieren. Fehlende Preise bleiben als fehlend sichtbar.
3. Preisvorschlag übernehmen und aus der Kalkulation einen Arbeitsgang erstellen.
4. Material reservieren, Entnahmen buchen und Bestellungen über Wareneingänge in den Bestand übernehmen.
5. Fertigung, Zeitbuchungen, Qualitätsprüfung und Dateien im selben Auftrag verwalten. Der QR-Code führt über die stabile Auftrags-ID zum Datensatz.

## Speicherung und Sicherung

Datensätze werden lokal im Browser gespeichert, Anhänge in IndexedDB. Ein anderer Browser oder ein anderes Gerät hat diese Daten nicht automatisch. Browserdaten deshalb nicht ohne Sicherung löschen.

„Daten & Sicherung“ bietet JSON-Export, geprüften Import und einen Wiederherstellungspunkt vor dem Import. **JSON-Sicherungen enthalten Datensätze und Dateiverweise, keine CAD-, PDF- oder sonstigen Anhangdateien.** Diese müssen zusätzlich separat aufbewahrt werden.

Die vorhandene Supabase-Anbindung unterstützt nach Einrichtung einen manuellen Abgleich mit Revisionsprüfung. Sie ist keine automatische Synchronisation und überträgt keine lokalen Anhangdateien. Die SQL-Dateien im Ordner `supabase` dokumentieren die vorhandene Serverstruktur. Der reine GitHub-Pages-Betrieb benötigt keinen Server; Cloud-Verbindungen müssen mit dem tatsächlich eingerichteten Projekt separat geprüft werden.

## Prüfung

`node tests/cncos.test.cjs` prüft Kalkulation, fehlende Werte, Reservierungen, Materialverbrauch, Teil-Wareneingänge, doppelte Arbeitsgänge, Sicherungsvalidierung und das Rendern der Hauptansichten. Browserprüfungen ergänzen dies für mobile Darstellung, Dialoge, Timer und QR-Code.

Die mobile Vorschau in `docs/cncos-mobile.jpg` zeigt ausschließlich Testdaten.

## Werkstatt-QR

Jede Maschine, jedes Material, Werkzeug, jede Werkzeugbaugruppe und jeder PDM-Datensatz erhält automatisch einen QR-Link über seine stabile ID. Aufträge behalten ihre bisherigen QR-Links. Etiketten lassen sich aus dem Datensatz drucken; Nummer und Bezeichnung bleiben lesbar.

Das Scan-Menü im Kopfbereich bietet Kamera, QR-Bildimport, eingefügten Link und Suche nach Nummer/Bezeichnung. Der Decoder jsQR 1.4.0 liegt mit Lizenz unter `vendor`; Bilddaten werden lokal verarbeitet. Die Kamera benötigt HTTPS bzw. localhost und eine Browserfreigabe. Sie wird bei Treffer, Navigation oder Hintergrundwechsel gestoppt. Ein Scan öffnet nur den Datensatz; Lagerbewegungen werden ausdrücklich bestätigt.

Material und Werkzeuge bieten Zugang/Entnahme mit optionalem Auftragsbezug, Bestandsprüfung und Buchungsverlauf. Werkzeugbewegungen speichern die Werkzeug-ID. Maschinen zeigen offene Arbeitsgänge und zugeordnete Baugruppen. PDM bietet Revision, Freigabestatus, HTTPS-Zeichnungslink und lokale PDF-/Bilddateien. Die QR-Links zeigen den aktuellen Datensatz, keine eingefrorene Zeichnungsrevision. Andere Geräte benötigen weiterhin denselben Datenstand; lokale Dateien werden nicht synchronisiert.

Geprüft: erzeugtes QR-Bild über den Bildimport erkannt, Datensatzlink aufgelöst, fremde Links abgewiesen, Materialentnahme samt Verlauf, lokale Dateiablage und Anzeige, Druckansicht und mobile Oberfläche. Die physische iPhone-Kamera ist in dieser Testumgebung nicht überprüfbar.

## Automatische Fertigungsunterlagen

Unter Büro oder Fertigung → „Unterlagen & Briefkopf“ lassen sich App-Name, eigene Firma, Kontakt und allgemeine Hinweise einstellen. Die Kundenfirma und Auftragsdaten kommen aus dem Auftrag. Änderungen erzeugen automatisch aktuelle PDF-Dateien im lokalen Dokumentenspeicher; über „Herunterladen“ können sie separat gespeichert werden.

Arbeitsplan → QR zum Arbeitsgangblatt → Maschine, Zeichnungen, Material, Werkzeugliste und Anleitungen. Werkzeugbaugruppen erhalten zusätzlich Komponentenblätter mit einem QR pro Einzelteil. Unter „Unterlagen zuordnen“ am Arbeitsgang können die verknüpften Unterlagen ausdrücklich gewählt und die Reihenfolge festgelegt werden. Fehlende Angaben werden sichtbar gekennzeichnet; Schnittdaten werden nur aus vorhandenen Einträgen übernommen.

Die Codes öffnen die App und erzeugen dort die aktuelle PDF. Bereits heruntergeladene oder gedruckte Dateien bleiben ein fester Stand mit Erstellungsdatum. Andere Geräte benötigen denselben Datenbestand; lokale Zeichnungsanhänge werden weiterhin nicht synchronisiert. Generierte PDFs können aus den gesicherten Datensätzen neu aufgebaut werden. Es werden keine Fertigungsdaten an einen PDF-Dienst gesendet.

`node tests/pdf.test.cjs` prüft alle sechs Dokumenttypen, Verknüpfungen, ausdrückliche leere Zuordnungen, Aktualisierung und mehrseitige Ausgabe. Die Test-PDFs enthalten ausschließlich gekennzeichnete Testdaten. Zusätzlich wurden 23 gerenderte QR-Codes wieder dekodiert und mit ihren Zieladressen verglichen. jsPDF, QR-Generator und eingebettete Schrift einschließlich Lizenzen liegen unter `vendor`.

## Werkzeugmontage nach Kategorie und QR

Neue und bisher unnummerierte Datensätze erhalten automatisch eine interne Nummer (z. B. WZ-00001, WG-00001). Vorhandene Nummern und QR-Ziele bleiben erhalten. Bezeichnung sowie Bauteilart und Unterkategorie am Einzelteil sind Pflichtfelder (*); Aufnahme, Maße, Schnittwerte und weitere Angaben sind optional.

In der Baugruppe nach Kategorie, Unterkategorie, Aufnahme oder Text filtern, eine genaue Nummer/QR-Adresse eingeben oder den QR-Code per Kamera/Bild scannen. Der Treffer wird zunächst ausgewählt. Erst Menge und „Komponente zuordnen“ buchen die Verwendung. Unbekannter oder unzureichender Bestand verhindert die Zuordnung. Kategorien dienen als Suchfilter; die zusätzliche Anschlussprüfung ist unten beschrieben.

## Bezeichnung, Materialeignung und Anschlussprüfung

Unter Werkzeuge → „Schreibweise einstellen“ bzw. Einstellungen → „Werkzeugbezeichnungen“ werden die Reihenfolge der Namensbausteine und die Durchmesser-Schreibweise festgelegt. Neue Werkzeuge erhalten einen Vorschlag; manuell bearbeitete Namen werden nicht überschrieben. Die Suche normalisiert Ø/Durchmesser, Umlaute und Wortreihenfolge.

Schneidwerkzeuge und Wendeschneidplatten führen Materialeignung, Sorte/Beschichtung und optionale ISO-Gruppen P/M/K/N/S/H. Nichtschneidende Komponenten sind materialunabhängig. Materialstammdaten erhalten eine ausdrückliche ISO-Gruppe; gängige ausgeschriebene Werkstoffgruppen werden erkannt, unbekannte Bezeichnungen bleiben offen. Im Auftrag erscheinen passende Werkzeuge zuerst, fehlende Angaben getrennt und ungeeignete Werkzeuge eingeklappt mit Bestätigung bei Auswahl und Übernahme. Stahl wird nicht als Edelstahl behandelt.

Baugruppen werden als geordnete Anschlusskette ab der gewählten Maschine geprüft. Werkzeugrollen und getrennte Ein-/Ausgangsdaten verhindern nicht passende ER-Typen, Spannzangen in direkten Schaftaufnahmen, falsche Durchmesser/Schafttypen, falsche Plattenkennungen und abweichende Spindelanschlüsse. Die Auswahl zeigt standardmäßig nur passende Teile; „Auch nicht passende zeigen“ zeigt gesperrte Einträge mit Gründen. Nummer und QR unterliegen derselben Prüfung. Ein Teil pro Anschluss, mit Ausnahme der angegebenen Plattensitze. Entfernen erfolgt vom Kettenende aus.

Bestandsdaten ohne Anschlussangaben bleiben unverändert erhalten. Sie werden als „Kompatibilität nicht geprüft“ markiert; neue Montagezuordnungen verlangen vollständige Daten. Änderungen an Maschine/Komponenten führen zur erneuten Prüfung. Es wird keine Passung aus einer alten Bezeichnung oder einem QR-Code geraten.

Die berechnete Gesamtlänge summiert **montierte axiale Längenbeiträge** ab der Spindel-Bezugsebene, nicht die ungekürzten Bauteillängen. Bei fehlenden Angaben wird nur eine Teilsumme angezeigt. Die vermessene Länge bleibt separat. PDFs enthalten Prüfstatus, Materialeignung und Sorte/Beschichtung.

Prüfumfang: eingetragene Anschlussarten/-kennungen, Spannbereiche, Schafttypen und Plattensitze. Dies ist keine Geometrie-/Kollisionssimulation und keine Herstellerfreigabe für Drehzahl, Einspannlänge, Toleranz oder Belastung. Anschlussdaten nach Herstellerunterlagen erfassen.

Prüfungen: `node tests/tooling.test.cjs`, `node tests/cncos.test.cjs`, `node tests/pdf.test.cjs`. Browserprüfung mit gekennzeichneten lokalen Testdaten: Schreibweise gespeichert, 12-mm-Fräser erfasst, bestehender Halter ergänzt, Maschinenanschluss gewählt, falsche Folgekomponente gesperrt, passende Kette mit 105 mm aufgebaut und Materialwechsel Aluminium/Stahl geprüft.

## Bestand nach Werkstattablauf (18.11.2026)

Unter **Bestand** werden Bearbeitungswerkzeuge, Aufnahmen/Zubehör und Mess-/Handwerkzeuge getrennt geöffnet. Es bleiben drei Werkzeugansichten: Lagerteile, Komplettwerkzeuge und Einsatzorte. Die Art des Lagerteils bestimmt die Eingabefelder; Pflichtfelder stehen zuerst. Ein Schaftfräser hat Schaft- und Schneidendurchmesser, aber keine Spindelaufnahme. HSK/SK/BT/Capto stehen beim Futter. Standardprofile übersetzen die wenigen Eingaben in die bestehenden Anschlussdaten. Sonderteile können mit noch unvollständigen Daten als Bestand gespeichert werden; ihre Montage bleibt bis zur Ergänzung gesperrt. Bestehende IDs, QR-Links, Daten und Baugruppen bleiben erhalten.

Maße/Hersteller, Lagerdaten, Materialeignung/Schnittwerte und Montagemaße sind getrennte optionale Gruppen. Gesamtlänge des Einzelteils und montierter axialer Längenbeitrag bleiben ausdrücklich getrennt. STEP/STP/STL, PDF und Bilder können am Lagerteil lokal hinterlegt und wieder heruntergeladen werden (maximal 15 MB; keine Simulation/Cloud-Dateiablage).

Komplettwerkzeuge lassen sich direkt einer Auftrags-Werkzeugliste und optional einem Arbeitsgang zuweisen, auch mehreren Aufträgen. Die PDF-Werkzeugliste enthält die Baugruppe und QR-Zeilen aller Komponenten; bestehende Arbeitsplan-Verknüpfungen bleiben bestehen.

Material bietet Metall/Rohmaterial, 3D-Druckmaterial und Hilfsmittel. Druckmaterial führt tatsächliche Restmenge in kg, separate ganze Rollenzahl und optional Nenngewicht je Rolle. Eine kg-Entnahme verändert die Rollenzahl nur bei ausdrücklicher Eingabe. Die zusätzlich angefragten Schreibweisen BC, BVA, ABS Plus und DPU stehen unverändert zur Auswahl; Hilfsmittel umfassen Isopropanol, Bremsenreiniger und Nitro.

Zusätzliche Prüfung: `node tests/inventory.test.cjs` (Profilableitung, passende/unpassende Kombinationen, Altbestand, Rollenbuchungen und Komponenten-QR in zugewiesenen PDFs). Browserprüfung: Fräser 12-mm-Schaft/10-mm-Schneide gespeichert, HSK-Schrumpffutter separat gespeichert, ABS Plus mit 2,5 kg/3 Rollen erfasst, 0,25 kg entnommen ohne Rollenzahländerung, Baugruppe Auftrag und Arbeitsgang zugewiesen. `docs/cncos-simple-inventory.jpg` zeigt die Eingabemaske mit lokalen Testdaten.

## Navigation und Hilfe

Die Hauptnavigation folgt Tätigkeiten: Aufträge, Bestand, Planung & Arbeit, Dateien & Wissen, Kontakte & Einkauf, Kosten & Auswertung sowie Einstellungen & Daten. Rollen schränken die Navigation nicht ein. Pfadnavigation und „Wie geht das?“ führen zum zuständigen Bereich bzw. zur Hilfe. Mobile Nutzer erreichen weitere Bereiche über Menü.

Maschinen unter Bestand zeigen und bearbeiten nur Stammdaten. Das bestehende Kostenmodell derselben Maschine wird separat unter Kosten & Auswertung → Maschinenkosten & Stundensätze gepflegt. Querverweise zu Planung und Wartung bleiben erhalten; es werden keine Maschinenkopien oder neuen Datenspeicher angelegt.

`app-guide.js` enthält die Bereichsstruktur und 38 durchsuchbare Anleitungen mit Weg, einzelnen Schritten, Ergebnis und Grenzen der Funktion. `BENUTZERHANDBUCH.md` ist die herunterladbare Gesamtfassung. Änderungen an Funktionen müssen in beiden Fassungen nachvollzogen werden. Die Hilfe ist in der App unter Hilfe & Anleitungen verfügbar, zum Beispiel über „Datei anlegen“, „Werkzeug erstellen“ oder „Werkzeug zusammenbauen“.

### Fachrichtungen und eigene Bilder

Oben unter Fachrichtung zwischen CNC-Fertigung und 3D-Druck wechseln. Bestände, Aufträge und Einstellungen sind getrennt; vorhandene Daten bleiben zunächst unter CNC-Fertigung. Unverknüpfte Maschinen und Lagerartikel können im Datensatz verschoben werden. Sicherungen und Cloud-Snapshots enthalten beide Bereiche. QR-Links tragen die Fachrichtung; ältere Links werden anhand des Datensatzes aufgelöst.

Datensätze und Bereichsseiten unterstützen eigene JPEG-, PNG- und WebP-Bilder (bis 8 MB), die auf maximal 640 Pixel verkleinert und mit den Daten gesichert werden. Ohne eigenes Foto erscheinen passende Illustrationen.
