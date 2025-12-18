import React from 'react';
import { UniqueVariable } from '@/types/serialization';
import { VariableInput } from './VariableInput';

interface VariablesOnlyViewProps {
  uniqueVariables: UniqueVariable[];
  variableValues: Record<string, string>;
  onVariableChange: (variableId: string, value: string) => void;
  focusFirst?: boolean;
}

/**
 * Compact view showing only the editable variables
 */
export const VariablesOnlyView: React.FC<VariablesOnlyViewProps> = ({
  uniqueVariables,
  variableValues,
  onVariableChange,
  focusFirst = false,
}) => {
  if (uniqueVariables.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-4 text-center">
        No HELPERVARIABLE placeholders found in this template.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4" data-testid="variables-only-view">
      {uniqueVariables.map((variable, index) => (
        <VariableInput
          key={variable.variableId}
          variableId={variable.variableId}
          groupId={variable.groupId}
          value={variableValues[variable.variableId] || ''}
          onChange={(value) => onVariableChange(variable.variableId, value)}
          fieldPositions={variable.fieldPositions}
          fieldNames={variable.fieldNames}
          occurrenceCount={variable.occurrenceCount}
          autoFocus={focusFirst && index === 0}
        />
      ))}
    </div>
  );
};
