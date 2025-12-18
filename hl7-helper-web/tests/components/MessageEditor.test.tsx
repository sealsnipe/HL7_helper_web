import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageEditor } from '@/components/MessageEditor';
import { SegmentDto } from '@/types';

describe('MessageEditor', () => {
  const createMockSegment = (name: string, fieldCount: number = 3): SegmentDto => ({
    id: `${name}-1`,
    name,
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      position: i + 1,
      value: `${name}-field-${i + 1}`,
      isEditable: true,
      components: [],
    })),
  });

  it('renders segments correctly', () => {
    const segments = [createMockSegment('MSH', 5), createMockSegment('PID', 4)];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    expect(screen.getByText('MSH')).toBeInTheDocument();
    expect(screen.getByText('PID')).toBeInTheDocument();
  });

  it('displays message type when MSH-9 is present', () => {
    const segments: SegmentDto[] = [
      {
        id: 'msh-1',
        name: 'MSH',
        fields: [
          { position: 1, value: '|', isEditable: false, components: [] },
          { position: 2, value: '^~\\&', isEditable: false, components: [] },
          {
            position: 9,
            value: 'ADT^A01',
            isEditable: true,
            components: [
              { position: 1, value: 'ADT', subComponents: [] },
              { position: 2, value: 'A01', subComponents: [] },
            ],
          },
        ],
      },
    ];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    expect(screen.getByText(/ADT\^A01/)).toBeInTheDocument();
  });

  it('field changes trigger callbacks', () => {
    const segments = [createMockSegment('PID', 2)];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    // Find the first editable input (should be PID-field-1)
    const inputs = screen.getAllByRole('textbox');
    const editableInput = inputs.find((input) => !input.hasAttribute('readonly'));

    expect(editableInput).toBeDefined();

    if (editableInput) {
      fireEvent.change(editableInput, { target: { value: 'new-value' } });

      expect(onUpdate).toHaveBeenCalled();
      const updatedSegments = onUpdate.mock.calls[0][0];
      expect(updatedSegments[0].fields[0].value).toBe('new-value');
      // When value is directly edited, components and repetitions should be cleared
      expect(updatedSegments[0].fields[0].components).toEqual([]);
      expect(updatedSegments[0].fields[0].repetitions).toEqual([]);
    }
  });

  it('handles empty state', () => {
    const onUpdate = vi.fn();

    render(<MessageEditor segments={[]} onUpdate={onUpdate} />);

    expect(screen.getByText('Message Segments')).toBeInTheDocument();
  });

  it('expand all button expands all segments', () => {
    const segments = [createMockSegment('MSH', 2), createMockSegment('PID', 2)];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);

    // All segments should show their fields (looking for specific field values)
    expect(screen.getByDisplayValue('MSH-field-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PID-field-1')).toBeInTheDocument();
  });

  it('collapse all button collapses all segments', () => {
    const segments = [createMockSegment('MSH', 2), createMockSegment('PID', 2)];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    // First expand all (segments are expanded by default, but let's be explicit)
    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);

    // Then collapse all
    const collapseAllButton = screen.getByText('Collapse All');
    fireEvent.click(collapseAllButton);

    // Fields should not be visible
    expect(screen.queryByDisplayValue('MSH-field-1')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('PID-field-1')).not.toBeInTheDocument();
  });

  it('displays segment count', () => {
    const segments = [createMockSegment('MSH', 5), createMockSegment('PID', 3)];
    const onUpdate = vi.fn();

    render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

    expect(screen.getByText('(5 fields)')).toBeInTheDocument();
    expect(screen.getByText('(3 fields)')).toBeInTheDocument();
  });

  describe('messageType prop', () => {
    // PROOF: Fails if messageType prop is not used for definition loading
    it('uses messageType prop when provided', () => {
      const segments = [createMockSegment('PID', 2)];
      const onUpdate = vi.fn();

      render(<MessageEditor segments={segments} onUpdate={onUpdate} messageType="ADT^A01" />);

      // messageType should be displayed in header
      expect(screen.getByText(/ADT\^A01/)).toBeInTheDocument();
    });

    // PROOF: Fails if messageType prop override is not implemented
    it('uses messageType prop even without MSH segment', () => {
      const segments = [createMockSegment('PID', 2), createMockSegment('PV1', 3)];
      const onUpdate = vi.fn();

      render(<MessageEditor segments={segments} onUpdate={onUpdate} messageType="ORU^R01" />);

      // messageType should be displayed even without MSH
      expect(screen.getByText(/ORU\^R01/)).toBeInTheDocument();
    });

    // PROOF: Fails if fallback to MSH-9 extraction is broken
    it('falls back to MSH-9 extraction when messageType prop not provided', () => {
      const segments: SegmentDto[] = [
        {
          id: 'msh-1',
          name: 'MSH',
          fields: [
            { position: 1, value: '|', isEditable: false, components: [] },
            { position: 2, value: '^~\\&', isEditable: false, components: [] },
            {
              position: 9,
              value: 'ORU^R01',
              isEditable: true,
              components: [
                { position: 1, value: 'ORU', subComponents: [] },
                { position: 2, value: 'R01', subComponents: [] },
              ],
            },
          ],
        },
      ];
      const onUpdate = vi.fn();

      render(<MessageEditor segments={segments} onUpdate={onUpdate} />);

      expect(screen.getByText(/ORU\^R01/)).toBeInTheDocument();
    });

    // PROOF: Fails if empty messageType prop is not handled correctly
    it('falls back to MSH extraction when messageType prop is empty string', () => {
      const segments: SegmentDto[] = [
        {
          id: 'msh-1',
          name: 'MSH',
          fields: [
            { position: 1, value: '|', isEditable: false, components: [] },
            { position: 2, value: '^~\\&', isEditable: false, components: [] },
            {
              position: 9,
              value: 'ADT^A01',
              isEditable: true,
              components: [
                { position: 1, value: 'ADT', subComponents: [] },
                { position: 2, value: 'A01', subComponents: [] },
              ],
            },
          ],
        },
      ];
      const onUpdate = vi.fn();

      render(<MessageEditor segments={segments} onUpdate={onUpdate} messageType="" />);

      // Should not show empty string, should extract from MSH
      expect(screen.queryByText(/^\(\)$/)).not.toBeInTheDocument();
      // Should show extracted message type
      expect(screen.getByText(/ADT\^A01/)).toBeInTheDocument();
    });

    // PROOF: Fails if messageType prop takes precedence over MSH segment
    it('gives precedence to messageType prop over MSH segment', () => {
      const segments: SegmentDto[] = [
        {
          id: 'msh-1',
          name: 'MSH',
          fields: [
            { position: 1, value: '|', isEditable: false, components: [] },
            { position: 2, value: '^~\\&', isEditable: false, components: [] },
            {
              position: 9,
              value: 'ADT^A01',
              isEditable: true,
              components: [
                { position: 1, value: 'ADT', subComponents: [] },
                { position: 2, value: 'A01', subComponents: [] },
              ],
            },
          ],
        },
      ];
      const onUpdate = vi.fn();

      render(<MessageEditor segments={segments} onUpdate={onUpdate} messageType="ORU^R01" />);

      // Should show messageType prop, not MSH-9
      expect(screen.getByText(/ORU\^R01/)).toBeInTheDocument();
      expect(screen.queryByText(/ADT\^A01/)).not.toBeInTheDocument();
    });
  });
});
