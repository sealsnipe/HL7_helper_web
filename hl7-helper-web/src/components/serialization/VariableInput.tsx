import React from 'react';
import { getVariableBadgeColor } from '@/utils/templateHelpers';

interface VariableInputProps {
  variableId: string;
  groupId: number | undefined;
  value: string;
  onChange: (value: string) => void;
  fieldPositions: string[];
  fieldNames: string[];
  occurrenceCount: number;
  autoFocus?: boolean;
}

/**
 * Format field position for display (e.g., "PID-5" -> "PID.5")
 */
function formatFieldPosition(position: string): string {
  return position.replace('-', '.');
}

/**
 * Single variable input with colored badge and field context
 */
export const VariableInput: React.FC<VariableInputProps> = ({
  variableId,
  groupId,
  value,
  onChange,
  fieldPositions,
  fieldNames,
  occurrenceCount,
  autoFocus = false,
}) => {
  const colorClass = getVariableBadgeColor(groupId);

  // Create a short label like "V1", "V2", or "V" for unnumbered
  const shortLabel = groupId !== undefined ? `V${groupId}` : 'V';

  // Create tooltip with full variable ID and all positions
  const tooltip = `${variableId}
Used in: ${fieldPositions.join(', ')}${
    occurrenceCount > 1
      ? `
(${occurrenceCount} occurrences - linked)`
      : ''
  }`;

  // Build display string for field positions and names
  // Format: "PID.5 (Patient Name)" or "PID.5 (Patient Name), PV1.19 (Visit Number)"
  const fieldInfoParts = fieldPositions.map((pos, idx) => {
    const formattedPos = formatFieldPosition(pos);
    const name = fieldNames[idx];
    // If name equals position (fallback case), just show position
    if (name === pos || !name) {
      return formattedPos;
    }
    return `${formattedPos} (${name})`;
  });

  return (
    <div className="flex flex-col gap-1" data-testid={`variable-input-${variableId}`}>
      {/* Field position and name - visible above the input */}
      <div
        className="text-xs text-muted-foreground font-medium truncate"
        title={fieldInfoParts.join(', ')}
      >
        {fieldInfoParts.join(', ')}
      </div>

      {/* Badge and Input row */}
      <div className="flex items-center gap-2">
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
          aria-label={`Value for ${fieldInfoParts.join(', ')}`}
          autoFocus={autoFocus}
          data-testid={`variable-input-field-${variableId}`}
        />
      </div>
    </div>
  );
};
