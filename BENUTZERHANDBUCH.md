# CNC OS – Anleitung und Funktionsübersicht

Stand: 18.11.2026. Über Hilfe & Anleitungen in der App nach Tätigkeiten suchen.

## Erster Auftrag: der komplette Ablauf

**Weg:** Aufträge

Von der Kundenanfrage bis zur Lieferung in einer Auftragsakte.

1. Aufträge öffnen und eine neue Anfrage mit Kunde, Teil und Stückzahl anlegen.
2. Im Auftrag unter Zeichnung & Dateien die Zeichnung hinterlegen.
3. Unter Kalkulation vorhandenes Material, Maschine, Werkzeugbedarf, Mengen und Zeiten wählen. Fehlende Stammdaten unter Bestand ergänzen.
4. Preis prüfen und den Auftragsstatus passend setzen. Unter Fertigung Arbeitsgänge anlegen und Maschine sowie Unterlagen zuordnen.
5. Material reservieren und tatsächliche Entnahmen buchen. Komplettwerkzeuge zusammenstellen und der Werkzeugliste zuordnen.
6. Zeiten erfassen, Prüfung dokumentieren und Status bis Fertig, Versandbereit, Ausgeliefert und gegebenenfalls Bezahlt weiterführen.

**Hinweis:** Die App versendet keine Angebote, Rechnungen oder Pakete automatisch.

## Wo finde ich welche Funktion?

**Weg:** Menü / Alle Bereiche

Die Navigation folgt Aufgaben, nicht deiner Rolle.

1. Aufträge: alles zu einem Kundenauftrag, einschließlich Kalkulation, Unterlagen und Status.
2. Bestand: vorhandene Maschinen, Werkzeuge, Material und Lagerbewegungen.
3. Planung & Arbeit: Arbeitsgänge, Zeiterfassung, Prüfungen und Wartung.
4. Dateien & Wissen: Zeichnungen, Programme, Arbeitsanleitungen und erzeugte PDFs.
5. Kontakte & Einkauf: Kunden, Lieferanten und Bestellungen. Kosten & Auswertung: Stundensätze, Buchungen, Finanzierung und Kennzahlen.
6. Einstellungen & Daten: Mitarbeiter, Einstellungen, Sicherung und Cloud. Über die Pfadnavigation gelangst du zurück zum zuständigen Bereich.

**Hinweis:** Querverweise öffnen denselben Datensatz. Es wird keine Kopie angelegt. Mitarbeiterrollen sind Angaben im Personalstamm, keine Zugriffsrechte.

## Auftrag oder Anfrage anlegen

**Weg:** Aufträge → Neue Anfrage

Legt eine Auftragsakte mit eindeutiger Nummer an.

1. Neue Anfrage öffnen. Bezeichnung, Kunde, Stückzahl und bei Bedarf Termin erfassen.
2. Speichern. Den Auftrag aus der Liste öffnen.
3. Die weiteren Angaben über Übersicht, Kalkulation, Fertigung, Material & Werkzeuge sowie Zeichnung & Dateien ergänzen.

**Hinweis:** Die erzeugte Nummer identifiziert den Auftrag; sein QR-Link bleibt über die interne ID stabil.

## Aufträge finden und Status ändern

**Weg:** Aufträge → Auftrag öffnen

Filter helfen beim Finden; der Status zeigt den aktuellen Arbeitsstand.

1. Nach Firma, Auftragsnummer und Status filtern oder den Suchbegriff eingeben.
2. Auftrag öffnen und unter Übersicht „Status wählen“ verwenden.
3. Nur den tatsächlich erreichten Status setzen; bei Bedarf zurücksetzen.

**Hinweis:** Ein Statuswechsel bucht weder Material noch Geld automatisch.

## Auftrag kalkulieren und Preis festlegen

**Weg:** Aufträge → Auftrag → Kalkulation

Berechnet geplante Kosten aus den erfassten Mengen und Sätzen.

1. Materialartikel, Materialmenge und Maschine wählen.
2. Bearbeitungs- und Rüstzeit, Werkzeugbedarf und weitere Kosten ergänzen.
3. Aufschlag und Preis prüfen, Kalkulation speichern und gegebenenfalls Preis übernehmen.
4. Bei Fehlmengen eine Einkaufsanfrage oder aus der Kalkulation einen Arbeitsgang erstellen.

