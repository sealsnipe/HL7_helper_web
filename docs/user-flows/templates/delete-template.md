# Flow: Delete Template

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Templates page with template list |
| Ziel | Remove a template permanently |
| Seite(n) | `/templates` |
| Components | `templates/page.tsx` |

## Voraussetzungen

- At least one template exists
- Template is visible in list

## Schritte

### 1. Click Delete Button
- **User Action**: Clicks "Delete" button on template row
- **System Response**: Shows browser confirmation dialog
- **UI Element**: "Delete" button (red/destructive styling)

### 2. Confirm Deletion
- **User Action**: Clicks "OK" in confirmation dialog
- **System Response**:
  - Removes template from templates array
  - Updates localStorage
  - If deleted template was expanded, collapses it
  - Template disappears from list
- **UI Element**: Browser confirm() dialog

### Alternative: Cancel Deletion
- **User Action**: Clicks "Cancel" in confirmation dialog
- **System Response**: No changes, template remains
- **UI Element**: Browser confirm() dialog

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 2 | User confirms | Template removed |
| Alt | User cancels | No change |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Geloescht | Template removed from list and localStorage |
| Abgebrochen | Template preserved |

## Verbundene Flows

- **Kommt von**: `view-templates.md`
- **Fuehrt zu**: `view-templates.md` (with one less template)

## Technische Details

### Event Propagation
```typescript
const handleDelete = (e: React.MouseEvent, id: string) => {
  e.stopPropagation(); // Prevents row toggle
  // ...
};
```

### Confirmation Message
```javascript
confirm('Are you sure you want to delete this template?')
```

### State Updates
```typescript
const updated = templates.filter(t => t.id !== id);
setTemplates(updated);
localStorage.setItem('hl7_templates', JSON.stringify(updated));
if (expandedId === id) setExpandedId(null);
```

### No Undo
- Deletion is permanent
- No recovery mechanism exists

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
