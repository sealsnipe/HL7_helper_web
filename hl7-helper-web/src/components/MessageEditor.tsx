import React from 'react';
import { SegmentDto } from '@/types';
import { loadDefinition, getSegmentDefinition } from '@/utils/definitionLoader';
import { SegmentRow } from './SegmentRow';

interface Props {
    segments: SegmentDto[];
    onUpdate: (segments: SegmentDto[]) => void;
    highlightVariable?: boolean;
    // Filter to show only variable-containing fields (for display only, updates use full data)
    filterVariablesOnly?: boolean;
    // Linked variable support
    variableValues?: Map<string, string>;
    onVariableChange?: (variableId: string, value: string) => void;
}

export const MessageEditor: React.FC<Props> = ({
    segments,
    onUpdate,
    highlightVariable = false,
    variableValues,
    onVariableChange
}) => {
    // State to track expanded segments by index
    const [expandedIndices, setExpandedIndices] = React.useState<Set<number>>(new Set());

    // Initialize all expanded when segments change
    React.useEffect(() => {
        setExpandedIndices(new Set(segments.map((_, i) => i)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments.length]); // Only reset if segment count changes (new parse)

    // Determine message type
    const messageType = React.useMemo(() => {
        const msh = segments.find(s => s.name === 'MSH');
        if (!msh) return null;

        const typeField = msh.fields.find(f => f.position === 9);
        if (!typeField) return null;

        // Check components for ADT^A01 format
        if (typeField.components && typeField.components.length >= 2) {
            const type = typeField.components.find(c => c.position === 1)?.value;
            const trigger = typeField.components.find(c => c.position === 2)?.value;
            if (type && trigger) return `${type}^${trigger}`;
        }

        // Fallback to value if no components (unlikely for standard HL7 but possible in simple parsing)
        return typeField.value;
    }, [segments]);

    const definition = React.useMemo(() => {
        return messageType ? loadDefinition(messageType) : null;
    }, [messageType]);

    const toggleSegment = (index: number) => {
        const newSet = new Set(expandedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setExpandedIndices(newSet);
    };

    const expandAll = () => {
        setExpandedIndices(new Set(segments.map((_, i) => i)));
    };

    const collapseAll = () => {
        setExpandedIndices(new Set());
    };

    const handleFieldChange = (segmentIndex: number, fieldIndex: number, value: string) => {
        // Create a deep copy to avoid mutating state directly
        const newSegments = segments.map((seg, sIdx) => {
            if (sIdx !== segmentIndex) return seg;
            return {
                ...seg,
                fields: seg.fields.map((f, fIdx) => {
                    if (fIdx !== fieldIndex) return f;
                    // Clear components and repetitions when value is directly edited to maintain single source of truth
                    return { ...f, value, components: [], repetitions: [] };
                })
            };
        });
        onUpdate(newSegments);
    };

    return (
        <div className="bg-card shadow-lg rounded-lg overflow-hidden border border-border">
            <div className="bg-muted/50 px-6 py-3 border-b border-border flex justify-between items-center">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Message Segments {messageType && <span className="text-primary ml-2">({messageType})</span>}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-muted transition-colors"
                    >
                        Collapse All
                    </button>
                </div>
            </div>
            <div className="divide-y divide-border">
                {segments.map((segment, index) => (
                    <SegmentRow
                        key={segment.id}
                        segment={segment}
                        definition={getSegmentDefinition(definition, segment.name)}
                        isExpanded={expandedIndices.has(index)}
                        onToggle={() => toggleSegment(index)}
                        onFieldChange={(fieldIndex, val) => handleFieldChange(index, fieldIndex, val)}
                        highlightVariable={highlightVariable}
                        variableValues={variableValues}
                        onVariableChange={onVariableChange}
                    />
                ))}
            </div>
        </div>
    );
};