**Hinweis:** Leer bedeutet unbekannt, nicht null Euro. Die Vorschau ist eine Planung, kein nachgewiesener Ist-Gewinn.

## Datei anlegen / hochladen

**Weg:** Aufträge → Auftrag → Zeichnung & Dateien

Hinterlegt eine vorhandene Datei in der Auftragsakte.

1. Auftrag öffnen und Zeichnung & Dateien wählen.
2. „Datei hinzufügen“ auswählen. PDF, STEP/STP, STL oder ein unterstütztes Bild vom Gerät wählen.
3. Nach dem Hochladen erscheint die Datei in der Liste; anklicken zum Öffnen oder Herunterladen.
4. Alternativ über „Link bearbeiten“ einen erreichbaren HTTPS-Zeichnungslink eintragen.

**Hinweis:** Maximal 15 MB pro Datei. Uploads liegen auf diesem Gerät und sind nicht im JSON-Backup enthalten. CAD-Geometrie wird nicht in der App erstellt oder simuliert.

## Zeichnung oder Bauteil verwalten

**Weg:** Dateien & Wissen → Zeichnungen & Bauteile

Verwaltet Bezeichnung, Zeichnungsnummer, Revision, Freigabe und einen Dateilink.

1. Neuen Eintrag anlegen und Bauteilname eingeben.
2. Bauteil-/Zeichnungsnummer, Revision und HTTPS-Dateilink ergänzen.
3. Speichern und Freigabestatus pflegen. Im Auftrag die passende Bauteilnummer angeben oder im Arbeitsgang ausdrücklich zuordnen.

**Hinweis:** Dieser Bereich hieß zuvor PDM / Teamcenter. Er ist keine Verbindung zu Siemens Teamcenter. Für lokale Datei-Uploads die Auftragsakte verwenden.

## Werkzeug erstellen

**Weg:** Bestand → Bearbeitungswerkzeuge

Erfasst ein wiederverwendbares Lagerteil, etwa einen Schaftfräser, Bohrer oder eine Platte.

1. „+ Bearbeitungswerkzeug“ wählen und die Art auswählen.
2. Die mit * markierten Felder oben ausfüllen. Beim Schaftfräser sind dies insbesondere Schaft- und Schneidendurchmesser sowie Schafttyp.
3. Bezeichnung prüfen; Schneidenlänge, Gesamtlänge, Hersteller und Bestand darunter bei Bedarf ergänzen.
4. Speichern. Interne Nummer und QR-Code werden automatisch vergeben.

**Hinweis:** Die Maschinenaufnahme gehört zum Halter. Gesamtlänge des Einzelteils und montierter Längenbeitrag sind verschiedene Maße.

## Halter, Spannzange oder Verlängerung anlegen

**Weg:** Bestand → Aufnahmen & Zubehör

Erfasst die Komponenten zwischen Maschine und Schneidwerkzeug.

1. Aufnahmen & Zubehör öffnen und einen neuen Eintrag anlegen.
2. Art wählen, zum Beispiel Spannzangenfutter, Schrumpffutter oder Spannzange.
3. Die passenden Aufnahmeangaben ausfüllen: beispielsweise SK40 und ER32 am Futter oder der Spannbereich an der Spannzange.
4. Optionale Maße, Hersteller, Bestand und Lagerplatz ergänzen. Speichern.

**Hinweis:** Bei Sonderteilen fehlende Anschlussdaten vor dem Zusammenstellen ergänzen. Ohne ausreichende Angaben wird die Kompatibilität nicht bestätigt.

## Messmittel und Handwerkzeug erfassen

**Weg:** Bestand → Mess- und Handwerkzeuge

Verwaltet allgemeine Werkzeuge getrennt von Montagekomponenten.

1. Bereich öffnen und Mess-/Handwerkzeug hinzufügen.
2. Art und Bezeichnung wählen.
3. Bestand, Lagerplatz und gegebenenfalls nächste Prüfung ergänzen. Speichern.

**Hinweis:** Ein Prüfdatum dokumentiert den Termin; es führt keine Kalibrierung durch.

## Werkzeug zusammenbauen

**Weg:** Bestand → Komplettwerkzeuge zusammenstellen

Verbindet vorhandene Lagerteile zu einem wiederverwendbaren Komplettwerkzeug.

