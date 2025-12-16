# Feature: Multi-Instance HL7 Serialization

## Document Version
- **Version**: 1.1 (Reviewed)
- **Date**: 2025-12-15
- **Status**: Approved with Modifications (Review Complete)

---

## 1. Overview

### 1.1 Problem Statement
Currently, the "Serialize from Template" page allows users to serialize ONE HL7 message at a time from a template. Users who need to generate multiple messages with similar structure but different values (e.g., different patient IDs, case numbers, or dates) must repeat the process manually for each message.

### 1.2 Solution
Introduce **Multi-Instance Serialization** - the ability to create multiple "instances" from a single template, each with its own set of HELPERVARIABLE values, generating multiple serialized HL7 messages simultaneously.

### 1.3 Key Benefits
- **Efficiency**: Generate 10+ HL7 messages in seconds instead of minutes
- **Consistency**: All messages share the same template structure
- **Batch Processing**: Copy all messages at once or load them sequentially
- **Error Reduction**: No need to re-select templates or re-enter common values

---

## 2. User Stories

### 2.1 Primary User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | Lab technician | Generate multiple ADT messages with different patient IDs | I can quickly create test data for multiple patients |
| US-2 | Integration tester | Create a batch of HL7 messages with varying case numbers | I can test system load and message processing |
| US-3 | Healthcare developer | Serialize templates with different variable combinations | I can validate HL7 parsing across edge cases |
| US-4 | QA engineer | Copy all generated messages at once | I can paste them into testing tools efficiently |

### 2.2 Acceptance Criteria (per User Story)

**US-1: Generate multiple messages**
- [ ] User can add new serialization instances (minimum 1, maximum 20)
- [ ] Each instance has its own set of variable inputs
- [ ] Each instance generates an independent HL7 output
- [ ] Instances are visually paired (input on right, output on left)

**US-2: Batch creation**
- [ ] User can duplicate an existing instance (copies current variable values)
- [ ] User can remove any instance except the last one
- [ ] Adding/removing instances does not affect other instances' values

**US-3: Variable combinations**
- [ ] Linked variables (same HELPERVARIABLE ID) stay synchronized within an instance
- [ ] Different instances can have different values for the same variable
- [ ] Variable badges (V1, V2, V3) are color-consistent across all instances

**US-4: Batch operations**
- [ ] "Copy All" button copies all serialized messages (see format specification below)
- [ ] "Serialize & Load" loads first message to main editor
- [ ] Individual "Copy" button per instance for single message copy

**"Copy All" Format Specification:**
```
MSH|^~\&|SYSTEM|FAC|...|ADT^A01|...
PID|1||12345|...
PV1|1||...

MSH|^~\&|SYSTEM|FAC|...|ADT^A01|...
PID|1||67890|...
PV1|1||...
```
- **Separator**: Double newline (blank line) between messages
- **No comments**: HL7 doesn't support comments - raw HL7 only
- **Order**: Messages appear in instance creation order
- **Line endings**: `\r` (standard HL7) within messages, `\n\n` between messages

---

## 3. Data Model

### 3.1 Core Types

```typescript
/**
 * Branded types for type safety (prevents passing arbitrary strings)
 */
type InstanceId = string & { readonly __brand: 'InstanceId' };
type VariableId = string & { readonly __brand: 'VariableId' };

/**
 * Represents a single serialization instance with its own variable values
 *
 * IMPORTANT: Uses Record<string, string> instead of Map for JSON serialization
 * compatibility with localStorage/sessionStorage.
 */
interface SerializationInstance {
  /** Unique identifier for this instance (branded type for type safety) */
  readonly id: InstanceId;

  /** Display name (e.g., "Instance 1", "Patient A") */
  name: string;

  /**
   * Variable values for this instance.
   * Uses Record (not Map) for JSON serialization compatibility.
   * Key: variableId (e.g., "HELPERVARIABLE1")
   * Value: current value for this instance
   */
  variableValues: Record<string, string>;

  /** Timestamp when instance was created (for ordering) - immutable */
  readonly createdAt: number;

  /** Whether this instance is expanded in the UI */
  isExpanded: boolean;
}

/**
 * Unique variable definition extracted from template
 */
interface UniqueVariable {
  /** The variable ID (e.g., "HELPERVARIABLE1") */
  variableId: string;

  /** The group ID for color coding (e.g., 1 for HELPERVARIABLE1) */
  groupId: number | undefined;

  /** Number of occurrences in the template */
  occurrenceCount: number;

  /** Field positions where this variable appears (for context) */
  fieldPositions: string[]; // e.g., ["PV1-1", "PV1-3"]
}
```

