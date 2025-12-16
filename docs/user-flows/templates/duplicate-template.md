# Flow: Duplicate Template

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Templates page with existing template |
| Ziel | Create a copy of an existing template |
| Seite(n) | `/templates` |
| Components | `templates/page.tsx` |

## Voraussetzungen

- At least one template exists
- Template is visible in list

## Schritte

### 1. Click Duplicate Button
- **User Action**: Clicks "Duplicate" button on template row
- **System Response**:
  - Creates copy of template with:
    - New unique ID
    - Name: "[Original Name] copy" (or "copy 2", "copy 3" if duplicates exist)
    - Same description, messageType, and content
    - New createdAt timestamp
  - Adds to template list
  - Auto-expands the new template
  - Enters edit mode for the duplicate
- **UI Element**: "Duplicate" button

### 2. Edit Duplicate (Optional)
- **User Action**: Modifies name, description, or content
- **System Response**: Updates edit state
- **UI Element**: Edit form fields

### 3a. Save Duplicate
- **User Action**: Clicks "Save Changes"
- **System Response**:
  - Persists the duplicate with changes
  - Saves to localStorage
  - Exits edit mode
- **UI Element**: "Save Changes" button

### 3b. Cancel (Delete Duplicate)
- **User Action**: Clicks "Cancel"
- **System Response**:
  - Note: The duplicate was already added to the list
  - Cancel only discards edit changes
  - Duplicate remains with original copy values
- **UI Element**: "Cancel" button

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | Name already has " copy" | Appends " copy 2", " copy 3", etc. |
| 3a | Save clicked | Duplicate saved with edits |
| 3b | Cancel clicked | Duplicate saved with original values |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | New template appears in list with unique name |

## Verbundene Flows

- **Kommt von**: `view-templates.md`
- **Fuehrt zu**: `edit-template.md` (immediately enters edit mode)

## Technische Details

### Name Uniqueness
```typescript
let newName = `${baseName} copy`;
let counter = 2;
while (templates.some(t => t.name === newName)) {
  newName = `${baseName} copy ${counter}`;
  counter++;
}
```

### Event Propagation
```typescript
const handleDuplicate = (e: React.MouseEvent, template: Template) => {
  e.stopPropagation(); // Prevents row toggle
  // ...
};
```

### Auto Edit Mode
- Duplicate is immediately put into edit mode
- Allows user to customize the copy before navigating away

### Template Copy
```typescript
const newTemplate: Template = {
  ...template,
  id: crypto.randomUUID(),
  name: newName,
  createdAt: Date.now()
};
```

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
