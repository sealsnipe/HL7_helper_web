import { FieldDto, FieldDefinition } from '@/types';

/**
 * Common props shared by all field components
 */
export interface BaseFieldProps {
  /** The field data to render */
  field: FieldDto;
  /** Field definition with descriptions (optional) */
  definition: FieldDefinition | null;
  /** Callback when field value changes */
  onChange: (value: string, updatedField?: FieldDto) => void;
  /** Whether to highlight fields containing variables */
  highlightVariable?: boolean;
  /** Map of variable IDs to their current values */
  variableValues?: Map<string, string>;
  /** Callback when a linked variable value changes */
  onVariableChange?: (variableId: string, value: string) => void;
  /** Whether this field is highlighted from search */
  isSearchHighlighted?: boolean;
}

/**
 * Props for simple input rendering helper
 */
export interface InputRenderProps {
  label: string;
  value: string;
  isEditable: boolean;
  onChange: (value: string) => void;
  testIdKey: string;
  description?: string;
}
