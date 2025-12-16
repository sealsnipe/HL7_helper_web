# Flow: Expand/Collapse Segments

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Parsed message in Visual Editor |
| Ziel | Show/hide segment field details |
| Seite(n) | `/` (Main Editor), `/templates`, `/templates/use` |
| Components | `MessageEditor`, `SegmentRow` |

## Voraussetzungen

- HL7 message has been parsed
- At least one segment is displayed

## Schritte

### 1a. Toggle Single Segment
- **User Action**: Clicks on segment header row (segment name or anywhere on row)
- **System Response**:
  - If expanded: Collapses segment (hides fields)
  - If collapsed: Expands segment (shows fields)
  - Chevron icon changes direction
- **UI Element**: Segment header row with chevron indicator

### 1b. Expand All Segments
- **User Action**: Clicks "Expand All" button
- **System Response**: All segments become expanded
- **UI Element**: "Expand All" link/button in header

### 1c. Collapse All Segments
- **User Action**: Clicks "Collapse All" button
- **System Response**: All segments become collapsed
- **UI Element**: "Collapse All" link/button in header

### 2. Expand Field Components
- **User Action**: Clicks expand button on composite field
- **System Response**: Shows individual component inputs
- **UI Element**: `data-testid="field-expand-{position}"`

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| Initial Load | New message parsed | All segments expanded by default |
| 1a | Segment is expanded | Collapses to show only header |
| 1a | Segment is collapsed | Expands to show all fields |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Expanded | Segment fields visible, chevron points down |
| Collapsed | Only segment header visible, chevron points right |

## Verbundene Flows

- **Kommt von**: `parse-message.md`
- **Fuehrt zu**: `edit-field.md` (expanded segments allow editing)

## Technische Details

### State Management
```typescript
const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
```
- Tracks expanded segments by index
- Initialized with all indices when segments change

### Visual Indicators
- Chevron: `down arrow` (expanded) or `right arrow` (collapsed)
- Field count shown in header: "(X fields)"

### Default Behavior
- All segments start expanded when new message is parsed
- State resets when segment count changes (new parse)

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
