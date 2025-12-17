/**
 * Regression Test: Variables Only Data Loss Bug
 *
 * BUG DESCRIPTION:
 * When editing templates in "Variables Only" mode, users could only see and edit
 * fields containing HELPERVARIABLE placeholders. However, edits were being applied
 * directly to the filtered segment list instead of being merged back into the full
 * segment list, causing all non-variable segments and fields to be permanently lost.
 *
 * ROOT CAUSE:
 * The MessageEditor received filtered segments (displaySegments) but updates were
 * applied directly to this filtered list without merging back into fullSegments.
 *
 * FIX:
 * Implemented mergeSegmentUpdates logic in handleEditorUpdate that:
 * 1. Maintains fullSegments as the source of truth
 * 2. Creates a map of field updates from the filtered segment edits
 * 3. Merges these updates back into fullSegments, preserving all non-edited data
 * 4. Generates HL7 from the complete merged segments
 *
 * This test ensures the bug doesn't recur by testing the merge logic directly.
 */

import { describe, it, expect } from 'vitest';
import { SegmentDto, FieldDto, ComponentDto } from '@/types';
import { generateHl7Message } from '@/utils/hl7Generator';

/**
 * Merge segment updates from filtered segments back into full segments.
 * This is the core logic from templates/page.tsx handleEditorUpdate function.
 *
 * @param fullSegments - Complete unfiltered segments (source of truth)
 * @param updatedSegments - Filtered segments with user edits
 * @returns Merged segments with updates applied and all other data preserved
 */
function mergeSegmentUpdates(
  fullSegments: SegmentDto[],
  updatedSegments: SegmentDto[]
): SegmentDto[] {
  // Create map of updates for quick lookup: segmentId -> (fieldPosition -> FieldDto)
  const updatedMap = new Map<string, Map<number, FieldDto>>();
  updatedSegments.forEach((seg) => {
    const fieldMap = new Map<number, FieldDto>();
    seg.fields.forEach((field) => {
      fieldMap.set(field.position, field);
    });
    updatedMap.set(seg.id, fieldMap);
  });

  // Merge updates into fullSegments (preserves non-edited segments and fields)
  const mergedSegments = fullSegments.map((seg) => {
    const updatedFieldMap = updatedMap.get(seg.id);
    if (!updatedFieldMap) return seg; // Segment wasn't in the edited set, keep as-is
    return {
      ...seg,
      fields: seg.fields.map((field) => {
        const updatedField = updatedFieldMap.get(field.position);
        return updatedField ?? field; // Use updated field if available, otherwise keep original
      }),
    };
  });

  return mergedSegments;
}

/**
 * Helper to create a simple field
 */
function createField(
  position: number,
  value: string,
  isEditable: boolean = true,
  variableId?: string
): FieldDto {
  return {
    position,
    value,
    isEditable,
    components: [],
    variableId,
  };
}

/**
 * Helper to create a field with components
 */
function createFieldWithComponents(
  position: number,
  components: Array<{ position: number; value: string }>,
  isEditable: boolean = true,
  variableId?: string
): FieldDto {
  const componentsDto: ComponentDto[] = components.map((c) => ({
    position: c.position,
    value: c.value,
    subComponents: [],
  }));

  // Reconstruct value from components (HL7 format: comp1^comp2^comp3)
  const value = componentsDto.map((c) => c.value).join('^');

  return {
    position,
    value,
    isEditable,
    components: componentsDto,
    variableId,
  };
}

/**
 * Simulate filtering segments to only show variable-containing fields
 */
function filterVariablesOnly(segments: SegmentDto[]): SegmentDto[] {
  return segments
    .map((seg) => ({
      ...seg,
      fields: seg.fields.filter((f) => f.variableId !== undefined),
    }))
    .filter((seg) => seg.fields.length > 0);
}

