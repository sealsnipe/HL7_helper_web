# HL7 Helper Web - Complete UI Hierarchy

**Compiled**: 2025-12-15
**Sources**: ui-hierarchy.md + 3 addendums (after orchestrator/UX-analyst discussion)

---

## 1. GLOBAL PRINCIPLES (All Pages)

### 1.1 Layout Architecture
| Pattern | Implementation | Pages |
|---------|---------------|-------|
| Max-width container | `max-w-7xl mx-auto px-6` | All |
| Sticky header | `sticky top-0 z-40 bg-background/95 backdrop-blur-md` | All |
| Vertical spacing | `py-8 space-y-8` or `py-8 space-y-6` | All |
| Page background | `min-h-screen bg-background font-sans transition-colors text-foreground` | All |

### 1.2 Theming System
- **7 themes**: light, dark, system, forest, ocean, sunset, midnight
- **CSS variables**: All colors via `--foreground`, `--background`, `--primary`, etc.
- **Persistence**: localStorage via `next-themes` library
- **System detection**: `prefers-color-scheme` media query

### 1.3 Typography
| Use | Classes |
|-----|---------|
| Headings | `text-2xl font-bold` |
| Section headers | `text-sm font-semibold uppercase tracking-wider` |
| Labels | `text-xs font-medium` or `text-[10px]` |
| Body | `text-sm` |
| Mono/Code | `font-mono text-sm` |

### 1.4 Spacing Standards
| Element | Padding | Gap |
|---------|---------|-----|
| Cards | `p-4` to `p-6` | - |
| Sections | - | `space-y-4` to `space-y-8` |
| Form groups | - | `gap-4` |
| Inline items | - | `gap-2` |

### 1.5 Animation Timings
| Type | Duration | Use |
|------|----------|-----|
| Primary | 200ms | Modals, expansions, color transitions |
| Secondary | 500ms | Gradient hovers |
| Continuous | `animate-spin`, `animate-pulse` | Loading, decorative |

### 1.6 Z-Index Layers
| Layer | Z-Index | Use |
|-------|---------|-----|
| Sticky Header | `z-40` | Navigation |
| Modals | `z-50` | Dialogs, overlays |
| Tooltips | Browser default | Minimal usage |

---

## 2. SHARED COMPONENTS

### 2.1 NavigationHeader
- **File**: `src/components/NavigationHeader.tsx`
- **Used on**: ALL pages
- **Props**: `activePage?: 'home' | 'create' | 'serialize' | 'templates'`
- **Contents**: Logo text, 4 navigation buttons, ThemeSwitcher
- **Active state**: `bg-primary text-primary-foreground` vs `bg-muted`

### 2.2 MessageEditor
- **File**: `src/components/MessageEditor.tsx`
- **Used on**: Main Editor, Template List, Use Template
- **Props**:
  ```typescript
  segments: SegmentDto[];
  onUpdate: (segments: SegmentDto[]) => void;
  highlightVariable?: boolean;
  variableValues?: Map<string, string>;      // PREPARED BUT NOT USED
  onVariableChange?: (variableId: string, value: string) => void;  // PREPARED BUT NOT USED
  ```
- **Features**: Message type detection, expand/collapse all, segment definitions

### 2.3 SegmentRow
- **File**: `src/components/SegmentRow.tsx`
- **Used in**: MessageEditor
- **Features**: Collapsible rows, segment descriptions from definitions, field rendering
- **Visibility**: Always visible (no field count condition)

### 2.4 FieldInput
- **File**: `src/components/FieldInput.tsx`
- **3 Render Modes** (determined by data):
  1. Simple field (no components/repetitions)
  2. Composite field (has components - expandable)
  3. Repetition field (has repetitions - multiple inputs)
- **Variable Badge**: Shows `V{groupId}` + "Linked variable" for numbered variables
- **Highlight**: Group-specific colors via `getVariableGroupColor()`

### 2.5 ConfirmDialog
- **File**: `src/components/ConfirmDialog.tsx`
- **Variants**: `'default'` | `'destructive'`
- **Accessibility**: Focus trap, ESC to close, auto-focus (confirm for default, cancel for destructive)
- **test-ids**: `confirm-dialog`, `confirm-dialog-cancel`, `confirm-dialog-confirm`

