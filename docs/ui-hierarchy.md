# HL7 Helper Web - Comprehensive UI Principles & Features Hierarchy

**Last Updated**: 2025-12-15
**Purpose**: Factual documentation of ALL UI principles, patterns, components, and features across the application

---

## 1. GLOBAL PRINCIPLES (Apply to ALL Pages)

### 1.1 Layout Architecture

#### Root Layout (`src/app/layout.tsx`)
- **HTML Structure**: `<html lang="en" suppressHydrationWarning>`
- **Fonts**:
  - Sans: Geist (`--font-geist-sans`)
  - Mono: Geist Mono (`--font-geist-mono`)
- **Body Classes**: `${geistSans.variable} ${geistMono.variable} antialiased`
- **Theme Wrapper**: All pages wrapped in `ThemeProvider` component

#### Page Container Pattern
All pages use consistent max-width container:
```
<main className="min-h-screen bg-background font-sans transition-colors text-foreground">
  <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    {/* Content */}
  </div>
</main>
```

#### Sticky Header Pattern
All pages use sticky navigation:
```
<div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <NavigationHeader activePage="..." />
  </div>
</div>
```

**Properties:**
- Z-index: 40
- Background: 95% opacity with backdrop blur
- Border: Bottom border with 50% opacity

### 1.2 Color System (CSS Variables)

#### Theme Tokens
All colors use CSS custom properties defined in `globals.css`:

**Core Tokens:**
- `--background`: Page background
- `--foreground`: Primary text color
- `--card`: Card/panel background
- `--card-foreground`: Card text color
- `--primary`: Primary action color
- `--primary-foreground`: Primary button text
- `--secondary`: Secondary elements
- `--secondary-foreground`: Secondary text
- `--muted`: Muted backgrounds
- `--muted-foreground`: Muted text
- `--accent`: Accent backgrounds
- `--accent-foreground`: Accent text
- `--destructive`: Destructive actions (delete, errors)
- `--destructive-foreground`: Destructive action text
- `--border`: Border color
- `--input`: Input border color
- `--ring`: Focus ring color

#### Theme Variants
**Available Themes** (7 total):
1. **Light** (default)
   - Background: `#ffffff`
   - Foreground: `#0f172a`
   - Primary: `#2563eb` (blue)

2. **Dark**
   - Background: `#020617`
   - Foreground: `#f8fafc`
   - Primary: `#3b82f6`

3. **Aurora Borealis**
   - Background: `#0f172a`
   - Foreground: `#e0e7ff`
   - Primary: `#8b5cf6` (purple)

4. **Matrix Green**
   - Background: `#000000`
   - Foreground: `#00ff41`
   - Primary: `#00ff41`

5. **Cyberpunk Neon**
   - Background: `#0a0a0f`
   - Foreground: `#00ff88`
   - Primary: `#ff0080` (pink)

6. **Ocean Depths**
   - Background: `#0d1b2a`
   - Foreground: `#e0f2fe`
   - Primary: `#06b6d4` (cyan)

7. **Sunset Horizon**
   - Background: `#1a0f1f`
   - Foreground: `#fef3c7`
   - Primary: `#f97316` (orange)

**Implementation:**
- Theme attribute: `data-theme="[theme-name]"`
- System preference detection: Enabled
- Default: System preference
- Transition: Disabled on change (`disableTransitionOnChange`)

### 1.3 Typography

#### Font Families
- **Sans-serif**: Geist (UI elements, body text)
- **Monospace**: Geist Mono (HL7 content, field values)

#### Text Size Conventions
- **Headers**:
  - H1: `text-3xl` (30px) - App title
  - H2: `text-2xl` (24px) - Page titles
  - H3: `text-lg` (18px) - Section headers
- **Body**: `text-sm` (14px) - Default for most UI
- **Small**: `text-xs` (12px) - Labels, metadata
- **Tiny**: `text-[10px]` - Field labels in editor

#### Font Weight Usage
- **Bold**: `font-bold` - Headings, segment names
- **Semibold**: `font-semibold` - Dialog titles, important labels
- **Medium**: `font-medium` - Buttons, secondary headings
- **Normal**: `font-normal` - Body text

### 1.4 Spacing Conventions

#### Container Padding
- Horizontal: `px-6` (24px)
- Vertical: `py-8` (32px) for page content
- Header vertical: `py-4` (16px)

#### Component Spacing
- Between sections: `space-y-8` (32px)
- Between form elements: `space-y-4` (16px)
- Between buttons: `gap-3` (12px)
- Between inline elements: `gap-2` (8px)

#### Internal Padding
- Buttons: `px-4 py-2` (16px/8px)
- Cards: `p-6` (24px)
- Inputs: `p-2` (8px) or `p-4` (16px)
- Table cells: `px-5 py-1` (20px/4px)

### 1.5 Border & Shadow System

#### Border Radius
- Small: `rounded` (4px) - Inputs, small buttons
- Medium: `rounded-lg` (8px) - Cards, panels
- Large: `rounded-xl` (12px) - Modals, dialogs
- Circle: `rounded-full` - Icons, badges

#### Border Styles
- Default: `border border-border` (1px solid)
- Input: `border border-input`
- Dashed: `border-2 border-dashed border-border` (for "add" areas)
- Half opacity: `border-border/50`

#### Shadows
- Small: `shadow-sm` - Buttons, subtle elevation
- Default: `shadow` - Cards
- Large: `shadow-lg` - Buttons with emphasis
- Extra large: `shadow-xl` - Editor panels
- 2XL: `shadow-2xl` - Modals, dialogs
- Custom: `shadow-lg shadow-[color]/20` - Colored shadows

### 1.6 Interactive States

#### Hover Effects
- Buttons: `hover:bg-[color]/90` or `hover:bg-[color]/80`
- Cards: `hover:bg-muted/30`
- Links: `hover:bg-muted`
- Text: `hover:text-foreground`

#### Focus States
- Inputs: `focus:ring-2 focus:ring-ring focus:border-ring`
- Buttons: `focus:ring-2 focus:ring-offset-2 focus:ring-[color]`
- Outline removal: `outline-none`

#### Active States
- Buttons: `active:scale-95` (scale down on click)

#### Disabled States
- Buttons: `disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50`
- Inputs: `cursor-not-allowed`

#### Transition Classes
- Default: `transition-colors` (200ms)
- All: `transition-all` (200ms)
- Custom: `duration-200`, `duration-500`

### 1.7 Loading State Patterns

#### Spinner (Inline)
```tsx
<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
```

#### "Parsing..." Indicator (Main Editor)
```tsx
<svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

#### Loading Text State
- Template page: "Loading templates..."
- Dropdown: "-- Loading templates... --"

### 1.8 Error State Patterns

#### Error Banner (Amber Warning Style)
Used in Main Editor (`page.tsx` line 326-354):
```tsx
<div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl shadow-sm">
  <div className="flex items-start gap-3">
    <svg>...</svg> {/* Warning triangle icon */}
    <div>
      <p className="font-bold text-sm">Unable to Parse Message</p>
      <p className="text-sm">{error}</p>
    </div>
  </div>
  <div className="flex gap-2">
    <button className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800...">Clear</button>
    <button className="px-3 py-1.5 bg-amber-600...">Try Sample Message</button>
  </div>
</div>
```

#### Error Banner (Red Alert Style)
Used in Use Template page (`use/page.tsx` line 280-289):
```tsx
<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
  <p className="font-medium">Error</p>
  <p className="text-sm">{error}</p>
</div>
```

#### ErrorBoundary Component Fallback
```tsx
<div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
  <AlertTriangle icon />
  <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
  <p className="text-red-600 text-sm">{error.message}</p>
  <button className="bg-red-600 hover:bg-red-700">Try Again</button>
</div>
```

### 1.9 Empty State Patterns

#### Main Editor - No Message
```tsx
<div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-60">
  <div className="p-6 bg-muted/50 rounded-full">
    <svg className="h-16 w-16">...</svg> {/* Document icon */}
  </div>
  <div className="text-center max-w-xs">
    <p className="text-lg font-medium text-foreground">No Message Loaded</p>
    <p className="text-sm mt-1">Paste a message on the left or load an example to start editing.</p>
  </div>
</div>
```

#### Template List - No Templates
```tsx
<div className="p-8 text-center text-muted-foreground">
  No templates found. Create one to get started.
