import React from 'react';
import { getVariableBadgeColor } from '@/utils/templateHelpers';

interface VariableInputProps {
  variableId: string;
  groupId: number | undefined;
  value: string;
  onChange: (value: string) => void;
  fieldPositions: string[];
  occurrenceCount: number;
  autoFocus?: boolean;
}

/**
 * Single variable input with colored badge
 */
export const VariableInput: React.FC<VariableInputProps> = ({
  variableId,
  groupId,
  value,
  onChange,
  fieldPositions,
  occurrenceCount,
  autoFocus = false,
}) => {
  const colorClass = getVariableBadgeColor(groupId);

  // Create a short label like "V1", "V2", or "V" for unnumbered
  const shortLabel = groupId !== undefined ? `V${groupId}` : 'V';

  // Create tooltip with field positions
  const tooltip = `${variableId}\nUsed in: ${fieldPositions.join(', ')}${occurrenceCount > 1 ? `\n(${occurrenceCount} occurrences - linked)` : ''}`;

  return (
    <div className="flex items-center gap-2" data-testid={`variable-input-${variableId}`}>
      {/* Badge */}
      <span
        className={`${colorClass} px-2 py-0.5 rounded text-xs font-bold shrink-0`}
        title={tooltip}
      >
        {shortLabel}
        {occurrenceCount > 1 && (
          <span className="ml-1 text-[10px] opacity-75">x{occurrenceCount}</span>
        )}
      </span>

      {/* Input */}
      <input
        id={`variable-input-${variableId}`}
        name={variableId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-2 py-1 text-sm border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        placeholder={variableId}
        aria-label={`Value for ${variableId} (appears in ${fieldPositions.join(', ')})`}
        autoFocus={autoFocus}
        data-testid={`variable-input-field-${variableId}`}
      />
    </div>
  );
};
