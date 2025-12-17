/**
 * HL7 Message Validation
 *
 * Provides validation for HL7 messages to detect structural issues
 * and missing required fields.
 */

import { SegmentDto } from '@/types';
import { ValidationResult, ValidationError, createEmptyValidationResult } from '@/types/validation';
import { checkStructuralRules } from './structuralRules';
import { checkRequiredFields } from './requiredFields';

/**
 * Validates an HL7 message and returns a validation result
 *
 * @param segments - Parsed HL7 segments to validate
 * @returns ValidationResult with errors, warnings, and validity status
 *
 * @example
 * ```typescript
 * const segments = parseHl7Message(hl7Text);
 * const result = validateMessage(segments);
 *
 * if (!result.isValid) {
 *   console.log('Errors:', result.errors);
 * }
 * ```
 */
export function validateMessage(segments: SegmentDto[]): ValidationResult {
  const result = createEmptyValidationResult();

  // Collect all validation errors from different rule sets
  const allErrors: ValidationError[] = [];

  // Run structural rules (MSH exists, MSH first, valid segment names)
  allErrors.push(...checkStructuralRules(segments));

  // Run required field rules (MSH-9, MSH-10, MSH-12, PID-3)
  allErrors.push(...checkRequiredFields(segments));

  // Categorize errors by severity
  for (const error of allErrors) {
    switch (error.severity) {
      case 'error':
        result.errors.push(error);
        break;
      case 'warning':
        result.warnings.push(error);
        break;
      case 'info':
        result.info.push(error);
        break;
    }
  }

  // isValid is true only if there are no errors (warnings are OK)
  result.isValid = result.errors.length === 0;

  return result;
}

// Re-export types and utilities
export type { ValidationResult, ValidationError } from '@/types/validation';
export type { ValidationSeverity } from '@/types/validation';
export { createEmptyValidationResult } from '@/types/validation';
