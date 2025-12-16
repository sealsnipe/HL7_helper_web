# UI Hierarchy Document - Addendum 3: Final Details

**Date**: 2025-12-15
**Purpose**: Final comprehensive review - test IDs, definitions, samples, responsive design, and UI details

---

## 1. TEST ID INVENTORY (data-testid)

### 1.1 Naming Convention

**Pattern**: `{component/purpose}-{specific-identifier}`
- Kebab-case
- Descriptive
- Hierarchical when needed

**Examples:**
- `confirm-dialog-cancel`
- `field-input-3`
- `serialization-pair-uuid123`

### 1.2 Complete Test ID List

**ConfirmDialog Component:**
```
data-testid="confirm-dialog"                  (dialog wrapper)
data-testid="confirm-dialog-cancel"           (cancel button)
data-testid="confirm-dialog-confirm"          (confirm button)
```

**Main Editor Page (`/`):**
```
data-testid="raw-hl7-input"                   (textarea for HL7 text)
data-testid="error-clear-button"              (clear error state)
data-testid="error-try-sample-button"         (load sample message)
data-testid="copy-to-clipboard-button"        (copy button)
data-testid="regenerate-button"               (update raw from visual)
```

**Template List Page (`/templates`):**
```
data-testid="edit-content-textarea"           (edit mode textarea)
data-testid="view-mode-all"                   (show all fields button)
data-testid="view-mode-variables"             (show variables only button)
```

**FieldInput Component:**
```
data-testid="field-input-{position}"          (simple field input)
data-testid="field-input-{position}-rep-{repIdx}"   (repetition input)
data-testid="field-input-{position}-composite"      (composite field - read-only)
data-testid="field-expand-{position}"               (expand/collapse button)

Example values:
- "field-input-3"
- "field-input-5-rep-0"
- "field-input-9-composite"
- "field-expand-9"
```

**ErrorBoundary Component:**
```
data-testid="error-boundary-fallback"        (error UI wrapper)
data-testid="error-boundary-retry"           (try again button)
```

**Use Template Page (`/templates/use`):**
```
data-testid="error-message"                  (error banner)
data-testid="template-select"                (template dropdown)
data-testid="raw-hl7-template"               (template preview)
data-testid="serialization-pair-{id}"        (serialization instance wrapper)
data-testid="copy-button-{id}"               (per-instance copy)
data-testid="remove-serialization-{id}"      (remove instance button)
data-testid="serialization-output-{id}"      (output display area)
data-testid="serialization-block-{id}"       (used for scrollIntoView)
data-testid="add-serialization-button"       (add new instance)
data-testid="cancel-button"                  (bottom cancel)
data-testid="serialize-button"               (serialize & load)
```

**Persistence Components:**
```
data-testid="data-management"                (wrapper)
data-testid="import-error"                   (import error display)
data-testid="import-file-input"              (hidden file input)
data-testid="import-button"                  (import button label)
data-testid="export-button"                  (export button)
```

**Serialization Components (unused but present):**
```
data-testid="action-bar"
data-testid="copy-all-btn"
data-testid="serialize-and-load-btn"
data-testid="instance-pair-{instanceName}"
data-testid="instance-list"
data-testid="add-instance-btn"
data-testid="instance-count-announcement"
data-testid="input-panel-{instanceName}"
data-testid="duplicate-btn-{instanceName}"
data-testid="delete-btn-{instanceName}"
data-testid="cancel-delete-{instanceName}"
data-testid="confirm-delete-{instanceName}"
data-testid="variable-input-{variableId}"
data-testid="variable-input-field-{variableId}"
data-testid="output-panel-{instanceName}"
data-testid="copy-btn-{instanceName}"
data-testid="output-content-{instanceName}"
data-testid="variables-only-view"
data-testid="view-mode-toggle"
data-testid="view-mode-vars"
data-testid="view-mode-all"
```

### 1.3 Consistency Analysis

**Consistent Patterns:**
- All buttons have `-button` or `-btn` suffix
- All inputs have `input` in name
- IDs are dynamic where needed (use template literals)
- Wrapper elements use component name

