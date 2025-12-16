# Flow: Load Example Message

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Main Editor page |
| Ziel | Load predefined example HL7 message |
| Seite(n) | `/` (Main Editor) |
| Components | `page.tsx`, `NavigationHeader` |

## Voraussetzungen

- Application loaded at `/`
- Sample templates available in `SAMPLE_TEMPLATES`

## Schritte

### 1. Click Load Example Button
- **User Action**: Clicks "Load Example Message" button in header
- **System Response**:
  - Opens modal dialog
  - Shows list of available example templates
- **UI Element**: "Load Example Message" button in NavigationHeader

### 2. Select Example Template
- **User Action**: Clicks on template name in list
- **System Response**:
  - Gets template content from `SAMPLE_TEMPLATES`
  - Sets `hl7Text` to template content
  - Closes modal
  - Immediately parses the loaded message
- **UI Element**: Template button in modal list

### 3. Parse Loaded Message
- **User Action**: None (automatic)
- **System Response**:
  - Calls `parseMessage(template)`
  - Updates Visual Editor with parsed content
  - Clears any previous error
- **UI Element**: Visual Editor panel

### Alternative: Cancel Selection
- **User Action**: Clicks "Cancel" button in modal
- **System Response**: Closes modal without loading
- **UI Element**: "Cancel" button at bottom of modal

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | Modal opens | Shows template list |
| 2 | Template selected | Loads and parses immediately |
| Alt | Cancel clicked | Modal closes, no change |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Example message loaded and parsed in editor |
| Abgebrochen | Modal closed, original state preserved |

## Verbundene Flows

- **Kommt von**: Global navigation
- **Fuehrt zu**: `parse-message.md`, `edit-field.md`

## Technische Details

### Template Storage
- `src/data/templates.ts` - `SAMPLE_TEMPLATES` object
- Key-value pairs: template name -> HL7 content

### Modal Styling
- Backdrop: `bg-black/60 backdrop-blur-sm`
- Content: `bg-card/90 backdrop-blur-md rounded-xl`
- Max height with scroll: `max-h-[60vh] overflow-y-auto`

### Immediate Parse
Unlike typing (which uses debounce), loading a template calls `parseMessage()` directly for instant feedback.

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
