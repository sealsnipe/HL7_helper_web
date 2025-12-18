'use client';

import React from 'react';
import { SegmentDto, Hl7Definition } from '@/types';
import { loadDefinition, getSegmentDefinition } from '@/utils/definitionLoader';
import {
  fieldContainsVariable,
  getVariableBadgeColor,
  getVariableGroupColor,
} from '@/utils/templateHelpers';

/**
 * Represents a flattened variable field for display
 */
interface VariableFieldItem {
  /** Unique key for React */
  key: string;
  /** Position string (e.g., "PV1.19", "PID.3.1") */
  position: string;
  /** Field name from HL7 definition */
  fieldName: string;
  /** The current value */
  value: string;
  /** Whether the field is editable */
  isEditable: boolean;
  /** Variable group ID for linked variables (1-999) or undefined for standalone */
  variableGroupId?: number;
  /** Reference to update the value */
  segmentId: string;
  fieldPosition: number;
  componentPosition?: number;
  subcomponentPosition?: number;
  /** Index of repetition if this value is inside a repetition (0-based) */
  repetitionIndex?: number;
}

interface Props {
  /** Parsed HL7 segments */
  segments: SegmentDto[];
  /** Callback when a field value changes */
  onUpdate: (segments: SegmentDto[]) => void;
  /** Message type for loading definitions (e.g., "ADT^A01") */
  messageType: string;
  /** Whether fields should be editable */
  isEditable?: boolean;
}

/**
 * Extract variable group ID from a value string
 */
function extractGroupId(value: string): number | undefined {
  const match = value.match(/HELPERVARIABLE(\d{1,3})/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return num >= 1 && num <= 999 ? num : undefined;
  }
  return undefined;
}

/**
 * Check if a string contains a HELPERVARIABLE
 */
function containsVariable(value: string): boolean {
  return /HELPERVARIABLE(\d{1,3})?/.test(value);
}

/**
 * Extracts all variable-containing fields from segments into a flat list
 */
function extractVariableFields(
  segments: SegmentDto[],
  definition: Hl7Definition | null
): VariableFieldItem[] {
  const items: VariableFieldItem[] = [];

  segments.forEach((segment) => {
    const segmentDef = definition ? getSegmentDefinition(definition, segment.name) : null;

    segment.fields.forEach((field) => {
      if (!fieldContainsVariable(field)) return;

      const fieldDef = segmentDef?.fields?.[String(field.position)];
      const fieldDescription = fieldDef?.description || `Field ${field.position}`;

      // Check if variable is at field level
      if (containsVariable(field.value)) {
        items.push({
          key: `${segment.id}-${field.position}`,
          position: `${segment.name}.${field.position}`,
          fieldName: fieldDescription,
          value: field.value,
          isEditable: field.isEditable,
          variableGroupId: extractGroupId(field.value),
          segmentId: segment.id,
          fieldPosition: field.position,
        });
      }

      // Check components for variables
      field.components?.forEach((comp) => {
        if (containsVariable(comp.value)) {
          const compDescription =
            fieldDef?.components?.[String(comp.position)] || `Component ${comp.position}`;
          items.push({
            key: `${segment.id}-${field.position}-${comp.position}`,
            position: `${segment.name}.${field.position}.${comp.position}`,
            fieldName: `${fieldDescription} > ${compDescription}`,
            value: comp.value,
            isEditable: field.isEditable,
            variableGroupId: extractGroupId(comp.value),
            segmentId: segment.id,
            fieldPosition: field.position,
            componentPosition: comp.position,
          });
        }

        // Check subcomponents for variables
        comp.subComponents?.forEach((sub) => {
          if (containsVariable(sub.value)) {
            const compDescription =
              fieldDef?.components?.[String(comp.position)] || `Component ${comp.position}`;
            items.push({
              key: `${segment.id}-${field.position}-${comp.position}-${sub.position}`,
              position: `${segment.name}.${field.position}.${comp.position}.${sub.position}`,
              fieldName: `${fieldDescription} > ${compDescription} > Sub ${sub.position}`,
              value: sub.value,
              isEditable: field.isEditable,
              variableGroupId: extractGroupId(sub.value),
              segmentId: segment.id,
              fieldPosition: field.position,
              componentPosition: comp.position,
              subcomponentPosition: sub.position,
            });
          }
        });
      });

      // Check repetitions for variables
      field.repetitions?.forEach((rep, repIndex) => {
        if (containsVariable(rep.value)) {
          items.push({
            key: `${segment.id}-${field.position}-rep${repIndex}`,
            position: `${segment.name}.${field.position}[${repIndex + 1}]`,
            fieldName: `${fieldDescription} (Repetition ${repIndex + 1})`,
            value: rep.value,
            isEditable: field.isEditable,
            variableGroupId: extractGroupId(rep.value),
            segmentId: segment.id,
            fieldPosition: field.position,
            repetitionIndex: repIndex,
          });
        }

        // Check repetition components
        rep.components?.forEach((comp) => {
          if (containsVariable(comp.value)) {
            const compDescription =
              fieldDef?.components?.[String(comp.position)] || `Component ${comp.position}`;
            items.push({
              key: `${segment.id}-${field.position}-rep${repIndex}-${comp.position}`,
              position: `${segment.name}.${field.position}[${repIndex + 1}].${comp.position}`,
              fieldName: `${fieldDescription} (Rep ${repIndex + 1}) > ${compDescription}`,
              value: comp.value,
              isEditable: field.isEditable,
              variableGroupId: extractGroupId(comp.value),
              segmentId: segment.id,
              fieldPosition: field.position,
              componentPosition: comp.position,
              repetitionIndex: repIndex,
            });
          }
        });
      });
    });
  });

  return items;
}

