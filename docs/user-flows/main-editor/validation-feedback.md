# Flow: Validation Feedback

## Overview

| Attribute | Value |
|-----------|-------|
| Start | Main Editor page with parsed message |
| Goal | View validation errors, warnings, and info about the HL7 message |
| Page(s) | `/` (Main Editor) |
| Components | `ValidationBadge`, `useHl7Editor`, validation utilities |

## Prerequisites

- Application is loaded at `/`
- A valid HL7 message must be parsed (segments exist)
- Message must be displayed in Visual Editor

## Steps

### 1. System Validates Message (Automatic)

- **User Action**: None (automatic after parsing)
- **System Response**:
  - Runs validation rules on parsed segments
  - Checks structural rules (MSH exists, MSH first, valid segments)
  - Checks required fields (MSH-9, MSH-10, MSH-12, PID-3)
  - Categorizes issues by severity: error, warning, info
  - Stores result in `validationResult` state
  - Badge appears in Visual Editor header
- **Triggered by**:
  - Initial message parse
  - Field edits
  - Segment updates

### 2. User Views Validation Badge

#### State A: Valid Message
- **User Action**: Observes the validation badge in the Visual Editor header
- **System Response**:
  - Displays green badge with checkmark icon
  - Shows "Valid" text
  - Badge is not expandable (no issues to show)
- **UI Element**: `data-testid="validation-badge-valid"`

#### State B: Message Has Issues
- **User Action**: Observes the validation badge in the Visual Editor header
- **System Response**:
  - Badge color indicates highest severity:
    - Red: Has errors
    - Amber: Has warnings (no errors)
    - Blue: Has info only (no errors/warnings)
  - Shows summary text: "X error(s), Y warning(s), Z info"
  - Displays appropriate icon:
    - AlertCircle (red) for errors
    - AlertTriangle (amber) for warnings
    - Info (blue) for info
  - Shows chevron down icon indicating expandable
  - Badge is clickable
- **UI Element**: `data-testid="validation-badge"`

### 3. User Expands Validation Details

- **User Action**: Clicks on the validation badge
- **System Response**:
  - Badge remains in place (stays in header)
  - Dropdown panel appears below badge
  - Panel is positioned absolutely, overlays content
  - Shows header: "Validation Issues"
  - Shows close button (X icon)
  - Lists all issues grouped by severity:
    1. Errors first (red)
    2. Warnings second (amber)
    3. Info last (blue)
  - Panel has max height (96 viewport units), scrolls if needed
  - Each issue shows:
    - Severity icon (AlertCircle, AlertTriangle, Info)
    - Path or code (e.g., "MSH-9", "MISSING_MSH_9")
    - Human-readable message
  - Panel is 320px wide
  - Z-index 50 (above most content)
- **UI Element**: `data-testid="validation-details"`

### 4. User Reviews Validation Issues

- **User Action**: Reads through the list of validation issues
- **System Response**:
  - Each issue displayed in a card with:
    - Colored background (light red/amber/blue)
    - Icon on left
    - Path/code in small gray monospace font
    - Message in regular font
    - Hover effect (slightly darker background)
  - Issues are grouped by severity but not by segment
  - Scrollbar appears if more than ~8 issues
- **UI Elements**: `data-testid="validation-item-{code}"`

### 5. User Closes Validation Details

#### Option A: Click Close Button
- **User Action**: Clicks the X button in the panel header
- **System Response**:
  - Panel closes (disappears)
  - Badge collapses back to summary state
  - Focus returns to badge button

#### Option B: Click Badge Again
- **User Action**: Clicks the validation badge while panel is open
- **System Response**: Same as Option A

#### Option C: Click Outside
- **User Action**: Clicks anywhere outside the panel
- **System Response**:
  - Panel closes (disappears)
  - Badge collapses back to summary state

### 6. User Clicks Validation Error (Phase 3)

- **User Action**: Clicks on a validation error item in the expanded panel
- **System Response**:
  - Expands the segment containing the error (if collapsed)
  - Highlights the problematic field with yellow pulse animation (2 seconds)
  - Scrolls the field into view
  - Field becomes immediately editable
  - Validation panel remains open for reference
- **Conditions**: Only errors with `segmentIndex` are clickable
- **Visual Feedback**: Error items show "Click to navigate" hint when clickable
- **UI Element**: `data-testid="validation-item-{code}"` with `role="button"`

### 7. User Fixes Validation Issues

- **User Action**: Edits fields to resolve validation errors
  - Example: Adds missing MSH-9 (Message Type)
  - Example: Adds MSH-10 (Message Control ID)
- **System Response**:
  - Validation runs automatically after edit
  - Badge updates in real-time:
    - Color changes if severity changes
    - Count updates (e.g., "2 errors" → "1 error")
    - Badge changes to "Valid" when all errors cleared
  - If panel is open, issue list updates immediately
  - Fixed issues disappear from list

## Branches

| After Step | Condition | Leads To |
|------------|-----------|----------|
| 1 | Message is valid | Shows green "Valid" badge (non-expandable) |
| 1 | Message has errors | Shows red badge with error count |
| 1 | Message has warnings only | Shows amber badge with warning count |
| 1 | Message has info only | Shows blue badge with info count |
| 3 | Badge clicked when expanded | Collapses the panel |
| 6 | Error is clickable (has segmentIndex) | Navigates to field, highlights it |
| 6 | Error not clickable (no segmentIndex) | No navigation, informational only |
| 7 | All errors fixed | Badge changes to green "Valid" |
| 7 | Errors remain | Badge stays red, count updates |

