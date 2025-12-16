# Flow: Generate HL7 Message

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Parsed message with edits in Visual Editor |
| Ziel | Update Raw HL7 text with edited values |
| Seite(n) | `/` (Main Editor) |
| Components | `page.tsx` |

## Voraussetzungen

- HL7 message has been parsed
- Segments are displayed in Visual Editor
- User has made edits to one or more fields

## Schritte

### 1. Click Update Raw Button
- **User Action**: Clicks "Update Raw" button
- **System Response**:
  - Sets `loading` to true
  - Clears any previous error
- **UI Element**: Green "Update Raw" button with refresh icon

### 2. Generate HL7 Text
- **User Action**: None (automatic)
- **System Response**:
  - Calls `generateHl7Message(segments)` from `hl7Generator.ts`
  - Converts segments back to HL7 text format
  - Uses proper delimiters from MSH-2

### 3. Update Display
- **User Action**: None (automatic)
- **System Response**:
  - Updates `hl7Text` state with generated string
  - Raw HL7 textarea shows updated content
  - Sets `loading` to false

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 2 | Generate throws error | Shows error message |
| 2 | Generate succeeds | Updates raw text display |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Raw HL7 textarea updated with regenerated message |
| Fehler | Red error box: "Failed to generate message" |

## Verbundene Flows

- **Kommt von**: `edit-field.md`
- **Fuehrt zu**:
  - Can copy raw text for use elsewhere
  - Can continue editing fields

## Technische Details

### Generator Location
- `src/utils/hl7Generator.ts` - `generateHl7Message()` function

### Button State
- Disabled during loading
- Shows loading spinner when processing

### Two-Way Sync
- Raw HL7 -> Parsed (via parse)
- Parsed -> Raw HL7 (via generate)
- Changes in Visual Editor require explicit "Update Raw" click

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
