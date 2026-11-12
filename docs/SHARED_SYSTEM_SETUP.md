# CNC OS – gemeinsames Firmensystem (Implementierungsstart)

## Stand
Dies ist ein isolierter Feature-Branch. Die veröffentlichte Hauptversion bleibt unverändert. Enthalten ist das Datenbankfundament für Mandanten, Mitarbeiterrollen, Aufträge, Dokumentverweise und Freigaben.

## Einrichtung
1. Neues Supabase-Projekt anlegen, E-Mail-Login konfigurieren.
2. SQL aus `supabase/schema.sql` im SQL Editor ausführen.
3. Organisation und ersten Admin-Nutzer über einen vertrauenswürdigen Administrationsweg anlegen. **Keine öffentlichen INSERT-Policies für Mitgliedschaften.**
4. Einen **privaten** Storage-Bucket `order-files` erstellen. Vor Datei-Uploads/downloads sind Storage-RLS-Policies zu implementieren, die den Organisationsbezug des Dokumentdatensatzes prüfen. Ohne diese Policies keine Kundendateien hochladen.
5. Frontend mit Supabase URL und **publishable/anon key** konfigurieren (nie service_role). Authentifizierte Benutzer laden ausschließlich ihre Organisation und deren Aufträge.
6. QR-Code: codiert nur die URL `https://jeremiagroebmer-collab.github.io/JERRYCNC/?order=<uuid>`. Beim Öffnen zuerst Login und RLS-geprüften Auftragsabruf ausführen. Der QR-Code selbst verleiht **keinen** Zugriff.
7. Bestehende localStorage-Daten nicht ungeprüft migrieren. Export, Prüfung, Zuordnung zu Organisation und kontrollierter Import sind erforderlich.

## Nächste Entwicklungsschritte
- Login/Logout und organisationsgebundene Auftragsliste.
- Erfassungsformular mit Textparser, Validierung und manueller Kontrolle; Bilder/PDF erst nach sicherem Storage-Setup.
- Auftragsakte mit Arbeitsplan, Zuschnitt, Zeichnungen, Dokumentrevisionen.
- Echte QR-Code-Erzeugung, Kamera-Scan, Berechtigungsprüfung.
- Audit-Log, serverseitige Statusübergänge, sichere Datei-Downloads und Einladungsprozess.
- Kalkulationslogik mit überprüfbaren Maschinen-, Material- und Rüstkosten; Angebote nur nach Freigabe.

**Sicherheitsgrenze:** GitHub Pages ist nur statisches Hosting. Die zentrale Datenbank, Authentifizierung und Zugriffskontrolle müssen über einen Backend-Dienst wie Supabase laufen. Die SQL-Datei allein macht die bestehende App noch nicht mehrbenutzerfähig.