### 3.2 State Structure

```typescript
interface SerializationPageState {
  // Template selection
  templates: Template[];
  selectedTemplateId: string;
  currentTemplateContent: string;

  // Parsed template data (shared across all instances)
  parsedSegments: SegmentDto[];
  uniqueVariables: UniqueVariable[];

  // Multiple instances
  instances: SerializationInstance[];

  // UI state
  viewMode: 'variables-only' | 'all-fields'; // Default: 'variables-only'
}
```

### 3.3 Derived Data (per instance)

```typescript
// Computed for each instance based on its variableValues
interface InstanceOutput {
  instanceId: string;
  segments: SegmentDto[];      // Segments with variables replaced
  serializedHl7: string;       // Final HL7 string output
  hasUnfilledVariables: boolean; // True if any variable is empty
}
```

---

## 4. UI/UX Design

### 4.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Header Navigation]                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Template Selection: [Dropdown ▼]                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Raw Template Preview (with highlighted HELPERVARIABLES)                 │ │
│ │ MSH|^~\&|App|Fac|...|ADT^A01|...                                        │
│ │ PID|1||12345^^^MRN||Doe^John                                            │
│ │ PV1|[HELPERVARIABLE1]|[HELPERVARIABLE2]|[HELPERVARIABLE1]|...           │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────┬───────────────────────────────────────┐ │
│ │ OUTPUTS                         │ INPUTS                                │ │
│ ├─────────────────────────────────┼───────────────────────────────────────┤ │
│ │ ┌─────────────────────────────┐ │ ┌───────────────────────────────────┐ │ │
│ │ │ Instance 1           [Copy] │ │ │ Instance 1    [Vars|All] [Delete]│ │ │
│ │ │ ─────────────────────────── │ │ │ ─────────────────────────────────│ │ │
│ │ │ MSH|^~\&|App|...            │ │ │ ┌─────┐ ┌─────┐                  │ │ │
│ │ │ PID|1||12345|...            │ │ │ │ V1  │ │ V1  │ (linked)         │ │ │
│ │ │ PV1|John|Clinic|John|...    │ │ │ └─────┘ └─────┘                  │ │ │
│ │ │                             │ │ │ ┌─────┐                          │ │ │
│ │ │                             │ │ │ │ V2  │                          │ │ │
│ │ │                             │ │ │ └─────┘                          │ │ │
│ │ │                             │ │ │ ┌─────┐ ┌─────┐                  │ │ │
│ │ │                             │ │ │ │ V3  │ │ V3  │ (linked)         │ │ │
│ │ │                             │ │ │ └─────┘ └─────┘                  │ │ │
│ │ └─────────────────────────────┘ │ └───────────────────────────────────┘ │ │
│ │                                 │                                       │ │
│ │ ┌─────────────────────────────┐ │ ┌───────────────────────────────────┐ │ │
│ │ │ Instance 2           [Copy] │ │ │ Instance 2    [Vars|All] [Delete]│ │ │
│ │ │ ─────────────────────────── │ │ │ ─────────────────────────────────│ │ │
│ │ │ MSH|^~\&|App|...            │ │ │ ┌─────┐ ┌─────┐                  │ │ │
│ │ │ PID|1||67890|...            │ │ │ │ V1  │ │ V1  │ (linked)         │ │ │
│ │ │ PV1|Jane|ER|Jane|...        │ │ │ └─────┘ └─────┘                  │ │ │
│ │ │                             │ │ │ ...                              │ │ │
│ │ └─────────────────────────────┘ │ └───────────────────────────────────┘ │ │
│ │                                 │                                       │ │
│ └─────────────────────────────────┴───────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [+ Add Instance]  [Duplicate Selected]    [Copy All]  [Serialize & Load]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Breakdown

#### 4.2.1 Template Preview Section
- **Location**: Top of page, below template selection
- **Content**: Raw HL7 template with HELPERVARIABLE placeholders highlighted
- **Height**: Fixed 150px with scroll
- **Purpose**: Reference for users to see which variables exist

