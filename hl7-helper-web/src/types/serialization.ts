import { SegmentDto } from './index';

/**
 * Branded types for type safety (prevents passing arbitrary strings)
 */
export type InstanceId = string & { readonly __brand: 'InstanceId' };

/**
 * Helper to create a branded InstanceId
 */
export function createInstanceId(): InstanceId {
  return `instance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}` as InstanceId;
}

/**
 * Represents a single serialization instance with its own variable values
 *
 * IMPORTANT: Uses Record<string, string> instead of Map for JSON serialization
 * compatibility with localStorage/sessionStorage.
 */
export interface SerializationInstance {
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
 * Unique variable definition extracted from template with metadata
 */
export interface UniqueVariable {
  /** The variable ID (e.g., "HELPERVARIABLE1") */
  variableId: string;

  /** The group ID for color coding (e.g., 1 for HELPERVARIABLE1) */
  groupId: number | undefined;

  /** Number of occurrences in the template */
  occurrenceCount: number;

  /** Field positions where this variable appears (for context) */
  fieldPositions: string[]; // e.g., ["PV1-1", "PV1-3"]
}

/**
 * Computed output for a single instance
 */
export interface InstanceOutput {
  instanceId: InstanceId;
  segments: SegmentDto[];
  serializedHl7: string;
  hasUnfilledVariables: boolean;
}

/**
 * View mode for the input panel
 */
export type ViewMode = 'variables-only' | 'all-fields';

/**
 * Discriminated union for all instance actions
 */
export type InstanceAction =
  | { type: 'ADD_INSTANCE' }
  | { type: 'REMOVE_INSTANCE'; id: InstanceId }
  | { type: 'DUPLICATE_INSTANCE'; id: InstanceId }
  | { type: 'UPDATE_VARIABLE'; instanceId: InstanceId; variableId: string; value: string }
  | { type: 'SET_TEMPLATE'; templateId: string; content: string; segments: SegmentDto[]; variables: UniqueVariable[] }
  | { type: 'TOGGLE_EXPAND'; id: InstanceId }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'RESET_INSTANCES' };

/**
 * Full state for the serialization page
 */
export interface SerializationState {
  instances: SerializationInstance[];
  selectedTemplateId: string;
  currentTemplateContent: string;
  parsedSegments: SegmentDto[];
  uniqueVariables: UniqueVariable[];
  viewMode: ViewMode;
}

/**
 * Maximum number of instances allowed
 */
export const MAX_INSTANCES = 20;

/**
 * Minimum number of instances (cannot delete last one)
 */
export const MIN_INSTANCES = 1;
