# HL7 Helper Web - Architecture Thoughts

*Brainstorming session on potential architecture improvements*
*Date: 2025-12-16*

---

## Executive Summary

After exploring the codebase (46 TypeScript files, 126 tests), I've identified several architectural patterns that are working well and opportunities for improvement. The application has evolved organically and shows signs of increasing complexity around state management, particularly with the new serialization features.

**Key Observations:**
- State is currently scattered across components using useState
- Recent features (serialization, linked variables) hint at need for more structured state
- Parser/Generator are pure functions (excellent separation)
- Component hierarchy is clear but prop drilling is becoming evident
- Performance patterns are minimal despite editing complex HL7 structures

---

## 1. State Management

### Current State

**Pattern:** Local useState in page components
- `page.tsx`: Manages hl7Text, segments, error, loading, modals
- `use/page.tsx`: Manages templates, serializations, variable values
- Props passed down through 3-4 levels (page → MessageEditor → SegmentRow → FieldInput)

**What's Working:**
- Simple and predictable for basic editor functionality
- Easy to reason about data flow in isolated features
- No external dependencies or learning curve

**Pain Points:**
- Prop drilling (e.g., `variableValues`, `onVariableChange` threaded through 3 components)
- Duplicate state logic between main editor and template use page
- Difficult to implement cross-cutting features (undo/redo, history)
- State synchronization between raw text and parsed segments requires manual coordination
- Debouncing logic mixed with component logic

### Alternative Approaches

#### Option A: React Context + useReducer
```typescript
// Context-based state tree
interface EditorContext {
  raw: { text: string; error: string | null };
  parsed: { segments: SegmentDto[]; isValid: boolean };
  ui: { loading: boolean; expandedSegments: Set<number> };
  history: { past: EditorState[]; future: EditorState[] };
}

// Dispatch actions instead of direct state updates
dispatch({ type: 'PARSE_HL7', payload: text });
dispatch({ type: 'UPDATE_FIELD', payload: { segmentIndex, fieldIndex, value } });
dispatch({ type: 'UNDO' });
```

**Pros:**
- Centralized state logic, easier to test
- Natural fit for undo/redo (store snapshots in history)
- Eliminates prop drilling via context
- Action log useful for debugging
- Already partially implemented in serialization (useSerializationReducer)

**Cons:**
- More boilerplate for simple operations
- Context updates can cause unnecessary re-renders if not carefully memoized
- Steeper learning curve for contributors
- May be overkill for simpler pages

**When to Consider:**
- If undo/redo becomes a requirement
- When state logic exceeds ~200 lines per component
- If time-travel debugging would help

#### Option B: Zustand
```typescript
// Store definition
const useEditorStore = create<EditorState>((set, get) => ({
  hl7Text: '',
  segments: [],
  parse: (text) => {
    const segments = parseHl7Message(text);
    set({ hl7Text: text, segments });
  },
  updateField: (segmentIndex, fieldIndex, value) => {
    const segments = produce(get().segments, draft => {
      draft[segmentIndex].fields[fieldIndex].value = value;
    });
    set({ segments });
  }
}));

// Component usage (no providers needed)
function MessageEditor() {
  const segments = useEditorStore(s => s.segments);
  const updateField = useEditorStore(s => s.updateField);
  // ...
}
```

**Pros:**
- Minimal boilerplate, ~50 lines for entire store
- No provider hell, just import and use
- Built-in shallow equality checking
- Excellent DevTools support
- Easy to share state across disconnected components (e.g., header + editor)
- Middleware for persistence (already doing localStorage manually)

**Cons:**
- External dependency (3.7kB gzipped)
- Less explicit than Context (store can be mutated anywhere)
- Might be harder to track what caused a state change

**When to Consider:**
- If multiple pages need shared state (templates, user settings)
- When prop drilling becomes painful (>3 levels)
- If localStorage sync becomes more complex

#### Option C: Redux Toolkit
```typescript
// Slice with automatic action creators
const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    parseHl7: (state, action) => {
      state.segments = parseHl7Message(action.payload);
    },
    updateField: (state, action) => {
      const { segmentIndex, fieldIndex, value } = action.payload;
      state.segments[segmentIndex].fields[fieldIndex].value = value;
    }
  }
});
```

**Pros:**
- Industry standard with massive ecosystem
- Built-in Immer for immutable updates
- RTK Query could replace manual persistence service
- Excellent DevTools and time-travel debugging
- Clear separation of concerns

