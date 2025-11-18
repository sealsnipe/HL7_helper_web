# Integration des MCP Fetch Tools mit Claude

Diese Anleitung erklärt, wie du das MCP Fetch Tool in Claude integrieren kannst, damit Claude Webinhalte für dich abrufen kann.

## Voraussetzungen

1. Python 3.10 oder höher muss installiert sein
2. Die erforderlichen Python-Pakete müssen installiert sein (siehe Installation)

## Installation der Abhängigkeiten

Führe den folgenden Befehl aus, um alle erforderlichen Abhängigkeiten zu installieren:

```
pip install httpx markdownify mcp protego pydantic readabilipy requests
```

Alternativ kannst du die `install.bat` im Verzeichnis `%APPDATA%\roo code\mcp\fetch` ausführen.

## Claude-Konfiguration

Um das MCP Fetch Tool mit Claude zu verwenden, musst du die Claude-Konfiguration anpassen. Die genaue Vorgehensweise hängt davon ab, wie du Claude verwendest:

### Für Claude im Browser (claude.ai)

1. Gehe zu [claude.ai](https://claude.ai)
2. Klicke auf dein Profilbild und wähle "Settings"
3. Scrolle nach unten zum Abschnitt "Advanced"
4. Suche nach "MCP Configuration" oder einem ähnlichen Eintrag
5. Füge den folgenden JSON-Code ein:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "python",
      "args": ["-m", "mcp_server_fetch"]
    }
  }
}
```

6. Speichere die Einstellungen

### Für Claude in VS Code oder anderen Anwendungen

1. Suche nach der Claude-Konfigurationsdatei in deiner Anwendung
2. Füge den MCP-Server-Eintrag hinzu:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "python",
      "args": ["-m", "mcp_server_fetch"]
    }
  }
}
```

## Testen der Integration

Nachdem du die Konfiguration gespeichert hast, kannst du die Integration testen:

1. Starte Claude neu oder öffne eine neue Konversation
2. Frage Claude, eine Webseite abzurufen, z.B.: "Rufe bitte die Seite https://example.com ab und fasse den Inhalt zusammen"
3. Claude sollte nun in der Lage sein, das MCP Fetch Tool zu verwenden, um die Webseite abzurufen

## Fehlerbehebung

Wenn Claude das Tool nicht verwenden kann:

1. Stelle sicher, dass Python korrekt installiert ist und im PATH verfügbar ist
2. Überprüfe, ob alle Abhängigkeiten installiert sind
3. Stelle sicher, dass die Claude-Konfiguration korrekt ist
4. Prüfe, ob der MCP Fetch Server manuell gestartet werden kann:
   ```
   python -m mcp_server_fetch
   ```
5. Überprüfe die Logs oder Fehlermeldungen in der Claude-Anwendung

## Erweiterte Konfiguration

Du kannst das Verhalten des MCP Fetch Tools anpassen, indem du zusätzliche Argumente in der Konfiguration hinzufügst:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "python",
      "args": [
        "-m", 
        "mcp_server_fetch", 
        "--ignore-robots-txt", 
        "--user-agent=MeinBenutzerdefinierterUserAgent"
      ]
    }
  }
}
```

Verfügbare Optionen:
- `--ignore-robots-txt`: Ignoriert robots.txt-Beschränkungen
- `--user-agent=XXX`: Verwendet einen benutzerdefinierten User-Agent
- `--proxy-url=XXX`: Verwendet einen Proxy für Anfragen