**Inconsistencies:**
- Sometimes `-button`, sometimes `-btn` (prefer `-button`)
- FieldInput uses `field-input-{position}` format
- Serialization uses `{component}-{instanceName}` format
- No global prefix (could add `hl7-helper-` prefix)

---

## 2. HL7 DEFINITIONS SYSTEM

### 2.1 Architecture

**File**: `src/utils/definitionLoader.ts`

**Implementation:**
```typescript
import adtA01 from '../data/hl7-definitions/adt-a01.json';
import oruR01 from '../data/hl7-definitions/oru-r01.json';
import ormO01 from '../data/hl7-definitions/orm-o01.json';

const definitions: Record<string, Hl7Definition> = {
  'ADT^A01': adtA01 as unknown as Hl7Definition,
  'ORU^R01': oruR01 as unknown as Hl7Definition,
  'ORM^O01': ormO01 as unknown as Hl7Definition,
};

export const loadDefinition = (messageType: string): Hl7Definition | null => {
  return definitions[messageType] || null;
};

export const getSegmentDefinition = (definition: Hl7Definition | null, segmentName: string) => {
  if (!definition || !definition.segments) return null;
  return definition.segments[segmentName] || null;
};
```

### 2.2 Available Definitions

**3 Message Types with Full Definitions:**

1. **ADT^A01** - Admit/Discharge/Transfer - Patient Admission
   - File: `src/data/hl7-definitions/adt-a01.json`
   - Segments: MSH, EVN, PID, NK1, PV1, etc.

2. **ORU^R01** - Observation Result - Lab Results
   - File: `src/data/hl7-definitions/oru-r01.json`
   - Segments: MSH, PID, PV1, OBR, OBX, etc.

3. **ORM^O01** - Order Message - General Order
   - File: `src/data/hl7-definitions/orm-o01.json`
   - Segments: MSH, PID, PV1, ORC, OBR, etc.

**Definition Structure:**
```typescript
interface Hl7Definition {
  messageType: string;       // e.g., "ADT^A01"
  description: string;       // e.g., "Admit/discharge/transfer"
  segments: Record<string, SegmentDefinition>;
}

interface SegmentDefinition {
  description: string;       // e.g., "Message Header"
  fields: Record<string, FieldDefinition>;
}

interface FieldDefinition {
  description: string;       // e.g., "Sending Application"
  components?: Record<string, string>; // Optional component descriptions
}
```

### 2.3 Usage in UI

**MessageEditor Component:**
- Loads definition based on MSH-9 message type
- Displays message type in header: `Message Segments (ADT^A01)`
- Passes definition to SegmentRow components

**SegmentRow Component:**
- Displays segment description: `MSH - Message Header`
- Passes field definitions to FieldInput

**FieldInput Component:**
- Displays field description as label
- Displays component descriptions if available
- Shows position numbers: `3`, `3.1`, `3.1.1`

**When No Definition:**
- UI still works (graceful degradation)
- No descriptions shown
- Position numbers still displayed
- All functionality intact

### 2.4 Gap: Limited Message Type Support

**Problem**: Only 3 message types have definitions, but HL7 has 100+ message types.

**Impact:**
- Unknown message types parse correctly but have no descriptions
- Dropdown only offers ADT-A01 and ORU-R01 (inconsistency - ORM-O01 has definition but not in dropdown!)
- Users can't add custom definitions

**Recommendation**: Add more definitions or allow user-provided definitions.

---

## 3. SAMPLE TEMPLATES

**File**: `src/data/templates.ts`

**Count**: 3 sample templates (matches definition count)

### 3.1 Template Inventory

**1. ADT^A01 (Admit)**
```
Name: "ADT^A01 (Admit)"
Message Type: ADT^A01
Segments: MSH, EVN, PID, NK1, PV1
Fields: Complete patient admission with next of kin
Sample Patient: JONES, WILLIAM A III, DOB 1961-06-15
```

