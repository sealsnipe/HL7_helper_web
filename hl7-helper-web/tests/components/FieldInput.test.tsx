import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldInput } from '@/components/FieldInput';
import { FieldDto, FieldDefinition } from '@/types';

describe('FieldInput', () => {
  it('renders simple values', () => {
    const field: FieldDto = {
      position: 3,
      value: 'John Doe',
      isEditable: true,
      components: [],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders simple values with definition description', () => {
    const field: FieldDto = {
      position: 5,
      value: 'Patient Name',
      isEditable: true,
      components: [],
    };
    const definition: FieldDefinition = {
      description: 'Patient Name',
      components: {},
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={definition} onChange={onChange} />);

    expect(screen.getByDisplayValue('Patient Name')).toBeInTheDocument();
    expect(screen.getByText('Patient Name')).toBeInTheDocument();
  });

  it('renders components with ^ separator display', () => {
    const field: FieldDto = {
      position: 5,
      value: 'Doe^John^M',
      isEditable: true,
      components: [
        { position: 1, value: 'Doe', subComponents: [] },
        { position: 2, value: 'John', subComponents: [] },
        { position: 3, value: 'M', subComponents: [] },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Should show the full value with ^ separators
    expect(screen.getByDisplayValue('Doe^John^M')).toBeInTheDocument();

    // Should show component positions
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders components with expand/collapse functionality', async () => {
    const user = userEvent.setup();
    const field: FieldDto = {
      position: 5,
      value: 'Doe^John^M',
      isEditable: true,
      components: [
        { position: 1, value: 'Doe', subComponents: [] },
        { position: 2, value: 'John', subComponents: [] },
        { position: 3, value: 'M', subComponents: [] },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Initially collapsed - component values should not be individually visible
    expect(screen.queryByDisplayValue('Doe')).not.toBeInTheDocument();

    // Find and click the expand button
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // After expansion, individual component values should be visible
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('M')).toBeInTheDocument();
  });

  it('renders repetitions with ~ separator display', () => {
    const field: FieldDto = {
      position: 6,
      value: 'first~second',
      isEditable: true,
      components: [],
      repetitions: [
        { position: 1, value: 'first', isEditable: true, components: [] },
        { position: 2, value: 'second', isEditable: true, components: [] },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Should show repetition labels
    expect(screen.getByText('Rep 1')).toBeInTheDocument();
    expect(screen.getByText('Rep 2')).toBeInTheDocument();

    // Should show repetition values
    expect(screen.getByDisplayValue('first')).toBeInTheDocument();
    expect(screen.getByDisplayValue('second')).toBeInTheDocument();
  });

  it('editing a simple field calls onChange with new value', () => {
    const field: FieldDto = {
      position: 3,
      value: 'original',
      isEditable: true,
      components: [],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    const input = screen.getByDisplayValue('original');
    fireEvent.change(input, { target: { value: 'updated' } });

    expect(onChange).toHaveBeenCalledWith('updated');
  });

  it('editing a component calls onChange with reconstructed value', async () => {
    const user = userEvent.setup();
    const field: FieldDto = {
      position: 5,
      value: 'Doe^John^M',
      isEditable: true,
      components: [
        { position: 1, value: 'Doe', subComponents: [] },
        { position: 2, value: 'John', subComponents: [] },
        { position: 3, value: 'M', subComponents: [] },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Expand to access individual components
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // Edit the second component
    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Should reconstruct the full value with ^ separators
    expect(onChange).toHaveBeenCalledWith('Doe^Jane^M');
  });

  it('readonly fields are not editable', () => {
    const field: FieldDto = {
      position: 1,
      value: '|',
      isEditable: false,
      components: [],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    const input = screen.getByDisplayValue('|');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders subcomponents with & separator', async () => {
    const user = userEvent.setup();
    const field: FieldDto = {
      position: 4,
      value: 'Main^Sub1&Sub2',
      isEditable: true,
      components: [
        { position: 1, value: 'Main', subComponents: [] },
        {
          position: 2,
          value: 'Sub1&Sub2',
          subComponents: [
            { position: 1, value: 'Sub1', subComponents: [] },
            { position: 2, value: 'Sub2', subComponents: [] },
          ]
        },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Expand to see components
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // Check that the component value shows the subcomponent separator
    expect(screen.getByDisplayValue('Sub1&Sub2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main')).toBeInTheDocument();
  });

  it('editing repetition calls onChange with ~ separated values', () => {
    const field: FieldDto = {
      position: 6,
      value: 'first~second',
      isEditable: true,
      components: [],
      repetitions: [
        { position: 1, value: 'first', isEditable: true, components: [] },
        { position: 2, value: 'second', isEditable: true, components: [] },
      ],
    };
    const onChange = vi.fn();

    render(<FieldInput field={field} definition={null} onChange={onChange} />);

    // Edit the first repetition
    const firstRepInput = screen.getByDisplayValue('first');
    fireEvent.change(firstRepInput, { target: { value: 'updated' } });

    // Should call onChange with ~ separated values
    expect(onChange).toHaveBeenCalledWith('updated~second');
  });
});
