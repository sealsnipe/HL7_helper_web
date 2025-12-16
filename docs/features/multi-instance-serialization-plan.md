# Implementation Plan: Multi-Instance HL7 Serialization

## Document Version
- **Version**: 1.0 (Draft)
- **Date**: 2025-12-15
- **Status**: Pending Review
- **Related**: [Feature Definition](./multi-instance-serialization.md)

---

## Overview

This document outlines the implementation plan for the Multi-Instance Serialization feature, broken down into phases, tasks, and subtasks.

---

## Phase 1: Core Infrastructure

**Goal**: Establish the data model and refactor state management to support multiple instances.

### Task 1.1: Define Types and Interfaces

**File**: `src/types/serialization.ts` (new)

#### Subtasks:
- [ ] 1.1.1: Create `SerializationInstance` interface
- [ ] 1.1.2: Create `UniqueVariable` interface
- [ ] 1.1.3: Create `InstanceOutput` interface
- [ ] 1.1.4: Create helper type `ViewMode = 'variables-only' | 'all-fields'`
- [ ] 1.1.5: Export all types from `src/types/index.ts`

**Acceptance Criteria**:
- All interfaces are properly typed with JSDoc comments
- Types are exported and importable from `@/types`

---

### Task 1.2: Create Instance Utility Functions

**File**: `src/utils/serializationHelpers.ts` (new)

#### Subtasks:
- [ ] 1.2.1: Implement `createDefaultInstance(uniqueVariables: UniqueVariable[]): SerializationInstance`
  - Generates unique ID using `crypto.randomUUID()`
  - Sets name to "Instance 1" (or next available number)
  - Initializes variableValues with HELPERVARIABLE placeholders
  - Sets createdAt to current timestamp
  - Sets isExpanded to true

- [ ] 1.2.2: Implement `duplicateInstance(instance: SerializationInstance, newName: string): SerializationInstance`
  - Deep copies variableValues Map
  - Generates new ID
  - Updates createdAt

- [ ] 1.2.3: Implement `computeInstanceOutput(instance: SerializationInstance, parsedSegments: SegmentDto[]): InstanceOutput`
  - Creates deep copy of segments
  - Replaces all variableIds with instance's values
  - Generates serialized HL7 string
  - Checks for unfilled variables

- [ ] 1.2.4: Implement `extractUniqueVariablesWithMetadata(segments: SegmentDto[]): UniqueVariable[]`
  - Extends existing `extractUniqueVariables` with field position tracking
  - Counts occurrences per variable

- [ ] 1.2.5: Write unit tests for all functions

**Acceptance Criteria**:
- All functions are pure (no side effects)
- Unit test coverage >95%
- Functions handle edge cases (empty segments, no variables)

---

### Task 1.3: Refactor Page State Management

**File**: `src/app/templates/use/page.tsx`

#### Subtasks:
- [ ] 1.3.1: Add `instances` state (array of `SerializationInstance`)
- [ ] 1.3.2: Add `uniqueVariables` state (array of `UniqueVariable`)
- [ ] 1.3.3: Add `viewMode` state (default: 'variables-only')
- [ ] 1.3.4: Remove single-instance states (`variableValues`, `editedSegments` for single instance)
- [ ] 1.3.5: Create memoized `instanceOutputs` computed from instances
- [ ] 1.3.6: Implement `addInstance` handler
- [ ] 1.3.7: Implement `duplicateInstance` handler
- [ ] 1.3.8: Implement `removeInstance` handler
- [ ] 1.3.9: Implement `updateInstanceVariable` handler
- [ ] 1.3.10: Update template change handler to reset instances with confirmation

**Acceptance Criteria**:
- State structure matches design document
- All handlers properly update state immutably
- No performance regression on single instance

---

## Phase 2: Variables-Only View Component

**Goal**: Create the compact variable input component for efficient editing.

### Task 2.1: Create VariableInput Component

**File**: `src/components/serialization/VariableInput.tsx` (new)

#### Subtasks:
- [ ] 2.1.1: Create component with props: `variableId`, `groupId`, `value`, `onChange`, `fieldPositions`
- [ ] 2.1.2: Render color-coded badge (V1, V2, V3...) using `getVariableBadgeColor`
- [ ] 2.1.3: Render text input with proper styling
- [ ] 2.1.4: Add tooltip showing field positions (e.g., "Used in: PV1-1, PV1-3")
- [ ] 2.1.5: Add aria-label for accessibility
- [ ] 2.1.6: Handle linked indicator when occurrenceCount > 1

