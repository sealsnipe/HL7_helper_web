# UI Hierarchy Document - Addendum 2: Technical Deep Dive

**Date**: 2025-12-15
**Purpose**: Address technical implementation details, browser APIs, persistence, and edge cases

---

## 1. KEYBOARD SHORTCUTS & INTERACTIONS

### 1.1 Documented Keyboard Shortcuts

**ESC Key:**
- **Where**: ConfirmDialog component
- **Action**: Closes dialog (calls `onCancel`)
- **Implementation**: Document-level keydown listener
- **Code**: `src/components/ConfirmDialog.tsx` lines 31-60

```typescript
if (e.key === 'Escape') {
  e.preventDefault();
  onCancel();
}
```

**Tab/Shift+Tab:**
- **Where**: ConfirmDialog component
- **Action**: Trap focus within dialog (accessibility)
- **Implementation**: Cycles between focusable elements (buttons)
- **Code**: `src/components/ConfirmDialog.tsx` lines 41-57

**Enter/Space:**
- **Where**: ImportButton label
- **Action**: Triggers file picker (keyboard accessibility)
- **Code**: `src/components/persistence/ImportButton.tsx` lines 61-65

```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInputRef.current?.click();
  }
}}
```

**Arrow Keys (Left/Right):**
- **Where**: ViewModeToggle (unused component)
- **Action**: Switch between view modes
- **Status**: Implemented but NOT in active code path
- **Code**: `src/components/serialization/ViewModeToggle.tsx` line 31

### 1.2 NO Application-Wide Shortcuts

**Not Implemented:**
- No Ctrl/Cmd shortcuts for copy, save, etc.
- No keyboard shortcuts for navigation
- No custom shortcuts for parsing or regenerating
- No shortcut documentation/help overlay

**Standard Browser Shortcuts Work:**
- Ctrl+A (select all) in textareas
- Ctrl+C/V (copy/paste)
- Ctrl+Z (undo) in textareas
- Tab navigation through inputs

---

## 2. ERROR RECOVERY PATTERNS

### 2.1 HL7 Parsing Failures

#### Malformed Input Handling

**Empty/Whitespace Input:**
```typescript
// page.tsx lines 32-37
if (!text.trim()) {
  setSegments([]);
  setError(null);
  setLoading(false);
  return;
}
```
**Result**: Clears editor, no error shown

**No Valid Segments:**
```typescript
// page.tsx lines 44-49
if (data.length === 0) {
  setError("No valid HL7 segments found in the message.");
  setSegments([]);
  setLoading(false);
  return;
}
```
**Result**: Error banner shown, editor cleared

**Invalid Segment Names:**
```typescript
// page.tsx lines 52-58
const invalidSegments = data.filter(seg => !/^[A-Z][A-Z0-9]{2}$/.test(seg.name));
if (invalidSegments.length > 0) {
  setError(`Invalid segment name(s): ${invalidSegments.map(s => `"${s.name}"`).join(', ')}...`);
  setSegments([]);
  setLoading(false);
  return;
}
```
**Result**: Specific error naming invalid segments

**No Field Data:**
```typescript
// page.tsx lines 61-67
const emptySegments = data.filter(seg => seg.fields.length === 0);
if (emptySegments.length === data.length) {
  setError("Message contains no valid field data.");
  setSegments([]);
  setLoading(false);
  return;
}
```
**Result**: Error shown, no partial parsing

**Parser Exception:**
```typescript
// page.tsx lines 79-82
catch (err) {
  console.error("Parse error:", err);
  setError(err instanceof Error ? err.message : "Failed to parse message");
  setSegments([]);
}
```
**Result**: Generic error from parser exception

#### Edge Cases Handled by Parser

**File**: `src/utils/hl7Parser.ts`

**Multiple Line Ending Formats:**
```typescript
// line 28
const segments = message.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
```
**Handles**: `\r\n` (Windows), `\n` (Unix), `\r` (Mac)