</div>
```

#### Use Template - No Selection
```tsx
<div className="bg-card p-12 rounded-lg shadow border border-border flex items-center justify-center">
  <p className="text-muted-foreground text-center">
    Select a template above to start creating serializations.
  </p>
</div>
```

### 1.10 Animation Patterns

#### Fade In
- Class: `animate-in fade-in`
- Used: Modal overlays, confirm dialogs

#### Slide In
- Class: `slide-in-from-top-2 duration-200`
- Used: Expanded template rows

#### Zoom In
- Class: `zoom-in-95 duration-200`
- Used: Dialog appearances

#### Pulse
- Class: `animate-pulse`
- Used: Background gradient effects

#### Spin
- Class: `animate-spin`
- Used: Loading indicators

### 1.11 Backdrop Effects

#### Background Gradients (Main Editor Only)
```tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
</div>
```

#### Backdrop Blur
- Modal overlays: `backdrop-blur-sm` (4px)
- Sticky header: `backdrop-blur-md` (12px)
- Cards: `backdrop-blur-xl` (24px)

### 1.12 Scrollbar Customization

Custom scrollbar defined in `globals.css`:
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  opacity: 0.5;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}
```

Applied to:
- Main editor textarea
- Template list containers
- MessageEditor scroll areas

---

## 2. SHARED COMPONENTS (Used Across Multiple Pages)

### 2.1 NavigationHeader

**File**: `src/components/NavigationHeader.tsx`

**Props Interface:**
```typescript
interface NavigationHeaderProps {
  activePage?: 'home' | 'create' | 'serialize' | 'templates';
  onNewMessage?: () => void;
  onLoadExample?: () => void;
}
```

**Structure:**
```tsx
<header className="flex justify-between items-center">
  <div className="flex items-center gap-4">
    {/* Left: Title + Theme Switcher */}
    <Link href="/">
      <h1 className="text-3xl font-bold">MARIS HL7 Helper</h1>
      <p className="text-muted-foreground mt-1">Web Edition</p>
    </Link>
    <ThemeSwitcher />
  </div>
  <div className="flex gap-3">
    {/* Right: Action Buttons */}
    <Link href="/templates">Templates</Link>
    <Link href="/templates/use">Serialize from Template</Link>
    {renderLoadExampleButton()}
    {renderNewMessageButton()}
  </div>
</header>
```

**Button Rendering Logic:**
- **On Home Page**: Buttons are interactive (`onClick` handlers)
- **On Other Pages**: Buttons are links to home (`href="/"`)

**Active State Styling:**
- Templates button when active: `bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary`
- Serialize button when active: `ring-2 ring-offset-2 ring-secondary`
- Inactive: `bg-card border border-border text-card-foreground hover:bg-muted`

**Button Styles:**
- New Message: `bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90`
- Load Example: `bg-card border border-border rounded-md text-sm font-medium hover:bg-muted`
- Templates: Conditional (see Active State above)
- Serialize: `bg-secondary text-secondary-foreground hover:bg-secondary/80`

**Used On:**
- Main Editor (`/`)
- Template List (`/templates`)
- Create Template (`/templates/create`)
- Use Template (`/templates/use`)

### 2.2 ThemeSwitcher

**File**: `src/components/ThemeSwitcher.tsx`

**UI Elements:**
- **Button**: Icon button showing current theme icon
  - Style: `p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700`
  - Icon size: `h-5 w-5`

- **Dropdown Menu**: Appears on click
  - Position: `absolute right-0 mt-2`
  - Width: `w-48`
  - Style: `bg-white dark:bg-gray-800 rounded-md shadow-lg border z-50`

**Theme Options:**
1. Light (Sun icon)
2. Dark (Moon icon)
3. Aurora Borealis (Sparkles icon)
4. Matrix Green (Terminal icon)
5. Cyberpunk Neon (Zap icon)
6. Ocean Depths (Waves icon)
7. Sunset Horizon (Sunset icon)

**Dropdown Item Style:**
- Default: `text-gray-700 dark:text-gray-200`
- Active: `text-blue-600 font-medium`
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-700`

**Behavior:**
- Click outside closes dropdown
- Selecting theme closes dropdown automatically
- Uses `next-themes` for persistence and system preference

**Used On:** All pages (via NavigationHeader)

### 2.3 MessageEditor

**File**: `src/components/MessageEditor.tsx`

**Props Interface:**
```typescript
interface Props {
  segments: SegmentDto[];
  onUpdate: (segments: SegmentDto[]) => void;
  highlightVariable?: boolean;
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
}
```

**Structure:**
```tsx
<div className="bg-card shadow-lg rounded-lg overflow-hidden border border-border">
  {/* Header Bar */}
  <div className="bg-muted/50 px-6 py-3 border-b border-border flex justify-between items-center">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
      Message Segments {messageType && <span className="text-primary ml-2">({messageType})</span>}
    </h2>
    <div className="flex gap-2">
      <button onClick={expandAll}>Expand All</button>
      <button onClick={collapseAll}>Collapse All</button>
    </div>
  </div>

  {/* Segment Rows */}
  <div className="divide-y divide-border">
    {segments.map(segment => <SegmentRow ... />)}
  </div>
</div>
```

**Header Buttons:**
- Expand All: `text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded hover:bg-primary/10`
- Collapse All: `text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-muted`

**Message Type Detection:**
- Extracted from MSH-9 field
- Format: `ADT^A01` or component-based
- Displayed in header as `(ADT^A01)`

**Expansion State:**
- Default: All segments expanded on initial parse
- Controlled via `expandedIndices` Set
- Persists during editing (not reset unless segment count changes)

**Used On:**
- Main Editor (`/`) - Full editing mode
- Template List (`/templates`) - Read-only and edit modes
- Use Template (`/templates/use`) - Variables-only editing

### 2.4 SegmentRow

**File**: `src/components/SegmentRow.tsx`

**Props Interface:**
```typescript
interface Props {
  segment: SegmentDto;
  definition: SegmentDefinition | null;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldChange: (fieldIndex: number, value: string) => void;
  highlightVariable?: boolean;
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
}
```

**Structure:**
```tsx
<div className="border-b border-border py-2 hover:bg-muted/30 transition-colors px-4">
  {/* Header (clickable to expand/collapse) */}
  <div className="flex items-center cursor-pointer mb-2 select-none" onClick={onToggle}>
    <div className="mr-2 text-muted-foreground w-4">{isExpanded ? '▼' : '▶'}</div>
    <div className="font-bold text-primary font-mono text-lg">{segment.name}</div>
    <div className="ml-2 text-sm text-muted-foreground font-medium">- {definition.description}</div>
    <div className="ml-auto text-xs text-muted-foreground">({segment.fields.length} fields)</div>
  </div>

  {/* Fields (when expanded) */}
  {isExpanded && (
    <div className="flex flex-col gap-2 pl-6">
      {visibleFields.map(field => <FieldInput ... />)}
    </div>
  )}