## End States

| State | Description |
|-------|-------------|
| Valid | Green badge with checkmark, no expandable panel |
| Has Errors | Red badge showing error count, panel with error details |
| Has Warnings | Amber badge showing warning count, panel with warning details |
| Has Info | Blue badge showing info count, panel with info details |
| Panel Open | Dropdown showing all validation issues, scrollable |
| Panel Closed | Badge showing summary only |

## Connected Flows

- **Comes from**:
  - `parse-message.md` (Validation runs after parse)
  - `edit-field.md` (Validation updates after edit)
  - `load-example.md` (Validation runs after load)
- **Leads to**:
  - `edit-field.md` (User clicks error to navigate and edit the field)
  - `expand-collapse.md` (Error click expands the segment)

## Technical Details

### Validation Implementation
- **Hook**: `useHl7Editor()` returns `validationResult`
- **Validation Function**: `validateMessage()` in `src/utils/validation/index.ts`
- **Rule Sets**:
  - Structural rules: `checkStructuralRules()` in `src/utils/validation/structuralRules.ts`
  - Required fields: `checkRequiredFields()` in `src/utils/validation/requiredFields.ts`

### Validation Rules

#### Structural Rules
- MSH segment must exist
- MSH must be first segment
- All segment names must be 3 characters
- All segment names must be uppercase

#### Required Field Rules
- MSH-9 (Message Type) must exist and have value
- MSH-10 (Message Control ID) must exist and have value
- MSH-12 (Version ID) must exist and have value
- PID-3 (Patient Identifier) must exist if PID segment present

### Validation Result Structure
```typescript
{
  isValid: boolean,     // true if no errors (warnings OK)
  errors: ValidationError[],
  warnings: ValidationError[],
  info: ValidationError[]
}
```

### ValidationError Structure
```typescript
{
  severity: 'error' | 'warning' | 'info',
  code: string,           // e.g., "MISSING_MSH_9"
  message: string,        // Human-readable
  path: string,           // e.g., "MSH-9", "PID"
  segmentIndex?: number,  // 0-based
  fieldPosition?: number  // 1-based
}
```

### Keyboard Shortcuts (Phase 3)
- **Alt+V**: Toggle validation panel (works globally, even in inputs)
- **Escape**: Close validation panel (when focused)

### Validation Timing
- Runs after:
  - Initial parse
  - Every field edit (via `updateSegments`)
  - Segment modifications
- Does NOT run during typing (only after parse completes)

### Badge States
| State | Color | Icon | Expandable |
|-------|-------|------|------------|
| Valid | Green | Checkmark | No |
| Has Errors | Red | AlertCircle | Yes |
| Has Warnings | Amber | AlertTriangle | Yes |
| Has Info | Blue | Info | Yes |

## Error Handling

| Error | Condition | Response |
|-------|-----------|----------|
| No validation result | Message not parsed | Badge not shown |
| Empty segments | No message | Badge not shown |
| Validation throws | Validation logic error | Badge not shown (fail silently) |

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard access | Badge is focusable button, Alt+V shortcut |
| Keyboard navigation | Enter/Space on error items to navigate |
| ARIA attributes | `aria-expanded`, `aria-label` with summary |
| ARIA roles | Error items have `role="button"` when clickable |
| Screen reader | Announces "X errors, Y warnings" and "Click to navigate" |
| Color contrast | All severity colors meet WCAG AA |
| Focus management | Close button is focusable, error items focusable |
| Controlled state | Supports controlled `isExpanded` prop for external control |

## Visual Design

### Badge Colors (Light Mode)
- Valid: `bg-green-100`, `text-green-700`
- Error: `bg-red-100`, `text-red-700`, `border-red-200`
- Warning: `bg-amber-100`, `text-amber-700`, `border-amber-200`
- Info: `bg-blue-100`, `text-blue-700`, `border-blue-200`

### Badge Colors (Dark Mode)
- Valid: `bg-green-900/30`, `text-green-300`
- Error: `bg-red-900/30`, `text-red-300`, `border-red-800`
- Warning: `bg-amber-900/30`, `text-amber-300`, `border-amber-800`
- Info: `bg-blue-900/30`, `text-blue-300`, `border-blue-800`

### Issue Item Colors
Each issue has matching background with hover state.

## Limitations

| Limitation | Description |
|------------|-------------|
| Partial navigation | Only errors with `segmentIndex` are clickable |
| No inline indicators | Validation issues not shown inline in fields |
| No filtering | Cannot filter issues by severity or segment |
| No sorting | Issues always grouped by severity |
| No copy/export | Cannot copy or export validation report |
| Panel position | Panel always opens below badge (may require scrolling) |

## Phase 3 Improvements (Implemented)

| Improvement | Status | Description |
|-------------|--------|-------------|
| Clickable errors | ✅ Implemented | Click validation errors to navigate to problematic field |
| Keyboard shortcut | ✅ Implemented | Alt+V toggles validation panel |
| Controlled state | ✅ Implemented | ValidationBadge supports controlled `isExpanded` prop |
| Visual feedback | ✅ Implemented | Clickable errors show "Click to navigate" hint |
| Focus management | ✅ Implemented | Proper timeout cleanup on unmount |

## Last Updated

- **Date**: 2025-12-17
- **Change**: Phase 3 update - Added clickable validation errors and Alt+V keyboard shortcut
