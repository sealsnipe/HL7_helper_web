# HL7 Helper Web - Feature Implementation Plan

## Executive Summary

This plan organizes 9 features + code quality fixes into 3 phases, with clear dependencies, file modifications, and test requirements.

---

## Phase 1: Foundation and Quick Wins

### 1.1 Code Quality Fixes (Pre-requisite)

#### 1.1.1 Fix Duplicate SerializationInstance Type
- **Problem:** `SerializationInstance` defined in both `types/index.ts` and `types/serialization.ts`
- **Solution:** Keep `serialization.ts` version, remove from `index.ts`, update imports
- **Files:** `src/types/index.ts`, `src/types/serialization.ts`, `src/app/templates/use/page.tsx`

#### 1.1.2 Migrate templates/create/page.tsx to PersistenceService
- **Problem:** Direct localStorage access bypassing persistence layer
- **Solution:** Use `getPersistenceService()` and `StorageKey.TEMPLATES`
- **Files:** `src/app/templates/create/page.tsx`

### 1.2 More Message Types
- **Add:** ADT^A04, ADT^A08, SIU^S12, MDM^T02
- **Create:** JSON definition files following `adt-a01.json` pattern
- **Modify:** `src/utils/definitionLoader.ts`, `src/app/templates/create/page.tsx`

### 1.3 Copy Individual Segment
- **Add:** Copy button to SegmentRow header
- **Create:** `generateSegment()` helper in `hl7Generator.ts`
- **Files:** `src/components/SegmentRow.tsx`, `src/utils/hl7Generator.ts`

### 1.4 Syntax Highlighting in Raw View
- **Create:** `src/components/Hl7HighlightedTextarea.tsx`
- **Approach:** ContentEditable overlay pattern
- **Colors:** Segment names (blue), separators (gray/purple/orange/green)

---

## Phase 2: Major Features

### 2.1 Undo/Redo System
- **Create:** `src/hooks/useUndoRedo.ts`, `src/types/history.ts`
- **Modify:** `src/app/page.tsx`, `src/components/MessageEditor.tsx`
- **Features:** Stack-based history, debounced rapid changes, keyboard shortcuts

### 2.2 Message Validation System
- **Create:** `src/utils/hl7Validator.ts`, `src/types/validation.ts`, `src/components/ValidationPanel.tsx`
- **Validation Types:** Required segments, required fields, data type checking
- **Dependencies:** More Message Types (for comprehensive definitions)

### 2.3 Message Diff/Compare
- **Create:** `src/app/compare/page.tsx`, `src/components/DiffView.tsx`, `src/utils/hl7Diff.ts`
- **Features:** Side-by-side comparison, color-coded changes, jump to differences

---

## Phase 3: Polish and Enhancement

### 3.1 Keyboard Shortcuts
- **Create:** `src/hooks/useKeyboardShortcuts.ts`, `src/components/KeyboardShortcutsHelp.tsx`
- **Shortcuts:** Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+C (copy), ? (help)
- **Dependencies:** Undo/Redo

### 3.2 Field Search/Filter
- **Create:** `src/components/SearchBar.tsx`, `src/utils/searchUtils.ts`
- **Features:** Fuzzy search, highlight matches, auto-expand segments

### 3.3 Human-Readable Interpretation
- **Create:** `src/components/InterpretationPanel.tsx`, `src/utils/hl7Interpreter.ts`, `src/data/hl7-codes.ts`
- **Features:** Translate HL7 to natural language sentences

### 3.4 Large Message Virtualization
- **Add:** react-window dependency
- **Modify:** `src/components/MessageEditor.tsx`
- **Features:** Virtualized segment list for 100+ segment messages

---

## Implementation Order

```
Week 1: Code Quality Fixes + 2 Message Types
Week 2: 2 More Message Types + Copy Segment + Start Syntax Highlighting
Week 3: Complete Syntax Highlighting + Start Undo/Redo
Week 4: Complete Undo/Redo + Start Validation
Week 5: Complete Validation + Start Diff/Compare
Week 6: Complete Diff/Compare + Keyboard Shortcuts
Week 7: Field Search/Filter + Start Interpretation
Week 8: Complete Interpretation + Virtualization
```

---

## Dependency Graph

```
[No Dependencies]
├── 1.1 Code Quality Fixes
├── 1.3 Copy Individual Segment
├── 1.4 Syntax Highlighting
├── 2.1 Undo/Redo System
├── 2.3 Message Diff/Compare
├── 3.2 Field Search/Filter
└── 3.4 Virtualization

[Depends on Code Quality]
└── 1.2 More Message Types

[Depends on More Message Types]
├── 2.2 Message Validation
└── 3.3 Human-Readable Interpretation

[Depends on Undo/Redo]
└── 3.1 Keyboard Shortcuts
```

---

## Priority Quick Reference

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| P1 | Code Quality Fixes | Low | High |
| P1 | More Message Types | Low | High |
| P1 | Copy Segment | Low | Medium |
| P1 | Undo/Redo | Medium | High |
| P1 | Validation | High | High |
| P2 | Diff/Compare | High | High |
| P2 | Syntax Highlighting | Medium | Medium |
| P2 | Keyboard Shortcuts | Medium | Medium |
| P2 | Search/Filter | Medium | High |
| P3 | Interpretation | Medium | Medium |
| P3 | Virtualization | Medium | Medium |
