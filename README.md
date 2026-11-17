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