#### 4.2.2 Instance Pair Container
- **Structure**: Two-column layout with output (left) and input (right)
- **Alignment**: Left and right boxes MUST be vertically aligned
- **Border**: Subtle border connecting the pair visually
- **Collapse**: Instance header clickable to expand/collapse

#### 4.2.3 Output Panel (Left)
- **Content**: Serialized HL7 message for this instance
- **Features**:
  - Copy button (individual)
  - Live update as variables change
  - Read-only display
  - Monospace font
- **Height**: Dynamic based on content, min 100px, max 300px

#### 4.2.4 Input Panel (Right) - "Sleek Variables Box"
- **Default Mode**: Variables-only (compact)
- **Toggle**: Switch between "Vars" and "All" view modes
- **Variables-Only Layout**:
  - Grouped by variable ID (V1, V2, V3...)
  - Single input per unique variable (linked automatically)
  - Color-coded badges matching template highlighting
  - Horizontal layout for multiple variables
- **All-Fields Layout**:
  - Full MessageEditor component (existing)
  - Scrollable within container

#### 4.2.5 Action Bar
- **[+ Add Instance]**: Creates new instance with empty variables
- **[Duplicate Selected]**: Copies current instance's values to new instance
- **[Copy All]**: Copies all serialized messages to clipboard
- **[Serialize & Load]**: Loads first instance's output to main editor

### 4.3 Interaction Patterns

#### 4.3.1 Adding Instance
1. User clicks "+ Add Instance"
2. New instance appears at bottom with default name "Instance N"
3. All variables initialized to their original HELPERVARIABLE placeholders
4. New instance is expanded, others remain in their state

#### 4.3.2 Duplicating Instance
1. User clicks duplicate icon on an instance
2. New instance created with copied variable values
3. Name becomes "Instance N (copy)"
4. Position: Below the duplicated instance

#### 4.3.3 Removing Instance
1. User clicks delete icon on an instance
2. Confirmation: Only if instance has non-default values
3. Instance removed, IDs don't renumber
4. Cannot delete if only 1 instance remains

#### 4.3.4 Variable Editing (Variables-Only Mode)
1. User types in any variable input
2. All fields with same variableId update immediately
3. Output panel updates in real-time
4. No need to click "save" - instant sync

### 4.4 Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | Side-by-side columns (output left, input right) |
| Tablet (768-1023px) | Stacked with output above input |
| Mobile (<768px) | Stacked, variables-only mode forced |

---

## 5. Technical Architecture

### 5.1 Component Hierarchy

```
UseTemplatePage (refactored)
├── TemplateSelector
├── TemplatePreview
├── InstanceList
│   ├── InstancePair (×N)
│   │   ├── OutputPanel
│   │   │   └── SerializedHL7Display
│   │   └── InputPanel
│   │       ├── VariablesOnlyView (new)
│   │       │   └── VariableInput (×M)
│   │       └── AllFieldsView
│   │           └── MessageEditor (existing)
│   └── AddInstanceButton
└── ActionBar
    ├── CopyAllButton
    └── SerializeAndLoadButton
```

### 5.2 New Components

#### 5.2.1 VariablesOnlyView
```typescript
interface VariablesOnlyViewProps {
  uniqueVariables: UniqueVariable[];
  variableValues: Record<string, string>;  // Record for JSON serialization
  onVariableChange: (variableId: string, value: string) => void;
}
```
- Renders compact variable inputs
- Groups linked variables visually
- Shows color-coded badges

#### 5.2.2 InstancePair
```typescript
interface InstancePairProps {
  instance: SerializationInstance;
  uniqueVariables: UniqueVariable[];
  parsedSegments: SegmentDto[];
  onVariableChange: (instanceId: string, variableId: string, value: string) => void;
  onDelete: (instanceId: string) => void;
  onDuplicate: (instanceId: string) => void;
  viewMode: 'variables-only' | 'all-fields';
  onViewModeChange: (mode: 'variables-only' | 'all-fields') => void;
}
```

#### 5.2.3 OutputPanel
```typescript
interface OutputPanelProps {
  instanceName: string;
  serializedHl7: string;
  onCopy: () => void;
}
```

### 5.3 State Management