**MSH Special Handling:**
```typescript
// lines 48-63
if (segmentName === 'MSH') {
  // MSH-1: Field Separator (always |)
  fieldDtos.push({ position: 1, value: '|', components: [], isEditable: false });

  // MSH-2: Encoding Characters
  fieldDtos.push({ position: 2, value: fields[1] || '', components: [], isEditable: false });

  // Remaining fields starting from MSH-3
  for (let i = 2; i < fields.length; i++) {
    fieldDtos.push(parseField(fields[i], i + 1));
  }
}
```
**Result**: MSH field positions adjusted correctly

**HL7 Escape Sequences:**
```typescript
// lines 14-21
const unescapeHl7 = (value: string): string => {
  return value
    .replace(/\\F\\/g, '|')   // Field separator
    .replace(/\\S\\/g, '^')   // Component separator
    .replace(/\\R\\/g, '~')   // Repetition separator
    .replace(/\\T\\/g, '&')   // Subcomponent separator
    .replace(/\\E\\/g, '\\'); // Escape character
};
```
**Note**: Only standard encoding (`^~\&`) supported. Non-standard MSH-2 NOT supported.

**Invalid Segment Names (Parser Warning):**
```typescript
// lines 35-37
if (!/^[A-Z][A-Z0-9]{2}$/.test(segmentName)) {
  console.warn(`Invalid HL7 segment name "${segmentName}" on line ${index + 1}...`);
}
```
**Result**: Warning logged but parsing continues (validation happens at UI level)

### 2.2 localStorage Unavailable or Full

**File**: `src/services/persistence/LocalStorageAdapter.ts`

**Availability Check:**
```typescript
// lines 18-29
isAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
```

**Every Operation Checks Availability:**
```typescript
// lines 45-48, 61-64, 78-81
async get<T>(key: string): Promise<T | null> {
  if (!this.isAvailable()) {
    throw new Error('localStorage is not available');
  }
  // ...
}
```

**Quota Exceeded Handling:**
```typescript
// lines 69-75
try {
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(this.prefixKey(key), serialized);
} catch (error) {
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    throw new Error('Storage quota exceeded. Please export your data and clear some space.');
  }
  throw error;
}
```

**JSON Parse Errors:**
```typescript
// lines 50-58
try {
  const item = window.localStorage.getItem(this.prefixKey(key));
  if (item === null) return null;
  return JSON.parse(item) as T;
} catch (error) {
  console.error(`Error parsing localStorage item "${key}":`, error);
  // Return null instead of throwing to allow recovery
  return null;
}
```
**Strategy**: Return null, allow app to continue with defaults

**Corrupted Template Data:**
- **Where**: Create Template page
- **Detection**: JSON.parse exception when reading templates
- **Handler**: Browser `confirm()` dialog asking user to clear data
- **Code**: `src/app/templates/create/page.tsx` lines 37-54

```typescript
catch (error) {
  console.error('Failed to parse templates:', error);
  const shouldClear = confirm(
    'There was an error reading your existing templates. ' +
    'The data may be corrupted.\n\n' +
    'Click OK to clear the corrupted data and save your new template.\n' +
    'Click Cancel to abort and keep the existing data.'
  );

  if (shouldClear) {
    localStorage.removeItem('hl7_templates');
    // Save new template and redirect
  }
  // If user clicks Cancel, stay on page without saving
}
```

### 2.3 Missing/Empty State Recovery

**No Templates Found:**
- **Where**: Template List page
- **Action**: Creates default templates from SAMPLE_TEMPLATES
- **Code**: `src/app/templates/page.tsx` lines 107-119

**No Template Selected:**
- **Where**: Use Template page
- **Action**: Shows empty state message
- **UI**: "Select a template above to start creating serializations."

**Security Validation Failure:**
- **Where**: Main Editor loading from Use Template
- **Detection**: `isValidHl7Content()` returns false
- **Action**: Logs warning, removes from localStorage, doesn't load
- **Code**: `src/app/page.tsx` lines 214-216

---

## 3. BROWSER APIs & COMPATIBILITY

### 3.1 Modern APIs Used (No Fallbacks)

