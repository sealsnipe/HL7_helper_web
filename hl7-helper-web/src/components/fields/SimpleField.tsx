import React from 'react';
import { getVariableGroupColor, getVariableBadgeColor } from '@/utils/templateHelpers';
import { BaseFieldProps } from './types';

/**
 * Renders a simple HL7 field without components or repetitions.
 * Handles single-value text inputs with optional variable highlighting.
 */
export const SimpleField: React.FC<BaseFieldProps> = ({
    field,
    definition,
    onChange,
    highlightVariable = false,
    variableValues,
    onVariableChange
}) => {
    // Get display value - use variableValues map if available for linked variables
    const displayValue = React.useMemo(() => {
        if (field.variableId && variableValues) {
            return variableValues.get(field.variableId) ?? field.value;
        }
        return field.value;
    }, [field.variableId, field.value, variableValues]);

    // Highlight class for fields containing HELPERVARIABLE - supports grouped colors
    const highlightClass = React.useMemo(() => {
        if (!highlightVariable || !field.isEditable) return '';
        if (field.variableId) {
            return getVariableGroupColor(field.variableGroupId);
        }
        return '';
    }, [highlightVariable, field.isEditable, field.variableId, field.variableGroupId]);

    // Handle value change - use onVariableChange for linked variables
    const handleValueChange = React.useCallback((newValue: string) => {
        if (field.variableId && onVariableChange) {
            onVariableChange(field.variableId, newValue);
        } else {
            onChange(newValue);
        }
    }, [field.variableId, onVariableChange, onChange]);

    const ariaLabel = definition?.description || `Field ${field.position}`;
    const testId = `field-input-${field.position}`;

    return (
        <div className={highlightClass ? `rounded ${highlightClass}` : ''}>
            {/* Visual badge for linked variables */}
            {field.variableGroupId !== undefined && (
                <div className="flex items-center gap-1 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getVariableBadgeColor(field.variableGroupId)}`}>
                        V{field.variableGroupId}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Linked variable</span>
                </div>
            )}
            <div className="flex flex-col mb-2 min-w-[120px] flex-1">
                <div className="flex flex-col mb-0.5">
                    <label className="text-[10px] text-muted-foreground font-mono whitespace-nowrap overflow-hidden text-ellipsis" title={`${field.position}`}>
                        {field.position}
                    </label>
                    {definition?.description && (
                        <span className="text-[10px] text-primary font-medium truncate" title={definition.description}>
                            {definition.description}
                        </span>
                    )}
                </div>
                <input
                    type="text"
                    value={displayValue}
                    readOnly={!field.isEditable}
                    onChange={(e) => handleValueChange(e.target.value)}
                    aria-label={ariaLabel}
                    data-testid={testId}
                    className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${field.isEditable
                        ? 'bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground'
                        : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                        }`}
                />
            </div>
        </div>
    );
};