**Content:**
```hl7
MSH|^~\&|ADT1|MCM|LABADT|MCM|198808181126|SECURITY|ADT^A01|MSG00001|P|2.3
EVN|A01|198808181123
PID|||PATID1234^5^M11||JONES^WILLIAM^A^III||19610615|M||C|1200 N ELM STREET^^GREENSBORO^NC^27401-1020|GL|(919)379-1212|(919)271-3434||S||PATID12345001^2^M10|123456789|987654^NC
NK1|1|JONES^BARBARA^K|WIFE||||||NK^NEXT OF KIN
PV1|1|I|2000^2012^01||||004777^LEBAUER^SIDNEY^J.|||SUR||||ADM|A0|
```

**2. ORU^R01 (Observation Result)**
```
Name: "ORU^R01 (Observation Result)"
Message Type: ORU^R01
Segments: MSH, PID, PV1, OBR, OBX
Fields: Radiology report with observation
Sample Patient: Kilian, Helga, DOB 1944-03-27
Procedure: X-ray Elbow right, 2 planes
```

**Content:**
```hl7
MSH|^~\&|ORBIS|RIS|SIEMENS|RAD|20251119121951||ORU^R01|RIS25########084240010|P|2.5
PID|||20306914|202533643|Kilian^Helga^^^^||19440327|F|||Hofgartenstr. 22 ^^Bensheim^^64625^D  ||||||||
PV1||O|I_HPRS_NOTAMB^^^I_HPRS^^^^^929400||||SCHMIDT28^Schmidt^Johannes^^^|||N|||||||||202533643||K|||||||||||||||||||||||20250724082600||||||28688150
OBR|16753186||39954910|L015030028^Röntgen.Ellenbogen rechts.2 Ebenen^ROE Ellenbogen rechts, 2 Ebenen^Ellenbogen rechts^ROE|||||||||^^Bursitis Olecrani Fremdkörper?^|||SCHMIDT28^Schmidt^Johannes^^^||0028688150084478|||ST3^ROE|20251119121804||ROE|||^^^20251105160300|||||&&&&^^^|&&&&~&&&&^^^^^^^^^||||0||37415|34569
OBX|16753186|TX|40048474^GDT|KOPF|Röntgen.Ellenbogen rechts.2 Ebenen vom 19.11.2025|||||||||20251119121941
```

**3. ORM^O01 (Order)**
```
Name: "ORM^O01 (Order)"
Message Type: ORM^O01
Segments: MSH, PID, PV1, ORC, OBR
Fields: Order message for CBC test
Sample Patient: Doe, John, DOB 1980-01-01
Order: Complete Blood Count (CBC)
```

**Content:**
```hl7
MSH|^~\&|HIS|RI|LIS|RI|202301010000||ORM^O01|MSGID12345|P|2.3
PID|||123456||Doe^John||19800101|M|||123 Main St^^Anytown^CA^12345
PV1||O|OP^^^||||123^Dr.Smith
ORC|NW|1000^HIS|2000^LIS||||||202301010000
OBR|1|1000^HIS|2000^LIS|80001^CBC||||||||||||||||||F
```

### 3.2 Usage in Application

**Main Editor:**
- "Load Example Message" button → shows modal with all 3
- "Try Sample Message" error button → loads first template (ADT^A01)

**Template List:**
- Loaded as defaults if no custom templates in localStorage
- Each becomes a Template object with:
  - ID: `default-0`, `default-1`, `default-2`
  - Name: As shown above
  - Description: "Standard Example"
  - Message Type: Extracted from MSH-9
  - Content: Full HL7 text
  - Created: Current timestamp

**Use Template:**
- Same default loading behavior as Template List

### 3.3 Data Source Notes

**ORU^R01 Template:**
- Contains real-looking German patient data (Bensheim, Germany)
- Recent dates (2025-11-19, 2025-07-24)
- **Appears to be anonymized real data or realistic test data**

**ADT^A01 Template:**
- Classic HL7 example from tutorials
- Old dates (1988, 1961)
- Location: Greensboro, NC

**ORM^O01 Template:**
- Simple generic example
- Minimal data
- Generic names (John Doe)

---

