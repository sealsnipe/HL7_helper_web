import React from 'react';
import { SegmentDto, SegmentDefinition } from '@/types';
import { FieldInput } from './FieldInput';

interface Props {
    segment: SegmentDto;
    definition: SegmentDefinition | null;
    isExpanded: boolean;
    onToggle: () => void;
    onFieldChange: (fieldIndex: number, value: string) => void;
}

export const SegmentRow: React.FC<Props> = ({ segment, definition, isExpanded, onToggle, onFieldChange }) => {
    // Filter out trailing empty fields
    const visibleFields = React.useMemo(() => {
        let lastNonEmptyIndex = -1;
        for (let i = segment.fields.length - 1; i >= 0; i--) {
            const field = segment.fields[i];
            const hasValue = field.value || (field.components && field.components.some(c => c.value || (c.subComponents && c.subComponents.some(s => s.value))));
            if (hasValue) {
                lastNonEmptyIndex = i;
                break;
            }
        }
        return segment.fields.slice(0, lastNonEmptyIndex + 1);
    }, [segment.fields]);

    return (
        <div className="border-b border-border py-2 hover:bg-muted/30 transition-colors px-4">
            <div
                className="flex items-center cursor-pointer mb-2 select-none"
                onClick={onToggle}
            >
                <div className="mr-2 text-muted-foreground w-4 flex justify-center">
                    {isExpanded ? '▼' : '▶'}
                </div>
                <div className="font-bold text-primary font-mono text-lg">{segment.name}</div>
                {definition && (
                    <div className="ml-2 text-sm text-muted-foreground font-medium">
                        - {definition.description}
                    </div>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                    ({segment.fields.length} fields)
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-col gap-2 pl-6">
                    {visibleFields.map((field, index) => (
                        <FieldInput
                            key={`${segment.name}-${field.position}-${index}`}
                            field={field}
                            definition={definition?.fields?.[field.position.toString()] || null}
                            onChange={(val) => onFieldChange(index, val)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