</div>
```

**Visibility Logic:**
- Filters out trailing empty fields
- Shows fields until last field with content
- Logic: Finds last field with value or components, shows all up to that point

**Expansion Indicators:**
- Collapsed: `▶` (right-pointing triangle)
- Expanded: `▼` (down-pointing triangle)

**Hover Effect:**
- `hover:bg-muted/30 transition-colors`

### 2.5 FieldInput

**File**: `src/components/FieldInput.tsx`

**Props Interface:**
```typescript
interface Props {
  field: FieldDto;
  definition: FieldDefinition | null;
  onChange: (value: string) => void;
  highlightVariable?: boolean;
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
}
```

**Field Types & Rendering:**

#### A. Simple Field (No components/repetitions)
```tsx
<div className={highlightClass ? `rounded ${highlightClass}` : ''}>
  {/* Variable badge if linked */}
  {field.variableGroupId !== undefined && (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getVariableBadgeColor(field.variableGroupId)}`}>
      V{field.variableGroupId}
    </span>
  )}
  <input
    type="text"
    value={displayValue}
    readOnly={!field.isEditable}
    className={editable ? 'bg-background border-input focus:border-ring' : 'bg-muted text-muted-foreground cursor-not-allowed'}
  />
</div>
```

#### B. Field with Components (Composite)
```tsx
<div className="flex flex-col border border-border rounded p-1 bg-muted/30">
  {/* Main value display (read-only composite) */}
  <input value={fullValue} readOnly />
  <button onClick={toggleExpand}>{isExpanded ? '▲' : '▼'}</button>

  {/* Expanded component inputs */}
  {isExpanded && (
    <div className="mt-2 pl-2 border-l-2 border-primary/20">
      {field.components.map(comp => (
        <input value={comp.value} onChange={...} />
        {/* Sub-components if present */}
      ))}
    </div>
  )}
</div>
```

#### C. Field with Repetitions
```tsx
<div className="flex flex-col border border-border rounded p-1 bg-muted/30">
  {field.repetitions.map((rep, idx) => (
    <div className="border border-primary/20 rounded p-2 bg-card">
      <label>Rep {idx + 1}</label>
      <input value={repFullValue} onChange={...} />
    </div>
  ))}
</div>
```

**Input Field Styling:**
- Editable: `bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground`
- Read-only: `bg-muted border-border text-muted-foreground cursor-not-allowed`

**Label Styling:**
- Position label: `text-[10px] text-muted-foreground font-mono`
- Description: `text-[10px] text-primary font-medium truncate`

**Variable Highlighting:**
- Applied when `highlightVariable={true}` AND `field.isEditable={true}`
- Ring color based on `variableGroupId`:
  - Standalone (no group): Amber ring
  - Group 1: Blue
  - Group 2: Green
  - Group 3: Purple
  - Group 4: Pink
  - Group 5: Cyan
  - Group 6: Orange
  - Group 7: Teal
  - Group 8: Indigo
  - (Cycles for groups 9+)

**Variable Badge Colors:**
- Same color scheme as rings, but badge format: `bg-[color]-100 text-[color]-800 dark:bg-[color]-900 dark:text-[color]-200`

### 2.6 ConfirmDialog

**File**: `src/components/ConfirmDialog.tsx`

**Props Interface:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string; // Default: "Confirm"
  cancelLabel?: string;  // Default: "Cancel"
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive'; // Default: 'default'
}
```

**Structure:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

  {/* Dialog */}
  <div className="relative bg-card/95 backdrop-blur-md rounded-xl border border-border/50 ring-1 ring-white/10 shadow-2xl p-6 max-w-md w-full mx-4">
    <h2 id="confirm-dialog-title" className="text-lg font-semibold text-card-foreground mb-2">{title}</h2>
    <p id="confirm-dialog-message" className="text-muted-foreground mb-6">{message}</p>

    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
        {cancelLabel}
      </button>
      <button onClick={onConfirm} className={confirmButtonClasses}>
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
```

**Confirm Button Variants:**
- Default: `bg-green-600 hover:bg-green-700 text-white`
- Destructive: `bg-red-600 hover:bg-red-700 text-white`

**Accessibility Features:**
- `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` and `aria-describedby` for screen readers
- Auto-focus on appropriate button:
  - Destructive variant: Focus cancel (safer default)
  - Default variant: Focus confirm
- Keyboard support:
  - ESC: Closes dialog (calls `onCancel`)
  - Tab: Traps focus within dialog (cycles between buttons)
- Body scroll lock when open

**Used For:**
- Delete template confirmation
- Clear message confirmation
- Corrupted data confirmation

### 2.7 ErrorBoundary

**File**: `src/components/ErrorBoundary.tsx`

**Props Interface:**
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error callback
}
```

**Default Fallback UI:**
```tsx
<div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
  <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
  <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
    Something went wrong
  </h2>
  <p className="text-red-600 dark:text-red-300 text-sm mb-4 text-center max-w-md">
    {error.message || 'An unexpected error occurred.'}
  </p>
  <button
    onClick={handleReset}
    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
  >
    <RefreshCw className="w-4 h-4" />
    Try Again
  </button>
</div>
```

**Behavior:**
- Catches React component errors during render
- Logs error to console
- Calls optional `onError` callback
- Shows fallback UI
- Reset button clears error state and re-renders children

**Used On:**
- Main Editor (wraps `<MessageEditor>`)

---

## 3. PAGE-SPECIFIC FEATURES

### 3.1 Main Editor (`src/app/page.tsx`)

**Route**: `/`
**Active Page ID**: `home`

#### Layout Structure
```
<main>
  {/* Background gradients */}
  {/* Template Modal (conditional) */}
  {/* Confirm Dialog (conditional) */}

  <div className="sticky top-0 z-40">
    <NavigationHeader activePage="home" onNewMessage={...} onLoadExample={...} />
  </div>

  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Raw HL7 Input */}
      {/* Right: Visual Editor */}
    </div>
  </div>
