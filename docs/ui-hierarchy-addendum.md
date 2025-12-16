# UI Hierarchy Document - Addendum & Corrections

**Date**: 2025-12-15
**Purpose**: Address gaps and clarifications identified in review

---

## CRITICAL CORRECTIONS

### 1. Use Template Page Implementation

**CORRECTION**: The current `src/app/templates/use/page.tsx` (451 lines) is a SIMPLER implementation than what exists in the .bak file (323 lines that uses advanced reducer pattern).

**Current Implementation** (documented in main hierarchy):
- Manual state management with `useState`
- `SerializationInstance[]` array
- Manual handlers for add/remove/copy
- Uses `getFilteredSegments()` local function

**Alternative Implementation** (EXISTS but NOT ACTIVE - in page.tsx.bak):
- Uses `useSerializationReducer` hook
- Redux-style reducer pattern
- Action creators for all operations
- More sophisticated instance management
- Uses separate components from `src/components/serialization/`

**Why Two Implementations Exist:**
The .bak file represents a more complex, component-based architecture that was replaced with a simpler direct implementation. The serialization components and helpers still exist in the codebase but are NOT currently used in the active page.

---

## ADDITIONS TO DOCUMENT

### Section 2.5: FieldInput - Variable Badge Detail

**ADD to FieldInput documentation (after line ~330 in main doc):**

#### Variable Group Badge Display
**Applies to**: Simple fields (no components/repetitions) with `variableGroupId` defined

**Structure:**
```tsx
{field.variableGroupId !== undefined && (
  <div className="flex items-center gap-1 mb-1">
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getVariableBadgeColor(field.variableGroupId)}`}>
      V{field.variableGroupId}
    </span>
    <span className="text-[10px] text-muted-foreground">Linked variable</span>
  </div>
)}
```

**Badge Format:**
- Label: `V{number}` (e.g., V1, V2, V3)
- Text: "Linked variable"
- Size: `text-[10px]`
- Padding: `px-1.5 py-0.5`
- Colors: Same as `getVariableBadgeColor()` (see Section 4.1)

**When Shown:**
- Only for fields with numbered HELPERVARIABLE (e.g., HELPERVARIABLE1)
- NOT shown for standalone HELPERVARIABLE
- Appears above the input field

**Purpose:**
- Visual indicator that this field is part of a linked variable group
- Currently displayed but linking functionality NOT implemented (see Section 11)

---

### Section 4.1: HELPERVARIABLE System - Unused Utilities

**ADD after Variable Highlighting section:**

#### Unused Utility Functions

**Function**: `filterSegmentsForVariables(segments: SegmentDto[]): SegmentDto[]`
- **File**: `src/utils/templateHelpers.ts` (lines 92-99)
- **Purpose**: Filter segments to show only fields containing HELPERVARIABLE
- **Used**: NOWHERE in current codebase
- **Status**: Dead code - redundant with inline filtering in pages

**Function**: `extractUniqueVariables(segments: SegmentDto[]): Map<string, string>`
- **File**: `src/utils/templateHelpers.ts` (lines 105-124)
- **Purpose**: Extract all unique HELPERVARIABLE IDs into a Map
- **Used**: NOWHERE in current codebase
- **Status**: Replaced by `extractUniqueVariablesWithMetadata()` in serializationHelpers.ts

**Alternative**: `extractUniqueVariablesWithMetadata(segments: SegmentDto[]): UniqueVariable[]`
- **File**: `src/utils/serializationHelpers.ts` (lines 154-216)
- **Purpose**: Enhanced version with metadata (occurrence count, field positions)
- **Used**: In .bak version of Use Template page (not currently active)
- **Status**: Prepared for future use but not in active code path

---

### Section 4.2: Variable View Filtering - Clarifications

**REPLACE existing Section 4.2 with:**

#### Variable View Filtering

**Modes:**
- `'all'`: Show all fields in MessageEditor
- `'variables-only'`: Show only fields containing HELPERVARIABLE

**Where Used:**

| Page | Location | Default | User Control | Implementation |
|------|----------|---------|--------------|----------------|
| Template List | Read-only view | `'all'` | Toggle button | `variableViewMode` state |
| Template List | Edit mode | `'all'` | Toggle button | Same state (SHARED between modes) |
| Use Template | Variables editor | `'variables-only'` | NO toggle | Always filtered via `getFilteredSegments()` |

**Important**: Template List uses ONE `variableViewMode` state shared between read and edit modes. Switching between read/edit preserves the filter setting.

**UI Control (Templates Page Only):**
```tsx
<div className="flex items-center gap-1 bg-muted rounded-lg p-1">
  <button
    onClick={() => setVariableViewMode('all')}
    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
      variableViewMode === 'all'
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`}
    data-testid="view-mode-all"
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
    data-testid="view-mode-variables"
  >
    Variables Only
  </button>
</div>
```