1. Komplettwerkzeug anlegen, speichern und öffnen.
2. Unter Aufbau ab der Maschine die Maschine mit erfasstem Spindelanschluss wählen.
3. Die interne Nummer oder den QR-Link der ersten Komponente eingeben, oder QR-Code scannen. Alternativ aus der Liste auswählen.
4. Menge prüfen und „Komponente zuordnen“ wählen. Danach passende Spannmittel, Verlängerungen und Schneidwerkzeug der Reihe nach hinzufügen.
5. Vermessene Länge, Offset, Lagerort und Status über Bearbeiten ergänzen.

**Hinweis:** Die Auswahl prüft hinterlegte Anschlüsse und freien Bestand. Entfernen erfolgt vom Kettenende. Es findet keine Kollisionssimulation statt.

## Werkzeugliste für Auftrag und Maschine erstellen

**Weg:** Bestand → Komplettwerkzeuge → Baugruppe

Übernimmt die Baugruppe mit ihren Komponenten in die Fertigungsunterlagen.

1. Komplettwerkzeug öffnen und „Zur Werkzeugliste hinzufügen“ wählen.
2. Auftrag und optional den zugehörigen Arbeitsgang auswählen.
3. Zuordnung speichern.
4. Im Auftrag unter Fertigung das Werkzeugliste-PDF öffnen oder die PDF-Unterlagen aufrufen.

**Hinweis:** Das PDF enthält Baugruppe und Komponenten mit QR-Verweisen. Bei Änderungen PDFs neu herunterladen; bereits gedruckte Blätter ändern sich nicht.

## Materialeignung und Schnittwerte pflegen

**Weg:** Bestand → Bearbeitungswerkzeuge → Bearbeiten

Speichert Herstellerangaben und eigene Erfahrungen getrennt.

1. Materialeignung & Schnittwerte im Formular aufklappen.
2. Geeignete Materialien, bei Bedarf ISO-Gruppen und Sorte/Beschichtung eintragen.
3. Herstellerwerte und eigene Vc/fz/ap/ae-Werte mit Bedingungen ergänzen.
4. Im Auftrag passende Werkzeuge wählen; ungeeignete Werkzeuge bleiben mit Warnung sichtbar.

**Hinweis:** Die App prüft die gespeicherten Angaben, keine Einsatzfreigabe des Herstellers.

## 3D-Modell am Werkzeug hinterlegen

**Weg:** Bestand → Lagerteil → Herstellerdaten & 3D-Dateien

Speichert Herstellerdateien zum späteren Herunterladen für CAM.

1. Werkzeug oder Aufnahme öffnen.
2. Datei hinzufügen und STEP/STP, STL, PDF oder Bild auswählen.
3. Über den Dateieintrag wieder herunterladen und im externen CAM verwenden.

**Hinweis:** Lokal auf diesem Gerät, maximal 15 MB. Keine integrierte CAM-Simulation; Originaldateien zusätzlich sichern.

## Material anlegen

**Weg:** Bestand → Metall & Rohmaterial

Erfasst Material, Einheit, Bestand und Lagerplatz.

1. Material hinzufügen und eindeutige Bezeichnung sowie Bestandseinheit angeben.
2. Werkstoffnummer, Abmessungen und Materialgruppe ergänzen, wenn bekannt.
3. Gezählten Bestand, Mindestbestand und Einstandspreis je gewählter Einheit eintragen. Speichern.

**Hinweis:** Mengen und Preise müssen dieselbe Einheit verwenden. Unbekannte Werte leer lassen.

## Filament: Rollen und Kilogramm verwalten

**Weg:** Bestand → 3D-Druckmaterial

Verwaltet tatsächliche Restmenge und physische Rollenzahl getrennt.

1. Material hinzufügen, Bezeichnung und Einheit kg angeben.
2. Tatsächliche Restmenge als Bestand und vorhandene Rollen separat erfassen.
3. Bei Bedarf Nenngewicht je Rolle, Materialart, Farbe und Filamentdurchmesser ergänzen.
4. Verbrauch über Entnahme buchen. Rollenzahl nur mitbuchen, wenn tatsächlich Rollen hinzukommen oder wegfallen.

