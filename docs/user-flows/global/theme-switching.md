# Flow: Theme Switching

## Uebersicht

| Attribut | Wert |
|----------|------|
| Start | Any page with visible theme switcher |
| Ziel | Change application color theme |
| Seite(n) | All pages |
| Components | `ThemeSwitcher.tsx`, `ThemeProvider.tsx` |

## Voraussetzungen

- Application is loaded and mounted
- NavigationHeader is rendered

## Schritte

### 1. Click Theme Button
- **User Action**: Clicks theme switcher button in header
- **System Response**:
  - Opens dropdown menu below button
  - Shows list of available themes with icons
- **UI Element**: Theme button (shows current theme icon)

### 2. Select Theme
- **User Action**: Clicks on theme option
- **System Response**:
  - Applies selected theme to entire application
  - Closes dropdown
  - Theme icon updates to reflect selection
  - Theme persisted for future visits
- **UI Element**: Theme option button in dropdown

### Alternative: Click Outside
- **User Action**: Clicks anywhere outside dropdown
- **System Response**: Closes dropdown without changing theme
- **UI Element**: Document (outside dropdown)

## Available Themes

| Theme | Icon | Description |
|-------|------|-------------|
| light | Sun | Light mode with white background |
| dark | Moon | Dark mode with dark background |
| aurora | Sparkles | Aurora Borealis color scheme |
| matrix | Terminal | Matrix Green (terminal style) |
| cyberpunk | Zap | Cyberpunk Neon colors |
| ocean | Waves | Ocean Depths color scheme |
| sunset | Sunset | Sunset Horizon warm colors |

## Verzweigungen

| Situation | Bedingung | Fuehrt zu |
|-----------|-----------|----------|
| Theme selected | Click on option | Theme applied, dropdown closes |
| Click outside | Click on document | Dropdown closes, no change |
| Same theme selected | Click current theme | No visible change, dropdown closes |

## End-Zustaende

| Zustand | Beschreibung |
|---------|--------------|
| Theme geaendert | New theme applied across application |
| Abgebrochen | Dropdown closed, theme unchanged |

## Verbundene Flows

- **Kommt von**: Any page via NavigationHeader
- **Fuehrt zu**: Same page with new theme applied

## Technische Details

### Theme Provider
- Uses `next-themes` library
- Theme stored in localStorage
- Supports system preference detection

### Hydration Safety
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);
if (!mounted) return null;
```

### Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isOpen]);
```

### Button Styling
- Border: `border border-gray-200 dark:border-gray-700`
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-800`
- Active theme: `text-blue-600 font-medium`

### Dropdown Position
- Absolute positioning: `absolute right-0 mt-2`
- Z-index: `z-50`

### Icon Components
Uses Lucide React icons:
- Sun, Moon, Sparkles, Terminal, Zap, Waves, Sunset

## Letzte Aktualisierung

- **Datum**: 2025-12-14
- **Aenderung**: Initial documentation
