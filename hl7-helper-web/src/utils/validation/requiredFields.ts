/**
 * Required field validation rules for HL7 messages
 */

import { SegmentDto } from '@/types';
import { ValidationError } from '@/types/validation';

/**
 * Gets a field value from a segment by position
 * @param segment - The segment to search
 * @param position - The 1-based field position
 * @returns The field value or undefined if not found
 */
function getFieldValue(segment: SegmentDto, position: number): string | undefined {
  const field = segment.fields.find((f) => f.position === position);
  return field?.value;
}

/**
 * Checks if a field value is empty (undefined, null, or empty string)
 */
function isFieldEmpty(value: string | undefined): boolean {
  return value === undefined || value === null || value.trim() === '';
}

/**
 * Required field configuration
 */
interface RequiredFieldConfig {
  segmentName: string;
  fieldPosition: number;
  fieldName: string;
  code: string;
  message: string;
  /** If true, only check if the segment exists */
  conditionalOnSegment?: boolean;
}

/**
 * Required fields configuration for HL7 messages
 */
const REQUIRED_FIELDS: RequiredFieldConfig[] = [
  {
    segmentName: 'MSH',
    fieldPosition: 9,
    fieldName: 'Message Type',
    code: 'MISSING_MSH_9',
    message:
      'MSH-9 (Message Type) is required. This field identifies the message type (e.g., ADT^A01).',
  },
  {
    segmentName: 'MSH',
    fieldPosition: 10,
    fieldName: 'Message Control ID',
    code: 'MISSING_MSH_10',
    message: 'MSH-10 (Message Control ID) is required. This field uniquely identifies the message.',
  },
  {
    segmentName: 'MSH',
    fieldPosition: 12,
    fieldName: 'Version ID',
    code: 'MISSING_MSH_12',
    message:
      'MSH-12 (Version ID) is required. This field identifies the HL7 version (e.g., 2.5.1).',
  },
  {
    segmentName: 'PID',
    fieldPosition: 3,
    fieldName: 'Patient ID',
    code: 'MISSING_PID_3',
    message:
      'PID-3 (Patient ID) is required when PID segment exists. This field identifies the patient.',
    conditionalOnSegment: true,
  },
];

/**
 * Checks required field rules for HL7 messages:
 * - MSH-9 (Message Type) is required
 * - MSH-10 (Message Control ID) is required
 * - MSH-12 (Version ID) is required
 * - PID-3 (Patient ID) is required when PID exists
 *
 * @param segments - Parsed HL7 segments
 * @returns Array of validation errors for missing required fields
 */
export function checkRequiredFields(segments: SegmentDto[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Build a map of segment names to segments for quick lookup
  const segmentMap = new Map<string, SegmentDto[]>();
  segments.forEach((seg) => {
    const existing = segmentMap.get(seg.name) || [];
    existing.push(seg);
    segmentMap.set(seg.name, existing);
  });

  for (const config of REQUIRED_FIELDS) {
    const segmentInstances = segmentMap.get(config.segmentName);

    // If segment doesn't exist
    if (!segmentInstances || segmentInstances.length === 0) {
      // If conditionalOnSegment is true, skip this check (segment doesn't exist, so field not required)
      if (config.conditionalOnSegment) {
        continue;
      }
      // Otherwise, this is an error (MSH fields are always required)
      // But we don't report missing MSH here - that's handled by structural rules
      continue;
    }

    // Check each instance of the segment (usually just one, but could be multiple)
    segmentInstances.forEach((segment) => {
      const fieldValue = getFieldValue(segment, config.fieldPosition);
      const segmentIndex = segments.indexOf(segment);

      if (isFieldEmpty(fieldValue)) {
        errors.push({
          severity: 'error',
          code: config.code,
          message: config.message,
          path: `${config.segmentName}-${config.fieldPosition}`,
          segmentIndex,
          fieldPosition: config.fieldPosition,
        });
      }
    });
  }

  return errors;
}
