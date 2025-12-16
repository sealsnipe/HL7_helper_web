# Flow: New Message

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Main Editor with existing content |
| Ziel | Clear editor for new message |
| Seite(n) | `/` (Main Editor) |
| Components | `page.tsx`, `NavigationHeader` |

## Voraussetzungen

- Application loaded at `/`
- May have existing message in editor

## Schritte

### 1. Click New Message Button
- **User Action**: Clicks "New Message" button in header
- **System Response**: Shows browser confirmation dialog
- **UI Element**: "New Message" button in NavigationHeader

### 2. Confirm Clear
- **User Action**: Clicks "OK" in confirmation dialog
- **System Response**:
  - Clears `hl7Text` to empty string
  - Clears `segments` to empty array
  - Clears any existing error
  - Visual Editor shows empty state
- **UI Element**: Browser confirm() dialog

### Alternative: Cancel Clear
- **User Action**: Clicks "Cancel" in confirmation dialog
- **System Response**: No changes, editor state preserved
- **UI Element**: Browser confirm() dialog

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 1 | Confirm dialog appears | User must respond |
| 2 | User confirms | Editor cleared |
| Alt | User cancels | No change |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Editor cleared, showing "No Message Loaded" placeholder |
| Abgebrochen | Previous content preserved |

## Verbundene Flows

- **Kommt von**: Any state in main editor
- **Fuehrt zu**: Ready for `parse-message.md` with new input

## Technische Details

### Confirmation Message
```javascript
confirm('Are you sure you want to clear the current message?')
```

### State Reset
```typescript
setHl7Text('');
setSegments([]);
setError(null);
```

### Navigation Behavior
- On home page: Button triggers `onNewMessage` callback
- On other pages: Button is a Link to `/`

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