**Cons:**
- Heaviest solution (~13kB gzipped)
- Most boilerplate
- Overkill for this application size
- Team needs to learn Redux patterns

**When to Consider:**
- If application grows to 10+ pages
- If server-state caching becomes complex
- If team already knows Redux

### Recommendation

**For Current Scale:** Stick with useState but extract complex state logic

```typescript
// Custom hook to encapsulate editor state
function useHl7Editor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return {
    hl7Text: state.hl7Text,
    segments: state.segments,
    parse: useCallback((text) => dispatch({ type: 'PARSE', text }), []),
    updateField: useCallback((segIdx, fldIdx, val) =>
      dispatch({ type: 'UPDATE_FIELD', segIdx, fldIdx, val }), [])
  };
}
```

**For Future (if complexity grows):** Zustand
- Lightweight enough to not regret
- Powerful enough for cross-component state
- Could gradually migrate by moving useState to store one slice at a time

**Important Consideration - Undo/Redo:**
If undo/redo is needed, it should influence architecture NOW:
- Need immutable state snapshots
- History array with pointer (past/present/future)
- Reducer pattern naturally fits this
- Consider immer for deep updates without mutation

---

## 2. Data Flow

### Current Flow

```
User Input (textarea)
  ↓ [debounced]
parseHl7Message(text) → SegmentDto[]
  ↓ [stored in state]
MessageEditor → SegmentRow → FieldInput
  ↓ [onChange bubbles up]
handleFieldChange updates segments
  ↓ [manual trigger]
generateHl7Message(segments) → string
  ↓
Update textarea
```

**Observations:**
- One-way data flow (good)
- Parser and generator are pure functions (excellent)
- Manual sync between text and segments
- No automatic text generation on edit (by design)

### Pattern: Event Sourcing

**Concept:** Store all changes as events, derive state from event log

```typescript
type EditorEvent =
  | { type: 'PASTE_TEXT'; text: string; timestamp: number }
  | { type: 'EDIT_FIELD'; segmentIndex: number; fieldIndex: number;
      oldValue: string; newValue: string; timestamp: number }
  | { type: 'ADD_SEGMENT'; segment: SegmentDto; timestamp: number };

// State is derived from events
const currentState = events.reduce(applyEvent, initialState);

// Undo = remove last event and replay
// Time-travel = replay events up to timestamp
```

**Pros:**
- Perfect audit trail (useful for debugging complex HL7 edits)
- Undo/redo falls out naturally
- Can replay sessions for bug reports
- Could export edit history for compliance

**Cons:**
- More complex than needed for current features
- Event log can grow large (need pruning strategy)
- Harder to debug (need to replay events to see state)
- Potentially slower (need to recompute derived state)

**When to Consider:**
- If audit trails are needed (healthcare context might require this)
- If time-travel debugging becomes essential
- If collaborative editing is ever planned

**Verdict:** Interesting but premature. Could be added later if needed.

### Pattern: Reactive State (Signals/Observables)

**Concept:** State changes automatically propagate

```typescript
// Using signals (like Solid.js or Preact Signals)
const hl7Text = signal('');
const segments = computed(() => parseHl7Message(hl7Text.value));
const generatedText = computed(() => generateHl7Message(segments.value));

// Auto-updates when hl7Text changes
effect(() => {
  console.log('Segments changed:', segments.value);
});
```

**Pros:**
- No manual synchronization
- Automatic memoization (computed values only recalculate when dependencies change)
- Fine-grained reactivity (only affected components re-render)
- Elegant for derived state

**Cons:**
- Requires adopting signals library (Preact Signals ~2kB)
- Different mental model from React's explicit re-renders
- Can be harder to debug (implicit dependencies)
- Not idiomatic React (though React is exploring signals internally)

**When to Consider:**
- If performance becomes a bottleneck (unlikely for HL7 message sizes)
- If complex derived state relationships emerge
- If team wants to experiment with cutting-edge patterns

**Verdict:** Interesting pattern but React's current model is sufficient. Watch React's built-in signals development.

### Current Recommendation

**Keep current flow but improve sync:**

