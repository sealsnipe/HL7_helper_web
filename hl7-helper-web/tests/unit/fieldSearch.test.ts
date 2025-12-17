import { describe, it, expect } from 'vitest';
import { searchFields, isPathQuery, highlightMatch } from '@/utils/fieldSearch';
import { SegmentDto, ComponentDto } from '@/types';

describe('fieldSearch', () => {
  // Helper to create test segments
  const createSegment = (
    name: string,
    fields: Array<{ position: number; value: string; components?: Partial<ComponentDto>[] }>
  ): SegmentDto => ({
    id: `seg-${name}`,
    name,
    fields: fields.map((f) => ({
      position: f.position,
      value: f.value,
      isEditable: true,
      components: f.components || [],
    })),
  });

  describe('searchFields - path queries', () => {
    // PROOF: Fails if path parsing logic removed
    it('returns matches for path query PID-5', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 9, value: 'ADT^A01' },
        ]),
        createSegment('PID', [
          { position: 3, value: '12345' },
          { position: 5, value: 'Doe^John' },
        ]),
      ];

      const results = searchFields(segments, 'PID-5');

      expect(results).toHaveLength(1);
      expect(results[0].segmentName).toBe('PID');
      expect(results[0].fieldPosition).toBe(5);
      expect(results[0].displayPath).toBe('PID-5');
      expect(results[0].value).toBe('Doe^John');
    });

    // PROOF: Fails if dot separator support removed
    it('returns matches for path query with dot separator PID.5', () => {
      const segments = [createSegment('PID', [{ position: 5, value: 'Doe^John' }])];

      const results = searchFields(segments, 'PID.5');

      expect(results).toHaveLength(1);
      expect(results[0].displayPath).toBe('PID-5');
    });

    // PROOF: Fails if component path parsing removed
    it('returns matches for component path query PID-5.1', () => {
      const segments = [
        createSegment('PID', [
          {
            position: 5,
            value: 'Doe^John',
            components: [
              { position: 1, value: 'Doe', subComponents: [] },
              { position: 2, value: 'John', subComponents: [] },
            ],
          },
        ]),
      ];

      const results = searchFields(segments, 'PID-5.1');

      expect(results).toHaveLength(1);
      expect(results[0].segmentName).toBe('PID');
      expect(results[0].fieldPosition).toBe(5);
      expect(results[0].componentPosition).toBe(1);
      expect(results[0].displayPath).toBe('PID-5.1');
      expect(results[0].value).toBe('Doe');
    });

    // PROOF: Fails if component path with dot separator support removed
    it('returns matches for component path query with dot PID.5.1', () => {
      const segments = [
        createSegment('PID', [
          {
            position: 5,
            value: 'Doe^John',
            components: [
              { position: 1, value: 'Doe', subComponents: [] },
              { position: 2, value: 'John', subComponents: [] },
            ],
          },
        ]),
      ];

      const results = searchFields(segments, 'PID.5.1');

      expect(results).toHaveLength(1);
      expect(results[0].displayPath).toBe('PID-5.1');
      expect(results[0].componentPosition).toBe(1);
    });

    // PROOF: Fails if case insensitivity removed
    it('path queries are case insensitive', () => {
      const segments = [createSegment('PID', [{ position: 5, value: 'Doe^John' }])];

      const results = searchFields(segments, 'pid-5');

      expect(results).toHaveLength(1);
      expect(results[0].segmentName).toBe('PID');
    });

    // PROOF: Fails if multiple segment instances not handled
    it('returns all matching fields across multiple segments', () => {
      const segments = [
        createSegment('PID', [{ position: 3, value: '12345' }]),
        createSegment('PID', [{ position: 3, value: '67890' }]),
      ];

      const results = searchFields(segments, 'PID-3');

      expect(results).toHaveLength(2);
      expect(results[0].value).toBe('12345');
      expect(results[1].value).toBe('67890');
    });

    // PROOF: Fails if empty results not handled for non-existent segment
    it('returns empty array for non-existent segment', () => {
      const segments = [createSegment('MSH', [{ position: 1, value: '|' }])];

      const results = searchFields(segments, 'OBR-1');

      expect(results).toEqual([]);
    });

    // PROOF: Fails if non-existent field not handled
    it('returns empty array for non-existent field', () => {
      const segments = [createSegment('PID', [{ position: 3, value: '12345' }])];

      const results = searchFields(segments, 'PID-99');

      expect(results).toEqual([]);
    });

    // PROOF: Fails if non-existent component not handled
    it('returns empty array for non-existent component', () => {
      const segments = [
        createSegment('PID', [
          {
            position: 5,
            value: 'Doe^John',
            components: [{ position: 1, value: 'Doe', subComponents: [] }],
          },
        ]),
      ];

      const results = searchFields(segments, 'PID-5.5');

      expect(results).toEqual([]);
    });
  });

  describe('searchFields - value queries', () => {
    // PROOF: Fails if value search removed
    it('returns matches for value search in simple fields', () => {
      const segments = [
        createSegment('PID', [
          { position: 3, value: 'john123' },
          { position: 5, value: 'Doe^John' },
        ]),
      ];

      const results = searchFields(segments, 'john');

      expect(results).toHaveLength(2);
      expect(results[0].value).toContain('john');
      expect(results[1].value).toContain('John');
    });

    // PROOF: Fails if case insensitivity removed
    it('value search is case insensitive', () => {
      const segments = [createSegment('PID', [{ position: 5, value: 'DOE^JOHN' }])];

      const results = searchFields(segments, 'john');

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe('DOE^JOHN');
    });

    // PROOF: Fails if component value search removed
    it('returns matches in components', () => {
      const segments = [
        createSegment('PID', [
          {
            position: 5,
            value: 'Doe^John^M',
            components: [
              { position: 1, value: 'Doe', subComponents: [] },
              { position: 2, value: 'John', subComponents: [] },
              { position: 3, value: 'M', subComponents: [] },
            ],
          },
        ]),
      ];

      const results = searchFields(segments, 'John');

      expect(results).toHaveLength(1);
      expect(results[0].componentPosition).toBe(2);
      expect(results[0].value).toBe('John');
      expect(results[0].displayPath).toBe('PID-5.2');
    });

    // PROOF: Fails if subcomponent search removed
    it('returns matches in subcomponents', () => {
      const segments = [
        createSegment('PID', [
          {
            position: 11,
            value: '123 Main St&Apt 4B',
            components: [
              {
                position: 1,
                value: '123 Main St&Apt 4B',
                subComponents: [
                  { position: 1, value: '123 Main St', subComponents: [] },
                  { position: 2, value: 'Apt 4B', subComponents: [] },
                ],
              },
            ],
          },
        ]),
      ];

      const results = searchFields(segments, 'Apt');

      expect(results).toHaveLength(1);
      expect(results[0].subcomponentPosition).toBe(2);
      expect(results[0].value).toBe('Apt 4B');
      expect(results[0].displayPath).toBe('PID-11.1.2');
    });

    // PROOF: Fails if MAX_RESULTS limit not enforced
    it('enforces MAX_RESULTS limit of 100', () => {
      const fields = Array.from({ length: 150 }, (_, i) => ({
        position: i + 1,
        value: 'match',
      }));
      const segments = [createSegment('PID', fields)];

      const results = searchFields(segments, 'match');

      expect(results).toHaveLength(100);
    });

    // PROOF: Fails if partial match not supported
    it('supports partial value matches', () => {
      const segments = [createSegment('PID', [{ position: 3, value: 'ABC12345XYZ' }])];

      const results = searchFields(segments, '12345');

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe('ABC12345XYZ');
    });
  });

  describe('searchFields - edge cases', () => {
    // PROOF: Fails if empty query handling removed
    it('returns empty array for empty query', () => {
      const segments = [createSegment('PID', [{ position: 3, value: '12345' }])];

      const results = searchFields(segments, '');

      expect(results).toEqual([]);
    });

    // PROOF: Fails if whitespace trimming removed
    it('returns empty array for whitespace-only query', () => {
      const segments = [createSegment('PID', [{ position: 3, value: '12345' }])];

      const results = searchFields(segments, '   ');

      expect(results).toEqual([]);
    });

    // PROOF: Fails if empty segments handling removed
    it('handles empty segments array', () => {
      const results = searchFields([], 'PID-3');

      expect(results).toEqual([]);
    });

    // PROOF: Fails if special characters not handled
    it('handles special characters in value search', () => {
      const segments = [createSegment('PID', [{ position: 3, value: 'ID-123^456' }])];

      const results = searchFields(segments, 'ID-123');

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe('ID-123^456');
    });

    // PROOF: Fails if invalid path format not handled
    it('treats invalid path format as value search', () => {
      const segments = [createSegment('PID', [{ position: 3, value: 'INVALID-SEGMENT' }])];

      const results = searchFields(segments, 'INVALID-SEGMENT');

      expect(results).toHaveLength(1);
    });

    // PROOF: Fails if segmentIndex not set correctly
    it('sets correct segmentIndex in results', () => {
      const segments = [
        createSegment('MSH', [{ position: 1, value: '|' }]),
        createSegment('PID', [{ position: 3, value: '12345' }]),
        createSegment('OBR', [{ position: 1, value: '1' }]),
      ];

      const results = searchFields(segments, 'PID-3');

      expect(results[0].segmentIndex).toBe(1);
    });

    // PROOF: Fails if fieldIndex not set correctly
    it('sets correct fieldIndex in results', () => {
      const segments = [
        createSegment('PID', [
          { position: 1, value: 'first' },
          { position: 3, value: 'target' },
          { position: 5, value: 'last' },
        ]),
      ];

      const results = searchFields(segments, 'PID-3');

      expect(results[0].fieldIndex).toBe(1);
    });
  });

  describe('isPathQuery', () => {
    // PROOF: Fails if path validation removed
    it('returns true for valid segment-field paths', () => {
      expect(isPathQuery('PID-5')).toBe(true);
      expect(isPathQuery('MSH-9')).toBe(true);
      expect(isPathQuery('OBR-1')).toBe(true);
    });

    // PROOF: Fails if dot separator support removed
    it('returns true for valid paths with dot separator', () => {
      expect(isPathQuery('PID.5')).toBe(true);
    });

    // PROOF: Fails if component path validation removed
    it('returns true for valid segment-field-component paths', () => {
      expect(isPathQuery('PID-5.1')).toBe(true);
      expect(isPathQuery('PID.5.1')).toBe(true);
    });

    // PROOF: Fails if invalid format rejection removed
    it('returns false for invalid formats', () => {
      expect(isPathQuery('PID')).toBe(false);
      expect(isPathQuery('PID-')).toBe(false);
      expect(isPathQuery('PID-5-1')).toBe(false);
      expect(isPathQuery('john')).toBe(false);
      expect(isPathQuery('INVALID-SEGMENT-99')).toBe(false);
    });

    // PROOF: Fails if case insensitivity removed
    it('is case insensitive', () => {
      expect(isPathQuery('pid-5')).toBe(true);
      expect(isPathQuery('Pid-5')).toBe(true);
    });

    // PROOF: Fails if segment name validation removed
    it('validates segment name format (3 chars, starts with letter)', () => {
      expect(isPathQuery('AB-1')).toBe(false); // Too short
      expect(isPathQuery('ABCD-1')).toBe(false); // Too long
      expect(isPathQuery('1BC-1')).toBe(false); // Starts with number
    });

    // PROOF: Fails if field position validation removed
    it('validates field position is positive integer', () => {
      expect(isPathQuery('PID-0')).toBe(false);
      expect(isPathQuery('PID--1')).toBe(false);
      expect(isPathQuery('PID-abc')).toBe(false);
    });

    // PROOF: Fails if component position validation removed
    it('validates component position is positive integer', () => {
      expect(isPathQuery('PID-5.0')).toBe(false);
      expect(isPathQuery('PID-5.-1')).toBe(false);
      expect(isPathQuery('PID-5.abc')).toBe(false);
    });
  });

  describe('highlightMatch', () => {
    // PROOF: Fails if highlighting logic removed
    it('highlights matching portion of value', () => {
      const result = highlightMatch('John Doe', 'Doe');

      expect(result).toEqual({
        before: 'John ',
        match: 'Doe',
        after: '',
      });
    });

    // PROOF: Fails if case insensitivity removed
    it('is case insensitive', () => {
      const result = highlightMatch('JOHN DOE', 'doe');

      expect(result).not.toBeNull();
      expect(result?.match).toBe('DOE');
    });

    // PROOF: Fails if first match logic removed
    it('highlights first match only', () => {
      const result = highlightMatch('test test test', 'test');

      expect(result).toEqual({
        before: '',
        match: 'test',
        after: ' test test',
      });
    });

    // PROOF: Fails if no match handling removed
    it('returns null when no match found', () => {
      const result = highlightMatch('John Doe', 'Smith');

      expect(result).toBeNull();
    });

    // PROOF: Fails if partial match not supported
    it('supports partial matches', () => {
      const result = highlightMatch('ABC12345XYZ', '123');

      expect(result).toEqual({
        before: 'ABC',
        match: '123',
        after: '45XYZ',
      });
    });

    // PROOF: Fails if special characters not handled
    it('handles special characters', () => {
      const result = highlightMatch('ID-123^456', 'ID-123');

      expect(result).not.toBeNull();
      expect(result?.match).toBe('ID-123');
    });

    // PROOF: Fails if empty value handling removed
    it('handles empty value', () => {
      const result = highlightMatch('', 'test');

      expect(result).toBeNull();
    });

    // PROOF: Fails if empty query handling removed
    it('handles empty query', () => {
      const result = highlightMatch('test', '');

      expect(result).toEqual({
        before: '',
        match: '',
        after: 'test',
      });
    });

    // PROOF: Fails if match at start not handled
    it('handles match at start of value', () => {
      const result = highlightMatch('John Doe', 'John');

      expect(result).toEqual({
        before: '',
        match: 'John',
        after: ' Doe',
      });
    });

    // PROOF: Fails if match at end not handled
    it('handles match at end of value', () => {
      const result = highlightMatch('John Doe', 'Doe');

      expect(result).toEqual({
        before: 'John ',
        match: 'Doe',
        after: '',
      });
    });
  });
});