/**
 * Highlight HELPERVARIABLE in text with colored badge
 */
function highlightVariable(text: string): React.ReactNode {
  if (!text) return null;

  const parts = text.split(/(HELPERVARIABLE[1-9]\d{0,2}|HELPERVARIABLE(?!\d))/g);
  return parts.map((part, index) => {
    const match = part.match(/^HELPERVARIABLE([1-9]\d{0,2})?$/);
    if (match) {
      const partGroupId = match[1] ? parseInt(match[1], 10) : undefined;
      const colorClass = getVariableBadgeColor(partGroupId);
      return (
        <span key={index} className={`${colorClass} px-1 rounded font-bold`}>
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * VariableFieldList displays a flat, serialized list of all fields containing HELPERVARIABLE.
 * Used in "Variables Only" mode on the templates page for a simpler editing experience.
 */
export const VariableFieldList: React.FC<Props> = ({
  segments,
  onUpdate,
  messageType,
  isEditable = false,
}) => {
  // Load HL7 definition for field names
  const definition = React.useMemo(() => {
    return loadDefinition(messageType);
  }, [messageType]);

  // Extract variable fields
  const variableFields = React.useMemo(() => {
    return extractVariableFields(segments, definition);
  }, [segments, definition]);

  // Handle value change for a specific field
  const handleValueChange = (item: VariableFieldItem, newValue: string) => {
    const newSegments = segments.map((segment) => {
      if (segment.id !== item.segmentId) return segment;

      return {
        ...segment,
        fields: segment.fields.map((field) => {
          if (field.position !== item.fieldPosition) return field;

          // Handle repetition updates
          if (item.repetitionIndex !== undefined) {
            return {
              ...field,
              repetitions: field.repetitions?.map((rep, repIdx) => {
                if (repIdx !== item.repetitionIndex) return rep;

                // Update component within repetition
                if (item.componentPosition) {
                  return {
                    ...rep,
                    components: rep.components?.map((comp) => {
                      if (comp.position !== item.componentPosition) return comp;
                      return { ...comp, value: newValue };
                    }),
                  };
                }

                // Update repetition value directly
                return { ...rep, value: newValue };
              }),
            };
          }

          // Update at field level (no repetition, no component)
          if (!item.componentPosition) {
            return { ...field, value: newValue };
          }

          // Update at component level (no repetition)
          return {
            ...field,
            components: field.components?.map((comp) => {
              if (comp.position !== item.componentPosition) return comp;

              // Update at subcomponent level
              if (item.subcomponentPosition) {
                return {
                  ...comp,
                  subComponents: comp.subComponents?.map((sub) => {
                    if (sub.position !== item.subcomponentPosition) return sub;
                    return { ...sub, value: newValue };
                  }),
                };
              }

              return { ...comp, value: newValue };
            }),
          };
        }),
      };
    });

    onUpdate(newSegments);
  };

  if (variableFields.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No HELPERVARIABLE fields found in this template.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden"
      data-testid="variable-field-list"
    >
      {/* Header */}
      <div className="grid grid-cols-[180px_1fr_1fr] gap-4 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
        <div>Field Position</div>
        <div>Field Name</div>
        <div>Value</div>
      </div>

      {/* Field rows */}
      <div className="divide-y divide-border">
        {variableFields.map((item) => {
          const groupColorClass =
            item.variableGroupId !== undefined
              ? getVariableGroupColor(item.variableGroupId)
              : 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20';

          return (
            <div
              key={item.key}
              className="grid grid-cols-[180px_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
              data-testid={`variable-row-${item.position}`}
            >
              {/* Position */}
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-primary font-semibold">
                  {item.position}
                </code>
                {item.variableGroupId !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getVariableBadgeColor(item.variableGroupId)}`}
                  >
                    V{item.variableGroupId}
                  </span>
                )}
              </div>

              {/* Field Name */}
              <div className="text-sm text-foreground truncate" title={item.fieldName}>
                {item.fieldName}
              </div>

              {/* Value */}
              <div>
                {isEditable && item.isEditable ? (
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleValueChange(item, e.target.value)}
                    className={`w-full px-2 py-1 text-sm font-mono rounded border transition-colors
                      bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none
                      ${groupColorClass}`}
                    data-testid={`variable-input-${item.position}`}
                  />
                ) : (
                  <div className={`px-2 py-1 text-sm font-mono rounded ${groupColorClass}`}>
                    {highlightVariable(item.value)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {variableFields.length} variable field{variableFields.length !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
};