```typescript
// Option 1: Bi-directional sync with single source of truth
// Text is source → segments are derived (read-only editor)
const segments = useMemo(() => parseHl7Message(hl7Text), [hl7Text]);

// OR

// Segments are source → text is derived (visual editor primary)
const hl7Text = useMemo(() => generateHl7Message(segments), [segments]);
```

Currently the app supports both directions (good flexibility) but could be clearer about which is "source of truth" at any moment.

**Consider:** View mode toggle (text-primary vs visual-primary)

---

## 3. Component Architecture

### Current Structure

```
page.tsx (434 lines)
  └── MessageEditor (135 lines)
        └── SegmentRow (79 lines)
              └── FieldInput (351 lines)
```

**What's Working:**
- Clear hierarchical decomposition
- Each component has single responsibility
- Good use of React features (useMemo, useCallback)

**Pain Points:**
- FieldInput is complex (351 lines, handles simple/component/repetition fields)
- Props drilling (variableValues, onVariableChange)
- Limited reusability (components tightly coupled to HL7 domain)

### Pattern: Composition over Hierarchy

**Current (inheritance-like):**
```tsx
<FieldInput
  field={field}
  onChange={onChange}
  highlightVariable={true}
  variableValues={values}
  onVariableChange={onVarChange}
/>
```

**Alternative (composition):**
```tsx
<Field value={field.value} onChange={onChange}>
  {field.components.length > 0 && (
    <Field.Components>
      {field.components.map(c => (
        <Field.Component value={c.value} />
      ))}
    </Field.Components>
  )}
  {field.repetitions.length > 0 && (
    <Field.Repetitions>
      {/* ... */}
    </Field.Repetitions>
  )}
</Field>
```

**Pros:**
- More flexible layouts
- Easier to customize without props explosion
- Component library emerging naturally

**Cons:**
- More verbose usage
- API surface area increases
- Might be overkill for internal app

**Verdict:** Current approach is fine. Consider compound components if customization needs grow.

### Pattern: Render Props / Slots

**Problem:** Field rendering logic is hardcoded

**Alternative:**
```tsx
<FieldInput
  field={field}
  renderLabel={(field) => (
    <div className="custom-label">{field.position}</div>
  )}
  renderValue={(field, onChange) => (
    // Custom input component
  )}
/>
```

**When useful:**
- If different HL7 message types need different field rendering
- If third-party customization is needed
- If A/B testing different UIs

**Verdict:** Not needed now but keep in mind for extension points.

### Pattern: Headless Components

**Separate logic from presentation:**

```typescript
// Headless hook with all logic
function useFieldEditor(field: FieldDto) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayValue = /* ... */;
  const handleChange = /* ... */;

  return {
    isExpanded,
    toggle: () => setIsExpanded(!isExpanded),
    displayValue,
    handleChange,
    // ... all logic exposed
  };
}

// Presentation component
function FieldInput({ field }) {
  const editor = useFieldEditor(field);

  return (
    <div>
      <input value={editor.displayValue} onChange={editor.handleChange} />
      {/* Visual stuff only */}
    </div>
  );
}
```

**Pros:**
- Logic is testable without mounting components
- Can have multiple UI implementations (mobile, desktop, print)
- Easier to share logic across components

**Cons:**
- More files to manage
- Indirection can hurt readability
- May be premature abstraction

**Verdict:** Worth considering for FieldInput (complex logic) but not urgent.

### Recommendation: Incremental Refactoring

1. **Extract FieldInput variants** into separate components:
   ```typescript
   // Instead of one 351-line component
   <FieldInput> // 50 lines - router component
     {field.repetitions ? <FieldWithRepetitions /> : null}
     {field.components ? <FieldWithComponents /> : null}
     {!field.components && !field.repetitions ? <SimpleField /> : null}
   </FieldInput>
   ```

2. **Extract common UI patterns** into utility components:
   ```typescript
   <Label field={field} definition={definition} />
   <ExpandButton isExpanded={isExpanded} onToggle={toggle} />
   <VariableBadge groupId={field.variableGroupId} />
   ```

3. **Consider composition** only if customization requests come in

---

## 4. Performance Patterns

### Current State

**What's implemented:**
- Basic memoization (useMemo for derived values)
- Debounced parsing (300ms)
- expandedIndices stored as Set (O(1) lookup)

**What's NOT implemented:**
- Virtualization for large messages (100+ segments)
- Web Workers for parsing
- Lazy rendering of collapsed segments
- Memoized components (React.memo)

### Pattern: Virtualization