</main>
```

#### Left Panel - Raw HL7 Input
```tsx
<div className="group relative">
  {/* Gradient border effect */}
  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50" />

  <div className="relative bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50">
    <div className="flex justify-between items-center mb-4">
      {/* Icon + Label */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <svg className="w-5 h-5 text-primary">...</svg> {/* Code icon */}
        </div>
        <div>
          <label className="text-sm font-bold text-card-foreground">Raw HL7 Message</label>
          <span className="text-xs text-muted-foreground">Input your message string below</span>
        </div>
      </div>
    </div>

    <textarea
      className="flex-1 w-full min-h-[400px] p-4 border border-input/50 rounded-lg font-mono text-sm bg-background/50 text-foreground custom-scrollbar"
      value={hl7Text}
      onChange={handleTextChange}
      placeholder="MSH|^~\&|..."
      spellCheck={false}
      data-testid="raw-hl7-input"
    />

    {/* Live parsing indicator */}
    {isTyping && hl7Text.trim() && (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <svg className="animate-spin h-3 w-3">...</svg>
        <span>Parsing...</span>
      </div>
    )}
  </div>

  {/* Error display (only when not typing) */}
  {error && !isTyping && (
    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      {/* Error content */}
      <button className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800">Clear</button>
      <button className="px-3 py-1.5 bg-amber-600">Try Sample Message</button>
    </div>
  )}
</div>
```

**Debounced Live Parsing:**
- Delay: 300ms (`PARSE_DEBOUNCE_MS`)
- Triggered on every keystroke
- Shows "Parsing..." indicator while waiting
- Clears error while typing
- Validates HL7 structure on parse

**Input Validation:**
- Must have valid segments (not empty)
- Segment names: 3 uppercase alphanumeric (e.g., MSH, PID)
- Must have field data
- MSH-1 and MSH-2 marked as non-editable

**Error Messages:**
- "No valid HL7 segments found in the message."
- "Invalid segment name(s): ..."
- "Message contains no valid field data."
- Custom parse errors from parser

#### Right Panel - Visual Editor
```tsx
<div className="group relative">
  {/* Gradient border effect (reversed) */}
  <div className="absolute -inset-0.5 bg-gradient-to-l from-primary/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50" />

  <div className="relative bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50 min-h-[500px]">
    {segments.length > 0 ? (
      <>
        {/* Header with actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg className="w-5 h-5 text-green-500">...</svg> {/* Edit icon */}
            </div>
            <h2 className="text-lg font-bold text-foreground">Visual Editor</h2>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20">
              <svg>...</svg> Copy
            </button>
            <button className="px-4 py-2 bg-green-600/90 hover:bg-green-600 text-white rounded-lg shadow-lg shadow-green-600/20">
              <svg>...</svg> Update Raw
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <MessageEditor segments={segments} onUpdate={handleUpdate} />
          </ErrorBoundary>
        </div>
      </>
    ) : (
      {/* Empty state */}
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-60">
        <div className="p-6 bg-muted/50 rounded-full">
          <svg className="h-16 w-16">...</svg>
        </div>
        <div className="text-center max-w-xs">
          <p className="text-lg font-medium text-foreground">No Message Loaded</p>
          <p className="text-sm mt-1">Paste a message on the left or load an example to start editing.</p>
        </div>
      </div>
    )}
  </div>
</div>
```

**Action Buttons:**
- **Copy to Clipboard**:
  - Color: Blue (`bg-blue-600/90 hover:bg-blue-600`)
  - Success state: Shows "Copied!" with checkmark for 2s
  - Icon swap: Copy icon → Checkmark
  - Disabled when no message
- **Update Raw** (Regenerate):
  - Color: Green (`bg-green-600/90 hover:bg-green-600`)
  - Action: Generates HL7 from edited segments, updates left panel
  - Disabled during loading

#### Template Selection Modal
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-card/90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-2xl border border-border/50 ring-1 ring-white/10">
    <h3 className="text-2xl font-bold mb-6 text-card-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
      Select Example Message
    </h3>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {Object.keys(SAMPLE_TEMPLATES).map(key => (
        <button
          key={key}
          onClick={() => handleLoadTemplate(key)}
          className="w-full text-left px-5 py-4 hover:bg-primary/10 rounded-lg border border-border/50 hover:border-primary/50 text-card-foreground group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100" />
          <span className="relative font-medium">{key}</span>
        </button>
      ))}
    </div>
    <button onClick={closeModal} className="mt-8 w-full px-4 py-3 bg-muted/50 text-muted-foreground rounded-lg hover:bg-muted">
      Cancel
    </button>
  </div>
</div>
```

**Modal Trigger:** "Load Example Message" button in NavigationHeader

#### Generated Message Loading
- Checks URL param: `?loadGenerated=true`
- Reads from `localStorage.getItem('generated_hl7')`
- **Security validation** (`isValidHl7Content`):
  - Must start with valid segment name (3 uppercase) + `|`
  - Only printable ASCII (0x20-0x7E), CR, LF, tab
  - Rejects HTML/script patterns (`<[a-zA-Z]|javascript:|data:`)
  - Removes invalid content, cleans up localStorage
- Auto-parses after load
- Cleans up URL (removes param)

### 3.2 Template List (`src/app/templates/page.tsx`)

**Route**: `/templates`
**Active Page ID**: `templates`

#### Layout Structure
```
<main>
  <div className="sticky top-0">
    <NavigationHeader activePage="templates" />
  </div>

  <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Template Management</h2>
      <button onClick={handleCreate}>+ New Template</button>
    </div>

    <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
      {/* Table Header */}
      {/* Template Rows */}
    </div>

    <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
      <DataManagement />
    </div>
  </div>

  <ConfirmDialog ... />
</main>
```

#### Table Header
```tsx
<div className="flex items-center px-5 py-1 bg-muted/50 border-b border-border font-medium text-xs text-muted-foreground leading-none">
  <div className="flex-1 min-w-0">Name</div>
  <div className="w-32 flex-shrink-0">Type</div>
  <div className="w-24 flex-shrink-0 text-center">Variables</div>
  <div className="w-48 flex-shrink-0 text-right">Actions</div>
</div>
```

**Column Widths:**
- Name: Flexible (`flex-1 min-w-0`)
- Type: Fixed 32 (`w-32`)
- Variables: Fixed 24 (`w-24`)
- Actions: Fixed 48 (`w-48`)

#### Template Row (Collapsed)
```tsx
<div onClick={() => handleExpand(template.id)} className="flex items-center px-5 py-1 cursor-pointer hover:bg-muted/10 leading-none">
  <div className="flex-1 min-w-0 font-medium text-foreground text-xs flex items-center truncate">
    <span className="truncate">{template.name}</span>
    {template.description && <span className="ml-1 text-xs text-muted-foreground font-normal truncate">- {template.description}</span>}
  </div>

  <div className="w-32 flex-shrink-0">
    <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary-foreground text-xs font-medium whitespace-nowrap">
      {template.messageType || 'ADT-A01'}
    </span>
  </div>

  <div className="w-24 flex-shrink-0 text-center text-muted-foreground text-xs">
    {getVariableCount(template.content)}
  </div>

  <div className="w-48 flex-shrink-0 flex justify-end gap-2">
    <button onClick={(e) => { e.stopPropagation(); startEditing(template); }} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20">
      Edit
    </button>
    <button onClick={(e) => handleDuplicate(e, template)} className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground rounded text-xs hover:bg-secondary/20">
      Duplicate
    </button>
    <button onClick={(e) => handleDeleteClick(e, template)} className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs hover:bg-destructive/20">
      Delete
    </button>
  </div>
</div>
```

**Row States:**
- Default: `hover:bg-muted/10`
- Expanded: `bg-muted/30`
- Click: Toggles expand

**Action Buttons:**
- Edit: Primary color, opens edit mode
- Duplicate: Secondary color, creates copy with "copy N" suffix
- Delete: Destructive color, shows confirm dialog

#### Template Row (Expanded - Read-Only)
```tsx
<div className="border-t border-border p-6 bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-200">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
    {/* Left: Raw HL7 */}
    <div className="flex flex-col space-y-2 h-full">
      <label className="text-sm font-medium text-muted-foreground">Raw HL7 Message</label>
      <div className="flex-1 p-4 border border-border rounded bg-muted font-mono text-sm overflow-auto whitespace-pre-wrap">
        {highlightVariablesInText(template.content)}
      </div>
    </div>

    {/* Right: Structured View */}
    <div className="flex flex-col space-y-2 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">Structured View</label>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button className={variableViewMode === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}>
            All Fields
          </button>
          <button className={variableViewMode === 'variables-only' ? 'bg-amber-500 text-white' : 'text-muted-foreground'}>
            Variables Only
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
        <MessageEditor segments={displaySegments} onUpdate={() => {}} highlightVariable={true} />
      </div>
    </div>
  </div>
</div>
```

**HELPERVARIABLE Highlighting:**
- Uses `highlightVariablesInText()` function
- Supports HELPERVARIABLE (standalone) and HELPERVARIABLE1-999 (grouped)
- Color coding via `getVariableBadgeColor(groupId)`:
  - No group: Amber
  - Group 1: Blue
  - Group 2: Green
  - etc. (8 colors, cycles)
- Badge style: `px-1 rounded font-bold`

**View Mode Toggle:**
- All Fields: Shows all fields in MessageEditor
- Variables Only: Filters to only fields containing HELPERVARIABLE
- Toggle button styles:
  - Active "All": `bg-primary text-primary-foreground`
  - Active "Variables": `bg-amber-500 text-white`
  - Inactive: `text-muted-foreground hover:text-foreground`

#### Template Row (Expanded - Edit Mode)
```tsx
<div className="border-t border-border p-6 bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-200">
  <div className="space-y-6">
    {/* Metadata Inputs */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card border border-border rounded-lg">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Template Name</label>
        <input value={editName} onChange={...} className="w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
        <input value={editDesc} onChange={...} className="..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Message Type</label>
        <select value={editType} onChange={...} className="...">
          <option value="ADT-A01">ADT-A01</option>
          <option value="ORU-R01">ORU-R01</option>
        </select>
      </div>
    </div>

    {/* Editor Area (2 columns) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      <div className="flex flex-col space-y-2 h-full">
        <label className="text-sm font-medium">Raw HL7 Message</label>
        {/* Highlighted overlay textarea */}
        <div className="relative flex-1">
          {/* Background highlight layer */}
          <div ref={highlightRef} className="absolute inset-0 p-4 font-mono text-sm overflow-hidden whitespace-pre-wrap pointer-events-none border border-transparent rounded-md select-none">
            {highlightVariablesInText(editContent)}
          </div>
          {/* Actual textarea (transparent text) */}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onScroll={handleHighlightScroll}
            className="absolute inset-0 w-full h-full p-4 border border-input rounded-md font-mono text-sm bg-transparent focus:ring-2 focus:ring-ring outline-none resize-none caret-foreground text-transparent"
            style={{ caretColor: 'var(--foreground)' }}
          />
        </div>
      </div>

      <div className="flex flex-col space-y-2 h-full overflow-hidden">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Structured View</label>
          {/* View Mode Toggle (same as read-only) */}
        </div>
        <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
          <MessageEditor segments={displaySegments} onUpdate={handleEditorUpdate} highlightVariable={true} />
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-3 pt-4 border-t border-border">
      <button onClick={handleCancelEdit} className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80">
        Cancel
      </button>
      <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm">
        Save Changes
      </button>
    </div>
  </div>
</div>
```

**Highlighted Textarea Implementation:**
- **Two-layer approach**:
  1. Background `div` with colored HELPERVARIABLE text (read-only, pointer-events-none)
  2. Foreground `textarea` with transparent text color
- **Scroll synchronization**: `onScroll` handler keeps layers aligned
- **Caret color**: Explicitly set via `style={{ caretColor: 'var(--foreground)' }}`
- **Line break handling**: Normalizes `\r\n` to `\n` for CSS rendering

**Edit Mode Behavior:**
- Triggered by "Edit" button
- Populates edit state from template
- Auto-expands row if collapsed
- Cancel: Discards changes and collapses row
- Save: Persists to localStorage, stays expanded

**MessageEditor in Edit Mode:**
- All fields editable except MSH-1 and MSH-2
- Updates sync back to raw text via `handleEditorUpdate`
- Uses `generateHl7Message()` to reconstruct raw HL7

#### Data Management Section
Located at bottom of page:
```tsx
<div className="bg-card rounded-lg shadow border border-border overflow-hidden">
  <DataManagement />
</div>
```

**Component**: `src/components/persistence/DataManagement.tsx`
**Features**: Export/Import templates (not detailed in this analysis)

#### New Template Creation
**Trigger**: "+ New Template" button
**Behavior:**
- Creates new template with UUID
- Default content:
  ```
  MSH|^~\&|App|Fac|App|Fac|20230101||ADT^A01|MSGID|P|2.5
  PID|1||12345^^^MRN||Doe^John
  ```
- Default name: "New Template"
- Auto-expands and enters edit mode

#### Template Duplication
**Trigger**: "Duplicate" button
**Behavior:**
- Copies all template properties
- Generates new UUID
- Creates unique name:
  - First copy: `{name} copy`
  - Subsequent: `{name} copy 2`, `{name} copy 3`, etc.
- Auto-expands and enters edit mode
- Adds to end of list

### 3.3 Create Template (`src/app/templates/create/page.tsx`)

**Route**: `/templates/create`
**Active Page ID**: `create`

**NOTE**: This page appears to be legacy/unused. The main template creation flow uses the "New Template" button on `/templates` page directly.

#### Layout Structure
```
<main>
  <div className="sticky top-0">
    <NavigationHeader activePage="create" />
  </div>

  <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    <h2 className="text-2xl font-bold">Create New Template</h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: HL7 Content */}
      {/* Right: Template Details */}
    </div>
  </div>
</main>
```

#### Left Column - HL7 Content
```tsx
<div className="space-y-4">
  <div className="bg-card p-4 rounded-lg shadow border border-border">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-card-foreground">HL7 Content</label>
      <span className="text-xs text-muted-foreground">Use HELPERVARIABLE as placeholder</span>
    </div>
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="w-full h-96 p-4 border border-input rounded-md font-mono text-sm bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
      placeholder="MSH|^~\&|...|HELPERVARIABLE|..."
    />
  </div>
</div>
```

#### Right Column - Template Details
```tsx
<div className="space-y-4">
  <div className="bg-card p-6 rounded-lg shadow border border-border space-y-4">
    <div>
      <label className="text-sm font-medium text-card-foreground mb-1">Template Name</label>
      <input value={name} onChange={...} className="..." placeholder="e.g., My Custom ADT" />
    </div>

    <div>
      <label className="text-sm font-medium text-card-foreground mb-1">Description</label>
      <input value={description} onChange={...} className="..." placeholder="Optional description" />
    </div>

    <div>
      <label className="text-sm font-medium text-card-foreground mb-1">Message Type</label>
      <select value={messageType} onChange={...} className="...">
        <option value="ADT-A01">ADT-A01</option>
        <option value="ORU-R01">ORU-R01</option>
      </select>
    </div>

    <div className="flex justify-end gap-3 pt-4">
      <button onClick={() => router.push('/')} className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80">
        Cancel
      </button>
      <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
        Save Template
      </button>
    </div>
  </div>
</div>
```

**Save Behavior:**
- Validates: Name and content required
- Creates template with UUID
- Saves to localStorage
- Handles corrupted data:
  - Shows browser `confirm()` dialog
  - Option to clear corrupted data
  - Option to abort
- Redirects to `/templates` on success

### 3.4 Use Template / Serialize (`src/app/templates/use/page.tsx`)

**Route**: `/templates/use`
**Active Page ID**: `serialize`

#### Layout Structure
```
<main>
  <div className="sticky top-0">
    <NavigationHeader activePage="serialize" />
  </div>

  <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
    {/* Error Display (conditional) */}

    <h2 className="text-2xl font-bold">Serialize from Template</h2>

    {/* Template Selection - Full Width */}
    {/* Serialization Pairs (conditional) */}
    {/* Empty State (conditional) */}
  </div>
</main>
```

#### Template Selection Section
```tsx
<div className="bg-card p-6 rounded-lg shadow border border-border space-y-4">
  <div>
    <label className="text-sm font-medium text-card-foreground mb-1">Select Template</label>
    <select
      value={selectedTemplateId}
      onChange={(e) => handleTemplateSelect(e.target.value)}
      data-testid="template-select"
      disabled={isLoading}
      className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
    >
      <option value="">{isLoading ? '-- Loading templates... --' : '-- Choose a template --'}</option>
      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  </div>

  {selectedTemplateId && (
    <div>
      <label className="text-sm font-medium text-card-foreground mb-1">
        Raw Template
        {hasVariables && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">(HELPERVARIABLE placeholders highlighted)</span>}
      </label>
      <div className="w-full max-h-64 p-4 border border-input rounded-md font-mono text-sm bg-muted text-muted-foreground overflow-auto whitespace-pre-wrap">
        {highlightVariablesInText(currentTemplateContent.replace(/\r/g, '\n'))}
      </div>
    </div>
  )}
</div>
```

**Template Selection Behavior:**
- Loads templates from storage on mount
- Falls back to SAMPLE_TEMPLATES if none found
- Shows loading state during fetch
- Highlights HELPERVARIABLE in raw display

#### Serialization Pair (Instance)
```tsx
<div className="bg-card rounded-lg shadow border border-border overflow-hidden">
  {/* Pair Header */}
  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
    <span className="text-sm font-semibold text-foreground">Serialization #{index + 1}</span>
    <div className="flex gap-2">
      <button
        onClick={() => handleCopySerializationToClipboard(ser.id)}
        className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
      >
        {ser.copyButtonText}
      </button>
      {index > 0 && (
        <button
          onClick={() => handleRemoveSerialization(ser.id)}
          className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/80"
        >
          ✕ Remove
        </button>
      )}
    </div>
  </div>

  {/* Pair Content: 2-column grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
    {/* Left: Serialized Output */}
    <div className="p-4 space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Serialized Output
        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">(Variables replaced)</span>
      </label>
      <div className="w-full h-64 p-3 border border-input rounded-md font-mono text-xs bg-background text-foreground overflow-auto whitespace-pre-wrap">
        {ser.output.replace(/\r/g, '\n')}
      </div>
    </div>

    {/* Right: Variables Editor */}
    <div className="p-4 space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Edit Variables
        {hasVariables ? (
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">(Fill in values below)</span>
        ) : (
          <span className="ml-2 text-xs text-muted-foreground font-normal italic">No variables in template</span>
        )}
      </label>
      <div className="h-64 overflow-auto border border-border rounded-lg">
        <MessageEditor
          segments={getFilteredSegments(ser.segments)}
          onUpdate={createUpdateHandler(ser.id)}
          highlightVariable={true}
        />
      </div>
    </div>
  </div>
</div>
```

**Serialization Instance Features:**
- **Unique ID**: Each instance has UUID
- **First instance**: Cannot be removed (no X button)
- **Additional instances**: Show "✕ Remove" button
- **Copy button**: Per-instance clipboard copy
  - Success: "Copied!" for 2s
  - Error: "Failed to copy" for 2s
  - Default: "Copy to Clipboard"

**Variables-Only Editor:**
- Uses `getFilteredSegments()` to show only fields with HELPERVARIABLE
- Each edit updates output in real-time
- Changes isolated per serialization instance
- Full segments maintained in background (not filtered)

#### Add Serialization Button
```tsx
<button
  onClick={handleAddSerialization}
  className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
>
  + Add Serialization
</button>
```

**Add Behavior:**
- Creates new instance from template
- Copies parsed segments (deep clone)
- Generates fresh HL7 output
- Auto-scrolls to new instance

#### Action Buttons (Bottom)
```tsx
<div className="flex justify-end gap-3 pt-4 border-t border-border">
  <button onClick={() => router.push('/')} className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80">
    Cancel
  </button>
  <button onClick={handleSerialize} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
    Serialize & Load
  </button>
</div>
```

**Serialize & Load Behavior:**
- Combines all serialization outputs with separator: `\n\n---\n\n`
- Saves to `localStorage.setItem('generated_hl7', allOutputs)`
- Redirects to `/?loadGenerated=true`
- Main editor loads and parses combined output

---

## 4. MINI-FEATURES & WHERE THEY APPLY

### 4.1 HELPERVARIABLE System

#### Variable Syntax
**Pattern**: `HELPERVARIABLE[1-999]?`
- **Standalone**: `HELPERVARIABLE` (no number)
- **Grouped**: `HELPERVARIABLE1`, `HELPERVARIABLE2`, ... `HELPERVARIABLE999`

**Regex**: `/HELPERVARIABLE(\d{1,3})?/`

#### Variable Detection
**Function**: `containsAnyVariable(value: string)`
- Tests if value contains any HELPERVARIABLE pattern
- Used to determine field editability

**Function**: `fieldContainsVariable(field: FieldDto)`
- Checks field value, components, subcomponents, repetitions
- Recursive check for nested structures

**Function**: `getVariableCount(content: string)`
- Counts all HELPERVARIABLE occurrences
- Used in template list "Variables" column

#### Variable Editability Rules
**Function**: `applyVariableEditability(segments: SegmentDto[])`
- **Applies to**: Template List (read/edit), Use Template page
- **Rule**: ONLY fields containing HELPERVARIABLE are editable
- **Exceptions**: MSH-1 and MSH-2 always non-editable (even if they had variables)
- **Persistence**: Once marked editable, remains editable even after value change (allows user to replace placeholder)

**Implementation:**
- Sets `field.isEditable = fieldContainsVariable(field)`
- Sets `field.variableId = extractVariableName(field.value)` (e.g., "HELPERVARIABLE1")
- Sets `field.variableGroupId = extractVariableGroupId(variableId)` (e.g., 1 for HELPERVARIABLE1, undefined for HELPERVARIABLE)

#### Variable Highlighting

**Color Scheme (8 colors, cycles for 9+):**
1. Group 1 / HELPERVARIABLE1: Blue
2. Group 2 / HELPERVARIABLE2: Green
3. Group 3 / HELPERVARIABLE3: Purple
4. Group 4 / HELPERVARIABLE4: Pink
5. Group 5 / HELPERVARIABLE5: Cyan
6. Group 6 / HELPERVARIABLE6: Orange
7. Group 7 / HELPERVARIABLE7: Teal
8. Group 8 / HELPERVARIABLE8: Indigo
- Standalone (HELPERVARIABLE): Amber

**Ring Colors** (for field inputs):
```typescript
function getVariableGroupColor(groupId: number | undefined): string {
  if (groupId === undefined) return 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const colors = [
    'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20',
    'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20',
    'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20',
    'ring-2 ring-pink-400 bg-pink-50 dark:bg-pink-900/20',
    'ring-2 ring-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
    'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20',
    'ring-2 ring-teal-400 bg-teal-50 dark:bg-teal-900/20',
    'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
  ];
  return colors[(groupId - 1) % colors.length];
}
```

**Badge Colors** (for raw text):
```typescript
function getVariableBadgeColor(groupId: number | undefined): string {
  if (groupId === undefined) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  ];
  return colors[(groupId - 1) % colors.length];
}
```

**Where Applied:**
- **Template List**: Raw text display (read and edit modes)
- **Use Template**: Raw template display, variable editor fields
- **MessageEditor**: Field inputs when `highlightVariable={true}`

#### Variable Text Highlighting Function
```typescript
function highlightVariablesInText(text: string): React.ReactNode {
  const parts = text.split(/(HELPERVARIABLE[1-9]\d{0,2}|HELPERVARIABLE(?!\d))/g);
  return parts.map((part, index) => {
    const match = part.match(/^HELPERVARIABLE([1-9]\d{0,2})?$/);
    if (match) {
      const groupId = match[1] ? parseInt(match[1], 10) : undefined;
      const colorClass = getVariableBadgeColor(groupId);
      return <span key={index} className={`${colorClass} px-1 rounded font-bold`}>{part}</span>;
    }
    return part;
  });
}
```

**Line Break Handling:**
- Template List edit mode: Normalizes `\r\n` → `\n` for CSS rendering
- Use Template: Replaces `\r` → `\n` for display

### 4.2 Variable View Filtering

**Modes:**
- `'all'`: Show all fields
- `'variables-only'`: Show only fields containing HELPERVARIABLE

**Where Used:**
- Template List page (both read and edit modes)

**UI Control:**
```tsx
<div className="flex items-center gap-1 bg-muted rounded-lg p-1">
  <button
    onClick={() => setVariableViewMode('all')}
    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
      variableViewMode === 'all'
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    All Fields
  </button>
  <button
    onClick={() => setVariableViewMode('variables-only')}
    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
      variableViewMode === 'variables-only'
        ? 'bg-amber-500 text-white'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    Variables Only
  </button>
</div>
```

**Implementation:**
```typescript
if (variableViewMode === 'variables-only') {
  processedSegments = processedSegments
    .map(s => ({
      ...s,
      fields: s.fields.filter(f => fieldContainsVariable(f))
    }))
    .filter(s => s.fields.length > 0);
}
```

**Note:** Use Template page filters automatically (no toggle), always variables-only.

### 4.3 Expand/Collapse Behaviors

#### MessageEditor - Segment Level
**Controls:**
- Expand All: Adds all indices to `expandedIndices` Set
- Collapse All: Clears `expandedIndices` Set
- Individual toggle: Adds/removes index from Set

**Default State:**
- All segments expanded on initial parse
- State persists during editing
- Resets only when segment count changes (new parse)

**Visual Indicator:**
- Collapsed: `▶` (right arrow)
- Expanded: `▼` (down arrow)

#### FieldInput - Component Level
**Applies to:** Fields with components or subcomponents

**Visual Indicator:**
- Collapsed: `▼` (down arrow) - shows composite value
- Expanded: `▲` (up arrow) - shows individual components

**Default State:**
- Collapsed (shows read-only composite value)
- User must click to expand

**When Expanded:**
- Shows individual component inputs
- Sub-components shown with left border
- Editable if field is editable

#### Template Row - Full Row
**Controls:**
- Click row header: Toggles expand
- Switching rows: Auto-collapses current, expands new

**States:**
- Collapsed: Shows only row summary
- Expanded (Read-only): Shows 2-column view (raw + structured)
- Expanded (Edit mode): Shows metadata + 2-column editor + actions

**Animations:**
- `animate-in fade-in slide-in-from-top-2 duration-200`

### 4.4 Copy to Clipboard

**Locations:**
1. Main Editor - "Copy" button (copies full HL7 text)
2. Use Template - Per-serialization button (copies individual output)

**Implementation:**
```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(text);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}
```

**Visual Feedback:**
- Default: "Copy" / "Copy to Clipboard"
- Success (2s): "Copied!" with checkmark icon
- Error (2s): "Failed to copy"
- Icon swap on success

**Button Styles:**
- Main Editor: `bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20`
- Use Template: `bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-xs px-3 py-1`

### 4.5 Field Highlighting (HL7 Structure)

**Field Position Labels:**
- Format: `1`, `2`, `3`, etc.
- Style: `text-[10px] text-muted-foreground font-mono font-bold text-primary`

**Component Position Labels:**
- Format: `1.1`, `1.2`, etc. (field.component)
- Style: Same as field labels

**Sub-component Position Labels:**
- Format: `1.1.1`, `1.1.2`, etc.
- Style: Same, indented with left border

**Description Display:**
- Source: HL7 definition files
- Style: `text-[10px] text-primary font-medium truncate`
- Shown below position label

### 4.6 Message Type Detection

**Source:** MSH-9 field
**Format:** `ADT^A01` (message type ^ trigger event)

**Extraction Logic:**
```typescript
const msh = segments.find(s => s.name === 'MSH');
const typeField = msh.fields.find(f => f.position === 9);

// Check components first
if (typeField.components && typeField.components.length >= 2) {
  const type = typeField.components.find(c => c.position === 1)?.value;
  const trigger = typeField.components.find(c => c.position === 2)?.value;
  if (type && trigger) return `${type}^${trigger}`;
}

// Fallback to value
return typeField.value;
```

**Display Locations:**
- MessageEditor header: `Message Segments (ADT^A01)`
- Template Type badge in list view

**Used For:**
- Loading segment/field definitions
- Template categorization
- UI labeling

### 4.7 Debounced Input (Main Editor)

**Delay:** 300ms

**Visual Indicators:**
- `isTyping` state: Shows "Parsing..." with spinner
- Error suppression: Hides errors while typing

**Implementation:**
```typescript
const handleTextChange = useCallback((newText: string) => {
  setHl7Text(newText);
  setIsTyping(true);

  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }

  debounceTimerRef.current = setTimeout(() => {
    setIsTyping(false);
    parseMessage(newText);
  }, PARSE_DEBOUNCE_MS);
}, [parseMessage]);
```

**Cleanup:** Timer cleared on component unmount

### 4.8 Modal Overlays

**Pattern:**
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-card/90 backdrop-blur-md rounded-xl p-8 max-w-md shadow-2xl border border-border/50 ring-1 ring-white/10">
    {/* Content */}
  </div>
</div>
```

**Used For:**
- Template selection (Main Editor)
- Confirm dialogs (Delete, Clear)

**Backdrop Click:** Closes modal (except ConfirmDialog which only closes on Cancel button or ESC)

### 4.9 Gradient Border Effects

**Pattern:**
```tsx
<div className="group relative">
  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
  <div className="relative bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50">
    {/* Content */}
  </div>
</div>
```

**Where Used:**
- Main Editor input/output panels
- Effect: Subtle glow on hover

---

## 5. CONSISTENCY REQUIREMENTS

### 5.1 What SHOULD Be Consistent But Might Not Be

#### Button Styles
**Primary Action:**
- Main Editor: `bg-primary text-primary-foreground rounded-md hover:bg-primary/90`
- Template List: `bg-primary text-primary-foreground rounded hover:bg-primary/90`
- Use Template: `bg-primary text-primary-foreground rounded hover:bg-primary/90`
- Create Template: `bg-primary text-primary-foreground rounded hover:bg-primary/90`

**✅ Consistent**: All use same style pattern

**Secondary Action:**
- Navigation: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- ConfirmDialog cancel: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- Use Template copy: `bg-secondary text-secondary-foreground rounded hover:bg-secondary/80`

**✅ Consistent**: All use same style pattern

**Destructive Action:**
- Template delete: `bg-destructive/10 text-destructive rounded text-xs hover:bg-destructive/20`
- ConfirmDialog confirm (destructive): `bg-red-600 hover:bg-red-700 text-white`
- Use Template remove: `bg-destructive text-destructive-foreground rounded hover:bg-destructive/80`

**⚠️ Inconsistent**: Button list uses `/10` background, dialog uses solid, serialization uses full destructive color

**Muted/Cancel:**
- Template List cancel: `bg-muted text-muted-foreground rounded hover:bg-muted/80`
- Create Template cancel: `bg-muted text-muted-foreground rounded hover:bg-muted/80`
- Use Template cancel: `bg-muted text-muted-foreground rounded hover:bg-muted/80`

**✅ Consistent**: All match

#### Card/Panel Styles

**Main Content Cards:**
- Main Editor panels: `bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50`
- Template List table: `bg-card rounded-lg shadow border border-border`
- Use Template sections: `bg-card p-6 rounded-lg shadow border border-border`

**⚠️ Inconsistent**:
- Main Editor uses backdrop blur + xl radius + 80% opacity
- Others use solid + lg radius + full opacity

**Form Input Cards:**
- Template edit metadata: `p-4 bg-card border border-border rounded-lg`
- Create Template form: `bg-card p-6 rounded-lg shadow border border-border`

**⚠️ Inconsistent**: Padding and shadow vary

#### Input Field Styles

**Text Inputs:**
- Template List: `w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none`
- Create Template: `w-full p-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring outline-none`
- Use Template: `w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none`

**⚠️ Inconsistent**: Some use `rounded`, some use `rounded-md` (though visually same)

**Textareas:**
- Main Editor: `p-4 border border-input/50 rounded-lg font-mono text-sm bg-background/50`
- Template edit: `p-4 border border-input rounded-md font-mono text-sm bg-transparent`
- Create Template: `p-4 border border-input rounded-md font-mono text-sm bg-background`

**⚠️ Inconsistent**: Border opacity, background opacity vary

**Select Dropdowns:**
- Template List: `w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none`
- Create Template: `w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none`
- Use Template: `w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none`

**✅ Mostly Consistent**: Minor text color variations

#### Error Message Display

**Amber Warning Style:**
- Main Editor parse errors: `bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl`

**Red Alert Style:**
- Use Template errors: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg`

**Red Error Boundary:**
- ErrorBoundary: `bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800`

**⚠️ Inconsistent**: Main Editor uses amber (warning), others use red (error). Border radius varies.

#### Loading Indicators

**Spinner:**
- Template List: `w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin`
- Main Editor: `h-3 w-3` custom SVG with circle + path

**⚠️ Inconsistent**: Different implementations

**Loading Text:**
- Template List: "Loading templates..."
- Use Template select: "-- Loading templates... --"

**⚠️ Inconsistent**: Format differs

### 5.2 Z-Index Layers

**Defined Layers:**
- Background effects: `-z-10`
- Sticky header: `z-40`
- Modals/Dialogs: `z-50`
- ThemeSwitcher dropdown: `z-50`

**✅ Consistent**: No overlap issues

### 5.3 Responsive Breakpoints

**Grid Layouts:**
- `grid-cols-1 lg:grid-cols-2` - Used for all 2-column layouts
- Breakpoint: `lg` (1024px)

**✅ Consistent**: All use same breakpoint

---

## 6. SPECIAL BEHAVIORS

### 6.1 HELPERVARIABLE Handling Rules

#### Rule 1: Editability Preservation
**Behavior:** Once a field is marked as containing HELPERVARIABLE (isEditable=true), it remains editable even after the value is changed to something else.

**Reason:** Allows user to replace placeholder text without field becoming read-only.

**Implementation:** `isEditable` flag set at parse time, not re-evaluated during editing.

**Where Applied:** Template List (edit mode), Use Template page

#### Rule 2: Template Position Preservation
**Behavior:** When editing templates in structured view, changes sync back to raw text while preserving HL7 structure.

**Implementation:**
- User edits field in MessageEditor
- `handleEditorUpdate` called
- `generateHl7Message()` reconstructs raw HL7
- Textarea updates with new content
- HELPERVARIABLE highlights re-render

**Where Applied:** Template List (edit mode)

#### Rule 3: MSH-1 and MSH-2 Exception
**Behavior:** MSH-1 (field separator `|`) and MSH-2 (encoding characters `^~\&`) are NEVER editable, even if they contain HELPERVARIABLE.

**Reason:** These define HL7 delimiters; changing them breaks parsing.

**Implementation:**
```typescript
fields: s.fields.map(f => ({
  ...f,
  isEditable: !(s.name === 'MSH' && (f.position === 1 || f.position === 2))
}))
```

**Where Applied:** Main Editor, Template List, Use Template

#### Rule 4: Group Color Consistency
**Behavior:** HELPERVARIABLE1 always gets same color (blue), HELPERVARIABLE2 always gets green, etc.

**Implementation:** Color determined by `(groupId - 1) % colors.length`

**Colors:**
1. Blue
2. Green
3. Purple
4. Pink
5. Cyan
6. Orange
7. Teal
8. Indigo
9+ (cycles)

**Where Applied:** All variable highlighting (raw text and field inputs)

### 6.2 HL7 Parsing Rules

#### Segment Delimiter
**Character:** `\r` (carriage return)
**Alternative:** `\n` (line feed, normalized during parsing)

#### Field Delimiter
**Character:** `|` (pipe)
**Special Case:** MSH-1 is the field delimiter itself

#### Component Delimiter
**Character:** `^` (caret)
**Display:** Components shown as `field.component` (e.g., `9.1`, `9.2`)

#### Repetition Delimiter
**Character:** `~` (tilde)
**Display:** Shown as "Rep 1", "Rep 2", etc.

#### Sub-component Delimiter
**Character:** `&` (ampersand)
**Display:** Shown as `field.component.subcomponent` (e.g., `11.1.1`)

#### Escape Character
**Character:** `\` (backslash)
**Handling:** Defined in MSH-2 but not actively processed in current implementation

### 6.3 Validation Behaviors

#### Main Editor Input Validation
1. **Empty Check:** Segments must exist
2. **Segment Name:** Must match `/^[A-Z][A-Z0-9]{2}$/` (3 uppercase alphanumeric)
3. **Field Data:** At least one segment must have fields
4. **Invalid Names:** Error lists all invalid segment names

**Error Format:**
```
"Invalid segment name(s): "XYZ", "AB". HL7 segments must be 3 uppercase characters (e.g., MSH, PID, OBR)."
```

#### Template Save Validation
**Create Template Page:**
- Name: Required
- Content: Required
- Description: Optional
- Message Type: Required (dropdown)

**Alert on failure:**
```
alert("Name and Content are required.");
```

#### Security Validation (Generated Message)
**Function:** `isValidHl7Content(content: string)`

**Checks:**
1. Must start with segment name + `|`: `/^[A-Z][A-Z0-9]{2}\|/`
2. Only printable ASCII + CR/LF/tab: `/^[\x20-\x7E\r\n\t]*$/`
3. No HTML/script: `/<[a-zA-Z]|javascript:|data:/i`

**On Failure:**
- Logs warning
- Removes from localStorage
- Does not load content

### 6.4 Segment Visibility Rules

#### Field Visibility
**Rule:** Hide trailing empty fields in segments

**Implementation:**
```typescript
let lastNonEmptyIndex = -1;
for (let i = segment.fields.length - 1; i >= 0; i--) {
  const field = segment.fields[i];
  const hasValue = field.value || (field.components && field.components.some(c => c.value || ...));
  if (hasValue) {
    lastNonEmptyIndex = i;
    break;
  }
}
return segment.fields.slice(0, lastNonEmptyIndex + 1);
```

**Effect:** Cleaner UI, hides noise from parser

#### Segment Visibility (Variables-Only Mode)
**Rule:** Hide segments with no fields containing variables

**Implementation:**
```typescript
processedSegments
  .map(s => ({
    ...s,
    fields: s.fields.filter(f => fieldContainsVariable(f))
  }))
  .filter(s => s.fields.length > 0);
```

**Where Applied:** Template List (optional), Use Template (always)

### 6.5 Component Reconstruction

**Challenge:** User can edit composite field value directly OR individual components

**Solution:** When components edited, reconstruct full value:
```typescript
const newValue = newComponents.map(c => {
  if (c.subComponents && c.subComponents.length > 0) {
    return c.subComponents.map(s => s.value).join('&');
  }
  return c.value;
}).join('^');
```

**Reverse:** When full value edited, clear components:
```typescript
return { ...f, value, components: [], repetitions: [] };
```

**Where Applied:** FieldInput component, all editing contexts

### 6.6 Scroll Synchronization (Template Edit)

**Components:**
1. Background div (highlights)
2. Foreground textarea (user input)

**Challenge:** Keep scroll positions in sync

**Solution:**
```typescript
const handleHighlightScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
  if (highlightRef.current) {
    highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
  }
}, []);