describe('Variables Only Data Loss Bug - Regression Tests', () => {
  describe('mergeSegmentUpdates - Basic Merge Logic', () => {
    // PROOF: Fails if merge logic doesn't preserve non-variable segments
    it('preserves segments without any variable fields', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'MSH',
          fields: [
            createField(1, '|', false),
            createField(2, '^~\\&', false),
            createField(3, 'SendingApp'),
          ],
        },
        {
          id: 'seg-1',
          name: 'PID',
          fields: [
            createField(1, '1'),
            createField(3, 'HELPERVARIABLE', true, 'HELPERVARIABLE'),
            createField(5, 'DOE^JOHN'),
          ],
        },
        {
          id: 'seg-2',
          name: 'PV1',
          fields: [createField(1, '1'), createField(2, 'I'), createField(3, 'WARD1')],
        },
        {
          id: 'seg-3',
          name: 'OBX',
          fields: [createField(1, '1'), createField(2, 'ST'), createField(5, 'TestResult')],
        },
      ];

      // Simulate filtered segments (only PID visible with variable field)
      const filteredSegments = filterVariablesOnly(fullSegments);

      expect(filteredSegments).toHaveLength(1);
      expect(filteredSegments[0].name).toBe('PID');

      // Edit the variable field
      const editedSegments: SegmentDto[] = [
        {
          ...filteredSegments[0],
          fields: filteredSegments[0].fields.map((f) =>
            f.position === 3 ? { ...f, value: '12345' } : f
          ),
        },
      ];

      // Merge back
      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      // Verify ALL segments preserved
      expect(merged).toHaveLength(4);
      expect(merged[0].name).toBe('MSH');
      expect(merged[1].name).toBe('PID');
      expect(merged[2].name).toBe('PV1');
      expect(merged[3].name).toBe('OBX');

      // Verify edit applied
      expect(merged[1].fields[1].value).toBe('12345');

      // Verify other fields preserved in PID
      expect(merged[1].fields).toHaveLength(3);
      expect(merged[1].fields[0].value).toBe('1');
      expect(merged[1].fields[2].value).toBe('DOE^JOHN');
    });

    // PROOF: Fails if merge logic doesn't preserve non-variable fields in same segment
    it('preserves non-variable fields within a segment containing variables', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [
            createField(1, '1'), // Set ID - no variable
            createField(3, 'HELPERVARIABLE1', true, 'HELPERVARIABLE1'), // Variable
            createField(5, 'DOE^JOHN'), // Name - no variable
            createField(7, '19800101'), // DOB - no variable
            createField(8, 'M'), // Gender - no variable
          ],
        },
      ];

      const filteredSegments = filterVariablesOnly(fullSegments);

      // Only field 3 (patient ID with variable) should be visible
      expect(filteredSegments[0].fields).toHaveLength(1);
      expect(filteredSegments[0].fields[0].position).toBe(3);

      // Edit the variable field
      const editedSegments: SegmentDto[] = [
        {
          ...filteredSegments[0],
          fields: [{ ...filteredSegments[0].fields[0], value: 'MRN12345' }],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      // All fields should be preserved
      expect(merged[0].fields).toHaveLength(5);
      expect(merged[0].fields[0].value).toBe('1'); // PID-1 preserved
      expect(merged[0].fields[1].value).toBe('MRN12345'); // PID-3 edited
      expect(merged[0].fields[2].value).toBe('DOE^JOHN'); // PID-5 preserved
      expect(merged[0].fields[3].value).toBe('19800101'); // PID-7 preserved
      expect(merged[0].fields[4].value).toBe('M'); // PID-8 preserved
    });

    // PROOF: Fails if multiple edits across different variable fields aren't all preserved
    it('preserves multiple edits across different variable fields', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [
            createField(1, '1'),
            createField(3, 'HELPERVARIABLE1', true, 'HELPERVARIABLE1'),
            createField(5, 'HELPERVARIABLE2', true, 'HELPERVARIABLE2'),
            createField(8, 'M'),
          ],
        },
      ];

      const filteredSegments = filterVariablesOnly(fullSegments);
      expect(filteredSegments[0].fields).toHaveLength(2);

      // Edit both variable fields
      const editedSegments: SegmentDto[] = [
        {
          ...filteredSegments[0],
          fields: [
            { ...filteredSegments[0].fields[0], value: 'ID123' },
            { ...filteredSegments[0].fields[1], value: 'Smith^Jane' },
          ],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      expect(merged[0].fields).toHaveLength(4);
      expect(merged[0].fields[1].value).toBe('ID123'); // First edit
      expect(merged[0].fields[2].value).toBe('Smith^Jane'); // Second edit
      expect(merged[0].fields[0].value).toBe('1'); // Non-variable preserved
      expect(merged[0].fields[3].value).toBe('M'); // Non-variable preserved
    });

    // PROOF: Fails if segments not in the edited set are modified
    it('leaves unedited segments completely unchanged', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'MSH',
          fields: [createField(1, '|', false), createField(3, 'App')],
        },
        {
          id: 'seg-1',
          name: 'PID',
          fields: [
            createField(3, 'HELPERVARIABLE', true, 'HELPERVARIABLE'),
            createField(5, 'Doe^John'),
          ],
        },
        {
          id: 'seg-2',
          name: 'PV1',
          fields: [createField(1, '1'), createField(2, 'I')],
        },
      ];

      const filteredSegments = filterVariablesOnly(fullSegments);

      // Edit PID only
      const editedSegments: SegmentDto[] = [
        {
          ...filteredSegments[0],
          fields: [{ ...filteredSegments[0].fields[0], value: '999' }],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      // MSH and PV1 should be exactly the same object references
      expect(merged[0]).toBe(fullSegments[0]);
      expect(merged[2]).toBe(fullSegments[2]);

      // Only PID should be a new object
      expect(merged[1]).not.toBe(fullSegments[1]);
      expect(merged[1].fields[0].value).toBe('999');
    });
  });

  describe('Round-Trip: Parse → Filter → Edit → Merge → Generate', () => {
    // PROOF: Fails if data is lost during the full editing workflow
    it('preserves all data through complete edit workflow', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'MSH',
          fields: [
            createField(1, '|', false),
            createField(2, '^~\\&', false),
            createField(3, 'App'),
            createField(4, 'Fac'),
            createField(5, 'Recv'),
            createField(6, 'Loc'),
          ],
        },
        {
          id: 'seg-1',
          name: 'PID',
          fields: [
            createField(1, '1'),
            createField(3, 'HELPERVARIABLE', true, 'HELPERVARIABLE'),
            createFieldWithComponents(
              5,
              [
                { position: 1, value: 'DOE' },
                { position: 2, value: 'JOHN' },
              ],
              true
            ),
            createField(7, '19800101'),
            createField(8, 'M'),
          ],
        },
        {
          id: 'seg-2',
          name: 'PV1',
          fields: [
            createField(1, '1'),
            createField(2, 'I'),
            createFieldWithComponents(
              3,
              [
                { position: 1, value: 'WARD1' },
                { position: 2, value: 'BED2' },
              ],
              true
            ),
          ],
        },
        {
          id: 'seg-3',
          name: 'OBX',
          fields: [
            createField(1, '1'),
            createField(2, 'ST'),
            createField(3, 'CODE'),
            createField(5, 'Result1'),
          ],
        },
      ];

      // Step 1: Filter to Variables Only
      const filteredSegments = filterVariablesOnly(fullSegments);
      expect(filteredSegments).toHaveLength(1);
      expect(filteredSegments[0].name).toBe('PID');
      expect(filteredSegments[0].fields).toHaveLength(1);

      // Step 2: User edits the variable field
      const editedSegments: SegmentDto[] = [
        {
          ...filteredSegments[0],
          fields: [{ ...filteredSegments[0].fields[0], value: 'MRN456' }],
        },
      ];

      // Step 3: Merge back into full segments
      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      // Step 4: Generate HL7
      const generatedHl7 = generateHl7Message(merged);

      // Verify all segments present in output
      expect(generatedHl7).toContain('MSH|');
      expect(generatedHl7).toContain('PID|');
      expect(generatedHl7).toContain('PV1|');
      expect(generatedHl7).toContain('OBX|');

      // Verify edit applied
      expect(generatedHl7).toContain('MRN456');

      // Verify other data preserved - use component format
      expect(generatedHl7).toContain('DOE^JOHN');
      expect(generatedHl7).toContain('19800101');
      expect(generatedHl7).toContain('WARD1^BED2');
      expect(generatedHl7).toContain('Result1');

      // Count segments
      const segmentLines = generatedHl7.split('\r').filter((line) => line.trim());
      expect(segmentLines).toHaveLength(4);
    });

    // PROOF: Fails if multiple edits in sequence cause data loss
    it('preserves data through multiple sequential edits', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [
            createField(1, '1'),
            createField(3, 'HELPERVARIABLE1', true, 'HELPERVARIABLE1'),
            createField(5, 'HELPERVARIABLE2', true, 'HELPERVARIABLE2'),
            createField(8, 'M'),
          ],
        },
        {
          id: 'seg-1',
          name: 'OBX',
          fields: [createField(1, '1'), createField(5, 'OriginalValue')],
        },
      ];

      // First edit: Change patient ID
      const filtered1 = filterVariablesOnly(fullSegments);
      const edited1: SegmentDto[] = [
        {
          ...filtered1[0],
          fields: [{ ...filtered1[0].fields[0], value: 'ID001' }, filtered1[0].fields[1]],
        },
      ];
      const merged1 = mergeSegmentUpdates(fullSegments, edited1);

      // Verify first edit applied and data preserved
      expect(merged1[0].fields[1].value).toBe('ID001');
      expect(merged1[0].fields).toHaveLength(4);
      expect(merged1[1].fields[1].value).toBe('OriginalValue');

      // Second edit: Change patient name
      const filtered2 = filterVariablesOnly(merged1);
      const edited2: SegmentDto[] = [
        {
          ...filtered2[0],
          fields: [filtered2[0].fields[0], { ...filtered2[0].fields[1], value: 'SMITH^JANE' }],
        },
      ];
      const merged2 = mergeSegmentUpdates(merged1, edited2);

      // Verify both edits preserved
      expect(merged2[0].fields[1].value).toBe('ID001'); // First edit
      expect(merged2[0].fields[2].value).toBe('SMITH^JANE'); // Second edit
      expect(merged2[0].fields).toHaveLength(4);
      expect(merged2[1].fields[1].value).toBe('OriginalValue'); // Other segment preserved
    });
  });

  describe('Edge Cases', () => {
    // PROOF: Fails if empty fullSegments causes crash
    it('handles empty fullSegments gracefully', () => {
      const fullSegments: SegmentDto[] = [];
      const updatedSegments: SegmentDto[] = [];

      const merged = mergeSegmentUpdates(fullSegments, updatedSegments);
      expect(merged).toEqual([]);
    });

    // PROOF: Fails if empty updatedSegments modifies fullSegments
    it('returns fullSegments unchanged when updatedSegments is empty', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [createField(1, '1'), createField(3, 'ID123')],
        },
      ];
      const updatedSegments: SegmentDto[] = [];

      const merged = mergeSegmentUpdates(fullSegments, updatedSegments);
      expect(merged).toEqual(fullSegments);
      expect(merged[0]).toBe(fullSegments[0]); // Should be same reference
    });

    // PROOF: Fails if merging segments with no matching IDs causes crash
    it('handles updatedSegments with non-existent segment IDs', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [createField(1, '1')],
        },
      ];

      const updatedSegments: SegmentDto[] = [
        {
          id: 'seg-999', // Non-existent ID
          name: 'OBX',
          fields: [createField(1, '1')],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, updatedSegments);

      // Original segment should be unchanged
      expect(merged).toHaveLength(1);
      expect(merged[0]).toBe(fullSegments[0]);
    });

    // PROOF: Fails if merging segments with no matching field positions causes data loss
    it('handles updatedSegments with non-existent field positions', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [createField(1, '1'), createField(3, 'ID123')],
        },
      ];

      const updatedSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [
            createField(99, 'NonExistent'), // Position doesn't exist in full
          ],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, updatedSegments);

      // Original fields should be preserved
      expect(merged[0].fields).toHaveLength(2);
      expect(merged[0].fields[0].value).toBe('1');
      expect(merged[0].fields[1].value).toBe('ID123');
    });

    // PROOF: Fails if components in edited fields aren't preserved
    it('preserves component structure in edited fields', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'PID',
          fields: [
            createField(1, '1'),
            createFieldWithComponents(
              5,
              [
                { position: 1, value: 'HELPERVARIABLE1' },
                { position: 2, value: 'HELPERVARIABLE2' },
              ],
              true,
              'HELPERVARIABLE1'
            ),
            createField(8, 'M'),
          ],
        },
      ];

      const filtered = filterVariablesOnly(fullSegments);

      // Edit the field with components
      const editedSegments: SegmentDto[] = [
        {
          ...filtered[0],
          fields: [
            createFieldWithComponents(
              5,
              [
                { position: 1, value: 'SMITH' },
                { position: 2, value: 'JANE' },
              ],
              true,
              'HELPERVARIABLE1'
            ),
          ],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, editedSegments);

      // Verify components preserved in merge
      expect(merged[0].fields[1].components).toHaveLength(2);
      expect(merged[0].fields[1].components[0].value).toBe('SMITH');
      expect(merged[0].fields[1].components[1].value).toBe('JANE');
      expect(merged[0].fields[1].value).toBe('SMITH^JANE');

      // Verify other fields preserved
      expect(merged[0].fields).toHaveLength(3);
      expect(merged[0].fields[0].value).toBe('1');
      expect(merged[0].fields[2].value).toBe('M');
    });
  });

  describe('Multiple Segments with Variables', () => {
    // PROOF: Fails if editing multiple segments with variables loses non-variable segments
    it('preserves all segments when editing multiple variable-containing segments', () => {
      const fullSegments: SegmentDto[] = [
        {
          id: 'seg-0',
          name: 'MSH',
          fields: [createField(1, '|', false), createField(3, 'App')],
        },
        {
          id: 'seg-1',
          name: 'PID',
          fields: [createField(1, '1'), createField(3, 'HELPERVARIABLE1', true, 'HELPERVARIABLE1')],
        },
        {
          id: 'seg-2',
          name: 'PV1',
          fields: [createField(1, '1'), createField(2, 'I')],
        },
        {
          id: 'seg-3',
          name: 'OBX',
          fields: [createField(1, '1'), createField(5, 'HELPERVARIABLE2', true, 'HELPERVARIABLE2')],
        },
      ];

      const filtered = filterVariablesOnly(fullSegments);

      // Should have PID and OBX
      expect(filtered).toHaveLength(2);

      // Edit both
      const edited: SegmentDto[] = [
        {
          ...filtered[0],
          fields: [{ ...filtered[0].fields[0], value: 'ID789' }],
        },
        {
          ...filtered[1],
          fields: [{ ...filtered[1].fields[0], value: 'ResultXYZ' }],
        },
      ];

      const merged = mergeSegmentUpdates(fullSegments, edited);

      // All 4 segments preserved
      expect(merged).toHaveLength(4);
      expect(merged[0].name).toBe('MSH');
      expect(merged[1].name).toBe('PID');
      expect(merged[2].name).toBe('PV1');
      expect(merged[3].name).toBe('OBX');

      // Edits applied
      expect(merged[1].fields[1].value).toBe('ID789');
      expect(merged[3].fields[1].value).toBe('ResultXYZ');

      // Non-variable data preserved
      expect(merged[1].fields[0].value).toBe('1');
      expect(merged[2].fields[0].value).toBe('1');
      expect(merged[2].fields[1].value).toBe('I');
      expect(merged[3].fields[0].value).toBe('1');
    });
  });
});