**Hinweis:** Eine angebrochene Rolle zählt weiter als Rolle. BC, BVA, ABS Plus und DPU sind als eingegebene Bezeichnungen vorhanden.

## Hilfsmittel verwalten

**Weg:** Bestand → Hilfsmittel

Verwaltet Reiniger und Verbrauchsmittel als Lagerartikel.

1. Hilfsmittel hinzufügen. Bezeichnung und Einheit, etwa Liter oder Stück, wählen.
2. Unter weitere Angaben beispielsweise Isopropanol, Bremsenreiniger oder Nitro auswählen.
3. Gebindegröße, Hersteller, Bestand und Mindestbestand ergänzen. Entnahmen wie bei Material buchen.

**Hinweis:** Eine Flasche und ein Liter sind unterschiedliche Einheiten. Gebindegröße beschreibt die Verpackung.

## Bestand zu- oder abbuchen

**Weg:** Bestand → Artikel → Zugang / Entnahme

Verändert den Bestand und schreibt eine Lagerbewegung.

1. Artikel öffnen oder dessen QR-Code scannen.
2. Zugang oder Entnahme wählen, Menge und optional Auftrag eintragen.
3. Buchung prüfen und bestätigen.
4. Lagerbewegungen öffnen, um bisherige Buchungen nachzusehen.

**Hinweis:** Reservierte oder verbaute Teile sind nicht frei entnehmbar. Eine manuell angelegte Notiz in Lagerbewegungen ersetzt keine Artikelbuchung.

## Material für einen Auftrag reservieren

**Weg:** Aufträge → Auftrag → Material & Werkzeuge

Hält Material für einen Auftrag frei, ohne es bereits zu verbrauchen.

1. Material und Bedarf zuerst in der Kalkulation erfassen.
2. Material & Werkzeuge öffnen und verfügbaren Bedarf reservieren.
3. Tatsächlichen Verbrauch über die Entnahmefunktion buchen.
4. Bei Fehlmengen eine Bestellung vorbereiten.

**Hinweis:** Reservierung und Entnahme sind getrennte Vorgänge. Reservierungen anderer Aufträge reduzieren den frei verfügbaren Bestand.

## Maschine anlegen oder bearbeiten

**Weg:** Bestand → Maschinen

Pflegt ausschließlich den Maschinenstamm: Name, Steuerung, Spindel und Status.

1. Maschinen öffnen und neuen Eintrag anlegen oder Maschine bearbeiten.
2. Name, Steuerung, Spindelanschluss und Status erfassen.
3. Speichern; Nummer und QR-Etikett stehen am Datensatz bereit.
4. Für Kosten, Planung oder Wartung die entsprechend beschrifteten Querverweise verwenden.

**Hinweis:** Stundensätze werden unter Kosten & Auswertung bearbeitet; Aufträge und Wartungen haben eigene Bereiche.

## Maschinenstundensatz berechnen

**Weg:** Kosten & Auswertung → Maschinenkosten & Stundensätze

Pflegt das Kostenmodell derselben Maschine, ohne einen zweiten Maschinenstamm anzulegen.

1. Maschine in der Kostenübersicht wählen und Kostendaten bearbeiten.
2. Manuellen Satz eintragen oder Anschaffung, Nutzungsdauer, Jahresstunden, Strom und weitere Kosten ergänzen.
3. Berechneten Satz und Aufschlüsselung prüfen.
4. Den Satz in der Auftragskalkulation verwenden.

**Hinweis:** Für automatische Berechnung müssen alle benötigten Angaben vorliegen. Nicht anfallende Kosten ausdrücklich mit 0 angeben.

## Arbeitsgang planen und Unterlagen zuordnen

**Weg:** Planung & Arbeit → Arbeitsgänge & Termine

Verbindet Auftrag, Maschine, Termin und geplante Dauer.

1. Arbeitsgang bevorzugt aus dem Auftrag unter Fertigung anlegen.
2. Auftragsnummer, Maschine, Termin, Dauer und Status prüfen.
3. Arbeitsgang öffnen und Zeichnungen, Material, Baugruppen und Anleitungen zuordnen.
4. Arbeitsgangblatt als PDF öffnen und nach der Bearbeitung den Status aktualisieren.

**Hinweis:** Ohne ausdrückliche Zuordnung können Unterlagen aus Auftrag und Maschine abgeleitet werden; die angezeigte Auswahl prüfen.

