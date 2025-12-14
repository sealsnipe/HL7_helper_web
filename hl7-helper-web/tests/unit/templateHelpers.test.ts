import { describe, it, expect } from 'vitest';
import {
  fieldContainsVariable,
  getVariableCount,
  applyVariableEditability,
  filterSegmentsForVariables,
} from '@/utils/templateHelpers';
import { FieldDto, SegmentDto } from '@/types';

describe('templateHelpers', () => {
  describe('fieldContainsVariable', () => {
    // PROOF: Catches bug where simple field values are not checked for variables
    it('returns true when field.value contains HELPERVARIABLE', () => {
      const field: FieldDto = {
        position: 1,
        value: 'Some HELPERVARIABLE value',
        isEditable: false,
        components: [],
      };

      expect(fieldContainsVariable(field)).toBe(true);
    });

    // PROOF: Catches bug where component values are not checked for variables
    it('returns true when component contains HELPERVARIABLE', () => {
      const field: FieldDto = {
        position: 1,
        value: '',
        isEditable: false,
        components: [
          { position: 1, value: 'HELPERVARIABLE' },
          { position: 2, value: 'normal' },
        ],
      };

      expect(fieldContainsVariable(field)).toBe(true);
    });

    // PROOF: Catches bug where subComponents are not checked for variables
    it('returns true when subComponent contains HELPERVARIABLE', () => {
      const field: FieldDto = {
        position: 1,
        value: '',
        isEditable: false,
        components: [
          {
            position: 1,
            value: '',
            subComponents: [
              { position: 1, value: 'HELPERVARIABLE' },
            ],
          },
        ],
      };

      expect(fieldContainsVariable(field)).toBe(true);
    });

    // PROOF: Catches bug where repetitions are not checked for variables
    it('returns true when repetition contains HELPERVARIABLE', () => {
      const field: FieldDto = {
        position: 1,
        value: '',
        isEditable: false,
        components: [],
        repetitions: [
          {
            position: 1,
            value: 'HELPERVARIABLE',
            isEditable: false,
            components: [],
          },
        ],
      };

      expect(fieldContainsVariable(field)).toBe(true);
    });

    // PROOF: Catches bug where false positives are returned for fields without variables
    it('returns false when no variables present', () => {
      const field: FieldDto = {
        position: 1,
        value: 'normal value',
        isEditable: false,
        components: [
          { position: 1, value: 'component value' },
        ],
      };

      expect(fieldContainsVariable(field)).toBe(false);
    });

    // PROOF: Catches bug where empty fields cause errors
    it('handles empty field values', () => {
      const field: FieldDto = {
        position: 1,
        value: '',
        isEditable: false,
        components: [],
      };

      expect(fieldContainsVariable(field)).toBe(false);
    });
  });

  describe('getVariableCount', () => {
    // PROOF: Catches bug where variable count is incorrect
    it('returns correct count of HELPERVARIABLE occurrences', () => {
      expect(getVariableCount('HELPERVARIABLE')).toBe(1);
      expect(getVariableCount('HELPERVARIABLE and HELPERVARIABLE')).toBe(2);
      expect(getVariableCount('no variables here')).toBe(0);
      expect(getVariableCount('')).toBe(0);
    });
  });

  describe('applyVariableEditability', () => {
    // PROOF: Catches bug where fields with variables are not marked editable
    it('marks fields with variables as editable', () => {
      const segments: SegmentDto[] = [
        {
          id: '1',
          name: 'PID',
          fields: [
            { position: 1, value: 'HELPERVARIABLE', isEditable: false, components: [] },
            { position: 2, value: 'normal', isEditable: false, components: [] },
          ],
        },
      ];

      const result = applyVariableEditability(segments);

      expect(result[0].fields[0].isEditable).toBe(true);
      expect(result[0].fields[1].isEditable).toBe(false);
    });

    // PROOF: Catches bug where original segments are mutated
    it('does not mutate original segments', () => {
      const segments: SegmentDto[] = [
        {
          id: '1',
          name: 'PID',
          fields: [
            { position: 1, value: 'HELPERVARIABLE', isEditable: false, components: [] },
          ],
        },
      ];

      applyVariableEditability(segments);

      expect(segments[0].fields[0].isEditable).toBe(false);
    });
  });

  describe('filterSegmentsForVariables', () => {
    // PROOF: Catches bug where segments without variables are included
    it('returns only fields containing variables', () => {
      const segments: SegmentDto[] = [
        {
          id: '1',
          name: 'MSH',
          fields: [
            { position: 1, value: 'normal', isEditable: false, components: [] },
          ],
        },
        {
          id: '2',
          name: 'PID',
          fields: [
            { position: 1, value: 'HELPERVARIABLE', isEditable: false, components: [] },
            { position: 2, value: 'normal', isEditable: false, components: [] },
          ],
        },
      ];

      const result = filterSegmentsForVariables(segments);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('PID');
      expect(result[0].fields).toHaveLength(1);
      expect(result[0].fields[0].value).toBe('HELPERVARIABLE');
    });

    // PROOF: Catches bug where empty segments are included
    it('removes segments with no variable fields', () => {
      const segments: SegmentDto[] = [
        {
          id: '1',
          name: 'MSH',
          fields: [
            { position: 1, value: 'normal', isEditable: false, components: [] },
          ],
        },
      ];

      const result = filterSegmentsForVariables(segments);

      expect(result).toHaveLength(0);
    });
  });
});