<textarea onScroll={handleHighlightScroll} ... />
```

**Where Applied:** Template List edit mode only

### 6.7 Deep Cloning (Serializations)

**Challenge:** Multiple serialization instances share template but have independent values

**Solution:**
```typescript
const newInstance: SerializationInstance = {
  id: crypto.randomUUID(),
  segments: structuredClone(parsedSegments),
  output: generateHl7Message(parsedSegments),
  copyButtonText: 'Copy to Clipboard'
};
```

**Why:** Prevents changes in one instance affecting others

**Where Applied:** Use Template "Add Serialization" button

---

## 7. DATA FLOW PATTERNS

### 7.1 Main Editor Flow
```
User types in textarea
  ↓ (300ms debounce)
parseHl7Message(text)
  ↓
segments (SegmentDto[])
  ↓
MessageEditor (display)
  ↓
User edits field
  ↓
handleUpdate(updatedSegments)
  ↓
setSegments(updatedSegments)
  ↓
User clicks "Update Raw"
  ↓
generateHl7Message(segments)
  ↓
setHl7Text(newHl7)
```

### 7.2 Template Edit Flow
```
User clicks "Edit" on template
  ↓
setEditingId(template.id)
setEditContent(template.content)
  ↓
parseHl7Message(editContent)
  ↓
