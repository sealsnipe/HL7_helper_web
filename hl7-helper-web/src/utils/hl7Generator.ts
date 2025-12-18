import { SegmentDto, FieldDto, ComponentDto } from '@/types';

/**
 * Escape a character for use in a regex pattern
 * @param char - The character to escape
 */
const escapeRegexChar = (char: string): string => {
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Escape special HL7 characters in a value
 * fieldSeparator = \F\ (field separator, default: |)
 * ^ = \S\ (component separator)
 * ~ = \R\ (repetition separator)
 * \ = \E\ (escape character)
 * & = \T\ (subcomponent separator)
 *
 * @param value - The value to escape
 * @param fieldSeparator - The field separator character (default: '|')
 */
const escapeHl7 = (value: string, fieldSeparator: string = '|'): string => {
  const sepRegex = new RegExp(escapeRegexChar(fieldSeparator), 'g');
  return value
    .replace(/\\/g, '\\E\\') // Must escape \ first to avoid double-escaping
    .replace(sepRegex, '\\F\\')
    .replace(/\^/g, '\\S\\')
    .replace(/~/g, '\\R\\')
    .replace(/&/g, '\\T\\');
};

/**
 * Validate that a character is a valid HL7 field separator.
 * Must be exactly one character and not a control character (ASCII 0-31) or newline.
 */
const isValidSeparator = (char: string): boolean => {
  return char.length === 1 && /^[^\r\n\x00-\x1f]$/.test(char);
};

export const generateHl7Message = (segments: SegmentDto[]): string => {
  if (!segments || segments.length === 0) return '';

  // Get the field separator from MSH-1, fallback to | if MSH not found or invalid
  const mshSegment = segments.find((s) => s.name === 'MSH');
  const msh1Field = mshSegment?.fields.find((f) => f.position === 1);
  const fieldSeparator =
    msh1Field?.value && isValidSeparator(msh1Field.value) ? msh1Field.value : '|';

  return segments
    .map((segment) => {
      // Handle MSH special case
      if (segment.name === 'MSH') {
        // MSH fields:
        // Field 1 is Separator - read from MSH-1 field value
        // Field 2 is Encoding Chars (^~\&) - must NOT be escaped
        // Field 3+ are standard
        // We want to construct: MSH|^~\&|Field3|Field4...

        // We take fields starting from index 1 (Field 2)
        // Field 2 (Encoding) is the first value after MSH|
        // IMPORTANT: MSH-2 (encoding characters) must not be escaped
        const mshFields = segment.fields.slice(1).map(
          (field, idx) => serializeField(field, idx === 0, fieldSeparator) // idx 0 in sliced array = MSH-2
        );
        return `MSH${fieldSeparator}${mshFields.join(fieldSeparator)}`;
      }

      // Standard Segment
      const fields = segment.fields.map((field) => serializeField(field, false, fieldSeparator));
      return `${segment.name}${fieldSeparator}${fields.join(fieldSeparator)}`;
    })
    .join('\r');
};

/**
 * Serialize a field to HL7 format
 * @param field - The field to serialize
 * @param skipEscape - If true, skip escaping (used for MSH-2 encoding characters)
 * @param fieldSeparator - The field separator character (default: '|')
 */
const serializeField = (
  field: FieldDto,
  skipEscape: boolean = false,
  fieldSeparator: string = '|'
): string => {
  // If skipEscape is true (MSH-2), return the raw value without any escaping
  // MSH-2 contains encoding characters (^~\&) that must be preserved exactly
  if (skipEscape) {
    return field.value || '';
  }

  // If repetitions exist, join them with ~
  if (field.repetitions && field.repetitions.length > 0) {
    return field.repetitions
      .map((rep) => {
        if (rep.components && rep.components.length > 0) {
          return rep.components.map((comp) => serializeComponent(comp, fieldSeparator)).join('^');
        }
        return escapeHl7(rep.value || '', fieldSeparator);
      })
      .join('~');
  }

  // If components exist, use them (components take precedence as source of truth)
  // Note: When field.value is edited, components should be cleared to maintain sync
  if (field.components && field.components.length > 0) {
    return field.components.map((comp) => serializeComponent(comp, fieldSeparator)).join('^');
  }
  // Otherwise use value
  return escapeHl7(field.value || '', fieldSeparator);
};

/**
 * Serialize a component to HL7 format
 * @param component - The component to serialize
 * @param fieldSeparator - The field separator character (default: '|')
 */
const serializeComponent = (component: ComponentDto, fieldSeparator: string = '|'): string => {
  // If subcomponents exist, use them
  if (component.subComponents && component.subComponents.length > 0) {
    return component.subComponents.map((s) => escapeHl7(s.value || '', fieldSeparator)).join('&');
  }
  return escapeHl7(component.value || '', fieldSeparator);
};