**crypto.randomUUID():**
- **Used In**:
  - Template creation (`templates/page.tsx` line 169)
  - Template duplication (`templates/page.tsx` line 250)
  - Serialization instances (`templates/use/page.tsx` lines 131, 162)
  - Create template page (`templates/create/page.tsx` line 22)
- **Browser Support**: Chrome 92+, Firefox 95+, Safari 15.4+
- **Fallback**: NONE - Will throw error in older browsers
- **Risk**: Medium (most users on modern browsers)

**structuredClone():**
- **Used In**: Use Template page for deep cloning segments
- **Code**: `templates/use/page.tsx` lines 132, 163
- **Browser Support**: Chrome 98+, Firefox 94+, Safari 15.4+
- **Fallback**: NONE
- **Risk**: Medium (fails silently in older browsers, causes bugs)

**navigator.clipboard.writeText():**
- **Used In**:
  - Main Editor copy button (`page.tsx` line 163)
  - Use Template per-instance copy (`templates/use/page.tsx` line 189)
  - Serialization OutputPanel (`components/serialization/OutputPanel.tsx` line 21)
  - Serialization ActionBar (`components/serialization/ActionBar.tsx` line 24)
- **Browser Support**: Chrome 63+, Firefox 53+, Safari 13.1+
- **Requires**: HTTPS or localhost
- **Fallback**: NONE - Logs error to console
- **Error Handling**:
  ```typescript
  try {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
  } catch (err) {
    console.error('Failed to copy:', err);
    // No user-facing error message
  }
  ```
- **Risk**: Low (widely supported, but fails silently)

### 3.2 Polyfills/Compatibility Layers

**next-themes:**
- **Used For**: Theme persistence and system preference detection
- **File**: `src/components/ThemeProvider.tsx`
- **Provider**: Wraps entire app in `layout.tsx`
- **Storage**: Uses localStorage with key managed by next-themes
- **Hydration**: `suppressHydrationWarning` on `<html>` tag
- **Compatibility**: Handles SSR/client mismatch

**CSS Custom Properties:**
- **Requirement**: IE 11 not supported
- **All themes**: Use CSS variables for colors
- **Browser Support**: All modern browsers

---

## 4. SESSION STATE & PERSISTENCE

### 4.1 What Persists vs. Ephemeral

**Persists (localStorage):**

| Data | Key | Format | Cleared When |
|------|-----|--------|--------------|
| Templates | `hl7-helper:templates` | JSON array | User action (delete/import) |
| Theme Preference | Managed by next-themes | String | Never (user setting) |
| Migration Status | `hl7-helper:migrations` | JSON object | Never |
| Generated HL7 (temp) | `generated_hl7` | String | After load into Main Editor |

**Ephemeral (React state only):**

| Data | Location | Lost When |
|------|----------|-----------|
| Main Editor input text | `hl7Text` state | Page refresh |
| Parsed segments | `segments` state | Page refresh |
| Template edit state | `editContent`, etc. | Page refresh |
| Serialization instances | `serializations` state | Page refresh |
| Error messages | `error` state | Page refresh |
| Copy success status | `copySuccess` state | After 2 seconds |

### 4.2 NO Auto-Save

**Main Editor:**
- User input is NOT saved to localStorage
- Refreshing page loses all work
- No warning on page unload

**Template Edit:**
- Changes NOT saved until "Save" clicked
- Refreshing page loses unsaved changes
- No warning on navigate away

**Use Template:**
- Instance data NOT persisted
- Refreshing page loses all instances
- Only final "Serialize & Load" creates temporary storage

### 4.3 localStorage Key Prefix System

**Prefix**: `hl7-helper:`

**Implementation**: `LocalStorageAdapter.prefixKey()`
```typescript
private prefixKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}
```

**Current Keys:**
- `hl7-helper:templates` - Template array
- `hl7-helper:migrations` - Migration status object
- `generated_hl7` - UNPREFIXED temporary key (inconsistency!)

**Migration Keys:**
- `hl7_templates` - OLD key (pre-migration)
- **Migration**: Runs once, moves data from old to new key
- **File**: `src/services/persistence/migrations/index.ts`

