# Flow: Create Template

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Templates page or Create Template page |
| Ziel | Save a new template with HL7 content |
| Seite(n) | `/templates`, `/templates/create` |
| Components | `templates/page.tsx`, `templates/create/page.tsx`, `NavigationHeader` |

## Voraussetzungen

- Application is accessible

## Method 1: Quick Create (from Templates List)

### 1. Click New Template Button
- **User Action**: Clicks "+ New Template" button on Templates page
- **System Response**:
  - Creates new template with defaults:
    - Name: "New Template"
    - Content: Basic MSH+PID message
    - Type: "ADT-A01"
  - Adds to template list
  - Auto-expands and enters edit mode
- **UI Element**: "+ New Template" button

### 2. Edit Template Details
- **User Action**: Modifies name, description, type, and content
- **System Response**: Updates form fields in edit mode
- **UI Element**: Edit form inputs

### 3. Save Template
- **User Action**: Clicks "Save Changes" button
- **System Response**:
  - Updates template in list
  - Saves to localStorage
  - Exits edit mode (stays expanded)
- **UI Element**: "Save Changes" button

## Method 2: Full Create Page

### 1. Navigate to Create Page
- **User Action**: Direct navigation to `/templates/create`
- **System Response**: Shows create form with empty fields
- **UI Element**: Create Template page

### 2. Enter HL7 Content
- **User Action**: Types or pastes HL7 message in textarea
- **System Response**: Content captured in state
- **UI Element**: HL7 Content textarea with placeholder hint

### 3. Enter Template Metadata
- **User Action**: Fills in name, description, and selects message type
- **System Response**: Metadata captured in state
- **UI Elements**:
  - Template Name input
  - Description input
  - Message Type select (ADT-A01, ORU-R01)

### 4. Save Template
- **User Action**: Clicks "Save Template" button
- **System Response**:
  - Validates name and content are provided
  - Creates template with unique ID
  - Saves to localStorage
  - Redirects to `/templates`
- **UI Element**: "Save Template" button

### Alternative: Cancel Creation
- **User Action**: Clicks "Cancel" button
- **System Response**: Redirects to `/` without saving
- **UI Element**: "Cancel" button

## Verzweigungen

| Nach Schritt | Bedingung | Fuehrt zu |
|--------------|-----------|----------|
| 4 (Method 2) | Name or content empty | Alert: "Name and Content are required." |
| 4 (Method 2) | localStorage corrupted | Confirmation to clear and retry |
| 4 (Method 2) | User declines clear | Stays on page without saving |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Erfolg | Template saved, visible in template list |
| Validierungsfehler | Alert shown, form not submitted |
| Abgebrochen | Redirected without saving |

## Verbundene Flows

- **Kommt von**: `view-templates.md`, `global/navigation.md`
- **Fuehrt zu**: `view-templates.md`

## Technische Details

### Default Content (Quick Create)
```typescript
content: 'MSH|^~\\&|App|Fac|App|Fac|20230101||ADT^A01|MSGID|P|2.5\rPID|1||12345^^^MRN||Doe^John'
```

### HELPERVARIABLE Hint
- Placeholder text: "Use HELPERVARIABLE as placeholder"
- Example: `MSH|^~\&|...|HELPERVARIABLE|...`

### Error Handling
```typescript
try {
  // Save logic
} catch (error) {
  // Offers to clear corrupted data with user consent
  const shouldClear = confirm('...');
}
```

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
