# Flow: Use Template (Serialize)

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Use Template page |
| Ziel | Fill template variables and generate HL7 message |
| Seite(n) | `/templates/use` |
| Components | `templates/use/page.tsx`, `MessageEditor`, `NavigationHeader` |

## Voraussetzungen

- Templates exist (defaults loaded if localStorage empty)
- Template contains HELPERVARIABLE placeholders (optional)

## Schritte

### 1. Navigate to Use Template Page
- **User Action**: Clicks "Serialize from Template" link in navigation
- **System Response**:
  - Loads `/templates/use` page
  - Initializes with default templates
  - Loads custom templates from localStorage
  - Shows template selection dropdown
- **UI Element**: "Serialize from Template" navigation link

### 2. Select Template
- **User Action**: Selects template from dropdown
- **System Response**:
  - Parses template content
  - Applies variable editability (only HELPERVARIABLE fields editable)
  - Displays raw HL7 output with highlighted variables
  - Shows parsed structure view
- **UI Element**: `data-testid="template-select"`

### 3. View Raw Output
- **User Action**: Views left panel
- **System Response**:
  - Shows raw HL7 with HELPERVARIABLE highlighted in amber
  - Updates live as edits are made
- **UI Element**: `data-testid="raw-hl7-output"`

### 4. Edit Variable Fields
- **User Action**: Edits fields that contain HELPERVARIABLE
- **System Response**:
  - Only fields with HELPERVARIABLE are editable
  - Other fields are read-only
  - Raw output updates immediately
  - No "Update Raw" button needed - live sync
- **UI Element**: MessageEditor with restricted editing

### 5. Serialize and Load
- **User Action**: Clicks "Serialize & Load" button
- **System Response**:
  - Saves generated HL7 to localStorage key `generated_hl7`
  - Redirects to `/?loadGenerated=true`
  - Main editor loads and parses the generated message
- **UI Element**: `data-testid="serialize-button"`

### Alternative: Cancel
- **User Action**: Clicks "Cancel" button
- **System Response**: Redirects to `/` without loading
- **UI Element**: `data-testid="cancel-button"`

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 2 | Template has no HELPERVARIABLE | All fields read-only, hint shown |
| 4 | Field contains HELPERVARIABLE | Field is editable |
| 4 | Field does not contain HELPERVARIABLE | Field is read-only |
| 5 | Serialize clicked | Redirects to main editor with message |
| Alt | Cancel clicked | Redirects to main editor without message |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Serialisiert | Message loaded in main editor for further editing |
| Abgebrochen | Redirected to main editor without loading |

## Verbundene Flows

- **Kommt von**: `global/navigation.md`
- **Fuehrt zu**: `main-editor/parse-message.md`

## Technische Details

### Variable Editability
```typescript
const applyVariableEditability = (segments: SegmentDto[]): SegmentDto[] => {
  return segments.map(seg => ({
    ...seg,
    fields: seg.fields.map(f => ({
      ...f,
      isEditable: fieldContainsVariable(f)
    }))
  }));
};
```

### Live Output
```typescript
const rawHl7Output = useMemo(() => {
  if (editedSegments.length === 0) {
    return currentTemplateContent;
  }
  return generateHl7Message(editedSegments);
}, [editedSegments, currentTemplateContent]);
```

### LocalStorage Transfer
```typescript
localStorage.setItem('generated_hl7', rawHl7Output);
router.push('/?loadGenerated=true');
```

### Main Editor Loading
- Checks URL param `loadGenerated=true`
- Validates HL7 content before loading
- Clears localStorage after successful load
- Cleans URL by removing query param

### No Variables Hint
When template has no HELPERVARIABLE:
```
"No HELPERVARIABLE placeholders - all fields read-only"
```

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
