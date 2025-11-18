import React from 'react';
import { SegmentDto } from '@/types';
import { FieldInput } from './FieldInput';

interface Props {
    segment: SegmentDto;
    onFieldChange: (fieldIndex: number, value: string) => void;
}

export const SegmentRow: React.FC<Props> = ({ segment, onFieldChange }) => {
    return (
        <div className="border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors px-4">
            <div className="font-bold text-blue-600 mb-2 font-mono text-lg">{segment.name}</div>
            <div className="flex flex-wrap gap-3">
                {segment.fields.map((field, index) => (
                    <FieldInput
                        key={`${segment.name}-${field.position}-${index}`}
                        field={field}
                        onChange={(val) => onFieldChange(index, val)}
                    />
                ))}
            </div>
        </div>
    );
};
