# Flow: View Templates

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Navigate to Templates page |
| Ziel | View list of saved templates |
| Seite(n) | `/templates` |
| Components | `templates/page.tsx`, `NavigationHeader`, `MessageEditor` |

## Voraussetzungen

- Application is accessible
- localStorage may contain templates

## Schritte

### 1. Navigate to Templates Page
- **User Action**: Clicks "Templates" link in navigation header
- **System Response**:
  - Loads `/templates` page
  - Reads templates from localStorage
  - If no templates exist, creates defaults from `SAMPLE_TEMPLATES`
  - Displays template list
- **UI Element**: "Templates" navigation link

### 2. View Template List
- **User Action**: Views the template table
- **System Response**: Shows table with columns:
  - Name (with description)
  - Type (message type badge)
  - Variables (count of HELPERVARIABLE occurrences)
  - Actions (Edit, Duplicate, Delete buttons)
- **UI Element**: Template table rows

### 3. Expand Template Details
- **User Action**: Clicks on template row
- **System Response**:
  - Expands row to show detailed view
  - Left panel: Raw HL7 content with HELPERVARIABLE highlighting
  - Right panel: Structured view (MessageEditor, read-only)
  - Toggle buttons for "All Fields" / "Variables Only" view
- **UI Element**: Expandable row section

### 4. Toggle Variable View
- **User Action**: Clicks "Variables Only" or "All Fields" button
- **System Response**:
  - "All Fields": Shows all segments and fields
  - "Variables Only": Filters to show only fields containing HELPERVARIABLE
- **UI Element**: `data-testid="view-mode-all"`, `data-testid="view-mode-variables"`

### 5. Collapse Template
- **User Action**: Clicks on same row header again
- **System Response**: Collapses the expanded view
- **UI Element**: Row header

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | No templates in localStorage | Creates defaults from SAMPLE_TEMPLATES |
| 1 | Corrupted localStorage data | Clears storage, shows empty state |
| 3 | Template expanded | Shows raw + structured view |
| 4 | Variables Only mode | Filters to variable-containing fields only |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Liste angezeigt | Template table visible with all templates |
| Leer | "No templates found. Create one to get started." |
| Erweitert | Single template expanded showing details |

## Verbundene Flows

- **Kommt von**: `global/navigation.md`
- **Fuehrt zu**:
  - `edit-template.md` (click Edit button)
  - `delete-template.md` (click Delete button)
  - `duplicate-template.md` (click Duplicate button)

## Technische Details

### LocalStorage Key
```typescript
const existing = localStorage.getItem('hl7_templates');
```

### Template Type
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  messageType: string;
  content: string;
  createdAt: number;
}
```

### HELPERVARIABLE Highlighting
- Raw view: Amber background on HELPERVARIABLE text
- Structured view: Amber ring on fields containing HELPERVARIABLE

### Variable Count
```typescript
const getVariableCount = (content: string) => {
  return (content.match(/HELPERVARIABLE/g) || []).length;
};
```

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
