import type { Meta, StoryObj } from '@storybook/react';
import { SimpleField } from './SimpleField';
import { FieldDto, FieldDefinition } from '@/types';

const meta: Meta<typeof SimpleField> = {
    title: 'Fields/SimpleField',
    component: SimpleField,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        highlightVariable: {
            control: 'boolean',
            description: 'Whether to highlight fields containing variables',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SimpleField>;

// Base field data
const baseField: FieldDto = {
    position: 3,
    value: 'Sample Value',
    isEditable: true,
    components: [],
};

const baseDefinition: FieldDefinition = {
    description: 'Patient ID',
    components: {},
};

/**
 * Default editable simple field
 */
export const Default: Story = {
    args: {
        field: baseField,
        definition: baseDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Read-only field (e.g., MSH-1, MSH-2)
 */
export const ReadOnly: Story = {
    args: {
        field: {
            ...baseField,
            position: 1,
            value: '|',
            isEditable: false,
        },
        definition: {
            description: 'Field Separator',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field without definition (no description shown)
 */
export const WithoutDefinition: Story = {
    args: {
        field: baseField,
        definition: null,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Empty value field
 */
export const EmptyValue: Story = {
    args: {
        field: {
            ...baseField,
            value: '',
        },
        definition: baseDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field with long value
 */
export const LongValue: Story = {
    args: {
        field: {
            ...baseField,
            value: 'This is a very long value that might overflow the input field and test how the component handles long text content',
        },
        definition: {
            description: 'Notes',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field containing a variable placeholder (highlighted)
 */
export const WithVariable: Story = {
    args: {
        field: {
            ...baseField,
            value: 'HELPERVARIABLE',
            variableId: 'HELPERVARIABLE',
            variableGroupId: 0,
        },
        definition: baseDefinition,
        onChange: (value) => console.log('Changed:', value),
        highlightVariable: true,
    },
};

/**
 * Linked variable with group color
 */
export const LinkedVariable: Story = {
    args: {
        field: {
            ...baseField,
            value: 'Patient Name Here',
            variableId: 'HELPERVARIABLE1',
            variableGroupId: 1,
        },
        definition: {
            description: 'Patient Name',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
        highlightVariable: true,
        variableValues: new Map([['HELPERVARIABLE1', 'John Doe']]),
        onVariableChange: (id, value) => console.log('Variable changed:', id, value),
    },
};

/**
 * Multiple variable groups showcase
 */
export const VariableGroups: Story = {
    render: () => (
        <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((groupId) => (
                <SimpleField
                    key={groupId}
                    field={{
                        position: groupId + 1,
                        value: `Variable Group ${groupId}`,
                        isEditable: true,
                        components: [],
                        variableId: `HELPERVARIABLE${groupId || ''}`,
                        variableGroupId: groupId,
                    }}
                    definition={{
                        description: `Field with Group ${groupId}`,
                        components: {},
                    }}
                    onChange={(value) => console.log('Changed:', value)}
                    highlightVariable={true}
                />
            ))}
        </div>
    ),
};
