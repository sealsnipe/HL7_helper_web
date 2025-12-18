import React from 'react';
import { SegmentDto, FieldDto } from '@/types';
import { loadDefinition, getSegmentDefinition } from '@/utils/definitionLoader';
import { SegmentRow } from './SegmentRow';

/** Highlighted field from search */
interface HighlightedField {
  segmentIndex: number;
  fieldPosition: number;
  componentPosition?: number;
}

interface Props {
  segments: SegmentDto[];
  onUpdate: (segments: SegmentDto[]) => void;
  highlightVariable?: boolean;
  // Filter to show only variable-containing fields (for display only, updates use full data)
  filterVariablesOnly?: boolean;
  // Linked variable support
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
  // Search highlighting support
  highlightedField?: HighlightedField | null;
  expandedSegments?: Set<number>;
  onExpandedSegmentsChange?: (expanded: Set<number>) => void;
  // Optional message type override (e.g., "ADT^A01") - used when MSH segment is not available
  // such as in "Variables Only" mode on templates page
  messageType?: string;
}

export const MessageEditor: React.FC<Props> = ({
  segments,
  onUpdate,
  highlightVariable = false,
  variableValues,
  onVariableChange,
  highlightedField,
  expandedSegments: controlledExpanded,
  onExpandedSegmentsChange,
  messageType: messageTypeProp,
}) => {
  // State to track expanded segments by index (internal state if not controlled)
  const [internalExpanded, setInternalExpanded] = React.useState<Set<number>>(new Set());

  // Use controlled or internal expanded state
  const expandedIndices = controlledExpanded ?? internalExpanded;
  const setExpandedIndices = onExpandedSegmentsChange ?? setInternalExpanded;

  // Initialize all expanded when segments change
  React.useEffect(() => {
    if (!controlledExpanded) {
      setInternalExpanded(new Set(segments.map((_, i) => i)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length, controlledExpanded]); // Only reset if segment count changes (new parse)

  // Ensure expanded from parent includes all initially expanded
  React.useEffect(() => {
    if (controlledExpanded && controlledExpanded.size === 0 && segments.length > 0) {
      // If controlled but empty, expand all initially
      onExpandedSegmentsChange?.(new Set(segments.map((_, i) => i)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length]);

  // Determine message type - use prop if provided, otherwise extract from MSH-9
  const messageType = React.useMemo(() => {
    // If messageType prop is provided, use it directly
    // This is important for "Variables Only" mode where MSH segment may be filtered out
    if (messageTypeProp) {
      return messageTypeProp;
    }

    // Fall back to extracting from MSH segment (main editor page behavior)
    const msh = segments.find((s) => s.name === 'MSH');
    if (!msh) return null;

    const typeField = msh.fields.find((f) => f.position === 9);
    if (!typeField) return null;

    // Check components for ADT^A01 format
    if (typeField.components && typeField.components.length >= 2) {
      const type = typeField.components.find((c) => c.position === 1)?.value;
      const trigger = typeField.components.find((c) => c.position === 2)?.value;
      if (type && trigger) return `${type}^${trigger}`;
    }

    // Fallback to value if no components (unlikely for standard HL7 but possible in simple parsing)
    return typeField.value;
  }, [segments, messageTypeProp]);

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

  const handleFieldChange = (
    segmentIndex: number,
    fieldIndex: number,
    value: string,
    updatedField?: FieldDto
  ) => {
    // Create a deep copy to avoid mutating state directly
    const newSegments = segments.map((seg, sIdx) => {
      if (sIdx !== segmentIndex) return seg;
      return {
        ...seg,
        fields: seg.fields.map((f, fIdx) => {
          if (fIdx !== fieldIndex) return f;
          // If updatedField is provided (from component/subcomponent edits),
          // use it to preserve the components structure.
          // Otherwise, clear components when the raw value is directly edited.
          if (updatedField) {
            return updatedField;
          }
          // Clear components and repetitions when value is directly edited to maintain single source of truth
          return { ...f, value, components: [], repetitions: [] };
        }),
      };
    });
    onUpdate(newSegments);
  };

  return (
    <div className="bg-card shadow-lg rounded-lg overflow-hidden border border-border">
      <div className="bg-muted/50 px-6 py-3 border-b border-border flex justify-between items-center">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Message Segments{' '}
          {messageType && <span className="text-primary ml-2">({messageType})</span>}
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
            segmentIndex={index}
            definition={getSegmentDefinition(definition, segment.name)}
            isExpanded={expandedIndices.has(index)}
            onToggle={() => toggleSegment(index)}
            onFieldChange={(fieldIndex, val, updatedField) =>
              handleFieldChange(index, fieldIndex, val, updatedField)
            }
            highlightVariable={highlightVariable}
            variableValues={variableValues}
            onVariableChange={onVariableChange}
            highlightedField={highlightedField}
          />
        ))}
      </div>
    </div>
  );
};
