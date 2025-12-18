import adtA01 from '../data/hl7-definitions/adt-a01.json';
import oruR01 from '../data/hl7-definitions/oru-r01.json';
import ormO01 from '../data/hl7-definitions/orm-o01.json';
import { Hl7Definition } from '@/types';

const definitions: Record<string, Hl7Definition> = {
  'ADT^A01': adtA01 as unknown as Hl7Definition,
  'ORU^R01': oruR01 as unknown as Hl7Definition,
  'ORM^O01': ormO01 as unknown as Hl7Definition,
};

export const loadDefinition = (messageType: string): Hl7Definition | null => {
  // messageType might be "ADT^A01" or just "ADT" depending on how we parse it.
  // The keys in our map are full "ADT^A01".
  return definitions[messageType] || null;
};

export const getSegmentDefinition = (definition: Hl7Definition | null, segmentName: string) => {
  if (!definition || !definition.segments) return null;
  return definition.segments[segmentName] || null;
};

/**
 * Get the field name/description from HL7 definition for a given segment and field position.
 * @param definition - The HL7 definition object
 * @param segmentName - Segment name (e.g., "PID", "PV1")
 * @param fieldPosition - Field position number (1-based)
 * @returns Field description or null if not found
 */
export const getFieldName = (
  definition: Hl7Definition | null,
  segmentName: string,
  fieldPosition: number
): string | null => {
  const segmentDef = getSegmentDefinition(definition, segmentName);
  if (!segmentDef || !segmentDef.fields) return null;

  const fieldDef = segmentDef.fields[String(fieldPosition)];
  return fieldDef?.description || null;
};

/**
 * Get field name from a field position string like "PID-5" or "PV1-19".
 * Handles the "-" format used in fieldPositions array.
 * @param definition - The HL7 definition object
 * @param fieldPosition - Field position string (e.g., "PID-5", "PV1-19")
 * @returns Field description or the original position if not found
 */
export const getFieldNameFromPosition = (
  definition: Hl7Definition | null,
  fieldPosition: string
): string => {
  const parts = fieldPosition.split('-');
  if (parts.length !== 2) return fieldPosition;

  const segmentName = parts[0];
  const fieldNum = parseInt(parts[1], 10);

  if (isNaN(fieldNum)) return fieldPosition;

  const fieldName = getFieldName(definition, segmentName, fieldNum);
  return fieldName || fieldPosition;
};
