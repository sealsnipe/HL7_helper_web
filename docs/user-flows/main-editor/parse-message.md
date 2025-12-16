# Flow: Parse HL7 Message

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Main Editor page with empty or existing text |
| Ziel | Display parsed HL7 message in structured view |
| Seite(n) | `/` (Main Editor) |
| Components | `page.tsx`, `MessageEditor`, `SegmentRow`, `FieldInput` |

## Voraussetzungen

- Application is loaded at `/`
- No specific data required

## Schritte

### 1. User Enters HL7 Text
- **User Action**: Types or pastes HL7 message into the Raw HL7 Message textarea
- **System Response**:
  - Sets `isTyping` to true
  - Shows "Parsing..." indicator with spinner
  - Starts 300ms debounce timer
- **UI Element**: `data-testid="raw-hl7-input"`

### 2. Debounce Timer Expires
- **User Action**: None (automatic after 300ms of no typing)
- **System Response**:
  - Calls `parseHl7Message(text)` from `hl7Parser.ts`
  - Sets `loading` to true
  - Hides "Parsing..." indicator

### 3. Parsing Succeeds
- **User Action**: None (automatic)
- **System Response**:
  - Creates `SegmentDto[]` array with parsed data
  - Marks all fields as editable except MSH-1 and MSH-2
  - Updates `segments` state
  - Clears any previous error
  - Sets `loading` to false
  - Displays MessageEditor with parsed segments

### 4. Visual Editor Displays
- **User Action**: None (automatic)
- **System Response**:
  - Shows "Visual Editor" panel on the right
  - Displays message type (e.g., "ADT^A01")
  - Shows segment count per segment
  - All segments expanded by default
  - "Update Raw" button becomes available

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | Text is empty or whitespace | Clears segments and error, shows empty state |
| 3 | Parse throws error | Shows error message, clears segments |
| 3 | Valid HL7 message | Displays structured view |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Parsed message displayed in Visual Editor with all segments |
| Fehler: Parse Error | Red error box below input: "Parsing Error" with error message |
| Leer | Empty state with "No Message Loaded" placeholder |

## Verbundene Flows

- **Kommt von**:
  - `load-example.md` (Load Example loads text and triggers parse)
  - `use-template.md` (Serialize loads generated message)
- **Fuehrt zu**:
  - `edit-field.md` (User can edit parsed fields)
  - `expand-collapse.md` (User can collapse/expand segments)
  - `generate-message.md` (User can regenerate raw HL7)

## Technische Details

### Debounce Mechanism
```typescript
const PARSE_DEBOUNCE_MS = 300;
```
- Live parsing with 300ms delay after last keystroke
- Previous timer cancelled on each new input
- Prevents excessive parsing during rapid typing

### Parser Location
- `src/utils/hl7Parser.ts` - `parseHl7Message()` function

### Field Editability
- All fields marked `isEditable: true` except:
  - MSH-1 (Field Separator)
  - MSH-2 (Encoding Characters)

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
