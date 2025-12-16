# Flow: Edit Template

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Templates page with template list |
| Ziel | Modify existing template content and metadata |
| Seite(n) | `/templates` |
| Components | `templates/page.tsx`, `MessageEditor` |

## Voraussetzungen

- At least one template exists
- Template row may be expanded or collapsed

## Schritte

### 1. Enter Edit Mode
- **User Action**: Clicks "Edit" button on template row
- **System Response**:
  - Expands row if not already expanded
  - Enters edit mode for that template
  - Populates form fields with current values
- **UI Element**: "Edit" button on row

### 2. Edit Metadata
- **User Action**: Modifies name, description, or message type
- **System Response**: Updates local edit state (not saved yet)
- **UI Elements**:
  - Template Name input
  - Description input
  - Message Type select

### 3. Edit Raw HL7 Content
- **User Action**: Types in raw HL7 textarea
- **System Response**:
  - Updates edit content state
  - Re-parses content for structured view
  - HELPERVARIABLE markers highlighted in amber
- **UI Element**: `data-testid="edit-content-textarea"`

### 4. Edit via Structured View
- **User Action**: Edits field values in MessageEditor
- **System Response**:
  - Regenerates HL7 from segments
  - Updates raw content textarea
  - Two-way sync maintained
- **UI Element**: MessageEditor component

### 5. Toggle Variable View (Optional)
- **User Action**: Clicks "All Fields" or "Variables Only"
- **System Response**: Filters structured view accordingly
- **UI Element**: View mode toggle buttons

### 6a. Save Changes
- **User Action**: Clicks "Save Changes" button
- **System Response**:
  - Updates template in templates array
  - Saves to localStorage
  - Exits edit mode (stays expanded to show result)
- **UI Element**: "Save Changes" button (green)

### 6b. Cancel Edit
- **User Action**: Clicks "Cancel" button
- **System Response**:
  - Discards all changes
  - Exits edit mode
  - Collapses the row
- **UI Element**: "Cancel" button

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | Template not expanded | Expands first, then enters edit mode |
| 3 | Content contains HELPERVARIABLE | Shows amber highlighting |
| 5 | Variables Only selected | Filters to variable fields only |
| 6a | Save clicked | Persists changes |
| 6b | Cancel clicked | Discards changes, collapses |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Gespeichert | Template updated in list and localStorage |
| Abgebrochen | Changes discarded, row collapsed |

## Verbundene Flows

- **Kommt von**: `view-templates.md`
- **Fuehrt zu**: `view-templates.md`

## Technische Details

### Two-Way Binding
- Raw HL7 text changes -> Re-parse -> Update structured view
- Structured view changes -> Regenerate -> Update raw text

### Edit State
```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [editName, setEditName] = useState('');
const [editDesc, setEditDesc] = useState('');
const [editType, setEditType] = useState('ADT-A01');
const [editContent, setEditContent] = useState('');
```

### MSH Field Protection
- MSH-1 (Field Separator) and MSH-2 (Encoding Characters) are never editable

### Switching Templates
- Clicking different row while editing: cancels current edit, expands new row

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
