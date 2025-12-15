import { SegmentDto, FieldDto } from '@/types';
import {
  SerializationInstance,
  UniqueVariable,
  InstanceOutput,
  createInstanceId,
} from '@/types/serialization';
import { generateHl7Message } from './hl7Generator';

/**
 * Get the next available instance number based on existing instances
 */
export function getNextInstanceNumber(instances: SerializationInstance[]): number {
  const numbers = instances
    .map(inst => {
      const match = inst.name.match(/^Instance (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);

  if (numbers.length === 0) return 1;
  return Math.max(...numbers) + 1;
}

/**
 * Create a new default instance with empty variable values
 * @param uniqueVariables - List of unique variables to initialize
 * @param existingInstances - Existing instances (used to determine next instance number)
 */
export function createDefaultInstance(
  uniqueVariables: UniqueVariable[],
  existingInstances: SerializationInstance[] = []
): SerializationInstance {
  const instanceNumber = getNextInstanceNumber(existingInstances);

  // Initialize variableValues with the original HELPERVARIABLE placeholders
  const variableValues: Record<string, string> = {};
  for (const variable of uniqueVariables) {
    variableValues[variable.variableId] = variable.variableId;
  }

  return {
    id: createInstanceId(),
    name: `Instance ${instanceNumber}`,
    variableValues,
    createdAt: Date.now(),
    isExpanded: true,
  };
}

/**
 * Deep copy an instance with a new ID and name
 * @param instance - Instance to duplicate
 * @param _existingInstances - Reserved for future use (e.g., smart naming based on existing instances)
 * @param newName - Optional custom name for the duplicate
 */
export function duplicateInstance(
  instance: SerializationInstance,
  _existingInstances: SerializationInstance[] = [],
  newName?: string
): SerializationInstance {
  return {
    id: createInstanceId(),
    name: newName || `${instance.name} (copy)`,
    variableValues: { ...instance.variableValues },
    createdAt: Date.now(),
    isExpanded: true,
  };
}

/**
 * Check if an instance has any non-default (modified) variable values
 */
export function instanceHasModifiedValues(
  instance: SerializationInstance,
  uniqueVariables: UniqueVariable[]
): boolean {
  for (const variable of uniqueVariables) {
    const currentValue = instance.variableValues[variable.variableId];
    // If the value differs from the original variable placeholder, it's modified
    if (currentValue && currentValue !== variable.variableId) {
      return true;
    }
  }
  return false;
}

/**
 * Apply variable substitutions to a segment's fields
 */
function substituteVariablesInFields(
  fields: FieldDto[],
  variableValues: Record<string, string>
): FieldDto[] {
  return fields.map(field => {
    let newValue = field.value;

    // Substitute variable placeholders in the value
    if (field.variableId && variableValues[field.variableId] !== undefined) {
      newValue = variableValues[field.variableId];
    }

    // Handle repetitions
    const newRepetitions = field.repetitions?.map(rep => {
      if (rep.variableId && variableValues[rep.variableId] !== undefined) {
        return { ...rep, value: variableValues[rep.variableId] };
      }
      return rep;
    });

    // Components don't have variableId in the current data model
    // Keep them as-is
    const newComponents = field.components;

    return {
      ...field,
      value: newValue,
      repetitions: newRepetitions,
      components: newComponents,
    };
  });
}

/**
 * Compute the output for a single instance
 */
export function computeInstanceOutput(
  instance: SerializationInstance,
  parsedSegments: SegmentDto[]
): InstanceOutput {
  // Deep copy segments and substitute variables
  const substitutedSegments: SegmentDto[] = parsedSegments.map(segment => ({
    ...segment,
    fields: substituteVariablesInFields(segment.fields, instance.variableValues),
  }));

  // Generate the HL7 message
  const serializedHl7 = generateHl7Message(substitutedSegments);

  // Check for unfilled variables (still contain HELPERVARIABLE)
  const hasUnfilledVariables = serializedHl7.includes('HELPERVARIABLE');

  return {
    instanceId: instance.id,
    segments: substitutedSegments,
    serializedHl7,
    hasUnfilledVariables,
  };
}

/**
 * Extract unique variables with metadata from parsed segments
 */
export function extractUniqueVariablesWithMetadata(segments: SegmentDto[]): UniqueVariable[] {
  const variableMap = new Map<string, UniqueVariable>();

  const processField = (field: FieldDto, segmentName: string) => {
    if (field.variableId) {
      const existing = variableMap.get(field.variableId);
      const fieldPosition = `${segmentName}-${field.position}`;

      if (existing) {
        existing.occurrenceCount++;
        if (!existing.fieldPositions.includes(fieldPosition)) {
          existing.fieldPositions.push(fieldPosition);
        }
      } else {
        variableMap.set(field.variableId, {
          variableId: field.variableId,
          groupId: field.variableGroupId,
          occurrenceCount: 1,
          fieldPositions: [fieldPosition],
        });
      }
    }

    // Process repetitions
    field.repetitions?.forEach(rep => {
      if (rep.variableId) {
        const existing = variableMap.get(rep.variableId);
        const fieldPosition = `${segmentName}-${field.position}`;

        if (existing) {
          existing.occurrenceCount++;
          if (!existing.fieldPositions.includes(fieldPosition)) {
            existing.fieldPositions.push(fieldPosition);
          }
        } else {
          variableMap.set(rep.variableId, {
            variableId: rep.variableId,
            groupId: rep.variableGroupId,
            occurrenceCount: 1,
            fieldPositions: [fieldPosition],
          });
        }
      }
    });

    // Note: Components don't have variableId in the current data model
    // Variables are only tracked at field and repetition level
  };

  for (const segment of segments) {
    for (const field of segment.fields) {
      processField(field, segment.name);
    }
  }

  // Sort by groupId (numbered variables first, then undefined)
  return Array.from(variableMap.values()).sort((a, b) => {
    if (a.groupId === undefined && b.groupId === undefined) return 0;
    if (a.groupId === undefined) return 1;
    if (b.groupId === undefined) return -1;
    return a.groupId - b.groupId;
  });
}

/**
 * Format all outputs for "Copy All" - raw HL7 with blank line separators
 * NO comments (HL7 doesn't support them)
 */
export function formatAllOutputsForCopy(outputs: InstanceOutput[]): string {
  return outputs
    .map(output => output.serializedHl7)
    .join('\n\n');
}