**Acceptance Criteria**:
- Input is fully accessible (aria-label, keyboard navigable)
- Badge colors match existing highlighting system
- Tooltip is informative but not intrusive

---

### Task 2.2: Create VariablesOnlyView Component

**File**: `src/components/serialization/VariablesOnlyView.tsx` (new)

#### Subtasks:
- [ ] 2.2.1: Create component with props from interface
- [ ] 2.2.2: Render variables grouped by groupId (V1s together, V2s together)
- [ ] 2.2.3: Implement horizontal layout for variables within a group
- [ ] 2.2.4: Add "Linked" indicator for variables with multiple occurrences
- [ ] 2.2.5: Handle empty state (no variables)
- [ ] 2.2.6: Add subtle dividers between variable groups
- [ ] 2.2.7: Write component tests

**Acceptance Criteria**:
- Variables are visually grouped and color-coded
- Layout is compact (sleek) but readable
- Responsive on smaller screens

---

### Task 2.3: Create ViewModeToggle Component

**File**: `src/components/serialization/ViewModeToggle.tsx` (new)

#### Subtasks:
- [ ] 2.3.1: Create toggle button group (Vars | All)
- [ ] 2.3.2: Style active state with appropriate colors
- [ ] 2.3.3: Add keyboard accessibility (arrow keys to switch)
- [ ] 2.3.4: Emit onChange with new mode

**Acceptance Criteria**:
- Toggle is visually clear which mode is active
- Accessible via keyboard
- Consistent styling with existing UI

---

## Phase 3: Instance UI Components

**Goal**: Build the instance pair container and related UI components.

### Task 3.1: Create OutputPanel Component

**File**: `src/components/serialization/OutputPanel.tsx` (new)

#### Subtasks:
- [ ] 3.1.1: Create component with props: `instanceName`, `serializedHl7`, `onCopy`, `hasUnfilledVariables`
- [ ] 3.1.2: Render instance name as header
- [ ] 3.1.3: Render serialized HL7 in monospace, scrollable container
- [ ] 3.1.4: Add Copy button with feedback (Copied!)
- [ ] 3.1.5: Show warning indicator if unfilled variables exist
- [ ] 3.1.6: Handle empty output state
- [ ] 3.1.7: Normalize line endings for display (`\r` → `\n`)

**Acceptance Criteria**:
- Output is readable with proper formatting
- Copy feedback is clear and timely
- Warning indicator is noticeable but not alarming

---

### Task 3.2: Create InputPanel Component

**File**: `src/components/serialization/InputPanel.tsx` (new)

#### Subtasks:
- [ ] 3.2.1: Create component with props from interface
- [ ] 3.2.2: Render instance name as header with actions (delete, duplicate)
- [ ] 3.2.3: Render ViewModeToggle
- [ ] 3.2.4: Conditionally render VariablesOnlyView or MessageEditor
- [ ] 3.2.5: Add delete confirmation for non-empty instances
- [ ] 3.2.6: Add duplicate button with icon
- [ ] 3.2.7: Handle collapse/expand

**Acceptance Criteria**:
- Mode switching is seamless
- Delete confirmation prevents accidental data loss
- Actions are discoverable but not cluttered

---

### Task 3.3: Create InstancePair Component

**File**: `src/components/serialization/InstancePair.tsx` (new)

#### Subtasks:
- [ ] 3.3.1: Create component that combines OutputPanel and InputPanel
- [ ] 3.3.2: Implement two-column layout with visual connection
- [ ] 3.3.3: Ensure vertical alignment between output and input
- [ ] 3.3.4: Add subtle border/background to group the pair
- [ ] 3.3.5: Handle responsive stacking (tablet/mobile)
- [ ] 3.3.6: Add expand/collapse for the entire pair
- [ ] 3.3.7: Write component tests

**Acceptance Criteria**:
- Left and right panels are visually paired
- Alignment is maintained at all content sizes
- Responsive behavior is smooth

---

### Task 3.4: Create InstanceList Component

**File**: `src/components/serialization/InstanceList.tsx` (new)

#### Subtasks:
- [ ] 3.4.1: Create component that renders multiple InstancePair components
- [ ] 3.4.2: Handle ordering by createdAt
- [ ] 3.4.3: Add "Add Instance" button at bottom
- [ ] 3.4.4: Handle maximum instance limit (20)
- [ ] 3.4.5: Add empty state (should never occur, but defensive)
- [ ] 3.4.6: Implement smooth animation for add/remove

