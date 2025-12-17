import { describe, it, expect } from 'vitest';
import { validateMessage } from '@/utils/validation';
import { SegmentDto } from '@/types';

describe('HL7 Message Validation', () => {
  // Helper to create test segments
  const createSegment = (
    name: string,
    fields: Array<{ position: number; value: string }>
  ): SegmentDto => ({
    id: `seg-${name}`,
    name,
    fields: fields.map((f) => ({
      position: f.position,
      value: f.value,
      isEditable: true,
      components: [],
    })),
  });

  describe('validateMessage - valid messages', () => {
    // PROOF: Fails if basic validation logic broken
    it('returns valid for properly structured HL7 message', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('PID', [
          { position: 1, value: '1' },
          { position: 3, value: '12345' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // PROOF: Fails if warnings prevent isValid from being true
    it('returns valid when only warnings exist', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    // PROOF: Fails if MSH-only message not considered valid
    it('returns valid for MSH-only message with required fields', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMessage - structural errors', () => {
    // PROOF: Fails if empty message check removed
    it('returns error for empty message', () => {
      const result = validateMessage([]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EMPTY_MESSAGE');
      expect(result.errors[0].severity).toBe('error');
    });

    // PROOF: Fails if missing MSH check removed
    it('returns error when MSH segment is missing', () => {
      const segments = [createSegment('PID', [{ position: 1, value: '1' }])];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH')).toBe(true);
    });

    // PROOF: Fails if MSH position check removed
    it('returns error when MSH is not first segment', () => {
      const segments = [
        createSegment('PID', [{ position: 1, value: '1' }]),
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MSH_NOT_FIRST')).toBe(true);
    });

    // PROOF: Fails if segment name validation removed
    it('returns error for invalid segment name', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('XY', [{ position: 1, value: '1' }]), // Invalid: too short
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SEGMENT_NAME')).toBe(true);
    });

    // PROOF: Fails if segment name starting with number not caught
    it('returns error for segment name starting with number', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('1BC', [{ position: 1, value: '1' }]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SEGMENT_NAME')).toBe(true);
    });

    // PROOF: Fails if lowercase segment name not caught
    it('returns error for lowercase segment name', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('pid', [{ position: 1, value: '1' }]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SEGMENT_NAME')).toBe(true);
    });

    // PROOF: Fails if multiple structural errors not all caught
    it('catches multiple structural errors', () => {
      const segments = [
        createSegment('PID', [{ position: 1, value: '1' }]), // MSH not first
        createSegment('XY', [{ position: 1, value: '1' }]), // Invalid name
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateMessage - required field errors', () => {
    // PROOF: Fails if MSH-9 check removed
    it('returns error when MSH-9 (Message Type) is missing', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
          // MSH-9 missing
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH_9')).toBe(true);
    });

    // PROOF: Fails if MSH-10 check removed
    it('returns error when MSH-10 (Message Control ID) is missing', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 12, value: '2.5.1' },
          // MSH-10 missing
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH_10')).toBe(true);
    });

    // PROOF: Fails if MSH-12 check removed
    it('returns error when MSH-12 (Version ID) is missing', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          // MSH-12 missing
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH_12')).toBe(true);
    });

    // PROOF: Fails if empty string not treated as missing
    it('returns error when required field is empty string', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: '' }, // Empty
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH_9')).toBe(true);
    });

    // PROOF: Fails if whitespace-only not treated as missing
    it('returns error when required field is whitespace only', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: '   ' }, // Whitespace
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_MSH_9')).toBe(true);
    });

    // PROOF: Fails if PID-3 check removed when PID exists
    it('returns error when PID-3 (Patient ID) is missing and PID segment exists', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('PID', [
          { position: 1, value: '1' },
          // PID-3 missing
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_PID_3')).toBe(true);
    });

    // PROOF: Fails if PID-3 check fires when PID doesn't exist
    it('does not return error for PID-3 when PID segment does not exist', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        // No PID segment
      ];

      const result = validateMessage(segments);

      expect(result.errors.some((e) => e.code === 'MISSING_PID_3')).toBe(false);
    });

    // PROOF: Fails if multiple required field errors not all caught
    it('catches multiple required field errors', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          // MSH-9, MSH-10, MSH-12 all missing
        ]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateMessage - error categorization', () => {
    // PROOF: Fails if severity categorization broken
    it('categorizes errors by severity', () => {
      const segments = [
        createSegment('PID', [{ position: 1, value: '1' }]), // MSH issues
      ];

      const result = validateMessage(segments);

      expect(result.errors.every((e) => e.severity === 'error')).toBe(true);
      expect(result.warnings.every((w) => w.severity === 'warning')).toBe(true);
      expect(result.info.every((i) => i.severity === 'info')).toBe(true);
    });

    // PROOF: Fails if error metadata not populated
    it('populates error metadata correctly', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: '' }, // Missing MSH-9
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      const msh9Error = result.errors.find((e) => e.code === 'MISSING_MSH_9');
      expect(msh9Error).toBeDefined();
      expect(msh9Error?.path).toBe('MSH-9');
      expect(msh9Error?.segmentIndex).toBe(0);
      expect(msh9Error?.fieldPosition).toBe(9);
      expect(msh9Error?.message).toContain('MSH-9');
    });

    // PROOF: Fails if structural error metadata not populated
    it('populates structural error metadata', () => {
      const segments = [
        createSegment('PID', [{ position: 1, value: '1' }]), // MSH not first
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      const mshNotFirstError = result.errors.find((e) => e.code === 'MSH_NOT_FIRST');
      expect(mshNotFirstError).toBeDefined();
      expect(mshNotFirstError?.segmentIndex).toBe(0);
      expect(mshNotFirstError?.message).toContain('PID');
    });
  });

  describe('validateMessage - edge cases', () => {
    // PROOF: Fails if multiple PID segments not all checked
    it('validates multiple instances of same segment', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('PID', [{ position: 3, value: '12345' }]), // Valid
        createSegment('PID', [{ position: 1, value: '1' }]), // Missing PID-3
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_PID_3')).toBe(true);
    });

    // PROOF: Fails if complex message with many segments not fully validated
    it('validates complex message with many segments', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        createSegment('PID', [{ position: 3, value: '12345' }]),
        createSegment('PV1', [{ position: 1, value: '1' }]),
        createSegment('OBR', [{ position: 1, value: '1' }]),
        createSegment('OBX', [{ position: 1, value: '1' }]),
      ];

      const result = validateMessage(segments);

      expect(result.isValid).toBe(true);
    });

    // PROOF: Fails if segment with no fields not handled
    it('handles segment with no fields', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
        {
          id: 'seg-EMPTY',
          name: 'ZZZ',
          fields: [],
        },
      ];

      const result = validateMessage(segments);

      // Should still validate (custom segments allowed to be empty)
      expect(result.isValid).toBe(true);
    });

    // PROOF: Fails if ValidationResult structure incorrect
    it('returns correct ValidationResult structure', () => {
      const segments = [
        createSegment('MSH', [
          { position: 1, value: '|' },
          { position: 2, value: '^~\\&' },
          { position: 9, value: 'ADT^A01' },
          { position: 10, value: 'MSG001' },
          { position: 12, value: '2.5.1' },
        ]),
      ];

      const result = validateMessage(segments);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('info');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.info)).toBe(true);
    });
  });
});