**IMPORTANT**: Uses `useReducer` pattern (not multiple `useState`) to prevent race conditions
and enable predictable state updates.

```typescript
/**
 * Discriminated union for all instance actions
 */
type InstanceAction =
  | { type: 'ADD_INSTANCE' }
  | { type: 'REMOVE_INSTANCE'; id: InstanceId }
  | { type: 'DUPLICATE_INSTANCE'; id: InstanceId }
  | { type: 'UPDATE_VARIABLE'; instanceId: InstanceId; variableId: string; value: string }
  | { type: 'SET_TEMPLATE'; templateId: string; content: string }
  | { type: 'TOGGLE_EXPAND'; id: InstanceId }
  | { type: 'SET_VIEW_MODE'; mode: 'variables-only' | 'all-fields' };

interface SerializationState {
  instances: SerializationInstance[];
  selectedTemplateId: string;
  currentTemplateContent: string;
  parsedSegments: SegmentDto[];
  uniqueVariables: UniqueVariable[];
  viewMode: 'variables-only' | 'all-fields';
}

/**
 * Reducer for centralized state management
 */
function serializationReducer(state: SerializationState, action: InstanceAction): SerializationState {
  switch (action.type) {
    case 'ADD_INSTANCE':
      return { ...state, instances: [...state.instances, createDefaultInstance()] };
    case 'REMOVE_INSTANCE':
      return { ...state, instances: state.instances.filter(i => i.id !== action.id) };
    case 'UPDATE_VARIABLE':
      return {
        ...state,
        instances: state.instances.map(inst =>
          inst.id === action.instanceId
            ? { ...inst, variableValues: { ...inst.variableValues, [action.variableId]: action.value } }
            : inst
        )
      };
    // ... other cases
  }
}

// Usage in component
const [state, dispatch] = useReducer(serializationReducer, initialState);

// Computed outputs (memoized per-instance)
const instanceOutputs = useMemo(() => {
  return state.instances.map(instance =>
    computeInstanceOutput(instance, state.parsedSegments)
  );
}, [state.instances, state.parsedSegments]);

// Instance operations via dispatch
const addInstance = () => dispatch({ type: 'ADD_INSTANCE' });
const removeInstance = (id: InstanceId) => dispatch({ type: 'REMOVE_INSTANCE', id });
const updateVariable = (instanceId: InstanceId, variableId: string, value: string) =>
  dispatch({ type: 'UPDATE_VARIABLE', instanceId, variableId, value });
```

### 5.4 Performance Considerations

1. **Memoization**: Each instance's output computation is memoized
2. **Debouncing**: Variable input changes debounced by 100ms for live updates
3. **Virtual Scrolling**: If >10 instances, implement virtual scrolling
4. **Lazy Generation**: HL7 string generated only when instance is expanded

---

## 6. Edge Cases

### 6.1 Template Edge Cases

| Case | Behavior |
|------|----------|
| Template with no variables | Show message: "This template has no HELPERVARIABLE placeholders. Multi-instance serialization is not applicable." Disable "Add Instance" button. |
| Template with 50+ variables | Show all variables, group by variable ID. Add search/filter if >20 unique variables. |
| Empty template selected | Show placeholder message, disable all instance operations |
| Template change while instances exist | Prompt: "Changing template will reset all instances. Continue?" |

### 6.2 Instance Edge Cases

| Case | Behavior |
|------|----------|
| Delete last instance | Button disabled, tooltip: "At least one instance required" |
| Add 20+ instances | Show warning: "Large number of instances may affect performance" |
| Instance name conflict | Auto-rename: "Instance 1", "Instance 1 (2)", "Instance 1 (3)" |
| Empty variable values | Output shows original HELPERVARIABLE placeholder |

### 6.3 Copy/Serialize Edge Cases

| Case | Behavior |
|------|----------|
| Copy All with unfilled variables | Include warning comment in copied text |
| Serialize & Load with multiple instances | Load first instance, store others in sessionStorage for "Next" navigation |
| Copy fails (clipboard denied) | Fallback: Show modal with text for manual copy |

---

## 7. Success Metrics

### 7.1 Functional Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Instance creation time | <100ms | Performance profiling |
| Variable sync latency | <50ms | Time from keystroke to output update |
| Max instances supported | 20 | Without performance degradation |
| UI render time (10 instances) | <200ms | React profiler |