**Migration Process:**
1. Check if `hl7-helper:migrations` shows `v1_templates_migrated: true`
2. If false, read from `hl7_templates`
3. Validate and transform data
4. Save to `hl7-helper:templates`
5. Mark migration complete
6. Remove old key

---

## 5. URL & ROUTING

### 5.1 Next.js App Router

**Routing Type**: File-based (Next.js 14 App Router)

**Routes:**
- `/` - Main Editor (`src/app/page.tsx`)
- `/templates` - Template List (`src/app/templates/page.tsx`)
- `/templates/create` - Create Template (`src/app/templates/create/page.tsx`)
- `/templates/use` - Use Template (`src/app/templates/use/page.tsx`)

**Navigation Methods:**
- `<Link href="/path">` - Client-side navigation (no full reload)
- `router.push('/path')` - Programmatic navigation
- `window.location` - Manual manipulation (for query params)

### 5.2 Query Parameters

**ONLY ONE Query Parameter Used:**

**`?loadGenerated=true`:**
- **Purpose**: Signal Main Editor to load HL7 from localStorage
- **Set By**: Use Template "Serialize & Load" button
- **Read By**: Main Editor on mount
- **Code**: `src/app/page.tsx` lines 205-221

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('loadGenerated') === 'true') {
    const generated = localStorage.getItem('generated_hl7');
    if (generated && isValidHl7Content(generated)) {
      setHl7Text(generated);
      parseMessage(generated);
      localStorage.removeItem('generated_hl7'); // Clean up
    }
    window.history.replaceState({}, '', '/'); // Clean up URL
  }
}, [parseMessage]);
```

**Flow:**
1. Use Template → "Serialize & Load" button
2. Writes to `localStorage.setItem('generated_hl7', allOutputs)`
3. Navigates to `/?loadGenerated=true`
4. Main Editor reads param, validates content, loads into textarea
5. Removes param from URL (replaceState)
6. Removes from localStorage

**Security**: `isValidHl7Content()` validates before loading (prevents XSS)

### 5.3 NO Deep Linking

**Not Supported:**
- Cannot link to specific template by ID
- Cannot share URL with template pre-selected
- Cannot bookmark template edit state
- Cannot link to serialization with pre-filled variables

**All navigation resets to default state** (empty/initial)

---

## 6. THEME PERSISTENCE

### 6.1 next-themes Implementation

**Library**: `next-themes` (by pacocoursey)

**Provider Setup:**
```typescript
// layout.tsx lines 31-36
<ThemeProvider
  attribute="data-theme"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**Configuration:**
- **Attribute**: `data-theme` on `<html>` element
- **Default**: System preference
- **System Detection**: Enabled (reads OS preference)
- **Transitions**: Disabled (no flicker on theme change)

### 6.2 Storage & Persistence

**Storage Method**: localStorage (managed by next-themes)

**Key**: Not visible in our code (internal to next-themes)
- Likely: `theme` or `next-themes-theme`

**Persists Across:**
- Page refreshes
- Browser sessions
- Device reboots

**System Preference:**
- Detects via `prefers-color-scheme` media query
- Updates automatically when OS preference changes
- User can override with manual theme selection

### 6.3 Hydration Handling

**Problem**: SSR renders with one theme, client hydrates with another

**Solution:**
```typescript
// layout.tsx line 27
<html lang="en" suppressHydrationWarning>
```

**ThemeSwitcher Mounted State:**
```typescript
// ThemeSwitcher.tsx lines 13-15, 34-36
const [mounted, setMounted] = React.useState(false);

React.useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null; // Don't render until client-side
}
```

**Result**: No theme flicker on initial load

---

## 7. ANIMATION TIMING

### 7.1 Consistent Durations

**200ms (Primary Animation Duration):**
- Modal fade-in: `duration-200`
- Template row expand: `duration-200`
- ConfirmDialog appearance: `duration-200`
- Template modal: `duration-200`

**500ms (Gradient Hover):**
- Main Editor gradient borders: `transition duration-500`

**Other Durations:**
- `delay-1000` - Background gradient pulse offset
- `transition-colors` (default 200ms)
- `transition-all` (default 200ms)

