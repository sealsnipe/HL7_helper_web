import { FieldDto, SegmentDto } from '@/types';

/**
 * Check if a field contains a HELPERVARIABLE placeholder
 */
export function fieldContainsVariable(field: FieldDto): boolean {
  if (field.value?.includes('HELPERVARIABLE')) return true;
  if (field.components?.some(c =>
    c.value?.includes('HELPERVARIABLE') ||
    c.subComponents?.some(s => s.value?.includes('HELPERVARIABLE'))
  )) return true;
  if (field.repetitions?.some(r => fieldContainsVariable(r))) return true;
  return false;
}

/**
 * Count the number of HELPERVARIABLE occurrences in content
 */
export function getVariableCount(content: string): number {
  return (content.match(/HELPERVARIABLE/g) || []).length;
}

/**
 * Apply variable editability to segments - only fields containing HELPERVARIABLE are editable
 */
export function applyVariableEditability(segments: SegmentDto[]): SegmentDto[] {
  return segments.map(seg => ({
    ...seg,
    fields: seg.fields.map(f => ({
      ...f,
      isEditable: fieldContainsVariable(f),
      components: f.components?.map(c => ({
        ...c,
        // Components inherit editability from parent field check
      })),
      repetitions: f.repetitions?.map(r => ({
        ...r,
        isEditable: fieldContainsVariable(r),
      })),
    })),
  }));
}

/**
 * Filter segments to show only fields containing variables
 */
export function filterSegmentsForVariables(segments: SegmentDto[]): SegmentDto[] {
  return segments
    .map(seg => ({
      ...seg,
      fields: seg.fields.filter(f => fieldContainsVariable(f)),
    }))
    .filter(seg => seg.fields.length > 0);
}