**Filtering Implementation:**
```typescript
// Template List (templates/page.tsx)
if (variableViewMode === 'variables-only') {
  processedSegments = processedSegments
    .map(s => ({
      ...s,
      fields: s.fields.filter(f => fieldContainsVariable(f))
    }))
    .filter(s => s.fields.length > 0);
}

// Use Template (templates/use/page.tsx)
const getFilteredSegments = useCallback((segments: SegmentDto[]) => {
  return segments
    .map(s => ({
      ...s,
      fields: s.fields.filter(f => fieldContainsVariable(f))
    }))
    .filter(s => s.fields.length > 0);
}, []);
```

---

### Section 3.2: Template List - Message Type Options

**ADD after Message Type dropdown documentation:**

#### Message Type Dropdown Options

**Available Options** (HARDCODED):
1. `ADT-A01` - Admit/Discharge/Transfer - Patient Admission
2. `ORU-R01` - Observation Result - Lab Results

**File**: All pages with message type selector
- Template List edit: `src/app/templates/page.tsx` (lines 438-440)
- Create Template: `src/app/templates/create/page.tsx` (lines 119-120)

**Code:**
```tsx
<select value={messageType} onChange={...} className="...">
  <option value="ADT-A01">ADT-A01</option>
  <option value="ORU-R01">ORU-R01</option>
</select>
```

**Limitation**: Only 2 message types supported. No way to add custom types.

**Recommendation**: Should support more HL7 message types or allow custom entry.

---

### Section 2.7: DataManagement Component - Full Documentation

**REPLACE brief mention with:**

### 2.8 DataManagement Component

**File**: `src/components/persistence/DataManagement.tsx`

**Purpose**: Export and import template data as JSON backups

**Structure:**
```tsx
<div className="p-4 border rounded-lg bg-white dark:bg-gray-800" role="region" aria-labelledby="data-management-heading">
  <h3 id="data-management-heading" className="text-lg font-semibold mb-4">Data Management</h3>

  <div className="flex gap-4 mb-4">
    <ExportButton />
    <ImportButton onImportComplete={setLastImport} />
  </div>

  {/* Success message (conditional) */}
  {/* Error message (conditional) */}
</div>
```

**Used On**: Template List page (bottom of page)

#### ExportButton Component
**File**: `src/components/persistence/ExportButton.tsx`

**Functionality:**
- Exports all template data from localStorage as JSON
- Downloads file via browser download
- Button text: "Export Data" / "Exporting..."
- Style: `bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50`
- Error display: Red text below button if export fails

**Implementation:**
- Uses `exportAndDownload()` service function
- Disables button during export
- Shows error state if export fails

#### ImportButton Component
**File**: `src/components/persistence/ImportButton.tsx`

