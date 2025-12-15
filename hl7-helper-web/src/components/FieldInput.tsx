
import React from 'react';
import { FieldDto, FieldDefinition } from '@/types';

interface Props {
    field: FieldDto;
    definition: FieldDefinition | null;
    onChange: (value: string) => void;
    highlightVariable?: boolean;
    variableOnlyEditing?: boolean;
}

// Helper to check if a value contains HELPERVARIABLE
const containsVariable = (value: string): boolean => {
    return value.includes('HELPERVARIABLE');
};

export const FieldInput: React.FC<Props> = ({ field, definition, onChange, highlightVariable = false, variableOnlyEditing: _variableOnlyEditing = false }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Check if this field or any of its components contains HELPERVARIABLE
    const fieldHasVariable = React.useMemo(() => {
        if (containsVariable(field.value)) return true;
        if (field.components?.some(c => containsVariable(c.value))) return true;
        if (field.components?.some(c => c.subComponents?.some(s => containsVariable(s.value)))) return true;
        if (field.repetitions?.some(r => containsVariable(r.value))) return true;
        return false;
    }, [field]);

    // Highlight class for fields containing HELPERVARIABLE
    const highlightClass = highlightVariable && fieldHasVariable
        ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20'
        : '';

    // Use the isEditable flag set by applyVariableEditability() at template load time
    // Don't re-check fieldHasVariable here - the flag is the source of truth
    // This allows users to edit the field even after replacing HELPERVARIABLE
    const effectiveIsEditable = field.isEditable;

    // Helper to render a single input with proper accessibility and test attributes
    const renderInput = (label: string, value: string, isEditable: boolean, onChangeVal: (v: string) => void, key: string, description?: string) => {
        const ariaLabel = description || `Field ${label}`;
        const testId = `field-input-${key}`;

        return (
            <div key={key} className="flex flex-col mb-2 min-w-[120px] flex-1">
                <div className="flex flex-col mb-0.5">
                    <label className="text-[10px] text-muted-foreground font-mono whitespace-nowrap overflow-hidden text-ellipsis" title={label}>
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
                    className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${isEditable
                        ? 'bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground'
                        : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                        }`}
                />
            </div>
        );
    };

    // If field has repetitions, render them
    if (field.repetitions && field.repetitions.length > 0) {
        return (
            <div className={`flex flex-col items-start border border-border rounded p-1 bg-muted/30 w-full ${highlightClass}`}>
                <div className="flex items-center gap-2 w-full mb-0.5">
                    <label className="text-[10px] text-muted-foreground font-mono font-bold text-primary">
                        {field.position}
                    </label>
                    {definition && (
                        <span className="text-xs font-medium text-foreground">
                            {definition.description}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-2 w-full">
                    {field.repetitions.map((rep, repIdx) => {
                        const repFullValue = rep.components && rep.components.length > 0
                            ? rep.components.map(c => {
                                if (c.subComponents && c.subComponents.length > 0) {
                                    return c.subComponents.map(s => s.value).join('&');
                                }
                                return c.value;
                            }).join('^')
                            : rep.value;

                        return (
                            <div key={`${field.position}-rep-${repIdx}`} className="flex flex-col border border-primary/20 rounded p-2 bg-card">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="text-[10px] text-primary font-mono font-bold">
                                        Rep {repIdx + 1}
                                    </label>
                                    <input
                                        type="text"
                                        value={repFullValue}
                                        readOnly={!effectiveIsEditable}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            const newReps = [...field.repetitions!];

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
                                                newReps[repIdx] = { ...rep, value: newValue, components };
                                            } else {
                                                newReps[repIdx] = { ...rep, value: newValue, components: [] };
                                            }

                                            const finalValue = newReps.map(r => r.value).join('~');
                                            onChange(finalValue);
                                        }}
                                        aria-label={`${definition?.description || `Field ${field.position}`} repetition ${repIdx + 1}`}
                                        data-testid={`field-input-${field.position}-rep-${repIdx}`}
                                        className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${effectiveIsEditable
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
    }

    // If field has components, render them instead of the main value
    if (field.components && field.components.length > 0) {
        // Reconstruct the full value for display
        const fullValue = field.components.map(c => {
            if (c.subComponents && c.subComponents.length > 0) {
                return c.subComponents.map(s => s.value).join('&'); // Assuming & for subcomponents
            }
            return c.value;
        }).join('^');

        return (
            <div className={`flex flex-col items-start border border-border rounded p-1 bg-muted/30 w-full ${highlightClass}`}>
                <div className="flex items-center gap-2 w-full">
                    {/* Main Value Display (Reconstructed) */}
                    <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-0.5">
                            <label className="text-[10px] text-muted-foreground font-mono font-bold text-primary">
                                {field.position}
                            </label>
                            {definition && (
                                <span className="text-xs font-medium text-foreground">
                                    {definition.description}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 w-full">
                            <input
                                type="text"
                                value={fullValue}
                                readOnly={true} // Main value is read-only in this view, edit components instead
                                aria-label={`${definition?.description || `Field ${field.position}`} (read-only, expand to edit components)`}
                                data-testid={`field-input-${field.position}-composite`}
                                className="border border-input rounded px-2 py-1 text-sm font-mono bg-muted text-muted-foreground w-full"
                            />
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                aria-label={isExpanded ? `Collapse field ${field.position}` : `Expand field ${field.position}`}
                                data-testid={`field-expand-${field.position}`}
                                className="p-1 hover:bg-muted rounded text-muted-foreground text-xs"
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? '▲' : '▼'}
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-2 pl-2 border-l-2 border-primary/20 ml-1 flex flex-col gap-2 w-full">
                        <div className="flex flex-wrap gap-2">
                            {field.components.map((comp, idx) => (
                                <div key={`${field.position}-${comp.position}`} className="flex flex-col min-w-[100px]">
                                    {renderInput(
                                        `${field.position}.${comp.position}`,
                                        comp.value,
                                        effectiveIsEditable,
                                        (newVal) => {
                                            // Bounds check before accessing array
                                            if (!field.components || idx >= field.components.length) return;
                                            // Update this component's value
                                            const newComponents = [...field.components];
                                            newComponents[idx] = { ...comp, value: newVal };
                                            // Reconstruct full value
                                            const newValue = newComponents.map(c => {
                                                if (c.subComponents && c.subComponents.length > 0) {
                                                    return c.subComponents.map(s => s.value).join('&');
                                                }
                                                return c.value;
                                            }).join('^');
                                            onChange(newValue);
                                        },
                                        `${field.position}-${comp.position}`,
                                        definition?.components?.[comp.position.toString()]
                                    )}
                                    {comp.subComponents && comp.subComponents.length > 0 && (
                                        <div className="flex gap-1 ml-2 border-l pl-1 border-border mt-1">
                                            {comp.subComponents.map((sub, subIdx) => (
                                                renderInput(
                                                    `${field.position}.${comp.position}.${sub.position}`,
                                                    sub.value,
                                                    effectiveIsEditable,
                                                    (newSubVal) => {
                                                        // Bounds check before accessing arrays
                                                        if (!field.components || idx >= field.components.length) return;
                                                        if (!comp.subComponents || subIdx >= comp.subComponents.length) return;
                                                        // Update subcomponent
                                                        const newSubComponents = [...comp.subComponents];
                                                        newSubComponents[subIdx] = { ...sub, value: newSubVal };

                                                        // Update component
                                                        const newComponents = [...field.components];
                                                        newComponents[idx] = {
                                                            ...comp,
                                                            subComponents: newSubComponents,
                                                            value: newSubComponents.map(s => s.value).join('&')
                                                        };

                                                        // Reconstruct full value
                                                        const newValue = newComponents.map(c => {
                                                            if (c.subComponents && c.subComponents.length > 0) {
                                                                return c.subComponents.map(s => s.value).join('&');
                                                            }
                                                            return c.value;
                                                        }).join('^');
                                                        onChange(newValue);
                                                    },
                                                    `${field.position}-${comp.position}-${sub.position}`
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Simple field without components or repetitions
    return (
        <div className={highlightClass ? `rounded ${highlightClass}` : ''}>
            {renderInput(
                `${field.position}`,
                field.value,
                effectiveIsEditable,
                onChange,
                `${field.position}`,
                definition?.description
            )}
        </div>
    );
};
