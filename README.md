# MARIS HL7 Helper

Ein WPF-Tool zur Anzeige, Bearbeitung und Validierung von HL7 v2.x Nachrichten.

## Hauptfunktionen

*   Laden und Anzeigen von HL7-Nachrichten im Rohformat und als Baumstruktur.
*   Bearbeiten von Feldwerten direkt in der Baumstrukturansicht.
*   Automatische Aktualisierung der Rohnachricht bei Änderungen in der Baumstruktur.
*   Laden und Speichern von Struktur-Templates im JSON-Format zur Definition von Nachrichtenstrukturen und Editierbarkeitsregeln.
*   Erstellen neuer HL7-Nachrichten basierend auf den geladenen Templates.
*   Durchführung von Basis-Validierungen (syntaktisch durch den HL7-Parser).
*   Unterstützung für erweiterbare, regelbasierte Validierungen mit Anzeige der Ergebnisse.
*   Steuerung der Editierbarkeit einzelner Felder über die geladenen Templates.

<!-- Ref: HL7H-9 -->

## Web Version (HL7 Helper Web)

A modern web-based interface for parsing, editing, and generating HL7 messages.

### Deployment
The web application is built with Next.js.
- **Source**: `./hl7-helper-web`
- **Standard**: `npm run build` then `npm run start`
- **Docker**: Available (see details below)

See [hl7-helper-web/README.md](./hl7-helper-web/README.md) for full deployment instructions including PM2 and Static Export.