applyVariableEditability(segments)
  ↓
MessageEditor (with variable highlighting)
  ↓
User edits field
  ↓
handleEditorUpdate(updatedSegments)
  ↓
generateHl7Message(updatedSegments)
  ↓
setEditContent(newHl7)
  ↓
(Highlights re-render automatically)
  ↓
User clicks "Save"
  ↓
Update template in array
saveTemplatesToStorage(updatedTemplates)
```

### 7.3 Serialization Flow
```
User selects template
  ↓
parseHl7Message(template.content)
  ↓
applyVariableEditability(segments)
  ↓
Create first SerializationInstance
  ↓
filterSegmentsForVariables(segments) → MessageEditor
  ↓
User edits variable field
  ↓
createUpdateHandler(serializationId)
  ↓
Merge edited fields back into full segments
  ↓
generateHl7Message(fullSegments)
  ↓
Update instance.output
  ↓
User clicks "Serialize & Load"
  ↓
Combine all outputs with `\n\n---\n\n`
  ↓
localStorage.setItem('generated_hl7', combined)
  ↓
Navigate to /?loadGenerated=true
  ↓
Main Editor loads and parses
```

---

## 8. ACCESSIBILITY FEATURES

### 8.1 ARIA Attributes

**Dialog Roles:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="[title-id]"`
- `aria-describedby="[message-id]"`

