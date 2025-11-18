import React from 'react';
import { FieldDto } from '@/types';

interface Props {
    field: FieldDto;
    onChange: (value: string) => void;
}

export const FieldInput: React.FC<Props> = ({ field, onChange }) => {
    return (
        <div className="flex flex-col mb-2 min-w-[60px]">
            <label className="text-[10px] text-gray-500 font-mono mb-0.5">
                {field.position}
            </label>
            <input
                type="text"
                value={field.value}
                readOnly={!field.isEditable}
                onChange={(e) => onChange(e.target.value)}
                className={`border rounded px-2 py-1 text-sm font-mono w-full transition-colors ${field.isEditable
                        ? 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none'
                        : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
            />
        </div>
    );
};
