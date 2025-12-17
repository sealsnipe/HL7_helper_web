/**
 * Validation types for HL7 message validation
 */

/**
 * Severity levels for validation errors
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation error/warning
 */
export interface ValidationError {
  /** Severity of the issue */
  severity: ValidationSeverity;
  /** Unique error code (e.g., "MISSING_MSH_9", "INVALID_SEGMENT_ORDER") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Path to the error (e.g., "MSH-9", "PID", segment level) */
  path: string;
  /** Index of the segment with the error (0-based) */
  segmentIndex?: number;
  /** Field position with the error (1-based) */
  fieldPosition?: number;
}

/**
 * Result of validating an HL7 message
 */
export interface ValidationResult {
  /** True if no errors (warnings are OK) */
  isValid: boolean;
  /** List of errors (severity = 'error') */
  errors: ValidationError[];
  /** List of warnings (severity = 'warning') */
  warnings: ValidationError[];
  /** List of info messages (severity = 'info') */
  info: ValidationError[];
}

/**
 * Creates an empty validation result
 */
export function createEmptyValidationResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };
}
