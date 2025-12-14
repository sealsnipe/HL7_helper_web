import { SegmentDto, FieldDto, ComponentDto } from '@/types';

/**
 * Escape special HL7 characters in a value
 * | = \F\ (field separator)
 * ^ = \S\ (component separator)
 * ~ = \R\ (repetition separator)
 * \ = \E\ (escape character)
 * & = \T\ (subcomponent separator)
 */
const escapeHl7 = (value: string): string => {
    return value
        .replace(/\\/g, '\\E\\')  // Must escape \ first to avoid double-escaping
        .replace(/\|/g, '\\F\\')
        .replace(/\^/g, '\\S\\')
        .replace(/~/g, '\\R\\')
        .replace(/&/g, '\\T\\');
};

export const generateHl7Message = (segments: SegmentDto[]): string => {
    if (!segments || segments.length === 0) return '';

    return segments.map(segment => {
        // Handle MSH special case
        if (segment.name === 'MSH') {
            // MSH fields:
            // Field 1 is Separator (|) - usually hardcoded or from MSH-1
            // Field 2 is Encoding Chars (^~\&) - must NOT be escaped
            // Field 3+ are standard
            // We want to construct: MSH|^~\&|Field3|Field4...

            // Filter out MSH-1 (separator) as it's implied by the join
            // But we need to ensure we use the correct separator if it's not |
            // For simplicity, we assume | as standard HL7 separator

            // We take fields starting from index 1 (Field 2)
            // Field 2 (Encoding) is the first value after MSH|
            // IMPORTANT: MSH-2 (encoding characters) must not be escaped
            const mshFields = segment.fields.slice(1).map((field, idx) =>
                serializeField(field, idx === 0) // idx 0 in sliced array = MSH-2
            );
            return `MSH|${mshFields.join('|')}`;
        }

        // Standard Segment
        const fields = segment.fields.map(field => serializeField(field, false));
        return `${segment.name}|${fields.join('|')}`;
    }).join('\r');
};

/**
 * Serialize a field to HL7 format
 * @param field - The field to serialize
 * @param skipEscape - If true, skip escaping (used for MSH-2 encoding characters)
 */
const serializeField = (field: FieldDto, skipEscape: boolean = false): string => {
    // If skipEscape is true (MSH-2), return the raw value without any escaping
    // MSH-2 contains encoding characters (^~\&) that must be preserved exactly
    if (skipEscape) {
        return field.value || '';
    }

    // If repetitions exist, join them with ~
    if (field.repetitions && field.repetitions.length > 0) {
        return field.repetitions.map(rep => {
            if (rep.components && rep.components.length > 0) {
                return rep.components.map(serializeComponent).join('^');
            }
            return escapeHl7(rep.value || '');
        }).join('~');
    }

    // If components exist, use them (components take precedence as source of truth)
    // Note: When field.value is edited, components should be cleared to maintain sync
    if (field.components && field.components.length > 0) {
        return field.components.map(serializeComponent).join('^');
    }
    // Otherwise use value
    return escapeHl7(field.value || '');
};

const serializeComponent = (component: ComponentDto): string => {
    // If subcomponents exist, use them
    if (component.subComponents && component.subComponents.length > 0) {
        return component.subComponents.map(s => escapeHl7(s.value || '')).join('&');
    }
    return escapeHl7(component.value || '');
};
