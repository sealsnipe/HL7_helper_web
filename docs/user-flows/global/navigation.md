# Flow: Navigation

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Any page in the application |
| Ziel | Navigate between application sections |
| Seite(n) | All pages |
| Components | `NavigationHeader.tsx` |

## Voraussetzungen

- Application is loaded
- NavigationHeader is rendered (present on all pages)

## Navigation Elements

### Header Layout
Left side:
- Logo/Title: "MARIS HL7 Helper" (links to `/`)
- Subtitle: "Web Edition"
- Theme Switcher button

Right side:
- Templates link
- Serialize from Template link
- Load Example Message button
- New Message button

## Navigation Targets

### 1. Home / Logo
- **User Action**: Clicks "MARIS HL7 Helper" title
- **System Response**: Navigates to `/`
- **UI Element**: Header title link

### 2. Templates
- **User Action**: Clicks "Templates" button
- **System Response**: Navigates to `/templates`
- **UI Element**: "Templates" navigation button
- **Visual State**: Has ring highlight when on Templates page

### 3. Serialize from Template
- **User Action**: Clicks "Serialize from Template" button
- **System Response**: Navigates to `/templates/use`
- **UI Element**: "Serialize from Template" button (secondary styling)
- **Visual State**: Has ring highlight when on serialize page

### 4. Load Example Message
- **User Action**: Clicks "Load Example Message" button
- **System Response**:
  - On home page: Opens example selection modal
  - On other pages: Navigates to `/`
- **UI Element**: "Load Example Message" button

### 5. New Message
- **User Action**: Clicks "New Message" button
- **System Response**:
  - On home page: Shows confirmation, clears editor
  - On other pages: Navigates to `/`
- **UI Element**: "New Message" button (primary styling)

## Page-Specific Behavior

| Page | Load Example | New Message |
|------|--------------|-------------|
| Home (`/`) | Opens modal | Clears editor (with confirm) |
| Templates (`/templates`) | Links to `/` | Links to `/` |
| Create (`/templates/create`) | Links to `/` | Links to `/` |
| Use (`/templates/use`) | Links to `/` | Links to `/` |

## Visual Indicators

### Active Page Highlighting
- Templates page: "Templates" button has `ring-2 ring-offset-2 ring-primary`
- Serialize page: "Serialize from Template" has `ring-2 ring-offset-2 ring-secondary`

### Button Styles
- Primary actions: `bg-primary text-primary-foreground`
- Secondary actions: `bg-secondary text-secondary-foreground`
- Tertiary actions: `bg-card border border-border text-card-foreground`

## Verzweigungen

| Situation | Bedingung | Fuehrt zu |
|-----------|-----------|----------|
| Load Example on home | `activePage === 'home'` | Modal opens |
| Load Example elsewhere | `activePage !== 'home'` | Navigate to `/` |
| New Message on home | `activePage === 'home'` | Confirm dialog, then clear |
| New Message elsewhere | `activePage !== 'home'` | Navigate to `/` |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Navigation erfolgt | User is on target page |
| Modal geoeffnet | Example selection modal visible (home only) |

## Verbundene Flows

- **Fuehrt zu**: All other flows based on navigation target

## Technische Details

### Active Page Props
```typescript
interface NavigationHeaderProps {
  activePage?: 'home' | 'create' | 'serialize' | 'templates';
  onNewMessage?: () => void;
  onLoadExample?: () => void;
}
```

### Conditional Rendering
```typescript
const isHome = activePage === 'home';

// Renders button with onClick on home, Link elsewhere
if (isHome && onNewMessage) {
  return <button onClick={onNewMessage}>...</button>;
}
return <Link href="/">...</Link>;
```

### Sticky Header
- Header is sticky with `sticky top-0 z-40`
- Has backdrop blur: `bg-background/95 backdrop-blur-md`
- Shadow: `shadow-sm`

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