## 4. MOBILE & RESPONSIVE BEHAVIOR

### 4.1 Responsive Breakpoints

**Tailwind Default Breakpoints Used:**
- `sm:` 640px (rarely used)
- `md:` 768px (used for 3-column grid)
- `lg:` 1024px (primary breakpoint for 2-column layouts)

**Breakpoint Usage:**

| Breakpoint | Usage | Pages |
|------------|-------|-------|
| `lg:grid-cols-2` | 2-column layouts (1 col on mobile) | Main Editor, Template Edit, Create Template, Use Template |
| `md:grid-cols-3` | 3-column metadata inputs | Template Edit metadata |
| `lg:divide-y-0 lg:divide-x` | Change divider direction | Use Template serialization pairs |

### 4.2 Mobile Layout Behavior

**Main Editor (`/`):**
- Desktop (≥1024px): 2-column grid (input | editor)
- Mobile (<1024px): Single column, stacked (input above editor)
- Gap: 32px (gap-8)

**Template Edit:**
- Desktop: 2-column (raw text | structured view)
- Mobile: Single column stacked
- Height: Fixed 600px (`h-[600px]`) on all screens

**Use Template:**
- Desktop: 2-column per serialization (output | variables)
- Mobile: Single column stacked
- Divider changes: Horizontal on mobile, vertical on desktop

**Template Edit Metadata:**
- Desktop (≥768px): 3 columns (name | description | type)
- Mobile (<768px): Single column stacked

### 4.3 Touch Interactions

**NO SPECIFIC TOUCH OPTIMIZATIONS:**
- No touch event handlers
- No swipe gestures
- No touch-specific UI elements
- Relies on browser default touch behavior

**Potential Issues:**
- Hover states don't work on touch devices
- No touch feedback beyond browser defaults
- Expand/collapse might be small targets on mobile
- No pull-to-refresh or touch gestures

### 4.4 Viewport/Scaling

**No viewport meta tag visible in code** (likely in Next.js default layout)

**Expected (Next.js default):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**No custom viewport settings**

### 4.5 Mobile Usability Issues

**Identified Problems:**
1. Fixed heights (`h-[600px]`) may overflow on small screens
2. No mobile-specific navigation (hamburger menu)
3. Gradient borders may perform poorly on mobile
4. Textarea min-height `min-h-[400px]` may be too large on mobile
5. Table layout in Template List not responsive (horizontal scroll likely)
6. Font sizes not adjusted for mobile (may be too small)

**Recommendation**: Needs mobile testing and optimization

---

## 5. LOADING STATES

### 5.1 All Loading Indicators

**Type 1: Inline Spinner (Border Animation)**
```tsx
<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
```
**Used In**: Template List (loading templates)
**Size**: 20x20px (w-5 h-5)
**Color**: Primary theme color

**Type 2: Inline SVG Spinner (Circle + Path)**
```tsx
<svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```
**Used In**: Main Editor "Parsing..." indicator
**Size**: 12x12px (h-3 w-3)
**Color**: Inherits from parent (`text-muted-foreground`)

**Type 3: Button Text Change**
```tsx
{isLoading ? 'Loading...' : 'Button Text'}
{isExporting ? 'Exporting...' : 'Export Data'}
{isImporting ? 'Importing...' : 'Import Data'}
```
**Used In**: ExportButton, ImportButton, Template List
**No spinner, just text change**

### 5.2 Loading States by Page

**Main Editor:**
- Parsing state: `isTyping` → Shows "Parsing..." with SVG spinner
- No loading state for initial render
- Copy success: Changes button text "Copy" → "Copied!" (not loading, success state)

**Template List:**
- Initial load: `isLoading` → Border spinner + "Loading templates..."
- No individual template loading states
- Save operation: No loading indicator (synchronous)

**Use Template:**
- Initial load: `isLoading` → "-- Loading templates... --" in dropdown
- No spinner visible
- No serialization loading states

**Create Template:**
- No loading states (save is synchronous)

**Persistence:**
- Export: Button text "Export Data" → "Exporting..."
- Import: Button text "Import Data" → "Importing..."
- No spinners

