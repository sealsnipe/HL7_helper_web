/**
 * Structural validation rules for HL7 messages
 */

import { SegmentDto } from '@/types';
import { ValidationError } from '@/types/validation';

/**
 * Valid segment name pattern: 3 uppercase alphanumeric, starting with a letter
 */
const VALID_SEGMENT_NAME_PATTERN = /^[A-Z][A-Z0-9]{2}$/;

/**
 * Checks structural rules for HL7 messages:
 * - MSH segment must exist
 * - MSH segment must be first
 * - All segment names must be valid (3 uppercase alphanumeric, starting with letter)
 *
 * @param segments - Parsed HL7 segments
 * @returns Array of validation errors for structural issues
 */
export function checkStructuralRules(segments: SegmentDto[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Rule: Message must not be empty
  if (segments.length === 0) {
    errors.push({
      severity: 'error',
      code: 'EMPTY_MESSAGE',
      message: 'Message is empty. HL7 messages must contain at least an MSH segment.',
      path: '',
    });
    return errors; // No point checking further if empty
  }

  // Rule: MSH segment must exist
  const mshSegment = segments.find((seg) => seg.name === 'MSH');
  if (!mshSegment) {
    errors.push({
      severity: 'error',
      code: 'MISSING_MSH',
      message: 'MSH segment is required. Every HL7 message must start with an MSH segment.',
      path: 'MSH',
    });
  }

  // Rule: MSH segment must be first
  if (segments.length > 0 && segments[0].name !== 'MSH') {
    errors.push({
      severity: 'error',
      code: 'MSH_NOT_FIRST',
      message: `MSH segment must be the first segment. Found "${segments[0].name}" instead.`,
      path: 'MSH',
      segmentIndex: 0,
    });
  }

  // Rule: All segment names must be valid
  segments.forEach((segment, index) => {
    if (!VALID_SEGMENT_NAME_PATTERN.test(segment.name)) {
      errors.push({
        severity: 'error',
        code: 'INVALID_SEGMENT_NAME',
        message: `Invalid segment name "${segment.name}". Segment names must be 3 uppercase alphanumeric characters starting with a letter (e.g., MSH, PID, OBR).`,
        path: segment.name,
        segmentIndex: index,
      });
    }
  });

  return errors;
}