**Used On:** ConfirmDialog

**Form Labels:**
- `aria-label` on all inputs without visible labels
- Format: `"Field {position} {description}"`

**Used On:** FieldInput component

### 8.2 Keyboard Navigation

**Tab Trapping (ConfirmDialog):**
- Keeps focus within dialog
- Shift+Tab: Reverse cycle
- Tab: Forward cycle

**ESC Key:**
- Closes ConfirmDialog (calls onCancel)
- Handled in useEffect with keyboard listener

**Focus Management:**
- Auto-focus on dialog open:
  - Destructive variant: Cancel button
  - Default variant: Confirm button

### 8.3 Screen Reader Support

**test-id Attributes:**
- All interactive elements have `data-testid`
- Used for both testing AND screen reader navigation

**Semantic HTML:**
- `<header>` for navigation
- `<main>` for page content
- `<button>` for actions
- `<label>` for form fields

**Error Announcements:**
- `role="alert"` on error messages (Use Template)
- Automatically announced by screen readers

### 8.4 Color Contrast

**Not Explicitly Defined:** Theme colors should meet WCAG AA standards, but this is not documented in code.

**Text Color Patterns:**
- Foreground on background
- Card-foreground on card
- Primary-foreground on primary
- Muted-foreground on muted

**Recommendation:** Validate each theme meets contrast requirements.

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1 Debouncing
- **Main Editor Input:** 300ms debounce on parsing
- **Prevents:** Excessive parsing during typing