### 2.6 ThemeSwitcher
- **File**: `src/components/ThemeSwitcher.tsx`
- **UI**: Dropdown with 7 theme options
- **Hydration**: Shows nothing until `mounted` to prevent flicker

### 2.7 ErrorBoundary
- **File**: `src/components/ErrorBoundary.tsx`
- **Shows**: "Something went wrong" + error message + "Try Again" button
- **test-ids**: `error-boundary-fallback`, `error-boundary-retry`

### 2.8 DataManagement
- **File**: `src/components/persistence/DataManagement.tsx`
- **Used on**: Template List page
- **Features**: Export templates as JSON, Import from JSON file
- **Validation**: File structure validation before import

---

## 3. PAGE-SPECIFIC FEATURES

### 3.1 Main Editor (`/`)
| Feature | Implementation |
|---------|---------------|
| Live parsing | 300ms debounce (`PARSE_DEBOUNCE_MS`) |
| Gradient borders | Decorative animated borders on panels |
| Template modal | "Load Example Message" with 3 sample templates |
| Security validation | `isValidHl7Content()` for localStorage data |
| Copy to clipboard | Button with "Copied!" feedback (2s timeout) |
| Regenerate | "Update Raw from Visual" button |

**State NOT persisted**: All editor content lost on refresh

### 3.2 Template List (`/templates`)
| Feature | Implementation |
|---------|---------------|
| Expandable rows | Click row header to expand/collapse |
| Edit mode | Inline editing with highlighted textarea |
| View toggle | "All Fields" / "Variables Only" (SHARED state between modes) |
| Raw + Structured | Side-by-side view (2-column on desktop) |
| Fixed height | `h-[600px]` for editor area |
| Actions | Edit, Duplicate, Delete per template |

**Unique**: Scroll sync between textarea and highlight overlay

### 3.3 Create Template (`/templates/create`)
- **Status**: Legacy page (rarely used, most creation via Template List)
- **Validation**: Name and Content required (browser `alert()`)
- **Corrupted data handling**: `confirm()` dialog to clear

### 3.4 Use Template (`/templates/use`)
| Feature | Implementation |
|---------|---------------|
| Multi-serialization | Array of `SerializationInstance[]` |
| Paired layout | Output (left) + Variables Editor (right) |
| Variables-only | Always filtered (NO toggle) |
| Add/Remove | "+ Add Serialization" button, remove per-instance |
| Copy per-instance | Individual clipboard buttons |
| Serialize & Load | Saves to localStorage, navigates to Main Editor |

**Key difference from Template List**: No view toggle, always shows only HELPERVARIABLE fields

---

## 4. MINI-FEATURES & WHERE THEY APPLY

### 4.1 HELPERVARIABLE System

#### Syntax
| Type | Pattern | Example |
|------|---------|---------|
| Standalone | `HELPERVARIABLE` | Basic placeholder |
| Numbered (1-999) | `HELPERVARIABLE{n}` | `HELPERVARIABLE1`, `HELPERVARIABLE42` |

#### Color Coding (8 rotating colors)
| Group | Ring/Background Color |
|-------|----------------------|
| None (standalone) | Amber |
| 1 | Blue |
| 2 | Green |
| 3 | Purple |
| 4 | Pink |
| 5 | Cyan |
| 6 | Orange |
| 7 | Teal |
| 8+ | Cycles back to Blue |

#### Where Applied
| Page | Highlighting | Editability |
|------|-------------|-------------|
| Template List (view) | Yes - in raw textarea | Read-only |
| Template List (edit) | Yes - in raw textarea | All fields editable (except MSH-1/2) |
| Use Template | Yes - in raw template | Only variable fields editable |
| Main Editor | No highlighting | All fields editable (except MSH-1/2) |

### 4.2 Field Editability Rules

| Page | Rule | MSH-1/MSH-2 |
|------|------|-------------|
| Main Editor | ALL fields editable | Never editable |
| Template List (read) | NO fields editable | Never |
| Template List (edit) | ALL fields editable | Never editable |
| Use Template | ONLY HELPERVARIABLE fields | Never editable |

