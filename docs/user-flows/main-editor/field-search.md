# Flow: Field Search

## Overview

| Attribute | Value |
|-----------|-------|
| Start | Main Editor page with parsed message |
| Goal | Find and navigate to specific fields by path or value |
| Page(s) | `/` (Main Editor) |
| Components | `NavigationHeader`, `SearchBar`, `MessageEditor`, `useFieldSearch` |

## Prerequisites

- Application is loaded at `/`
- A valid HL7 message must be parsed (segments exist)
- Message must be displayed in Visual Editor

## Steps

### 1. User Opens Search Bar

#### Option A: Keyboard Shortcut
- **User Action**: Presses Ctrl+K (Windows/Linux) or Cmd+K (Mac)
- **System Response**:
  - Search bar opens and becomes visible in the navigation header
  - Input field automatically receives focus
  - Placeholder shows "Search fields (Ctrl+K)"
- **UI Element**: `data-testid="search-input"`

#### Option B: Click Input
- **User Action**: Clicks directly on the search input field
- **System Response**:
  - Input field receives focus
  - Search opens
- **UI Element**: `data-testid="search-input"`

### 2. User Enters Search Query

#### Option A: Path Search
- **User Action**: Types a field path like "PID-5", "MSH.9", "PID-5.1", or "PID.5.1"
- **System Response**:
  - Shows "searching" spinner for 150ms (debounce delay)
  - Searches for exact path match
  - Displays dropdown with matching fields
  - Shows result count (e.g., "1/3")
  - First result is automatically selected (highlighted)
- **Supported Formats**:
  - `SEG-F` (e.g., "PID-5")
  - `SEG.F` (e.g., "PID.5")
  - `SEG-F.C` (e.g., "PID-5.1")
  - `SEG.F.C` (e.g., "PID.5.1")

#### Option B: Value Search
- **User Action**: Types any text string (e.g., "john", "smith", "123")
- **System Response**:
  - Shows "searching" spinner for 150ms (debounce delay)
  - Searches case-insensitively through all field values
  - Includes components and subcomponents in search
  - Displays dropdown with matching fields (max 10 visible)
  - Shows result count (e.g., "1/25")
  - First result is automatically selected
  - Matching text is highlighted in yellow

### 3. User Reviews Results

- **User Action**: Observes the search results dropdown
- **System Response**:
  - Each result shows:
    - Path in blue monospace font (e.g., "PID-5.1")
    - Field description in gray (from HL7 definitions)
    - Field value with search term highlighted
    - Navigation arrows (up/down)
  - Maximum 10 results visible at once
  - If more than 10 results, shows "+X more results" footer
  - Keyboard hints displayed at bottom:
    - "Up/Down navigate"
    - "Enter select"
    - "Esc close"
- **UI Elements**:
  - `data-testid="search-result-{index}"`
  - Results list with `id="search-results"`

### 4. User Navigates Results

#### Option A: Keyboard Navigation
- **User Action**: Presses Arrow Down or Arrow Up
- **System Response**:
  - Highlights next/previous result with primary color background
  - Scrolls result into view smoothly
  - Updates result counter (e.g., "2/25")
  - Wraps around: after last result, goes to first

#### Option B: Mouse Navigation
- **User Action**: Hovers over a result item
- **System Response**:
  - Highlights the result with hover effect

### 5. User Selects Result

#### Option A: Press Enter
- **User Action**: Presses Enter key with a result selected
- **System Response**:
  - Expands the segment containing the matched field (if collapsed)
  - Highlights the field with animation (yellow pulse for 2 seconds)
  - Scrolls the field into view
  - Closes the search bar (Phase 3 behavior)
  - Does NOT clear the search query (preserved for reuse)

#### Option B: Click Result
- **User Action**: Clicks on a result item
- **System Response**: Same as Option A

**Phase 3 Note**: Search bar now closes after selection but preserves the query, allowing users to quickly reopen and continue searching without retyping.

### 6. User Closes Search

#### Option A: Press Escape (with query)
- **User Action**: Presses Escape key when search query exists
- **System Response**:
  - Clears the search query
  - Keeps search bar open
  - Input remains focused

#### Option B: Press Escape (without query)
- **User Action**: Presses Escape key when search query is empty
- **System Response**:
  - Closes the search bar
  - Removes focus from input