## NC-Programm verwalten

**Weg:** Dateien & Wissen → NC-Programme

Dokumentiert Programm, Revision, Freigabestatus und Dateiverweis.

1. Programm bevorzugt im Auftrag unter Fertigung hinzufügen.
2. Maschine, Revision, Dateipfad oder Link und Bearbeitungsstand eintragen.
3. Nach externer Prüfung den Status entsprechend aktualisieren.

**Hinweis:** Die App erzeugt keinen NC-Code, simuliert nicht und überträgt keine Programme an Maschinen. Ein lokaler Dateipfad ist nur ein Verweis.

## Zeit erfassen und korrigieren

**Weg:** Planung & Arbeit → Zeit starten / stoppen

Ordnet erfasste Arbeitszeit Mitarbeiter, Tätigkeit und Auftrag zu.

1. Mitarbeiter, Auftrag und Tätigkeit wählen.
2. Zeit starten und nach der Tätigkeit stoppen.
3. Gespeicherte Buchungen unter Zeitbuchungen prüfen.
4. Fehlende Buchungen dort manuell anlegen oder bestehende bearbeiten.

**Hinweis:** Arbeitszeit ist nicht automatisch Spindellaufzeit.

## Prüfung dokumentieren

**Weg:** Planung & Arbeit → Prüfungen & Ergebnisse

Dokumentiert Prüfergebnis, Auftragsbezug und Hinweise.

1. Prüfung direkt aus dem Auftrag oder in der Prüfungsliste anlegen.
2. Bauteil, Auftragsnummer, Ergebnis und Notizen erfassen.
3. Status Offen, In Prüfung, Bestanden oder Gesperrt setzen.

**Hinweis:** Die App misst keine Teile automatisch und ersetzt keine Prüfmittel.

## Wartung oder Reparatur planen

**Weg:** Planung & Arbeit → Wartung & Reparaturen

Dokumentiert Maßnahmen, Fälligkeit, Maschine, Kosten und Status.

1. Neue Maßnahme anlegen und Maschine auswählen.
2. Fälligkeit und geplante Maßnahme ergänzen.
3. Nach Durchführung Kosten und Status aktualisieren.

**Hinweis:** Maschinenstatus im Maschinenstamm bei Bedarf separat anpassen.

## Arbeitsanleitung schreiben

**Weg:** Dateien & Wissen → Arbeitsanleitungen

Speichert eigene Rüsthinweise und Checklisten.

1. Anleitung hinzufügen, Titel und Kategorie vergeben.
2. Inhalt unter Anleitung / Inhalt schreiben und Version eintragen.
3. Speichern und bei Bedarf einem Arbeitsgang zuordnen.
4. Anleitungs-PDF aus den PDF-Unterlagen öffnen.

**Hinweis:** Dies sind deine betrieblichen Anleitungen; die Hilfe zur App findest du unter Hilfe & Anleitungen.

## PDF erstellen, herunterladen und Briefkopf ändern

**Weg:** Dateien & Wissen → PDF-Unterlagen

Erzeugt Arbeitspläne, Arbeitsgangblätter, Werkzeuglisten, Baugruppenblätter und Anleitungen aus den gespeicherten Daten.

1. Unter Briefkopf & Hinweise App-Name, eigene Firma, Kontakt und allgemeine Hinweise speichern.
2. Aufträge, Arbeitsgänge und Komponenten vollständig zuordnen.
3. Gewünschtes PDF öffnen, prüfen und herunterladen oder drucken.
4. Nach Änderungen neue Fassung herunterladen; bei Bedarf PDFs aktualisieren verwenden.

**Hinweis:** Kundenfirma stammt aus dem Auftrag. QR-Codes öffnen verknüpfte Datensätze/PDFs auf Basis des auf dem Zielgerät verfügbaren Datenstands.

## QR-Code scannen oder Etikett drucken

**Weg:** QR-Code scannen

Öffnet den zugehörigen Datensatz anhand der stabilen internen ID.

1. Scan-Menü öffnen und Kamera, QR-Bildimport oder Nummer/Link verwenden.
2. Treffer prüfen und Datensatz öffnen.
3. Für Bestandsänderungen Zugang/Entnahme ausdrücklich bestätigen.
4. Etikett am Datensatz unter QR-Etikett drucken.

