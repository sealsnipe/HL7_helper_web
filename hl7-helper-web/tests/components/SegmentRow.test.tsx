import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentRow } from '@/components/SegmentRow';
import { SegmentDto, SegmentDefinition } from '@/types';

describe('SegmentRow', () => {
  const createMockSegment = (name: string, fieldCount: number): SegmentDto => ({
    id: `${name}-1`,
    name,
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      position: i + 1,
      value: `field-${i + 1}`,
      isEditable: true,
      components: [],
    })),
  });

  it('renders segment name', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByText('PID')).toBeInTheDocument();
  });

  it('renders segment description when definition is provided', () => {
    const segment = createMockSegment('PID', 3);
    const definition: SegmentDefinition = {
      description: 'Patient Identification',
      fields: {},
    };
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={definition}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByText('Patient Identification', { exact: false })).toBeInTheDocument();
  });

  it('shows fields correctly when expanded', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={true}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByDisplayValue('field-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('field-2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('field-3')).toBeInTheDocument();
  });

  it('hides fields when collapsed', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.queryByDisplayValue('field-1')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('field-2')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('field-3')).not.toBeInTheDocument();
  });

  it('expand/collapse works when clicking segment header', async () => {
    const user = userEvent.setup();
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    const segmentName = screen.getByText('PID');
    await user.click(segmentName);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('displays field count', () => {
    const segment = createMockSegment('MSH', 12);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByText('(12 fields)')).toBeInTheDocument();
  });

  it('shows expand indicator when collapsed', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={false}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('shows collapse indicator when expanded', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={true}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('field changes call onFieldChange with correct index', () => {
    const segment = createMockSegment('PID', 3);
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={true}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    const secondField = screen.getByDisplayValue('field-2');
    fireEvent.change(secondField, { target: { value: 'updated' } });

    // Should call onFieldChange with the field index (1 for the second field), new value,
    // and undefined for updatedField (since this is a simple field edit, not component edit)
    expect(onFieldChange).toHaveBeenCalledWith(1, 'updated', undefined);
  });

  it('filters out trailing empty fields', () => {
    const segment: SegmentDto = {
      id: 'test-1',
      name: 'PID',
      fields: [
        { position: 1, value: 'value1', isEditable: true, components: [] },
        { position: 2, value: 'value2', isEditable: true, components: [] },
        { position: 3, value: '', isEditable: true, components: [] },
        { position: 4, value: '', isEditable: true, components: [] },
      ],
    };
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={null}
        isExpanded={true}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    // Only the first two fields should be visible
    expect(screen.getByDisplayValue('value1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('value2')).toBeInTheDocument();

    // Empty trailing fields should not create inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(2);
  });

  it('passes field definitions to FieldInput components', () => {
    const segment = createMockSegment('PID', 2);
    const definition: SegmentDefinition = {
      description: 'Patient Identification',
      fields: {
        '1': { description: 'Set ID', components: {} },
        '2': { description: 'Patient ID', components: {} },
      },
    };
    const onToggle = vi.fn();
    const onFieldChange = vi.fn();

    render(
      <SegmentRow
        segment={segment}
        definition={definition}
        isExpanded={true}
        onToggle={onToggle}
        onFieldChange={onFieldChange}
      />
    );

    // Verify that field descriptions from definition are displayed
    expect(screen.getByText('Set ID')).toBeInTheDocument();
    expect(screen.getByText('Patient ID')).toBeInTheDocument();
  });
});