### 5.3 Consistency Analysis

**Inconsistent:**
- Two different spinner implementations (border vs SVG)
- Different sizes (w-5 vs h-3)
- Some have spinners, some just text
- No loading state for save operations
- No global loading indicator

**Missing:**
- No loading state for regenerate button
- No loading state for template delete
- No loading state for template duplicate
- No skeleton loaders

---

## 6. FOCUS MANAGEMENT

### 6.1 Auto-Focus Patterns

**ConfirmDialog:**
- **Default variant**: Auto-focuses confirm button on open
- **Destructive variant**: Auto-focuses cancel button (safer)
- **Implementation**: `setTimeout(() => buttonToFocus?.focus(), 0)`
- **File**: `src/components/ConfirmDialog.tsx` lines 63-72

**ImportButton:**
- Focus remains on label after file picker closes
- No auto-focus on success/error

**NO OTHER AUTO-FOCUS:**
- Main Editor textarea: Not auto-focused
- Template name input: Not auto-focused on edit mode
- Variable inputs: Not auto-focused

### 6.2 Focus Trap

**ConfirmDialog Only:**
- Traps Tab/Shift+Tab within dialog
- Cycles between focusable buttons
- Code: lines 41-57
- Other modals: NO focus trap (Template Selection modal)

### 6.3 Focus Outline

**Tailwind Default:**
- `focus:ring-2` - 2px ring
- `focus:ring-ring` - Theme color
- `focus:border-ring` - Border matches ring
- `outline-none` - Removes browser default outline

**Applied To:**
- All input fields
- All buttons (via browser defaults)
- Template modal buttons

**Accessibility Note**: All interactive elements have visible focus states

---

## 7. ERROR MESSAGES INVENTORY

### 7.1 User-Facing Error Messages

**Main Editor - Parsing Errors:**
```
"No valid HL7 segments found in the message."
"Invalid segment name(s): "XYZ", "AB". HL7 segments must be 3 uppercase characters (e.g., MSH, PID, OBR)."
"Message contains no valid field data."
{parser exception message} // From hl7Parser.ts
```

**Main Editor - Security:**
```
(Console only, not shown to user)
'Invalid HL7 content detected in localStorage, ignoring'
```

**Template Create:**
```
"Name and Content are required." // Browser alert()
```

**Template Create - Corrupted Data:**
```
'There was an error reading your existing templates. The data may be corrupted.\n\nClick OK to clear the corrupted data and save your new template.\nClick Cancel to abort and keep the existing data.'
// Browser confirm()
```

**Use Template - General:**
```
"Failed to load templates: {error message}"
```
**Display**: Red error banner

**localStorage Errors:**
```
'localStorage is not available'
'Storage quota exceeded. Please export your data and clear some space.'
```
**Display**: Thrown as exceptions (no user-facing UI in most places)

**Clipboard Errors:**
```
(Console only)
'Failed to copy: {error}'
```
**No user feedback** - Silent failure

**Import Errors:**
```
{validation.errors} // Array of error messages from validation
{result.errors} // Array of {key, error} objects
```
**Display**: Red alert box below Import button

**ErrorBoundary:**
```
"Something went wrong"
{error.message} // or "An unexpected error occurred."
```

### 7.2 Error Message Tone Analysis

**Inconsistent Tone:**
- Some technical: `"localStorage is not available"`
- Some user-friendly: `"No valid HL7 segments found in the message."`
- Some instructional: `"HL7 segments must be 3 uppercase characters (e.g., MSH, PID, OBR)."`

**Language:**
- Mix of passive and active voice
- Some with period, some without
- Inconsistent capitalization of "HL7" vs "Hl7"

**Helpful vs. Cryptic:**
- Good: Provides examples `(e.g., MSH, PID, OBR)`
- Good: Explains fix `"Please export your data and clear some space"`
- Bad: `"Failed to copy"` - No explanation or next steps
- Bad: localStorage errors - Technical, no user action

### 7.3 Error Display Patterns

