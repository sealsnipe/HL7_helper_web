import { SegmentDto, FieldDto, ComponentDto } from '@/types';

export const parseHl7Message = (message: string): SegmentDto[] => {
    if (!message) return [];

    const segments = message.split(/\r?\n/).filter(line => line.trim().length > 0);

    return segments.map((line, index) => {
        const fields = line.split('|');
        const segmentName = fields[0];

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
    // Check for components (^)
    if (value.includes('^')) {
        const components = value.split('^').map((compVal, idx) => parseComponent(compVal, idx + 1));
        return {
            position,
            value: value,
            components,
            isEditable: false
        };
    }

    return {
        position,
        value: value,
        components: [],
        isEditable: false
    };
};

const parseComponent = (value: string, position: number): ComponentDto => {
    // Check for subcomponents (&)
    if (value.includes('&')) {
        const subComponents = value.split('&').map((subVal, idx) => ({
            position: idx + 1,
            value: subVal,
        }));
        return {
            position,
            value: value,
            subComponents,
        };
    }

    return {
        position,
        value: value,
        subComponents: [],
    };
};
