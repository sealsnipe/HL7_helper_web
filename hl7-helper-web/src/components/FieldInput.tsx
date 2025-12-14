
import React from 'react';
import { FieldDto, FieldDefinition } from '@/types';

interface Props {
    field: FieldDto;
    definition: FieldDefinition | null;
    onChange: (value: string) => void;
}

export const FieldInput: React.FC<Props> = ({ field, definition, onChange }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Helper to render a single input
    const renderInput = (label: string, value: string, isEditable: boolean, onChangeVal: (v: string) => void, key: string, description?: string) => (
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
                className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${isEditable
                    ? 'bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none text-foreground'
                    : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                    }`}
            />
        </div>
    );

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
            <div className="flex flex-col items-start border border-border rounded p-1 bg-muted/30 w-full">
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
                                className="border border-input rounded px-2 py-1 text-sm font-mono bg-muted text-muted-foreground w-full"
                            />
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
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
                                        field.isEditable,
                                        (newVal) => {
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
                                                    field.isEditable,
                                                    (newSubVal) => {
                                                        // Update subcomponent
                                                        const newSubComponents = [...(comp.subComponents || [])];
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

    return renderInput(
        `${field.position}`,
        field.value,
        field.isEditable,
        onChange,
        `${field.position}`,
        definition?.description
    );
};