**Hinweis:** Kamera benötigt HTTPS und Freigabe. Andere Geräte brauchen denselben Datenstand; im Code steckt nicht die ganze Datenbank.

## Kunden und Lieferanten anlegen

**Weg:** Kontakte & Einkauf

Hinterlegt Firmen, Ansprechpartner und Kontaktdaten.

1. Kunden oder Lieferanten öffnen und einen Eintrag hinzufügen.
2. Firmenname und verfügbare Kontaktangaben erfassen.
3. Den Firmennamen anschließend in Auftrag oder Bestellung auswählen.

**Hinweis:** Es werden keine E-Mails automatisch versendet.

## Bestellen und Wareneingang buchen

**Weg:** Kontakte & Einkauf → Bestellungen & Wareneingang

Verknüpft Beschaffung mit Lieferant, Auftrag und Materialartikel.

1. Bestellung oder Einkaufsanfrage anlegen, gegebenenfalls direkt aus der Fehlmenge im Auftrag.
2. Materialartikel, Menge, Lieferant, Betrag und Termin prüfen.
3. Beim Eintreffen den Wareneingang am Bestelldatensatz buchen; Teillieferungen sind möglich.
4. Restmenge und Status prüfen.

**Hinweis:** Die Bestellung wird nicht automatisch an den Lieferanten gesendet. Nur der zugeordnete Materialartikel wird beim Wareneingang gebucht.

## Einnahmen, Ausgaben und Finanzierung erfassen

**Weg:** Kosten & Auswertung

Dokumentiert betriebliche Geldbeträge und Finanzierungsangaben.

1. Einnahmen & Ausgaben öffnen und Betrag, Datum, Art, Kategorie und Status eintragen.
2. Unter Kredite & Raten Finanzierung, Restschuld, Rate und Zinssatz pflegen.
3. Angaben bei Änderungen aktualisieren und in den Auswertungen prüfen.

**Hinweis:** Keine Bankanbindung, Zahlungsabwicklung oder vollständige Steuerbuchhaltung.

## Kennzahlen und Auftragskosten ansehen

**Weg:** Kosten & Auswertung → Auftragsauswertung

Zeigt Kennzahlen aus vorhandenen Aufträgen, Preisen, Planwerten und Zeitbuchungen.

1. Zeitraum auswählen und bei Bedarf Maschine oder Status filtern.
2. Vollständigkeit der Kosten und Stückzahlen prüfen.
3. Für Details den betreffenden Auftrag öffnen.

**Hinweis:** Preis minus kalkulierte Kosten ist eine Plandifferenz, kein automatisch ermittelter tatsächlicher Gewinn.

## Firma, Schreibweise und Mitarbeiter pflegen

**Weg:** Einstellungen & Daten

Bündelt Einstellungen, Personalstamm und Datensicherung.

1. Firma und PDF-Briefkopf über PDF-Unterlagen → Briefkopf & Hinweise bearbeiten.
2. Werkzeug-Schreibweise unter Einstellungen → Werkzeugbezeichnungen festlegen.
3. Mitarbeiter mit Name, Rolle, Stundensatz und Hinweisen erfassen.

**Hinweis:** Mitarbeiterdaten erzeugen keine Benutzerkonten oder Rollenberechtigungen. Allgemeine Parameter wirken nur, wenn eine Funktion sie ausdrücklich verwendet.

## Daten sichern, importieren und Geräte wechseln

**Weg:** Einstellungen & Daten → Sicherung & Cloud

Sichert Datensätze und ermöglicht den eingerichteten manuellen Cloud-Abgleich.

1. Sicherung herunterladen und Originaldateien zusätzlich separat aufbewahren.
2. Zum Import passende JSON-Sicherung auswählen und die angezeigten Optionen prüfen.
3. Für Gerätewechsel auf Gerät A anmelden und den Stand in die Cloud speichern. Erst nach Erfolg auf Gerät B anmelden und Cloud-Stand laden.
4. Benötigte lokale Anhänge auf Gerät B separat hinterlegen oder HTTPS-Dateilinks verwenden.

**Hinweis:** Cloud benötigt eingerichteten Server und berechtigten Zugang. Kein automatischer Hintergrundabgleich; lokale Anhänge sind weder im JSON-Backup noch im Cloud-Datensatz enthalten.