**Acceptance Criteria**:
- Instances render in correct order
- Add button is always visible
- Animations are subtle and performant

---

## Phase 4: Batch Operations

**Goal**: Implement Copy All and Serialize & Load functionality.

### Task 4.1: Create ActionBar Component

**File**: `src/components/serialization/ActionBar.tsx` (new)

#### Subtasks:
- [ ] 4.1.1: Create component with props: `instanceCount`, `onAddInstance`, `onCopyAll`, `onSerializeAndLoad`
- [ ] 4.1.2: Render "Add Instance" button (duplicate of InstanceList button for convenience)
- [ ] 4.1.3: Render "Copy All" button with icon
- [ ] 4.1.4: Render "Serialize & Load" button (primary action)
- [ ] 4.1.5: Disable buttons appropriately (e.g., Copy All when no instances)
- [ ] 4.1.6: Show instance count badge

**Acceptance Criteria**:
- Primary action (Serialize & Load) is visually prominent
- Buttons are appropriately disabled
- Layout works at all viewport sizes

---

### Task 4.2: Implement Copy All Functionality

**File**: `src/utils/serializationHelpers.ts`

#### Subtasks:
- [ ] 4.2.1: Implement `formatAllOutputsForCopy(outputs: InstanceOutput[]): string`
  - Separates messages with double newline
  - Adds instance name as comment header
  - Warns about unfilled variables
- [ ] 4.2.2: Add clipboard fallback (show modal if API fails)
- [ ] 4.2.3: Add success feedback

**Acceptance Criteria**:
- Copied format is clear and usable
- Fallback works for restricted clipboard environments

---

### Task 4.3: Implement Serialize & Load Functionality

**File**: `src/app/templates/use/page.tsx`

#### Subtasks:
- [ ] 4.3.1: Load first instance's output to localStorage
- [ ] 4.3.2: Navigate to main page with `?loadGenerated=true`
- [ ] 4.3.3: (Future) Store remaining instances for sequential loading

**Acceptance Criteria**:
- First instance loads correctly
- Navigation is seamless
- No data loss

---

## Phase 5: Page Integration & Refactoring

**Goal**: Integrate all components into the Serialize from Template page.

### Task 5.1: Refactor UseTemplatePage Layout

**File**: `src/app/templates/use/page.tsx`

#### Subtasks:
- [ ] 5.1.1: Add TemplatePreview section at top
- [ ] 5.1.2: Replace existing two-column layout with InstanceList
- [ ] 5.1.3: Add ActionBar at bottom
- [ ] 5.1.4: Remove deprecated single-instance code
- [ ] 5.1.5: Update responsive breakpoints
- [ ] 5.1.6: Ensure proper spacing and alignment

**Acceptance Criteria**:
- New layout matches design document
- No visual regression from previous version
- Responsive at all viewports

---

### Task 5.2: Implement Template Change Handling

**File**: `src/app/templates/use/page.tsx`

#### Subtasks:
- [ ] 5.2.1: Detect when template selection changes with existing instances
- [ ] 5.2.2: Show confirmation dialog: "Changing template will reset all instances"
- [ ] 5.2.3: If confirmed, reset instances to single default
- [ ] 5.2.4: If cancelled, revert selection
- [ ] 5.2.5: Handle edge case: same template reselected

**Acceptance Criteria**:
- User is warned before data loss
- Cancel preserves current state completely

---

## Phase 6: Testing

**Goal**: Comprehensive test coverage for all new functionality.

### Task 6.1: Unit Tests

**Files**: `tests/unit/serializationHelpers.test.ts` (new)

#### Subtasks:
- [ ] 6.1.1: Test `createDefaultInstance`
- [ ] 6.1.2: Test `duplicateInstance`
- [ ] 6.1.3: Test `computeInstanceOutput`
- [ ] 6.1.4: Test `extractUniqueVariablesWithMetadata`
- [ ] 6.1.5: Test `formatAllOutputsForCopy`
- [ ] 6.1.6: Test edge cases (empty inputs, max instances)

**Target**: >95% coverage

---

### Task 6.2: Component Tests

**Files**: `tests/components/serialization/*.test.tsx` (new)

#### Subtasks:
- [ ] 6.2.1: Test VariableInput rendering and interaction
- [ ] 6.2.2: Test VariablesOnlyView grouping and updates
- [ ] 6.2.3: Test ViewModeToggle state changes
- [ ] 6.2.4: Test OutputPanel copy functionality
- [ ] 6.2.5: Test InputPanel mode switching
- [ ] 6.2.6: Test InstancePair alignment
- [ ] 6.2.7: Test InstanceList add/remove operations
- [ ] 6.2.8: Test ActionBar button states

