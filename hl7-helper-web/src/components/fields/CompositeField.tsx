import React from 'react';
import { FieldDto } from '@/types';
import { getVariableGroupColor, containsAnyVariable } from '@/utils/templateHelpers';
import { BaseFieldProps } from './types';

/**
 * Renders an HL7 field with components (separated by ^).
 * Provides expand/collapse functionality to edit individual components.
 */
export const CompositeField: React.FC<BaseFieldProps> = ({
  field,
  definition,
  onChange,
  highlightVariable = false,
  isSearchHighlighted = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Check if this field or any of its components contains HELPERVARIABLE
  const fieldHasVariable = React.useMemo(() => {
    if (containsAnyVariable(field.value)) return true;
    if (field.components?.some((c) => containsAnyVariable(c.value))) return true;
    if (field.components?.some((c) => c.subComponents?.some((s) => containsAnyVariable(s.value))))
      return true;
    return false;
  }, [field]);

  // Auto-expand composite fields containing variables when in variable editing mode
  // or when search highlighted
  React.useEffect(() => {
    if (highlightVariable && fieldHasVariable && field.components && field.components.length > 0) {
      setIsExpanded(true);
    }
    if (isSearchHighlighted && field.components && field.components.length > 0) {
      setIsExpanded(true);
    }
  }, [highlightVariable, fieldHasVariable, field.components, isSearchHighlighted]);

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

  // Reconstruct the full value for display
  const fullValue = React.useMemo(() => {
    if (!field.components || field.components.length === 0) return field.value;
    return field.components
      .map((c) => {
        if (c.subComponents && c.subComponents.length > 0) {
          return c.subComponents.map((s) => s.value).join('&');
        }
        return c.value;
      })
      .join('^');
  }, [field.components, field.value]);

  // Helper to render a single input
  const renderInput = (
    label: string,
    value: string,
    isEditable: boolean,
    onChangeVal: (v: string) => void,
    key: string,
    description?: string
  ) => {
    const ariaLabel = description || `Field ${label}`;
    const testId = `field-input-${key}`;

    return (
      <div key={key} className="flex flex-col mb-2 min-w-[120px] flex-1">
        <div className="flex flex-col mb-0.5">
          <label
            className="text-[10px] text-muted-foreground font-mono whitespace-nowrap overflow-hidden text-ellipsis"
            title={label}
          >
            {label}
          </label>
          {description && (
            <span className="text-[10px] text-primary font-medium truncate" title={description}>
              {description}
            </span>
          )}
        </div>
        <input
          type="text"
          value={value}
          readOnly={!isEditable}
          onChange={(e) => onChangeVal(e.target.value)}
          aria-label={ariaLabel}
          data-testid={testId}
          className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${
            isEditable
              ? 'bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground'
              : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
          }`}
        />
      </div>
    );
  };

  const handleComponentChange = (compIdx: number, newVal: string) => {
    if (!field.components || compIdx >= field.components.length) return;

    const newComponents = [...field.components];
    newComponents[compIdx] = { ...newComponents[compIdx], value: newVal };

    // Reconstruct full value
    const newValue = newComponents
      .map((c) => {
        if (c.subComponents && c.subComponents.length > 0) {
          return c.subComponents.map((s) => s.value).join('&');
        }
        return c.value;
      })
      .join('^');

    // Pass updated field with components preserved
    const updatedField: FieldDto = {
      ...field,
      value: newValue,
      components: newComponents,
    };
    onChange(newValue, updatedField);
  };

  const handleSubComponentChange = (compIdx: number, subIdx: number, newSubVal: string) => {
    if (!field.components || compIdx >= field.components.length) return;
    const comp = field.components[compIdx];
    if (!comp.subComponents || subIdx >= comp.subComponents.length) return;

    const newSubComponents = [...comp.subComponents];
    newSubComponents[subIdx] = { ...newSubComponents[subIdx], value: newSubVal };

    const newComponents = [...field.components];
    newComponents[compIdx] = {
      ...comp,
      subComponents: newSubComponents,
      value: newSubComponents.map((s) => s.value).join('&'),
    };

    // Reconstruct full value
    const newValue = newComponents
      .map((c) => {
        if (c.subComponents && c.subComponents.length > 0) {
          return c.subComponents.map((s) => s.value).join('&');
        }
        return c.value;
      })
      .join('^');

    // Pass updated field with components preserved
    const updatedField: FieldDto = {
      ...field,
      value: newValue,
      components: newComponents,
    };
    onChange(newValue, updatedField);
  };

  return (
    <div
      className={`flex flex-col items-start border border-border rounded p-1 bg-muted/30 w-full ${highlightClass}`}
      data-search-highlight={isSearchHighlighted ? 'true' : undefined}
    >
      <div className="flex items-center gap-2 w-full">
        {/* Main Value Display (Reconstructed) */}
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 mb-0.5">
            <label className="text-[10px] text-muted-foreground font-mono font-bold text-primary">
              {field.position}
            </label>
            {definition && (
              <span className="text-xs font-medium text-foreground">{definition.description}</span>
            )}
          </div>
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={fullValue}
              readOnly={true}
              aria-label={`${definition?.description || `Field ${field.position}`} (read-only, expand to edit components)`}
              data-testid={`field-input-${field.position}-composite`}
              className="border border-input rounded px-2 py-1 text-sm font-mono bg-muted text-muted-foreground w-full"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={
                isExpanded ? `Collapse field ${field.position}` : `Expand field ${field.position}`
              }
              data-testid={`field-expand-${field.position}`}
              className="p-1 hover:bg-muted rounded text-muted-foreground text-xs"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '\u25B2' : '\u25BC'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && field.components && (
        <div className="mt-2 pl-2 border-l-2 border-primary/20 ml-1 flex flex-col gap-2 w-full">
          <div className="flex flex-wrap gap-2">
            {field.components.map((comp, idx) => (
              <div
                key={`${field.position}-${comp.position}`}
                className="flex flex-col min-w-[100px]"
              >
                {renderInput(
                  `${field.position}.${comp.position}`,
                  comp.value,
                  field.isEditable,
                  (newVal) => handleComponentChange(idx, newVal),
                  `${field.position}-${comp.position}`,
                  definition?.components?.[comp.position.toString()]
                )}
                {comp.subComponents && comp.subComponents.length > 0 && (
                  <div className="flex gap-1 ml-2 border-l pl-1 border-border mt-1">
                    {comp.subComponents.map((sub, subIdx) =>
                      renderInput(
                        `${field.position}.${comp.position}.${sub.position}`,
                        sub.value,
                        field.isEditable,
                        (newSubVal) => handleSubComponentChange(idx, subIdx, newSubVal),
                        `${field.position}-${comp.position}-${sub.position}`
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
