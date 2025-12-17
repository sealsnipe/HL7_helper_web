import React from 'react';
import { FieldDto, FieldDefinition } from '@/types';
import { SimpleField, CompositeField, RepetitionField } from './fields';

/**
 * Props for the FieldInput component
 */
interface Props {
  field: FieldDto;
  definition: FieldDefinition | null;
  onChange: (value: string, updatedField?: FieldDto) => void;
  highlightVariable?: boolean;
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
  isSearchHighlighted?: boolean;
}

/**
 * Router component that delegates to the appropriate field renderer based on field type.
 *
 * Field types:
 * - RepetitionField: Fields with repetitions (~ separated values)
 * - CompositeField: Fields with components (^ separated values)
 * - SimpleField: Simple single-value fields
 */
export const FieldInput: React.FC<Props> = (props) => {
  const { field } = props;

  // Repetition fields take priority (they may contain components within repetitions)
  if (field.repetitions && field.repetitions.length > 0) {
    return <RepetitionField {...props} />;
  }

  // Composite fields with components
  if (field.components && field.components.length > 0) {
    return <CompositeField {...props} />;
  }

  // Simple single-value fields
  return <SimpleField {...props} />;
};
