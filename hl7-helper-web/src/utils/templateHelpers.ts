import React from 'react';
import { FieldDto, SegmentDto } from '@/types';

// Regex pattern to match HELPERVARIABLE with optional number (1-999)
// Word boundaries (\b) ensure we don't match partial strings like XHELPERVARIABLE or HELPERVARIABLEEXTRA
// Note: Uses [1-9]\d{0,2} to match 1-999 (no leading zeros) or no digits for standalone
const VARIABLE_REGEX = /\bHELPERVARIABLE(?:[1-9]\d{0,2})?\b/;

// Same pattern but with capturing group for split operations (needs global flag)
// When used with split(), captured groups are included in the result array
const VARIABLE_SPLIT_REGEX = /(\bHELPERVARIABLE(?:[1-9]\d{0,2})?\b)/g;

/**
 * Extract variable name from a value (e.g., "HELPERVARIABLE1" or "HELPERVARIABLE")
 * Returns null if no variable found
 */
export function extractVariableName(value: string): string | null {
  if (!value) return null;
  const match = value.match(VARIABLE_REGEX);
  return match ? match[0] : null;
}

/**
 * Extract the group ID from a variable name
 * Returns number (1-999) for linked variables, null for standalone HELPERVARIABLE
 */
export function extractVariableGroupId(variableName: string): number | null {
  if (!variableName) return null;
  // Match HELPERVARIABLE followed by 1-999 (no leading zeros)
  const match = variableName.match(/HELPERVARIABLE([1-9]\d{0,2})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check if a value contains any type of HELPERVARIABLE (standalone or numbered)
 */
export function containsAnyVariable(value: string): boolean {
  if (!value) return false;
  return VARIABLE_REGEX.test(value);
}

/**
 * Check if a field contains a HELPERVARIABLE placeholder (any type)
 */
export function fieldContainsVariable(field: FieldDto): boolean {
  if (containsAnyVariable(field.value)) return true;
  if (
    field.components?.some(
      (c) =>
        containsAnyVariable(c.value) || c.subComponents?.some((s) => containsAnyVariable(s.value))
    )
  )
    return true;
  if (field.repetitions?.some((r) => fieldContainsVariable(r))) return true;
  return false;
}

/**
 * Count the number of HELPERVARIABLE occurrences in content (any type)
 */
export function getVariableCount(content: string): number {
  // Use global version of VARIABLE_REGEX pattern for counting
  return (content.match(/\bHELPERVARIABLE(?:[1-9]\d{0,2})?\b/g) || []).length;
}

/**
 * Apply variable editability and metadata to a single field
 */
function applyVariableToField(field: FieldDto): FieldDto {
  const variableId = extractVariableName(field.value);
  const variableGroupId = variableId ? extractVariableGroupId(variableId) : undefined;

  return {
    ...field,
    isEditable: fieldContainsVariable(field),
    variableId: variableId ?? undefined,
    variableGroupId: variableGroupId ?? undefined,
    components: field.components?.map((c) => ({
      ...c,
      // Components inherit editability from parent field check
    })),
    repetitions: field.repetitions?.map((r) => applyVariableToField(r)),
  };
}

/**
 * Apply variable editability to segments - only fields containing HELPERVARIABLE are editable
 * Also adds variableId and variableGroupId metadata for linked variable support
 */
export function applyVariableEditability(segments: SegmentDto[]): SegmentDto[] {
  return segments.map((seg) => ({
    ...seg,
    fields: seg.fields.map((f) => applyVariableToField(f)),
  }));
}

/**
 * Filter segments to show only fields containing variables
 */
export function filterSegmentsForVariables(segments: SegmentDto[]): SegmentDto[] {
  return segments
    .map((seg) => ({
      ...seg,
      fields: seg.fields.filter((f) => fieldContainsVariable(f)),
    }))
    .filter((seg) => seg.fields.length > 0);
}

/**
 * Extract all unique variable IDs from segments
 * Returns a Map with variableId as key and initial value (the placeholder itself)
 */
export function extractUniqueVariables(segments: SegmentDto[]): Map<string, string> {
  const variables = new Map<string, string>();

  function processField(field: FieldDto) {
    if (field.variableId) {
      // Initialize with the placeholder itself - will be replaced by user
      if (!variables.has(field.variableId)) {
        variables.set(field.variableId, field.variableId);
      }
    }
    // Check repetitions
    field.repetitions?.forEach((r) => processField(r));
  }

  segments.forEach((seg) => {
    seg.fields.forEach((f) => processField(f));
  });

  return variables;
}

/**
 * Get color class for variable group highlighting
 */
export function getVariableGroupColor(groupId: number | undefined): string {
  if (groupId === undefined) {
    // Standalone HELPERVARIABLE - use amber
    return 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20';
  }
  const colors = [
    'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20', // Group 1
    'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20', // Group 2
    'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20', // Group 3
    'ring-2 ring-pink-400 bg-pink-50 dark:bg-pink-900/20', // Group 4
    'ring-2 ring-cyan-400 bg-cyan-50 dark:bg-cyan-900/20', // Group 5
    'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20', // Group 6
    'ring-2 ring-teal-400 bg-teal-50 dark:bg-teal-900/20', // Group 7
    'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20', // Group 8
  ];
  return colors[(groupId - 1) % colors.length];
}

/**
 * Get badge color class for variable group
 */
export function getVariableBadgeColor(groupId: number | undefined): string {
  if (groupId === undefined) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  }
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  ];
  return colors[(groupId - 1) % colors.length];
}

/**
 * Highlight HELPERVARIABLE placeholders in raw HL7 text with group-specific colors.
 * Renders highlighted badges for variable placeholders in React.
 * Used for read-only display (not for editable textareas to avoid cursor issues).
 *
 * @param text - The HL7 text to highlight
 * @returns React nodes with highlighted variable badges, or null if text is empty
 */
export function highlightVariablesInText(text: string): React.ReactNode {
  if (!text) return null;

  // Normalize line endings: HL7 uses \r but CSS whitespace-pre-wrap needs \n for line breaks
  const normalizedText = text.replace(/\r\n?/g, '\n');

  // Split on any HELPERVARIABLE with optional number (1-999)
  // Uses VARIABLE_SPLIT_REGEX for consistency with VARIABLE_REGEX
  const parts = normalizedText.split(VARIABLE_SPLIT_REGEX);

  return parts.map((part, index) => {
    // Check if this part is a variable (already filtered by split)
    const match = part.match(/^HELPERVARIABLE(?:([1-9]\d{0,2}))?$/);
    if (match) {
      const groupId = match[1] ? parseInt(match[1], 10) : undefined;
      const colorClass = getVariableBadgeColor(groupId);

      return React.createElement(
        'span',
        { key: index, className: `${colorClass} px-1 rounded font-bold` },
        part
      );
    }
    return part;
  });
}