**Functionality:**
- Imports template data from JSON file
- Validates file structure before import
- Merges with existing templates (doesn't replace)
- Button text: "Import Data" / "Importing..."
- Style: `bg-green-600 text-white rounded hover:bg-green-700`
- File input: Hidden, accepts `.json` files only

**Implementation:**
- Uses hidden `<input type="file">` with custom label styled as button
- Keyboard accessible (Enter/Space triggers file picker)
- Uses `importFromFile()` service function
- Shows validation errors before import
- Shows import results after completion

**Import Result Display:**

**Success:**
```tsx
<div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded" role="status">
  <p className="text-green-800 dark:text-green-200">
    Import successful! Imported: {imported.join(', ')}
  </p>
  {skipped.length > 0 && (
    <p className="text-yellow-600">Skipped: {skipped.join(', ')}</p>
  )}
</div>
```

**Error:**
```tsx
<div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded" role="alert">
  <p className="text-red-800 dark:text-red-200 font-medium">Import failed</p>
  <ul className="text-red-700 dark:text-red-300 text-sm mt-1 list-disc list-inside">
    {errors.map(err => <li>{err.key}: {err.error}</li>)}
  </ul>
</div>
```

**Validation Warnings:**
```tsx
<div className="mt-2 text-yellow-600" role="status">
  {warnings.map(w => <p>{w}</p>)}
</div>
```

**Use Cases:**
- Backup templates before major changes
- Transfer templates between browsers/devices
- Share template libraries with team
- Restore corrupted template data

---

### Section 6.1: HELPERVARIABLE Handling - Editability Rules Clarification

**ADD Rule 5 to existing rules:**

#### Rule 5: Page-Specific Editability Behavior

**Behavior**: Different pages apply different editability rules to the SAME segments.

**Breakdown by Page:**

| Page | Editability Rule | MSH-1/MSH-2 | Implementation |
|------|------------------|-------------|----------------|
| Main Editor | All fields except MSH-1/MSH-2 | Never | `page.tsx` lines 69-76 |
| Template List (Read) | NO fields editable | Never | `onUpdate={() => {}}` (no-op) |
| Template List (Edit) | All fields except MSH-1/MSH-2 | Never | `page.tsx` lines 306-315 |
| Use Template | ONLY fields with HELPERVARIABLE | Never | `getFilteredSegments()` + editability from `applyVariableEditability()` |

**Main Editor Code:**
```typescript
// All fields editable except MSH-1/MSH-2
const editableSegments = data.map((seg) => ({
  ...seg,
  fields: seg.fields.map((f) => ({
    ...f,
    isEditable: !(seg.name === 'MSH' && (f.position === 1 || f.position === 2))
  }))
}));
```

**Template List (Edit) Code:**
```typescript
// In edit mode, all fields editable except MSH-1/MSH-2
return processedSegments.map(s => ({
  ...s,
  fields: s.fields.map(f => ({
    ...f,
    isEditable: !(s.name === 'MSH' && (f.position === 1 || f.position === 2))
  }))
}));
```

**Use Template Code:**
```typescript
// applyVariableEditability sets isEditable based on fieldContainsVariable()
const segments = applyVariableEditability(parsed);

// Then getFilteredSegments filters to only show variable fields
// Those fields are editable because applyVariableEditability marked them
```

**Key Distinction:**
- Main Editor + Template Edit: **Blanket editability** (all except MSH-1/2)
- Use Template: **Selective editability** (only HELPERVARIABLE fields)

---

## NEW SECTION 11: PREPARED BUT UNUSED FEATURES

### 11.1 Linked Variable System (PARTIALLY IMPLEMENTED)

**Status**: Props exist, badge displays, but linking logic NOT ACTIVE

**Files Involved:**
- `src/components/MessageEditor.tsx` - Accepts props but doesn't use them
- `src/components/SegmentRow.tsx` - Passes props through
- `src/components/FieldInput.tsx` - Implements display and handler

**Props Interface:**
```typescript
interface Props {
  variableValues?: Map<string, string>;      // Map of variableId → current value
  onVariableChange?: (variableId: string, value: string) => void; // Update handler
}
```

**How It WOULD Work:**
1. All fields with same `variableId` (e.g., "HELPERVARIABLE1") share one value
2. `variableValues` Map stores current value per variableId
3. When user edits one field, `onVariableChange` fires
4. Parent updates Map
5. All fields with that variableId re-render with new value

**Current Reality:**
- FieldInput has handler: `handleValueChange` checks for `variableId` and calls `onVariableChange`
- FieldInput displays value from Map if available
- BUT: No page passes these props to MessageEditor
- Result: Badge shows but linking doesn't work

**Evidence of Intent:**
```typescript
// FieldInput.tsx lines 62-69
const handleValueChange = React.useCallback((newValue: string) => {
  if (field.variableId && onVariableChange) {
    onVariableChange(field.variableId, newValue);
  } else {
    onChange(newValue);
  }
}, [field.variableId, onVariableChange, onChange]);
```

**Where It Could Be Used:**
- Use Template page: Multiple instances of same template could share variable values
- Template Edit page: Edit one HELPERVARIABLE1 field, update all HELPERVARIABLE1 fields

**Why Not Used:**
- Current implementation uses simpler approach (each instance independent)
- Linking would require state management at page level
- .bak version of Use Template may have implemented this (not verified)

### 11.2 Advanced Serialization Architecture (NOT ACTIVE)

**Status**: Complete implementation exists but NOT used in active code

**Files Exist But Unused:**
- `src/hooks/useSerializationReducer.ts` - Redux-style state management
- `src/utils/serializationHelpers.ts` - Helper functions for instances
- `src/types/serialization.ts` - Type definitions
- `src/components/serialization/` - 9 component files

**What This Architecture Provides:**
1. **State Management**: Reducer pattern with action creators
2. **Instance Management**: Add, remove, duplicate with smart naming
3. **View Modes**: Toggle between full view and variables-only
4. **Constraints**: MIN_INSTANCES=1, MAX_INSTANCES=10
5. **Computed Outputs**: Memoized instance outputs
6. **Metadata**: Track occurrence count, field positions per variable

**Serialization Components:**
- `ActionBar.tsx` - Top-level controls (add, reset, copy all)
- `InputPanel.tsx` - Template selection and raw display
- `InstanceList.tsx` - List of serialization instances
- `InstancePair.tsx` - Single instance (input + output)
- `OutputPanel.tsx` - Serialized HL7 output display
- `VariableInput.tsx` - Individual variable input field
- `VariablesOnlyView.tsx` - Filtered view of variables
- `ViewModeToggle.tsx` - Switch between view modes

**Why Not Used:**
- Current Use Template page uses simpler useState approach
- Component-based architecture may have been deemed overengineered
- .bak file shows it WAS used at some point
- Kept in codebase for potential future use

**Comparison:**

| Feature | Current Implementation | Advanced Implementation |
|---------|----------------------|-------------------------|
| State | Multiple useState | Single reducer |
| Instances | Manual array | Action creators |
| Naming | "Serialization #N" | "Instance N" with smart incrementing |
| Limits | None | MIN=1, MAX=10 |
| Duplicate | Deep clone + increment | `duplicateInstance()` helper |
| Variables | Inline filtering | `extractUniqueVariablesWithMetadata()` |
| Components | Inline JSX | 9 separate components |
| Lines | 451 | 323 + components |

---

## FINDINGS SUMMARY

### What Was Missing:

1. **Variable Badge Display**: Fully documented now (Section 2.5 addendum)
2. **filterSegmentsForVariables**: Dead code, never used
3. **extractUniqueVariables**: Replaced by enhanced version, not used
4. **View Toggle Sharing**: Clarified that Template List shares state between read/edit
5. **Use Template Toggle**: Clarified NO toggle exists (always variables-only)
6. **Message Type Options**: Only 2 hardcoded (ADT-A01, ORU-R01)
7. **DataManagement**: Fully documented (Export/Import with validation)
8. **Editability Rules**: Page-specific behavior now clearly documented
9. **Linked Variables**: Prepared but NOT implemented (Section 11.1)
10. **Advanced Architecture**: Exists but unused (Section 11.2)

### What I Discovered Beyond Your Questions:

1. **Two Implementations**: Current page.tsx vs .bak version with reducer
2. **Unused Component Library**: 9 serialization components not in active code
3. **Dead Helper Functions**: At least 2 utilities never called
4. **Incomplete Feature**: Linked variables display badge but don't link
5. **Architecture Decision**: Simpler approach chosen over component-based

### Code Health Notes:

**Dead Code:**
- `templateHelpers.ts`: `filterSegmentsForVariables()` - Remove?
- `templateHelpers.ts`: `extractUniqueVariables()` - Remove?

**Incomplete Features:**
- Linked variables: Either complete or remove props/badge
- Message types: Either expand options or allow custom entry

**Architectural Debt:**
- Keep unused serialization architecture? Or remove?
- Document decision: Why was reducer approach abandoned?

---

## RECOMMENDATION

Merge this addendum into main `ui-hierarchy.md` document, organizing by section numbers to maintain structure.