**Target**: All components have interaction tests

---

### Task 6.3: E2E Tests

**File**: `tests/e2e/multi-instance-serialization.spec.ts` (new)

#### Subtasks:
- [ ] 6.3.1: Test full workflow: select template → add instances → fill variables → copy all
- [ ] 6.3.2: Test instance duplication preserves values
- [ ] 6.3.3: Test instance deletion removes correct instance
- [ ] 6.3.4: Test template change confirmation
- [ ] 6.3.5: Test Copy All clipboard content
- [ ] 6.3.6: Test Serialize & Load navigation
- [ ] 6.3.7: Test responsive layout at different viewports

**Target**: All user stories covered

---

### Task 6.4: Visual Regression Tests

**File**: `tests/e2e/multi-instance-visual.spec.ts` (new)

#### Subtasks:
- [ ] 6.4.1: Screenshot: Empty state (no template selected)
- [ ] 6.4.2: Screenshot: Single instance with variables
- [ ] 6.4.3: Screenshot: Multiple instances (3+)
- [ ] 6.4.4: Screenshot: Variables-only vs All-fields mode
- [ ] 6.4.5: Screenshot: Dark theme
- [ ] 6.4.6: Screenshot: Mobile viewport

**Target**: Baseline established for all key states

---

### Task 6.5: Accessibility Tests

**File**: `tests/e2e/multi-instance-a11y.spec.ts` (new)

#### Subtasks:
- [ ] 6.5.1: axe-core scan of full page
- [ ] 6.5.2: Keyboard navigation test
- [ ] 6.5.3: Screen reader announcement test
- [ ] 6.5.4: Focus management on add/remove

**Target**: 0 critical/serious violations

---

## Phase 7: Documentation & Polish

**Goal**: Finalize documentation and polish UX details.

### Task 7.1: Update User Documentation

#### Subtasks:
- [ ] 7.1.1: Update README with new feature description
- [ ] 7.1.2: Add inline tooltips/help text where needed
- [ ] 7.1.3: Update user flows documentation

---

### Task 7.2: Performance Optimization

#### Subtasks:
- [ ] 7.2.1: Profile with 10+ instances
- [ ] 7.2.2: Optimize re-renders with proper memoization
- [ ] 7.2.3: Consider virtualization if needed
- [ ] 7.2.4: Debounce variable input updates

---

### Task 7.3: Final Polish

#### Subtasks:
- [ ] 7.3.1: Review all animations and transitions
- [ ] 7.3.2: Ensure consistent spacing throughout
- [ ] 7.3.3: Test all error states
- [ ] 7.3.4: Review keyboard shortcuts
- [ ] 7.3.5: Final cross-browser testing

---

## Summary

| Phase | Tasks | Estimated Complexity |
|-------|-------|---------------------|
| Phase 1: Core Infrastructure | 3 tasks, 20 subtasks | Medium |
| Phase 2: Variables-Only View | 3 tasks, 17 subtasks | Medium |
| Phase 3: Instance UI Components | 4 tasks, 26 subtasks | High |
| Phase 4: Batch Operations | 3 tasks, 10 subtasks | Low |
| Phase 5: Page Integration | 2 tasks, 11 subtasks | Medium |
| Phase 6: Testing | 5 tasks, 28 subtasks | Medium |
| Phase 7: Documentation & Polish | 3 tasks, 12 subtasks | Low |

**Total**: 23 tasks, 124 subtasks

---

## Dependencies

```
Phase 1 ─────────────────────────────────────────────┐
    │                                                 │
    ├──► Phase 2 (needs types from Phase 1)          │
    │        │                                        │
    │        └──► Phase 3 (needs VariablesOnlyView)  │
    │                 │                               │
    │                 └──► Phase 5 (needs all UI)    │
    │                          │                      │
    └──► Phase 4 (needs state from Phase 1)          │
             │                                        │
             └──► Phase 5 (needs batch ops)          │
                      │                               │
                      └──► Phase 6 (needs full impl) │
                               │                      │
                               └──► Phase 7 ◄────────┘
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with many instances | Medium | High | Implement virtualization, memoization |
| Complex state management | Medium | Medium | Use proven patterns, thorough testing |
| Alignment issues across browsers | Low | Medium | Visual regression tests |
| Accessibility regressions | Low | High | Automated a11y testing |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-15 | Claude (Orchestrator) | Initial draft |