**Amber Warning Banner:**
- Main Editor parse errors
- Style: Rounded, icon, actions

**Red Error Banner:**
- Use Template general errors
- Style: Simpler, no icon

**Browser Alerts:**
- Template Create validation
- Corrupted data confirmation

**Inline Below Element:**
- Import/Export errors
- Style: Small text, no background

**ErrorBoundary:**
- Full component replacement
- Style: Centered, icon, retry button

**Console Only:**
- Security warnings
- Clipboard failures
- Parser warnings

---

## 8. EMPTY STATES INVENTORY

### 8.1 All Empty State Messages

**Main Editor - No Message:**
```
Icon: Document icon (gray, in circle)
Title: "No Message Loaded"
Subtitle: "Paste a message on the left or load an example to start editing."
Style: Center-aligned, muted colors, opacity-60
```

**Template List - No Templates:**
```
Text: "No templates found. Create one to get started."
Style: Simple text, centered in table, padding
```

**Use Template - No Template Selected:**
```
Text: "Select a template above to start creating serializations."
Style: Card with border, centered, large padding
Location: Where serialization instances would appear
```

**Template Dropdown - Loading:**
```
Text: "-- Loading templates... --"
Style: Dropdown option, disabled
```

**Template Dropdown - Empty (shouldn't happen):**
```
Text: "-- Choose a template --"
Style: Dropdown placeholder option
```

### 8.2 Empty State Patterns

**Consistent Elements:**
- All use muted colors (`text-muted-foreground`)
- All centered or center-aligned
- All use instructional language (tell user what to do)

**Inconsistent:**
- Main Editor has icon, others don't
- Different padding/spacing
- Different container styles (card vs plain text)
- No empty state for no serializations (can't happen - min 1)

### 8.3 Missing Empty States

**Template Edit - No Variables:**
- NO specific empty state
- Just shows all fields normally

**MessageEditor - No Segments:**
- Shouldn't happen (validation prevents)
- Would show empty div

**Search Results:**
- No search functionality exists
- N/A

---

## 9. TOOLTIPS & HOVER STATES

### 9.1 Tooltips (title attribute)

**ONLY 2 Uses Found:**

1. **FieldInput Label** (truncated):
```tsx
<label className="..." title={label}>
  {label}
</label>
```
**Purpose**: Show full label text when truncated
**Location**: Field position labels

2. **FieldInput Expand Button**:
```tsx
<button title={isExpanded ? "Collapse" : "Expand"}>
  {isExpanded ? '▲' : '▼'}
</button>
```
**Purpose**: Explain button action
**Location**: Component expand/collapse

**NO OTHER TOOLTIPS:**
- No tooltips on navigation buttons
- No tooltips on action buttons
- No tooltips explaining features
- No help text anywhere

### 9.2 Hover State Patterns

**Standard Pattern:**
```
hover:bg-{color}
hover:text-{color}
hover:border-{color}
transition-colors
```

**Button Hover States:**
- Primary: `hover:bg-primary/90`
- Secondary: `hover:bg-secondary/80`
- Muted: `hover:bg-muted`
- Destructive: `hover:bg-destructive/80`

**Interactive Element Hovers:**
- Segment rows: `hover:bg-muted/30`
- Template rows: `hover:bg-muted/10`
- Expand buttons: `hover:bg-primary/10`
- Modal items: `hover:bg-primary/10 hover:border-primary/50`

**Gradient Border Hover:**
```
group-hover:opacity-50
```
**Used**: Main Editor input/output panels
**Transition**: `duration-500` (slower than standard)

### 9.3 Hover State Issues

**Mobile Devices:**
- Hover states trigger on tap and stick
- No touch-specific alternatives
- May cause confusion on mobile

**Accessibility:**
- No `:focus-visible` variants used
- Keyboard users get same focus states as mouse users
- Could use `:focus-visible:` for keyboard-only focus styles

---

## 10. COMPONENT VARIANT PROPS

### 10.1 ConfirmDialog Variants

**Only Component with Explicit Variants**

**Prop:**
```typescript
variant?: 'default' | 'destructive';
```

**Default Value:** `'default'`

**Visual Differences:**

| Variant | Confirm Button Color | Auto-Focus Target | Use Case |
|---------|---------------------|-------------------|----------|
| `default` | Green (`bg-green-600`) | Confirm button | Safe actions (save, create) |
| `destructive` | Red (`bg-red-600`) | Cancel button | Dangerous actions (delete) |

**Code:**
```typescript
const confirmButtonClasses = variant === 'destructive'
  ? 'bg-red-600 hover:bg-red-700 text-white'
  : 'bg-green-600 hover:bg-green-700 text-white';

// Auto-focus logic
const buttonToFocus = variant === 'destructive'
  ? cancelButtonRef.current
  : confirmButtonRef.current;
```

**Usage:**
- Delete template: `variant="destructive"`
- Clear message: `variant="default"` (actually destructive but not marked)

### 10.2 Other Components with Implicit Variants

**FieldInput (3 render modes, no prop):**
- Simple field (no components/repetitions)
- Field with components (expandable)
- Field with repetitions (multiple inputs)

**Determined By**: Data structure (field.components, field.repetitions)

**MessageEditor (2 modes, via props):**
```typescript
highlightVariable?: boolean;
variableValues?: Map<string, string>;
onVariableChange?: (variableId: string, value: string) => void;
```

**Modes:**
- Normal editing: `highlightVariable={false}`
- Variable editing: `highlightVariable={true}`

**NavigationHeader (4 page modes, via prop):**
```typescript
activePage?: 'home' | 'create' | 'serialize' | 'templates';
```

**Changes:**
- Active button styling
- Button behavior (click handler vs link)

### 10.3 Missing Variant Systems

**No Size Variants:**
- Buttons all one size
- No `size="sm" | "md" | "lg"`

**No Color Variants:**
- No `color="primary" | "secondary" | "danger"`
- Colors hardcoded in components

**No Density Variants:**
- No `compact` vs `comfortable` mode
- All spacing fixed

---

## FINAL SUMMARY

### Documentation Completion Checklist

- [x] Test IDs - Complete inventory with naming patterns
- [x] HL7 Definitions - 3 message types, JSON structure, usage
- [x] Sample Templates - 3 templates with full content
- [x] Mobile/Responsive - Breakpoints, layout behavior, issues
- [x] Loading States - All indicators, consistency issues
- [x] Focus Management - Auto-focus, traps, outlines
- [x] Error Messages - Complete inventory, tone analysis
- [x] Empty States - All messages, patterns
- [x] Tooltips - Only 2 uses, hover patterns
- [x] Component Variants - ConfirmDialog only explicit variant

### Critical Findings

**Mobile Issues:**
- No touch optimization
- Fixed heights may overflow
- No mobile-specific navigation
- Needs testing and optimization

**Accessibility Gaps:**
- Very few tooltips (only 2 uses)
- No help text anywhere
- Silent failures (clipboard errors)
- No keyboard shortcuts documentation

**Inconsistencies:**
- Two spinner implementations
- Inconsistent error display patterns
- Inconsistent test ID naming
- No variant system for common components

**Missing Features:**
- No loading states for many operations
- No skeleton loaders
- No tooltips on complex UI
- No help/documentation in app

### Recommendations

**HIGH PRIORITY:**
1. Add mobile testing and optimization
2. Standardize loading indicators
3. Add tooltips to complex UI elements
4. Improve error message consistency and helpfulness
5. Add keyboard shortcut documentation

**MEDIUM PRIORITY:**
6. Create variant system for buttons/inputs
7. Add more HL7 definitions (or user-provided)
8. Implement skeleton loaders
9. Add in-app help/documentation
10. Improve empty state consistency

**LOW PRIORITY:**
11. Touch gesture support
12. Responsive table layout for Template List
13. Mobile-specific navigation
14. Density/size variants for components
15. Focus-visible styles for keyboard users

---

## Integration Note

This is the FINAL addendum. All three addendums should be merged into the main `ui-hierarchy.md` document, organized by section numbers to maintain a single comprehensive reference.