**Critical Rule**: Variable fields remain editable even AFTER user replaces HELPERVARIABLE text (position-based, not content-based)

### 4.3 Expand/Collapse Behaviors

| Level | Component | Trigger |
|-------|-----------|---------|
| Page-level | Template rows | Click row header |
| Editor-level | All segments | "Expand All" / "Collapse All" buttons |
| Field-level | Composite fields | ▼/▲ button per field |

### 4.4 Copy to Clipboard

| Location | Feedback | Error Handling |
|----------|----------|----------------|
| Main Editor | "Copied!" (2s) | Console only |
| Use Template (per-instance) | "Copied!" (2s) | Console only |
| Serialization components | "Copied!" (2s) | Console only |

**Gap**: Silent failures, no user feedback on error

### 4.5 Loading States

| Page | Indicator | Style |
|------|-----------|-------|
| Main Editor (parsing) | "Parsing..." + SVG spinner | 12px spinner |
| Template List (initial) | "Loading templates..." + border spinner | 20px spinner |
| Use Template (dropdown) | "-- Loading templates... --" | Text only |
| Export/Import | Button text change | No spinner |

**Inconsistency**: Two different spinner implementations

### 4.6 Debounced Input
- **Only location**: Main Editor textarea
- **Delay**: 300ms
- **Effect**: Suppresses errors while typing, parses after pause

---

## 5. CONSISTENCY REQUIREMENTS

### 5.1 What SHOULD Be Same (Current Status)

| Element | Status | Notes |
|---------|--------|-------|
| Button primary | Consistent | `bg-primary text-primary-foreground` |
| Button destructive | **Inconsistent** | 3 different implementations |
| Card backgrounds | **Inconsistent** | Mix of solid/transparent/backdrop-blur |
| Error banners | **Inconsistent** | Amber vs Red, different radiuses |
| Loading spinners | **Inconsistent** | 2 implementations |
| Input fields | Mostly consistent | Minor border-radius differences |
| Z-index layers | Consistent | z-40 header, z-50 modals |
| Responsive breakpoints | Consistent | lg: for 2-column |

### 5.2 Test ID Naming
- **Pattern**: `{component}-{identifier}` in kebab-case
- **Inconsistency**: Mix of `-button` and `-btn` suffixes
- **Count**: 68+ test IDs documented

### 5.3 Tooltips
- **Current**: Only 2 uses (field labels, expand button)
- **Gap**: No tooltips on buttons, complex features, or help text

---

## 6. SPECIAL BEHAVIORS

