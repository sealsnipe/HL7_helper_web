import { SegmentDto, FieldDto, ComponentDto } from '@/types';

/**
 * Unescape HL7 escape sequences in a value
 * \F\ = | (field separator)
 * \S\ = ^ (component separator)
 * \R\ = ~ (repetition separator)
 * \E\ = \ (escape character)
 * \T\ = & (subcomponent separator)
 *
 * NOTE: This implementation assumes standard encoding characters (^~\&).
 * Non-standard encoding characters from MSH-2 are not currently supported.
 */
const unescapeHl7 = (value: string): string => {
    return value
        .replace(/\\F\\/g, '|')
        .replace(/\\S\\/g, '^')
        .replace(/\\R\\/g, '~')
        .replace(/\\T\\/g, '&')
        .replace(/\\E\\/g, '\\');
};

export const parseHl7Message = (message: string): SegmentDto[] => {
    if (!message) return [];

    // HL7 standard uses \r as segment terminator, but we also handle \n and \r\n for flexibility
    // Order matters: \r\n must be checked before \r to avoid splitting on both
    const segments = message.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);

    return segments.map((line, index) => {
        const fields = line.split('|');
        const segmentName = fields[0];

        // Validate segment name (3 uppercase alphanumeric chars, starting with letter)
        if (!/^[A-Z][A-Z0-9]{2}$/.test(segmentName)) {
            console.warn(`Invalid HL7 segment name "${segmentName}" on line ${index + 1}. Expected 3 uppercase alphanumeric characters starting with a letter.`);
        }

        // Handle MSH special case
        // MSH|^~\&|...
        // fields[0] = MSH
        // fields[1] = ^~\& (Field 2)
        // fields[2] = ... (Field 3)
        // So for MSH, we need to manually construct Field 1 (|) and Field 2 (^~\&)

        const fieldDtos: FieldDto[] = [];

        if (segmentName === 'MSH') {
            // MSH-1: Field Separator
            fieldDtos.push({
                position: 1,
                value: '|',
                components: [],
                isEditable: false
            });

            // MSH-2: Encoding Characters
            fieldDtos.push({
                position: 2,
                value: fields[1] || '',
                components: [],
                isEditable: false
            });

            // Remaining fields starting from MSH-3 (index 2)
            for (let i = 2; i < fields.length; i++) {
                fieldDtos.push(parseField(fields[i], i + 1));
            }
        } else {
            // Standard segment
            // fields[0] is name, fields[1] is Field 1
            for (let i = 1; i < fields.length; i++) {
                fieldDtos.push(parseField(fields[i], i));
            }
        }

        return {
            id: `seg-${index}`,
            name: segmentName,
            fields: fieldDtos
        };
    });
};

const parseField = (value: string, position: number): FieldDto => {
    // Check for repetitions (~) first
    if (value.includes('~')) {
        const repetitionValues = value.split('~');
        const repetitions = repetitionValues.map((repVal) => {
            // Parse each repetition for components
            if (repVal.includes('^')) {
                const components = repVal.split('^').map((compVal, idx) => parseComponent(compVal, idx + 1));
                return {
                    position,
                    value: unescapeHl7(repVal),
                    components,
                    isEditable: false
                };
            }
            return {
                position,
                value: unescapeHl7(repVal),
                components: [],
                isEditable: false
            };
        });

        return {
            position,
            value: value,
            components: [],
            isEditable: false,
            repetitions
        };
    }

    // Check for components (^)
    if (value.includes('^')) {
        const components = value.split('^').map((compVal, idx) => parseComponent(compVal, idx + 1));
        return {
            position,
            // NOTE: field.value remains raw (not unescaped) when components exist,
            // since the generator uses components for serialization, not the parent value.
            value: value,
            components,
            isEditable: false
        };
    }

    return {
        position,
        value: unescapeHl7(value),
        components: [],
        isEditable: false
    };
};

const parseComponent = (value: string, position: number): ComponentDto => {
    // Check for subcomponents (&)
    if (value.includes('&')) {
        const subComponents = value.split('&').map((subVal, idx) => ({
            position: idx + 1,
            value: unescapeHl7(subVal),
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
        value: unescapeHl7(value),
        subComponents: [],
    };
};
