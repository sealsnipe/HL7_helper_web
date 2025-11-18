import React from 'react';
import { SegmentDto } from '@/types';
import { SegmentRow } from './SegmentRow';

interface Props {
    segments: SegmentDto[];
    onUpdate: (segments: SegmentDto[]) => void;
}

export const MessageEditor: React.FC<Props> = ({ segments, onUpdate }) => {
    const handleFieldChange = (segmentIndex: number, fieldIndex: number, value: string) => {
        // Create a deep copy to avoid mutating state directly
        const newSegments = segments.map((seg, sIdx) => {
            if (sIdx !== segmentIndex) return seg;
            return {
                ...seg,
                fields: seg.fields.map((f, fIdx) => {
                    if (fIdx !== fieldIndex) return f;
                    return { ...f, value };
                })
            };
        });
        onUpdate(newSegments);
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Message Segments</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {segments.map((segment, index) => (
                    <SegmentRow
                        key={index}
                        segment={segment}
                        onFieldChange={(fieldIndex, val) => handleFieldChange(index, fieldIndex, val)}
                    />
                ))}
            </div>
        </div>
    );
};
