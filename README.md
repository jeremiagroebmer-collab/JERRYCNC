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

In der Baugruppe nach Kategorie, Unterkategorie, Aufnahme oder Text filtern, eine genaue Nummer/QR-Adresse eingeben oder den QR-Code per Kamera/Bild scannen. Der Treffer wird zunächst ausgewählt. Erst Menge und „Komponente zuordnen“ buchen die Verwendung. Unbekannter oder unzureichender Bestand verhindert die Zuordnung. Kategorien sind Suchhilfen und keine automatische technische Kompatibilitätsfreigabe.