### 7.2 Animation Classes Used

**Tailwind Animate:**
- `animate-pulse` - Background gradients (continuous)
- `animate-spin` - Loading spinners (continuous)

**Custom Animate (from tailwindcss plugin):**
- `animate-in` - Entry animation
- `fade-in` - Opacity 0 → 1
- `zoom-in-95` - Scale 95% → 100%
- `slide-in-from-top-2` - Translate Y -8px → 0

**Example:**
```tsx
className="animate-in fade-in zoom-in-95 duration-200"
// Animates opacity and scale over 200ms
```

---

## 8. DEBOUNCE DETAILS

### 8.1 Live Parsing Debounce

**Constant**: `PARSE_DEBOUNCE_MS = 300`
**File**: `src/app/page.tsx` line 15

**Trigger**: Every keystroke in Main Editor textarea

**Implementation:**
```typescript
const handleTextChange = useCallback((newText: string) => {
  setHl7Text(newText);          // Update immediately
  setIsTyping(true);            // Show "Parsing..." indicator

  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current); // Cancel previous timer
  }

  debounceTimerRef.current = setTimeout(() => {
    setIsTyping(false);         // Hide "Parsing..."
    parseMessage(newText);      // Actually parse
  }, PARSE_DEBOUNCE_MS);        // 300ms delay
}, [parseMessage]);
```

**What Happens:**
1. User types character → `setHl7Text` updates immediately (textarea responsive)
2. Start timer for 300ms
3. User types another character → cancel previous timer, start new 300ms
4. User stops typing for 300ms → timer fires, parsing begins
5. While parsing, errors are suppressed (`{error && !isTyping && ...}`)

**Cleanup:**
```typescript
useEffect(() => {
  return () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, []);
```

**Result**: Parser doesn't run until user pauses typing

### 8.2 NO Other Debouncing

**Not Debounced:**
- Template search/filter
- Variable input in Use Template
- Field editing in MessageEditor
- Theme switching
- Copy to clipboard

---

## 9. FORM VALIDATION

### 9.1 Template Name & Content

**Create Template Page:**
```typescript
// templates/create/page.tsx lines 16-19
if (!name || !content) {
  alert("Name and Content are required.");
  return;
}
```

**Validation:**
- Name: Required (non-empty string)
- Content: Required (non-empty string)
- Description: Optional
- Message Type: Required but has default (ADT-A01)

**NO Validation For:**
- Name length (could be 1000 characters)
- Name characters (could contain special chars, emojis)
- Content format (no HL7 validation at save time)
- Duplicate names (allowed)

**Template List Edit:**
- Same save logic via `handleSave()` but NO validation
- Empty name/content CAN be saved
- Inconsistency with Create page

### 9.2 HL7 Content Validation (at Load Time)

**Security Function**: `isValidHl7Content(content: string)`
**File**: `src/app/page.tsx` lines 185-201

```typescript
const isValidHl7Content = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;

  // Must start with valid segment name (3 uppercase) + |
  if (!/^[A-Z][A-Z0-9]{2}\|/.test(content)) return false;

  // Only printable ASCII (0x20-0x7E), CR, LF, tab
  const validHl7Pattern = /^[\x20-\x7E\r\n\t]*$/;
  if (!validHl7Pattern.test(content)) return false;

  // Reject HTML/script injection patterns
  if (/<[a-zA-Z]|javascript:|data:/i.test(content)) return false;

  return true;
};
```

**Used For:**
- Validating content from `localStorage.getItem('generated_hl7')`
- Prevents XSS attacks from localStorage tampering
- ONLY applied when loading from Use Template → Main Editor
- NOT applied when user types directly in Main Editor

**XSS Prevention:**
- Blocks `<script>`, `<img>`, etc.
- Blocks `javascript:` URLs
- Blocks `data:` URLs
- Only allows HL7-compatible ASCII characters

### 9.3 NO Client-Side Sanitization

**User Input NOT Sanitized:**
- Template names stored as-is
- Template descriptions stored as-is
- HL7 content stored as-is
- Variable values stored as-is

