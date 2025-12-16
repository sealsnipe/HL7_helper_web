# Flow: Edit Field

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Parsed message displayed in Visual Editor |
| Ziel | Modify field value in structured view |
| Seite(n) | `/` (Main Editor) |
| Components | `MessageEditor`, `SegmentRow`, `FieldInput` |

## Voraussetzungen

- HL7 message has been parsed successfully
- Segments are displayed in Visual Editor
- Target field is editable (not MSH-1 or MSH-2)

## Schritte

### 1. Locate Field to Edit
- **User Action**: Scrolls to find the segment and field
- **System Response**: Field displayed with position label and description (if available)
- **UI Element**: Segment row with fields listed

### 2a. Edit Simple Field
- **User Action**: Clicks on field input, types new value
- **System Response**:
  - Input accepts text
  - `onChange` triggers `handleFieldChange`
  - Updates `segments` state with new value
  - Clears any existing components/repetitions for that field
- **UI Element**: `data-testid="field-input-{position}"`

### 2b. Edit Composite Field (with Components)
- **User Action**: Clicks expand button (down arrow) on composite field
- **System Response**:
  - Expands to show individual components
  - Shows subcomponents if present
- **UI Element**: `data-testid="field-expand-{position}"`

### 3. Edit Component Value
- **User Action**: Types new value in component input
- **System Response**:
  - Updates component value
  - Reconstructs full field value using `^` separator
  - Triggers `onChange` with reconstructed value
- **UI Element**: `data-testid="field-input-{position}-{component}"`

### 4. Edit Subcomponent Value
- **User Action**: Types new value in subcomponent input
- **System Response**:
  - Updates subcomponent value
  - Reconstructs component value using `&` separator
  - Reconstructs full field value using `^` separator
  - Triggers `onChange` with reconstructed value

### 5. Edit Repetition Field
- **User Action**: Types new value in repetition input
- **System Response**:
  - Updates repetition value
  - Re-parses components if value contains `^`
  - Reconstructs full field value using `~` separator
- **UI Element**: `data-testid="field-input-{position}-rep-{index}"`

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 2a | Field is not editable | Input is read-only, cursor shows not-allowed |
| 2b | Field has components | Expand button visible |
| 2b | Field has repetitions | Repetition list displayed |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Field value updated in segments state |
| Gesperrt | Read-only field (MSH-1, MSH-2) cannot be edited |

## Verbundene Flows

- **Kommt von**: `parse-message.md`
- **Fuehrt zu**: `generate-message.md` (after editing, user regenerates raw HL7)

## Technische Details

### Field Structure
```typescript
interface FieldDto {
  position: number;
  value: string;
  isEditable: boolean;
  components?: ComponentDto[];
  repetitions?: FieldDto[];
}
```

### HL7 Separators
- `^` - Component separator
- `&` - Subcomponent separator
- `~` - Repetition separator

### Highlight for Variables
- When `highlightVariable` is true, fields containing "HELPERVARIABLE" get amber highlight
- Class: `ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20`

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