**Problem:** Performance degrades with 100+ segments

**Solution:** Only render visible segments

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageEditor({ segments }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: segments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimate segment height
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <SegmentRow
            key={virtualRow.key}
            segment={segments[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Pros:**
- Massive performance gains for large messages (1000+ segments)
- Smooth scrolling
- Proven library (@tanstack/react-virtual)

**Cons:**
- Adds complexity
- Breaks browser find (Ctrl+F)
- Height estimation can be tricky for variable-height segments
- Extra dependency (~5kB)

**When to Consider:**
- If users report slow editing with large messages
- If typical message size exceeds 50 segments
- If mobile performance matters

**Verdict:** Not needed now (typical HL7 messages are 5-20 segments). Add if performance complaints arise.

### Pattern: Web Workers for Parsing

**Move parsing off main thread:**

```typescript
// parser.worker.ts
onmessage = (e) => {
  const segments = parseHl7Message(e.data);
  postMessage(segments);
};

// page.tsx
const parseWorker = new Worker('/parser.worker.js');
parseWorker.onmessage = (e) => {
  setSegments(e.data);
};
parseWorker.postMessage(hl7Text);
```

**Pros:**
- Keeps UI responsive during parse
- Useful for VERY large messages (10,000+ lines)

**Cons:**
- Overhead of worker communication
- Complex setup (Webpack/Next.js config)
- Overkill for typical HL7 messages (parse is fast, <10ms)

**When to Consider:**
- If parsing takes >100ms
- If users paste extremely large messages
- Never for messages <10KB

**Verdict:** Unnecessary. Parser is already fast enough.

### Pattern: React.memo and useMemo

**Current:** Limited memoization

**Opportunity:**
```typescript
// Prevent SegmentRow re-renders when unrelated segments change
export const SegmentRow = React.memo<Props>(({ segment, ... }) => {
  // ...
}, (prevProps, nextProps) => {
  // Custom equality: only re-render if this segment changed
  return prevProps.segment === nextProps.segment
    && prevProps.isExpanded === nextProps.isExpanded;
});

// Memoize expensive field filtering
const visibleFields = useMemo(() => {
  return segment.fields.filter(/* ... */);
}, [segment.fields]); // Only recalculate when fields change
```

**Pros:**
- Free performance wins
- No architectural changes needed
- Easy to add incrementally

**Cons:**
- Premature optimization if not measured
- Can cause bugs if dependencies are wrong
- Makes code slightly harder to read

**Recommendation:**
1. Measure first (React DevTools Profiler)
2. Add memo to leaf components (FieldInput) if they're rendering unnecessarily
3. Use useMemo for expensive array operations (field filtering, uniqueVariables extraction)
4. Don't over-optimize without evidence

### Current Verdict

**Performance is NOT a bottleneck.** Current patterns are sufficient:
- Debounced parsing prevents thrashing
- Memoized derived values
- Reasonable component sizes

**Add optimizations ONLY if:**
- Users report sluggishness
- Profiling shows >100ms renders
- Message sizes exceed 50 segments regularly

---

## 5. Type System

### Current State

**Core types** (`src/types/index.ts`):
```typescript
interface SegmentDto {
  id: string;
  name: string;
  fields: FieldDto[];
}

interface FieldDto {
  position: number;
  value: string;
  isEditable: boolean;
  components: ComponentDto[];
  repetitions?: FieldDto[];
  variableId?: string;
  variableGroupId?: number;
}
```

**What's Good:**
- Clear DTO naming convention
- Comprehensive types for HL7 structure
- Optional properties for extensions (variableId)

**Opportunities:**

#### Branded Types for Safety

**Problem:** String IDs can be mixed up

```typescript
// Current: easy to mix up
const segmentId: string = "seg-123";
const templateId: string = "tmpl-456";

// Both are strings, compiler can't help
function loadSegment(id: string) { /* ... */ }
loadSegment(templateId); // Bug! But compiles fine
```

**Solution: Branded types**

```typescript
// Opaque type that prevents mixing
type SegmentId = string & { readonly __brand: 'SegmentId' };
type TemplateId = string & { readonly __brand: 'TemplateId' };

// Factory functions with runtime branding
function createSegmentId(id: string): SegmentId {
  return id as SegmentId;
}

// Type-safe APIs
function loadSegment(id: SegmentId) { /* ... */ }
loadSegment(templateId); // ❌ Compile error!
loadSegment(createSegmentId("seg-123")); // ✅ Works
```

**Already done well:** InstanceId in serialization.ts uses this pattern!

**Recommendation:** Extend to all ID types:
- SegmentId
- FieldId
- TemplateId
- VariableId (currently string)

#### Discriminated Unions for Field Types

**Problem:** Field can be simple, composite, or repeated - checked at runtime

```typescript
// Current: runtime checks scattered
if (field.repetitions && field.repetitions.length > 0) { /* ... */ }
if (field.components && field.components.length > 0) { /* ... */ }
```

**Solution: Discriminated unions**

```typescript
type FieldDto =
  | SimpleField
  | CompositeField
  | RepeatedField;

interface SimpleField {
  kind: 'simple';
  position: number;
  value: string;
  isEditable: boolean;
}

interface CompositeField {
  kind: 'composite';
  position: number;
  isEditable: boolean;
  components: ComponentDto[];
}

interface RepeatedField {
  kind: 'repeated';
  position: number;
  isEditable: boolean;
  repetitions: FieldDto[];
}

// Type-safe handling
function renderField(field: FieldDto) {
  switch (field.kind) {
    case 'simple':
      return <SimpleFieldInput value={field.value} />;
    case 'composite':
      return <CompositeFieldInput components={field.components} />;
    case 'repeated':
      return <RepeatedFieldInput repetitions={field.repetitions} />;
  }
  // Exhaustiveness check - compiler ensures all cases covered
}
```

**Pros:**
- Impossible states become unrepresentable (can't have both components AND repetitions)
- Type narrowing in switch statements
- Compiler enforces exhaustive handling
- Self-documenting code

**Cons:**
- Migration effort (parser/generator need updating)
- Breaks existing serialized data (need migration)
- More boilerplate in type definitions
- Might be over-engineering for current needs

**Verdict:** Worth considering for future refactor, but not urgent. Current approach works and is simpler.

#### Action Types for State Management

**If adopting reducers:**

```typescript
// Current (implicit actions)
setSegments([...segments]);

// With discriminated union actions
type EditorAction =
  | { type: 'PARSE_TEXT'; text: string }
  | { type: 'UPDATE_FIELD'; segmentIndex: number; fieldIndex: number; value: string }
  | { type: 'ADD_SEGMENT'; segment: SegmentDto }
  | { type: 'REMOVE_SEGMENT'; segmentId: SegmentId };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      // TypeScript knows action has segmentIndex, fieldIndex, value
      // ...
  }
}
```

**Recommendation:** Already using this in useSerializationReducer - good pattern! Expand if moving to reducer-based state.

### Type Safety Gaps

**Current issues:**

1. **Any escapes:**
   ```typescript
   // Find and eliminate these
   grep -r ": any" src/
   ```

2. **Loose function signatures:**
   ```typescript
   // Current
   function handleFieldChange(segIdx: number, fldIdx: number, val: string) { }

   // Better
   interface FieldChangeEvent {
     segmentIndex: number;
     fieldIndex: number;
     newValue: string;
     timestamp?: number;
   }
   function handleFieldChange(event: FieldChangeEvent) { }
   ```

3. **Missing null checks:**
   ```typescript
   // Current
   const template = templates.find(t => t.id === id);
   setContent(template.content); // Might crash!

   // Better
   const template = templates.find(t => t.id === id);
   if (!template) throw new Error(`Template ${id} not found`);
   setContent(template.content);
   ```

### Recommendation

1. **Adopt branded types** for all IDs (already done for InstanceId)
2. **Add exhaustiveness checks** to all switch statements
3. **Enable strict TypeScript options** if not already:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "exactOptionalPropertyTypes": true
     }
   }
   ```
4. **Consider discriminated unions** for FieldDto in major refactor
5. **Document type decisions** in types/index.ts (why certain choices were made)

---

## 6. Cross-Cutting Concerns

### Persistence Architecture

**Current:** Well-designed service layer!

```
PersistenceService (coordinator)
  ├── Adapter selection (IndexedDB → localStorage fallback)
  ├── Envelope wrapping (versioning + checksum)
  ├── Migration system
  └── Backup management

IndexedDBAdapter / LocalStorageAdapter (implementations)
```

**What's Great:**
- Adapter pattern allows swapping storage backends
- Envelope pattern for versioned data
- Checksum verification prevents corruption
- Automatic migrations

**Opportunities:**

#### Async State Hydration

**Problem:** Templates load client-side, causing flash of empty state

```typescript
// Current
useEffect(() => {
  loadTemplates().then(setTemplates);
}, []);

// First render: templates = []
// Second render: templates = [loaded data]
```

**Solution: Suspense for data loading**

```typescript
// Using React.use (React 19)
function TemplateList() {
  const templates = use(templatesPromise);
  return <div>{templates.map(/* ... */)}</div>;
}

// Wrap with Suspense boundary
<Suspense fallback={<TemplatesSkeleton />}>
  <TemplateList />
</Suspense>
```

**Pros:**
- No loading state management
- Cleaner component code
- Streaming SSR compatible (if Next.js RSC adopted)

**Cons:**
- Requires React 19 (already on 19.2.0!)
- Different mental model
- Error boundaries needed

**Verdict:** Experiment with this pattern - you're already on React 19.

#### Cache Invalidation Strategy

**Current:** No explicit cache management

**Questions:**
- When should templates be reloaded?
- How to handle stale data across tabs?
- What if user imports data in another tab?

**Patterns:**

1. **Storage events** for cross-tab sync:
   ```typescript
   useEffect(() => {
     const handleStorageChange = (e: StorageEvent) => {
       if (e.key === 'templates') {
         reloadTemplates();
       }
     };
     window.addEventListener('storage', handleStorageChange);
     return () => window.removeEventListener('storage', handleStorageChange);
   }, []);
   ```

2. **Versioned timestamps:**
   ```typescript
   interface CacheEntry<T> {
     data: T;
     cachedAt: number;
     ttl: number; // Time to live in ms
   }

   function isCacheValid(entry: CacheEntry): boolean {
     return Date.now() - entry.cachedAt < entry.ttl;
   }
   ```

3. **Periodic refresh:**
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       refreshTemplates();
     }, 5 * 60 * 1000); // Every 5 minutes
     return () => clearInterval(interval);
   }, []);
   ```

**Recommendation:** Add storage event listener for cross-tab sync. TTL not needed for user-local data.

### Error Handling

**Current:** Try-catch with console.error

**Gaps:**
- No error recovery strategies
- No user notification for persistence failures
- No error reporting/telemetry

**Patterns:**

1. **Error boundaries** for component failures:
   ```typescript
   <ErrorBoundary
     fallback={<ErrorMessage />}
     onError={(error) => logToService(error)}
   >
     <MessageEditor />
   </ErrorBoundary>
   ```
   ✅ Already implemented! (ErrorBoundary.tsx)

2. **Result types** instead of exceptions:
   ```typescript
   type Result<T, E = Error> =
     | { ok: true; value: T }
     | { ok: false; error: E };

   async function saveTemplate(template: Template): Promise<Result<void>> {
     try {
       await persistenceService.save('templates', template);
       return { ok: true, value: undefined };
     } catch (error) {
       return { ok: false, error: error as Error };
     }
   }

   // Usage
   const result = await saveTemplate(template);
   if (!result.ok) {
     showErrorToast(result.error.message);
   }
   ```

3. **Retry with exponential backoff:**
   ```typescript
   async function withRetry<T>(
     fn: () => Promise<T>,
     maxAttempts = 3
   ): Promise<T> {
     for (let i = 0; i < maxAttempts; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxAttempts - 1) throw error;
         await sleep(2 ** i * 1000); // 1s, 2s, 4s
       }
     }
     throw new Error('Unreachable');
   }
   ```

**Recommendation:**
- Adopt Result types for persistence operations
- Add toast notifications for errors (currently just console.error)
- Retry failed IndexedDB operations (can be flaky)

### Testing Architecture

**Current:** Excellent coverage (126 tests)
- 62 unit tests (parser, generator)
- 28 component tests
- 36 e2e tests (workflows, visual, a11y)

**Strengths:**
- Round-trip tests (parse → edit → generate → parse)
- Visual regression tests
- Accessibility tests

**Gaps:**
- No integration tests for persistence layer with real IndexedDB
- No performance benchmarks
- No mutation testing running regularly (script exists but not CI)

**Recommendations:**

1. **Add persistence integration tests:**
   ```typescript
   // tests/integration/persistence.test.ts
   import { getPersistenceService } from '@/services/persistence';
   import indexedDB from 'fake-indexeddb';

   test('full save-load cycle with migrations', async () => {
     const service = getPersistenceService();
     const template = { id: '1', content: 'MSH|...' };

     await service.save('templates', [template]);
     const loaded = await service.load('templates');

     expect(loaded).toEqual([template]);
   });
   ```

2. **Performance benchmarks:**
   ```typescript
   import { bench, describe } from 'vitest';

   describe('Parser performance', () => {
     bench('parse 100-segment message', () => {
       parseHl7Message(largeMessage);
     });

     bench('parse and generate round-trip', () => {
       const segments = parseHl7Message(message);
       generateHl7Message(segments);
     });
   });
   ```

3. **Mutation testing in CI:**
   - Run `npm run test:mutation` weekly
   - Fail build if mutation score <75%

---

## 7. Scalability Considerations

### Multi-User Scenarios

**Current:** Single-user, local-only

**Future scenarios:**
- Team sharing templates
- Cloud backup
- Collaborative editing

**Architecture implications:**

1. **Conflict resolution:**
   - Need versioning (Last-Write-Wins? Operational Transform?)
   - Optimistic updates with rollback

2. **Offline-first:**
   - Current architecture already offline-first (good!)
   - Need sync queue for background upload

3. **Real-time updates:**
   - WebSocket connection for live changes
   - CRDT (Conflict-free Replicated Data Type) for automatic merging

**Recommendation:** Don't architect for multi-user now, but keep it possible:
- Keep data serializable (no circular refs)
- Add timestamps to all data
- Use UUIDs for IDs (not sequential numbers)

### Plugin Architecture

**If third parties want to extend:**

```typescript
// Plugin API
interface HL7Plugin {
  name: string;
  version: string;

  // Lifecycle hooks
  onParse?(segments: SegmentDto[]): SegmentDto[];
  onGenerate?(text: string): string;

  // UI extensions
  renderFieldActions?(field: FieldDto): React.ReactNode;
  renderSegmentActions?(segment: SegmentDto): React.ReactNode;
}

// Registration
registerPlugin(myPlugin);
```

**When to consider:**
- If extensibility becomes a product requirement
- If users want custom field types
- If third-party integrations are needed

**Verdict:** Not needed now, but architecture is clean enough to add later.

---

## 8. Technology Decisions

### Current Stack Assessment

| Tech | Usage | Assessment |
|------|-------|------------|
| Next.js 16 | Framework | ✅ Excellent choice, latest version |
| React 19 | UI library | ✅ Cutting edge, enables new patterns |
| TypeScript 5 | Type safety | ✅ Well-typed codebase |
| Tailwind 4 | Styling | ✅ Modern, utility-first |
| Vitest | Unit testing | ✅ Fast, modern alternative to Jest |
| Playwright | E2E testing | ✅ Best-in-class |
| IndexedDB | Storage | ✅ Right choice for large data |

**No red flags.** Stack is modern and well-chosen.

### Future Considerations

1. **Server Components (RSC)?**
   - Current: Pure client-side app
   - Opportunity: Templates could be server-rendered
   - Tradeoff: Complexity vs performance gains
   - Verdict: Not worth it for single-page app

2. **State management library?**
   - See section 1 (State Management)
   - Zustand if complexity grows

3. **Styling: Tailwind vs CSS-in-JS?**
   - Current Tailwind works great
   - Don't change without strong reason

4. **Monorepo?**
   - Current: Single package
   - Future: If mobile app or API server added
   - Tools: Turborepo, Nx
   - Verdict: Not needed yet

---

## 9. Migration Strategies

If adopting any of these patterns, how to do it safely?

### Strategy A: Incremental Refactoring

**For state management:**
1. Extract one page's state to Zustand store
2. Run all tests
3. Migrate next page
4. Repeat until complete

**For type system:**
1. Add branded types for one entity (e.g., SegmentId)
2. Fix all type errors
3. Run tests
4. Add next entity

### Strategy B: Feature Flags

```typescript
const USE_NEW_STATE_MANAGEMENT = process.env.NEXT_PUBLIC_USE_ZUSTAND === 'true';

function Editor() {
  if (USE_NEW_STATE_MANAGEMENT) {
    return <EditorWithZustand />;
  }
  return <EditorWithUseState />;
}
```

Run both implementations in parallel, gradually shift traffic.

### Strategy C: Parallel Implementation

Build new architecture alongside old, swap when ready:

```
src/
  components/         # Old
  components-v2/      # New architecture
  ...
```

Once v2 is stable, delete v1 and rename v2 → components.

---

## 10. Prioritized Recommendations

### Do Now (High Value, Low Effort)

1. **Extract state logic from page components** into custom hooks
   - `useHl7Editor()`, `useTemplateManager()`
   - Improves testability, reduces duplication

2. **Add branded types for all IDs**
   - Prevents ID confusion bugs
   - Already done for InstanceId, extend to others

3. **Memoize expensive operations**
   - Profile first to find hotspots
   - Add React.memo selectively

4. **Add storage event listener** for cross-tab sync
   - Simple, prevents stale data issues

5. **Improve error handling**
   - Toast notifications for persistence failures
   - Result types for async operations

### Do Soon (High Value, Medium Effort)

6. **Split FieldInput** into separate components
   - SimpleField, CompositeField, RepeatedField
   - Easier to maintain and test

7. **Add integration tests** for persistence
   - Ensure IndexedDB adapters work correctly
   - Test migration paths

8. **Implement undo/redo**
   - High user value
   - Requires reducer pattern (good forcing function for architecture)

### Consider Later (Medium Value, High Effort)

9. **Adopt Zustand** if state complexity grows
   - Only if prop drilling becomes painful
   - Gradual migration possible

10. **Discriminated unions** for FieldDto
    - Major refactor, breaks existing code
    - Do as part of larger type system overhaul

### Don't Do (Low Value or Premature)

11. ❌ **Event sourcing** - Too complex for current needs
12. ❌ **Web Workers** - Parser is already fast enough
13. ❌ **Virtualization** - Messages aren't large enough
14. ❌ **Redux** - Too heavy for this application
15. ❌ **Plugin system** - No requirement yet

---

## 11. Key Questions to Guide Decisions

Before making architecture changes, answer these:

### State Management
- Is prop drilling causing bugs or making features hard to implement?
- Do we need undo/redo? (If yes → reducer pattern)
- Do we need cross-component state? (If yes → Context or Zustand)
- Is current useState approach causing performance issues? (Probably no)

### Component Architecture
- Are components hard to test in isolation? (If yes → extract logic)
- Are components being reused across pages? (If yes → extract to library)
- Is component customization needed? (If yes → composition patterns)

### Performance
- Have we measured actual performance issues? (Always measure first)
- Are users complaining about slowness? (If no, don't optimize)
- What's the 95th percentile message size? (Don't optimize for edge cases)

### Type Safety
- Are we catching bugs at runtime that types could prevent? (If yes → strengthen types)
- Are type errors helpful or annoying? (If annoying → loosen types)
- Is the team comfortable with advanced TypeScript? (Don't over-engineer)

---

## 12. Conclusion

### What's Working Well

1. **Pure function architecture** (parser/generator) - keep this
2. **Comprehensive testing** - excellent foundation
3. **Modern tech stack** - no technical debt here
4. **Persistence layer design** - adapter pattern, envelopes, migrations
5. **Type safety** - good use of TypeScript

### What Could Improve

1. **State management** - scattered across components, hard to share
2. **Component complexity** - FieldInput doing too much
3. **Error handling** - silent failures, no user feedback
4. **Performance profiling** - not measuring, so can't improve strategically

### Guiding Principles

1. **Measure before optimizing** - don't guess, profile
2. **Keep it simple** - prefer useState over Redux unless pain is clear
3. **Incremental improvement** - don't rewrite, refactor
4. **Test everything** - architecture changes must maintain test coverage
5. **User value first** - does this make the app better for users?

### Final Thought

The current architecture is **solid for a single-page application**. There's no urgent need for major changes. Focus on:
- Extracting reusable logic (custom hooks)
- Strengthening type safety (branded IDs)
- Improving error UX (toasts, retry)

Consider larger changes (Zustand, discriminated unions) only when:
- Current approach becomes painful (multiple bugs from same root cause)
- New features are hard to implement (undo/redo would be easier with reducers)
- Performance degrades measurably (not "feels slow" but "profiler shows 500ms renders")

**The best architecture is the simplest one that solves the problem.**

---

*These are exploratory notes, not a formal proposal. Use as brainstorming material for future discussions.*