#### Option C: Click Clear Button
- **User Action**: Clicks the X button in the search input
- **System Response**:
  - Clears the search query
  - Clears all results
  - Keeps search bar open
  - Input remains focused
- **UI Element**: `data-testid="search-clear"`

#### Option D: Click Outside
- **User Action**: Clicks anywhere outside the search bar or dropdown
- **System Response**:
  - Closes the search bar
  - Preserves the search query (can reopen)

## Branches

| After Step | Condition | Leads To |
|------------|-----------|----------|
| 1 | No message loaded | Input is disabled, placeholder shows "Load message to search" |
| 2 | Empty query | No results displayed, dropdown hidden |
| 2 | No matches found | Dropdown shows "No matches found" |
| 2 | Query matches fields | Results displayed |
| 2 | More than 100 results | Only first 100 results returned (performance limit) |
| 5 | Field selected | → `edit-field.md` (User can now edit the highlighted field) |

## End States

| State | Description |
|-------|-------------|
| Success: Field Found | Field is highlighted and visible in editor |
| Success: Field Navigated | User can edit the found field |
| No Results | Dropdown shows "No matches found" message |
| Cleared | Search bar closed, no query |
| Empty State | No message loaded, search disabled |

## Connected Flows

- **Comes from**:
  - `parse-message.md` (Search available after parsing)
  - `load-example.md` (Search available after loading)
- **Leads to**:
  - `edit-field.md` (User edits the found field)
  - `expand-collapse.md` (Selected field's segment is expanded)

## Technical Details

### Search Implementation
- **Hook**: `useFieldSearch(segments)` in `src/hooks/useFieldSearch.ts`
- **Search Logic**: `searchFields()` in `src/utils/fieldSearch.ts`
- **Debounce**: 150ms delay after last keystroke
- **Max Results**: 100 matches (performance limit)
- **Max Visible**: 10 results in dropdown

### Path Query Detection
```typescript
// Matches: PID-5, PID.5, PID-5.1, PID.5.1
/^([A-Z][A-Z0-9]{2})[-.](\d+)(?:\.(\d+))?$/
```

### Search Scope
- Searches in:
  - Field values (direct)
  - Component values
  - Subcomponent values
- Uses HL7 definitions for descriptions (if available)
- Message type determined from MSH-9

### Keyboard Shortcuts
- **Ctrl+K / Cmd+K**: Open search (global, works even in inputs)
- **Arrow Up/Down**: Navigate results
- **Enter**: Select result (closes search, preserves query)
- **Escape**: Clear query or close search

**Phase 3 Enhancement**: Ctrl+K now displays a visible badge in the search input placeholder, improving discoverability.

### State Management
- Query state: Managed by `useFieldSearch`
- Selected index: Automatically cycles (wrap-around)
- Search open state: Controlled by `isOpen` flag
- Highlighted field: Stored in page state, cleared after 2s

## Error Handling

| Error | Condition | Response |
|-------|-----------|----------|
| No message | No segments parsed | Input disabled, message shown |
| Empty query | User clears input | Dropdown hidden, no results |
| Invalid path | Path doesn't match format | Treated as value search |
| No matches | Search returns empty | Shows "No matches found" |
| Too many results | More than 100 matches | Only first 100 returned |

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard navigation | Full support (Ctrl+K, arrows, Enter, Esc) |
| ARIA roles | `role="combobox"` on input, `role="listbox"` on results |
| ARIA attributes | `aria-expanded`, `aria-controls`, `aria-selected` |
| Screen reader labels | `aria-label` on all interactive elements |
| Focus management | Auto-focus on open, focus trap in dropdown |

## Phase 3 Improvements (Implemented)

| Improvement | Status | Description |
|-------------|--------|-------------|
| Search persistence | ✅ Implemented | Search stays open after selection (behavior reverted from Phase 2) |
| Ctrl+K hint | ✅ Implemented | "Search fields (Ctrl+K)" visible in placeholder |
| Global shortcut | ✅ Implemented | Ctrl+K works even when typing in inputs |

## Last Updated

- **Date**: 2025-12-17
- **Change**: Phase 3 update - Search closes after selection, Ctrl+K hint added to placeholder