**React Handles:**
- Automatic escaping in JSX (`{template.name}` is safe)
- No `dangerouslySetInnerHTML` used anywhere

**Risk**: Low (React escapes by default)

---

## 10. COMPLETE localStorage KEY INVENTORY

### 10.1 Active Keys

**Prefixed Keys** (`hl7-helper:` prefix):

| Key | Type | Managed By | Purpose |
|-----|------|------------|---------|
| `hl7-helper:templates` | JSON Array | PersistenceService | Current template storage |
| `hl7-helper:migrations` | JSON Object | Migration system | Track completed migrations |

**Unprefixed Keys:**

| Key | Type | Lifecycle | Purpose |
|-----|------|-----------|---------|
| `generated_hl7` | String | Temporary | Transfer serialized HL7 from Use Template to Main Editor |
| `hl7_templates` | JSON Array | Legacy (pre-migration) | Old template storage, removed after migration |
| `theme` or similar | String | Persistent | Managed by next-themes (exact key unknown) |

### 10.2 Key Prefixing System

**Prefix Constant:**
```typescript
// LocalStorageAdapter.ts line 3
const STORAGE_PREFIX = 'hl7-helper:';
```

**Prefixing Method:**
```typescript
private prefixKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}
```

**Unprefixing Method:**
```typescript
private unprefixKey(key: string): string {
  return key.replace(STORAGE_PREFIX, '');
}
```

**Enumeration:**
```typescript
async getAllKeys(): Promise<string[]> {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(this.unprefixKey(key));
    }
  }
  return keys;
}
```

**Inconsistency**: `generated_hl7` does NOT use prefix system (direct localStorage access in pages)

### 10.3 Migration System

**Migration Status Structure:**
```typescript
interface MigrationStatus {
  v1_templates_migrated: boolean;
}
```

**Stored In**: `hl7-helper:migrations` (note: uses old key format, not prefixed)

**Migration File**: `src/services/persistence/migrations/index.ts`

**Migration v1 (Templates):**
1. Checks if already migrated
2. Reads from `hl7_templates` (old key)
3. Validates each template:
   - Has `id`, `name`, `content`, `messageType`, `createdAt`
   - All required fields are correct type
4. Saves to `hl7-helper:templates` (new key)
5. Marks `v1_templates_migrated: true`
6. Removes `hl7_templates` (old key)

**Future Migrations:**
- Add new boolean flags to `MigrationStatus`
- Check flag before running
- Mark complete after successful run

---

## SUMMARY OF FINDINGS

### Critical Gaps Identified:

1. **No Fallbacks for Modern APIs**: App breaks in older browsers
2. **No Auto-Save**: User loses work on refresh
3. **No Deep Linking**: Cannot share/bookmark specific states
4. **Inconsistent Validation**: Create page validates, Edit page doesn't
5. **Inconsistent Key Naming**: `generated_hl7` not prefixed
6. **No Keyboard Shortcuts**: Limited accessibility
7. **Silent Clipboard Failures**: No user feedback on copy errors
8. **No Input Sanitization**: Relies entirely on React escaping

### Browser Compatibility Issues:

| API | Chrome | Firefox | Safari | Risk |
|-----|--------|---------|--------|------|
| crypto.randomUUID() | 92+ | 95+ | 15.4+ | Medium |
| structuredClone() | 98+ | 94+ | 15.4+ | Medium |
| navigator.clipboard | 63+ | 53+ | 13.1+ | Low |

**Recommendation**: Add polyfills or feature detection

### Suggested Improvements:

1. Add browser compatibility warning on app load
2. Implement auto-save to localStorage (with user preference)
3. Add keyboard shortcut documentation
4. Add clipboard fallback (document.execCommand)
5. Standardize localStorage key naming (prefix everything)
6. Add validation to Template Edit page
7. Add deep linking support (template IDs in URL)
8. Add "unsaved changes" warning on navigate away

---

## INTEGRATION NOTES

This addendum should be merged into main `ui-hierarchy.md` as new sections or subsections under existing categories.
