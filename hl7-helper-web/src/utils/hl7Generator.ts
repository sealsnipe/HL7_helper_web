import { SegmentDto, FieldDto, ComponentDto } from '@/types';

export const generateHl7Message = (segments: SegmentDto[]): string => {
    if (!segments || segments.length === 0) return '';

    return segments.map(segment => {
        // Handle MSH special case
        if (segment.name === 'MSH') {
            // MSH fields:
            // Field 1 is Separator (|) - usually hardcoded or from MSH-1
            // Field 2 is Encoding Chars (^~\&)
            // Field 3+ are standard
            // We want to construct: MSH|^~\&|Field3|Field4...

            // Filter out MSH-1 (separator) as it's implied by the join
            // But we need to ensure we use the correct separator if it's not |
            // For simplicity, we assume | as standard HL7 separator

            // We take fields starting from index 1 (Field 2)
            // Field 2 (Encoding) is the first value after MSH|

            const mshFields = segment.fields.slice(1).map(serializeField);
            return `MSH|${mshFields.join('|')}`;
        }

        // Standard Segment
        const fields = segment.fields.map(serializeField);
        return `${segment.name}|${fields.join('|')}`;
    }).join('\n');
};

const serializeField = (field: FieldDto): string => {
    // If components exist, use them
    if (field.components && field.components.length > 0) {
        return field.components.map(serializeComponent).join('^');
    }
    // Otherwise use value
    return field.value || '';
};

const serializeComponent = (component: ComponentDto): string => {
    // If subcomponents exist, use them
    if (component.subComponents && component.subComponents.length > 0) {
        return component.subComponents.map(s => s.value || '').join('&');
    }
    return component.value || '';
};