### 7.2 Usability Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to create 5 instances | <30 seconds | User testing |
| Error rate (wrong variable in wrong instance) | <5% | User testing |
| Feature discoverability | >80% find without help | User testing |

### 7.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Unit test coverage | >90% | Jest coverage report |
| E2E test coverage | All user stories | Playwright tests |
| Accessibility score | 100% | axe-core |
| Visual regression | 0 unexpected changes | Playwright visual tests |

---

## 8. Testing Requirements

### 8.1 Unit Tests

- [ ] `createDefaultInstance()` returns valid instance
- [ ] `computeInstanceOutput()` correctly replaces variables
- [ ] `duplicateInstance()` deep copies variable values
- [ ] Variable sync updates all linked fields within instance
- [ ] Variable changes in one instance don't affect others

### 8.2 Component Tests

- [ ] VariablesOnlyView renders correct number of inputs
- [ ] VariablesOnlyView shows correct color badges
- [ ] OutputPanel displays serialized HL7 correctly
- [ ] InstancePair aligns output and input panels
- [ ] ViewMode toggle switches between modes

### 8.3 E2E Tests

- [ ] Create 3 instances with different values → 3 different outputs
- [ ] Duplicate instance → values copied correctly
- [ ] Delete instance → removed without affecting others
- [ ] Copy All → clipboard contains all messages
- [ ] Serialize & Load → first message loaded to main editor
- [ ] Change template → instances reset with confirmation

### 8.4 Visual Tests

- [ ] Instance pair alignment at all viewports
- [ ] Color consistency between variable badges and outputs
- [ ] Proper scrolling behavior with many instances
- [ ] Dark/light theme consistency

### 8.5 Accessibility Tests

- [ ] All inputs have labels
- [ ] Keyboard navigation through instances
- [ ] Screen reader announces instance names
- [ ] Focus management when adding/removing instances

### 8.6 Focus Management Specification

**Required focus behavior (WCAG 2.4.3 compliant):**

| Action | Focus Destination |
|--------|-------------------|
| Add Instance | First variable input of new instance |
| Delete Instance | First variable input of previous instance (or next if first deleted) |
| Duplicate Instance | First variable input of new duplicate |
| Template Change | Template selector (reset context) |

**Live Region Announcements (aria-live="polite"):**
- Instance added: "Instance {N} added. {count} total instances."
- Instance deleted: "Instance {N} deleted. {count} instances remaining."
- Copy success: "Copied to clipboard."
- Copy failure: "Failed to copy. Please try again."

**Keyboard Shortcuts:**
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+N | Add new instance |
| Ctrl+Shift+D | Duplicate current instance |
| Ctrl+Shift+C | Copy All to clipboard |
| Delete | Remove current instance (with confirmation) |

---

## 9. Implementation Phases

### Phase 1: Core Infrastructure
- Define types and interfaces
- Refactor state management for multi-instance
- Create basic InstancePair component

### Phase 2: Variables-Only View
- Create VariablesOnlyView component
- Implement variable grouping and badges
- Add view mode toggle

### Phase 3: Instance Management
- Add/remove/duplicate instance functionality
- Instance naming and ordering
- Confirmation dialogs

### Phase 4: Batch Operations
- Copy All functionality
- Serialize & Load (first instance)
- Keyboard shortcuts

### Phase 5: Polish & Testing
- Responsive layout refinement
- Performance optimization
- Full test suite
- Documentation

---

## 10. Open Questions

1. **Instance Naming**: Should users be able to rename instances? (Current: Auto-generated names)
2. **Persistence**: Should instances be saved to localStorage for session recovery?
3. **Export Format**: Should "Copy All" support CSV or JSON export in addition to raw HL7?
4. **Navigation**: After "Serialize & Load", should there be a way to load subsequent instances?

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Instance | A single serialization "slot" with its own variable values |
| HELPERVARIABLE | Placeholder in template (e.g., HELPERVARIABLE1) |
| Linked Variable | Multiple occurrences of the same HELPERVARIABLE ID that sync together |
| Variables-Only View | Compact UI showing only editable variable inputs |
| Serialization | Process of replacing HELPERVARIABLE placeholders with actual values |

---

## Appendix B: UI Mockup References

(Screenshots to be added after implementation)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-15 | Claude (Orchestrator) | Initial draft |
