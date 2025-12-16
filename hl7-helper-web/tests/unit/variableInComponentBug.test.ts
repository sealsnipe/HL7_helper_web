/**
 * BUG-001: Variable Corruption in Expanded Components
 *
 * When entering variables like `{{PATIENT_ID}}` in component fields,
 * they were getting corrupted to `{\S\\S\\S\MRN` because:
 * 1. FieldInput reconstructed the value with ^ separators
 * 2. MessageEditor.handleFieldChange cleared the components array
 * 3. The generator escaped the ^ characters in field.value
 *
 * Fix: FieldInput now passes the updated field with components preserved,
 * and MessageEditor uses this when provided.
 */

import { describe, it, expect } from 'vitest';
import { parseHl7Message } from '@/utils/hl7Parser';
import { generateHl7Message } from '@/utils/hl7Generator';
import { SegmentDto, FieldDto, ComponentDto } from '@/types';

describe('BUG-001: Variable in component preservation', () => {
  it('preserves {{VARIABLE}} in component when field has components', () => {
    // Simulate the data structure after editing a component to contain {{PATIENT_ID}}
    const segments: SegmentDto[] = [{
      id: 'seg-0',
      name: 'PID',
      fields: [
        {
          position: 3,
          value: '{{PATIENT_ID}}^^^MRN',  // This is the reconstructed display value
          isEditable: true,
          components: [
            { position: 1, value: '{{PATIENT_ID}}', subComponents: [] },
            { position: 2, value: '', subComponents: [] },
            { position: 3, value: '', subComponents: [] },
            { position: 4, value: 'MRN', subComponents: [] },
          ],
        },
      ],
    }];

    const output = generateHl7Message(segments);

    // The output should have {{PATIENT_ID}} preserved, not escaped
    // Components are serialized using their component values, joined by ^
    expect(output).toContain('{{PATIENT_ID}}^^^MRN');
    expect(output).not.toContain('\\S\\');  // No escaped ^ characters
  });

  it('round-trip preserves variables in simple fields', () => {
    const input = 'MSH|^~\\&|App|Fac|App|Fac|202301010000||ADT^A01|MSG001|P|2.5\rPID|1||{{PATIENT_ID}}||Doe^John';

    const segments = parseHl7Message(input);
    const output = generateHl7Message(segments);

    expect(output).toContain('{{PATIENT_ID}}');
  });

  it('does not escape curly braces in field values', () => {
    const segments: SegmentDto[] = [{
      id: 'seg-0',
      name: 'OBX',
      fields: [
        {
          position: 5,
          value: '{{TEST_VALUE}}',
          isEditable: true,
          components: [],
        },
      ],
    }];

    const output = generateHl7Message(segments);

    expect(output).toBe('OBX|{{TEST_VALUE}}');
    expect(output).not.toContain('\\S\\');
    expect(output).not.toContain('\\F\\');
  });

  it('correctly serializes components without corrupting special patterns', () => {
    const segments: SegmentDto[] = [{
      id: 'seg-0',
      name: 'PID',
      fields: [
        {
          position: 5,
          value: '{{LAST}}^{{FIRST}}^{{MIDDLE}}',
          isEditable: true,
          components: [
            { position: 1, value: '{{LAST}}', subComponents: [] },
            { position: 2, value: '{{FIRST}}', subComponents: [] },
            { position: 3, value: '{{MIDDLE}}', subComponents: [] },
          ],
        },
      ],
    }];

    const output = generateHl7Message(segments);

    // When components exist, generator uses them (each escaped individually, then joined with ^)
    expect(output).toBe('PID|{{LAST}}^{{FIRST}}^{{MIDDLE}}');
  });
});
