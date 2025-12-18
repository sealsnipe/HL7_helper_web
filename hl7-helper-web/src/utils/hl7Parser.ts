import { SegmentDto, FieldDto, ComponentDto } from '@/types';

/**
 * Unescape HL7 escape sequences in a value
 * \F\ = field separator (default: |)
 * \S\ = ^ (component separator)
 * \R\ = ~ (repetition separator)
 * \E\ = \ (escape character)
 * \T\ = & (subcomponent separator)
 *
 * NOTE: This implementation assumes standard encoding characters (^~\&).
 * Non-standard encoding characters from MSH-2 are not currently supported.
 *
 * Uses single-pass replacement to avoid double-unescaping issues
 * (e.g., \E\\F\ should become \| not be double-processed)
 *
 * @param value - The value to unescape
 * @param fieldSeparator - The field separator character (default: '|')
 */
const unescapeHl7 = (value: string, fieldSeparator: string = '|'): string => {
  return value.replace(/\\([FSRTE])\\/g, (match, char) => {
    switch (char) {
      case 'F':
        return fieldSeparator;
      case 'S':
        return '^';
      case 'R':
        return '~';
      case 'T':
        return '&';
      case 'E':
        return '\\';
      default:
        return match;
    }
  });
};

/**
 * Extract the field separator from the MSH segment.
 * The separator is the 4th character (index 3) of the MSH line, immediately after "MSH".
 * Returns '|' as default if not found or invalid.
 */
const extractFieldSeparator = (lines: string[]): string => {
  const mshLine = lines.find((line) => line.startsWith('MSH'));
  if (mshLine && mshLine.length > 3) {
    const separator = mshLine[3];
    // Validate: must be a single printable character, not alphanumeric (to avoid confusion with segment names)
    if (/^[^\r\n\x00-\x1f]$/.test(separator) && !/^[A-Za-z0-9]$/.test(separator)) {
      return separator;
    }
  }
  return '|'; // Default separator
};

export const parseHl7Message = (message: string): SegmentDto[] => {
  if (!message) return [];

  // HL7 standard uses \r as segment terminator, but we also handle \n and \r\n for flexibility
  // Order matters: \r\n must be checked before \r to avoid splitting on both
  const segments = message.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);

  // Extract the field separator from the MSH segment (use across all segments)
  const fieldSeparator = extractFieldSeparator(segments);

  return segments.map((line, index) => {
    const fields = line.split(fieldSeparator);
    const segmentName = fields[0];

    // Validate segment name (3 uppercase alphanumeric chars, starting with letter)
    if (!/^[A-Z][A-Z0-9]{2}$/.test(segmentName)) {
      console.warn(
        `Invalid HL7 segment name "${segmentName}" on line ${index + 1}. Expected 3 uppercase alphanumeric characters starting with a letter.`
      );
    }

    // Handle MSH special case
    // MSH|^~\&|...
    // fields[0] = MSH
    // fields[1] = ^~\& (Field 2)
    // fields[2] = ... (Field 3)
    // So for MSH, we need to manually construct Field 1 (|) and Field 2 (^~\&)

    const fieldDtos: FieldDto[] = [];

    if (segmentName === 'MSH') {
      // MSH-1: Field Separator (use the actual separator extracted from the message)
      fieldDtos.push({
        position: 1,
        value: fieldSeparator,
        components: [],
        isEditable: false,
      });

      // MSH-2: Encoding Characters
      fieldDtos.push({
        position: 2,
        value: fields[1] || '',
        components: [],
        isEditable: false,
      });

      // Remaining fields starting from MSH-3 (index 2)
      for (let i = 2; i < fields.length; i++) {
        fieldDtos.push(parseField(fields[i], i + 1, fieldSeparator));
      }
    } else {
      // Standard segment
      // fields[0] is name, fields[1] is Field 1
      for (let i = 1; i < fields.length; i++) {
        fieldDtos.push(parseField(fields[i], i, fieldSeparator));
      }
    }

    return {
      id: `seg-${index}`,
      name: segmentName,
      fields: fieldDtos,
    };
  });
};

const parseField = (value: string, position: number, fieldSeparator: string = '|'): FieldDto => {
  // Check for repetitions (~) first
  if (value.includes('~')) {
    const repetitionValues = value.split('~');
    const repetitions = repetitionValues.map((repVal) => {
      // Parse each repetition for components
      if (repVal.includes('^')) {
        const components = repVal
          .split('^')
          .map((compVal, idx) => parseComponent(compVal, idx + 1, fieldSeparator));
        return {
          position,
          value: unescapeHl7(repVal, fieldSeparator),
          components,
          isEditable: false,
        };
      }
      return {
        position,
        value: unescapeHl7(repVal, fieldSeparator),
        components: [],
        isEditable: false,
      };
    });

    return {
      position,
      value: value,
      components: [],
      isEditable: false,
      repetitions,
    };
  }

  // Check for components (^)
  if (value.includes('^')) {
    const components = value
      .split('^')
      .map((compVal, idx) => parseComponent(compVal, idx + 1, fieldSeparator));
    return {
      position,
      // NOTE: field.value remains raw (not unescaped) when components exist,
      // since the generator uses components for serialization, not the parent value.
      value: value,
      components,
      isEditable: false,
    };
  }

  return {
    position,
    value: unescapeHl7(value, fieldSeparator),
    components: [],
    isEditable: false,
  };
};

const parseComponent = (
  value: string,
  position: number,
  fieldSeparator: string = '|'
): ComponentDto => {
  // Check for subcomponents (&)
  if (value.includes('&')) {
    const subComponents = value.split('&').map((subVal, idx) => ({
      position: idx + 1,
      value: unescapeHl7(subVal, fieldSeparator),
      subComponents: [], // SubComponents are ComponentDto[], so they need this property
    }));
    return {
      position,
      value: value,
      subComponents,
    };
  }

  return {
    position,
    value: unescapeHl7(value, fieldSeparator),
    subComponents: [],
  };
};
