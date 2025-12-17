import React, { useRef, useEffect } from 'react';
import { SegmentDto, SegmentDefinition, FieldDto } from '@/types';
import { FieldInput } from './FieldInput';

/** Highlighted field from search */
interface HighlightedField {
  segmentIndex: number;
  fieldPosition: number;
  componentPosition?: number;
}

interface Props {
  segment: SegmentDto;
  segmentIndex: number;
  definition: SegmentDefinition | null;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldChange: (fieldIndex: number, value: string, updatedField?: FieldDto) => void;
  highlightVariable?: boolean;
  // Linked variable support
  variableValues?: Map<string, string>;
  onVariableChange?: (variableId: string, value: string) => void;
  // Search highlighting support
  highlightedField?: HighlightedField | null;
}

export const SegmentRow: React.FC<Props> = ({
  segment,
  segmentIndex,
  definition,
  isExpanded,
  onToggle,
  onFieldChange,
  highlightVariable = false,
  variableValues,
  onVariableChange,
  highlightedField,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out trailing empty fields
  const visibleFields = React.useMemo(() => {
    let lastNonEmptyIndex = -1;
    for (let i = segment.fields.length - 1; i >= 0; i--) {
      const field = segment.fields[i];
      const hasValue =
        field.value ||
        (field.components &&
          field.components.some(
            (c) => c.value || (c.subComponents && c.subComponents.some((s) => s.value))
          ));
      if (hasValue) {
        lastNonEmptyIndex = i;
        break;
      }
    }
    return segment.fields.slice(0, lastNonEmptyIndex + 1);
  }, [segment.fields]);

  // Scroll into view when this segment contains the highlighted field
  useEffect(() => {
    if (
      highlightedField &&
      highlightedField.segmentIndex === segmentIndex &&
      containerRef.current
    ) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedField, segmentIndex]);

  // Check if a field should be highlighted
  const isFieldHighlighted = (field: FieldDto): boolean => {
    if (!highlightedField) return false;
    return (
      highlightedField.segmentIndex === segmentIndex &&
      highlightedField.fieldPosition === field.position
    );
  };

  return (
    <div
      ref={containerRef}
      className="border-b border-border py-2 hover:bg-muted/30 transition-colors px-4"
    >
      <div
        className="flex items-center cursor-pointer mb-2 select-none"
        onClick={onToggle}
        data-testid={`segment-row-${segment.name}`}
      >
        <div className="mr-2 text-muted-foreground w-4 flex justify-center">
          {isExpanded ? '\u25BC' : '\u25B6'}
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
              onChange={(val, updatedField) => onFieldChange(index, val, updatedField)}
              highlightVariable={highlightVariable}
              variableValues={variableValues}
              onVariableChange={onVariableChange}
              isSearchHighlighted={isFieldHighlighted(field)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
