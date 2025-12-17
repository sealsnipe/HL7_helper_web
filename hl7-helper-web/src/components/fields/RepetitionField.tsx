import React from 'react';
import { getVariableGroupColor, containsAnyVariable } from '@/utils/templateHelpers';
import { BaseFieldProps } from './types';

/**
 * Renders an HL7 field with repetitions (separated by ~).
 * Each repetition can contain components and subcomponents.
 */
export const RepetitionField: React.FC<BaseFieldProps> = ({
  field,
  definition,
  onChange,
  highlightVariable = false,
  isSearchHighlighted = false,
}) => {
  // Check if this field or any of its repetitions contains HELPERVARIABLE
  const fieldHasVariable = React.useMemo(() => {
    if (containsAnyVariable(field.value)) return true;
    if (field.repetitions?.some((r) => containsAnyVariable(r.value))) return true;
    return false;
  }, [field]);

  // Highlight class for fields containing HELPERVARIABLE or search highlighted
  const highlightClass = React.useMemo(() => {
    // Search highlight takes priority
    if (isSearchHighlighted) {
      return 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 animate-pulse';
    }
    if (!highlightVariable || !field.isEditable) return '';
    if (field.variableId) {
      return getVariableGroupColor(field.variableGroupId);
    }
    if (fieldHasVariable) {
      return 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20';
    }
    return '';
  }, [
    isSearchHighlighted,
    highlightVariable,
    field.isEditable,
    field.variableId,
    field.variableGroupId,
    fieldHasVariable,
  ]);

  const handleRepetitionChange = (repIdx: number, newValue: string) => {
    if (!field.repetitions) return;

    const newReps = [...field.repetitions];

    // Re-parse components if value contains ^
    if (newValue.includes('^')) {
      const components = newValue.split('^').map((compVal, idx) => {
        if (compVal.includes('&')) {
          const subComponents = compVal.split('&').map((subVal, subIdx) => ({
            position: subIdx + 1,
            value: subVal,
            subComponents: [],
          }));
          return {
            position: idx + 1,
            value: compVal,
            subComponents,
          };
        }
        return {
          position: idx + 1,
          value: compVal,
          subComponents: [],
        };
      });
      newReps[repIdx] = { ...newReps[repIdx], value: newValue, components };
    } else {
      newReps[repIdx] = { ...newReps[repIdx], value: newValue, components: [] };
    }

    const finalValue = newReps.map((r) => r.value).join('~');
    onChange(finalValue);
  };

  if (!field.repetitions || field.repetitions.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col items-start border border-border rounded p-1 bg-muted/30 w-full ${highlightClass}`}
      data-search-highlight={isSearchHighlighted ? 'true' : undefined}
    >
      <div className="flex items-center gap-2 w-full mb-0.5">
        <label className="text-[10px] text-muted-foreground font-mono font-bold text-primary">
          {field.position}
        </label>
        {definition && (
          <span className="text-xs font-medium text-foreground">{definition.description}</span>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        {field.repetitions.map((rep, repIdx) => {
          // Reconstruct the full value for this repetition
          const repFullValue =
            rep.components && rep.components.length > 0
              ? rep.components
                  .map((c) => {
                    if (c.subComponents && c.subComponents.length > 0) {
                      return c.subComponents.map((s) => s.value).join('&');
                    }
                    return c.value;
                  })
                  .join('^')
              : rep.value;

          return (
            <div
              key={`${field.position}-rep-${repIdx}`}
              className="flex flex-col border border-primary/20 rounded p-2 bg-card"
            >
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[10px] text-primary font-mono font-bold">
                  Rep {repIdx + 1}
                </label>
                <input
                  type="text"
                  value={repFullValue}
                  readOnly={!field.isEditable}
                  onChange={(e) => handleRepetitionChange(repIdx, e.target.value)}
                  aria-label={`${definition?.description || `Field ${field.position}`} repetition ${repIdx + 1}`}
                  data-testid={`field-input-${field.position}-rep-${repIdx}`}
                  className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${
                    field.isEditable
                      ? 'bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground'
                      : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