### 6.1 HL7 Parsing Rules
- **Line endings**: Handles `\r\n`, `\n`, `\r`
- **MSH special case**: Field positions adjusted (MSH-1 = separator, MSH-2 = encoding)
- **Escape sequences**: `\F\`, `\S\`, `\R\`, `\T\`, `\E\` supported
- **Validation**: 5 different checks with specific error messages

### 6.2 Template Persistence
- **Storage key**: `hl7-helper:templates`
- **Migration**: From old `hl7_templates` key (v1 migration)
- **Default templates**: 3 samples created if none exist

### 6.3 Inter-Page Data Transfer
- **Flow**: Use Template → `generated_hl7` localStorage → Main Editor
- **Trigger**: `?loadGenerated=true` query parameter
- **Security**: `isValidHl7Content()` validates before loading
- **Cleanup**: Removes from localStorage and URL after loading

### 6.4 Session State

| Data | Persists | Lost on Refresh |
|------|----------|-----------------|
| Templates | Yes (localStorage) | No |
| Theme preference | Yes (next-themes) | No |
| Editor content | No | Yes |
| Serialization instances | No | Yes |
| Errors/UI state | No | Yes |

**Gap**: No auto-save, no "unsaved changes" warning

---

## 7. BROWSER COMPATIBILITY

### 7.1 Modern APIs Used (NO FALLBACKS)

| API | Min Browser | Risk |
|-----|-------------|------|
| `crypto.randomUUID()` | Chrome 92+, Firefox 95+, Safari 15.4+ | Medium |
| `structuredClone()` | Chrome 98+, Firefox 94+, Safari 15.4+ | Medium |
| `navigator.clipboard` | Chrome 63+, Firefox 53+, Safari 13.1+ | Low |

**Critical**: App will break on browsers from 2021 or earlier

### 7.2 localStorage Keys

| Key | Prefix | Purpose |
|-----|--------|---------|
| `hl7-helper:templates` | Yes | Template storage |
| `hl7-helper:migrations` | Yes | Migration tracking |
| `generated_hl7` | **No** | Temporary transfer |
| Theme key | N/A | Managed by next-themes |

---

## 8. ACCESSIBILITY FEATURES

### 8.1 Implemented
- **ARIA**: Dialog roles, labels on inputs
- **Focus trap**: ConfirmDialog only
- **Keyboard**: ESC to close, Tab navigation, Enter/Space on ImportButton
- **Visible focus**: `focus:ring-2` on all interactive elements
- **Screen reader**: Semantic HTML, test-ids, `aria-label`

### 8.2 Gaps
- No keyboard shortcuts (beyond browser defaults)
- No in-app help/documentation
- Silent clipboard failures
- No `:focus-visible` variants
- Very few tooltips

---

## 9. MOBILE/RESPONSIVE

### 9.1 Breakpoints Used
| Breakpoint | Pixels | Primary Use |
|------------|--------|-------------|
| `lg:` | 1024px | 2-column → 1-column layouts |
| `md:` | 768px | 3-column → 1-column metadata |

### 9.2 Known Issues
- Fixed heights (`h-[600px]`) may overflow
- No touch optimizations
- Hover states stick on tap
- No mobile-specific navigation
- Template List table not responsive

---

## 10. PREPARED BUT UNUSED FEATURES

### 10.1 Linked Variables
- **Props exist**: `variableValues`, `onVariableChange` in MessageEditor/FieldInput
- **Badge displays**: "V{groupId}" with "Linked variable" text
- **Handler exists**: `handleValueChange` checks for `variableId`
- **Status**: NOT connected - no page passes these props

### 10.2 Advanced Serialization Architecture
- **9 components** in `src/components/serialization/`
- **Reducer hook**: `useSerializationReducer.ts`
- **Helper utilities**: `serializationHelpers.ts`
- **Status**: NOT used - replaced by simpler useState approach

### 10.3 Dead Code
- `filterSegmentsForVariables()` - never called
- `extractUniqueVariables()` - replaced by enhanced version, not used

---

## 11. HL7 DEFINITIONS

### 11.1 Available Definitions
| Message Type | File | In Dropdown |
|--------------|------|-------------|
| ADT^A01 | `adt-a01.json` | Yes |
| ORU^R01 | `oru-r01.json` | Yes |
| ORM^O01 | `orm-o01.json` | **No** (gap!) |

### 11.2 Sample Templates
| Name | Type | Content |
|------|------|---------|
| ADT^A01 (Admit) | ADT^A01 | Patient admission (Greensboro, NC) |
| ORU^R01 (Observation) | ORU^R01 | Lab result (German medical data) |
| ORM^O01 (Order) | ORM^O01 | CBC order (generic) |

---

## 12. RECOMMENDATIONS PRIORITY

### HIGH Priority
1. Add browser feature detection + warning
2. Add auto-save or "unsaved changes" warning
3. Standardize loading indicators
4. Add clipboard fallback
5. Fix ORM^O01 not in dropdown

### MEDIUM Priority
6. Mobile testing and optimization
7. Add tooltips to complex UI
8. Complete or remove linked variables feature
9. Remove dead code
10. Standardize error message tone

### LOW Priority
11. Add keyboard shortcuts
12. Deep linking support
13. Touch gesture support
14. Component variant system
15. More HL7 definitions

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Pages | 4 |
| Shared Components | 8 |
| Themes | 7 |
| Test IDs | 68+ |
| HL7 Definitions | 3 |
| Sample Templates | 3 |
| Unused Components | 9 |
| Dead Functions | 2 |
| Browser API Risks | 3 |
| Known Inconsistencies | 6 |
| Accessibility Gaps | 5 |
| Mobile Issues | 5 |

**Document Status**: Complete - All UI elements, patterns, behaviors, and edge cases documented.