### 9.2 Memoization
- **MessageEditor:** `useMemo` for message type extraction and definition loading
- **FieldInput:** `useMemo` for display value, highlight class
- **Template Page:** `useMemo` for displaySegments

### 9.3 Virtualization
**Not Implemented:** Long message segments or large template lists may cause performance issues

### 9.4 Deep Cloning
- **Uses:** `structuredClone()` for serialization instances
- **Modern API:** May not work in older browsers

---

## 10. BROWSER COMPATIBILITY NOTES

### 10.1 Modern APIs Used
- `crypto.randomUUID()` - UUID generation
- `structuredClone()` - Deep cloning
- `navigator.clipboard.writeText()` - Clipboard API
- `next-themes` - Theme management

### 10.2 Hydration
- `suppressHydrationWarning` on `<html>` tag
- ThemeSwitcher checks `mounted` state before rendering

---

## Summary

This document provides a complete, factual inventory of all UI principles, patterns, components, and behaviors in the HL7 Helper Web application. It is intended as a reference for the @ux-designer agent and for maintaining consistency during future development.

**Key Takeaways:**
- 7 theme variants with CSS custom properties
- Comprehensive HELPERVARIABLE system with color-coded grouping
- Three main workflows: Edit, Template Management, Serialization
- Shared component library with consistent patterns (mostly)
- Some inconsistencies noted in button styles, card styles, and error displays
- Strong accessibility foundation with ARIA attributes and keyboard support
