import type { Meta, StoryObj } from '@storybook/react';
import { CompositeField } from './CompositeField';
import { FieldDto, FieldDefinition } from '@/types';

const meta: Meta<typeof CompositeField> = {
    title: 'Fields/CompositeField',
    component: CompositeField,
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
type Story = StoryObj<typeof CompositeField>;

// Patient name field with components
const patientNameField: FieldDto = {
    position: 5,
    value: 'Doe^John^M',
    isEditable: true,
    components: [
        { position: 1, value: 'Doe', subComponents: [] },
        { position: 2, value: 'John', subComponents: [] },
        { position: 3, value: 'M', subComponents: [] },
    ],
};

const patientNameDefinition: FieldDefinition = {
    description: 'Patient Name',
    components: {
        '1': 'Family Name',
        '2': 'Given Name',
        '3': 'Middle Name',
    },
};

/**
 * Default composite field (collapsed)
 */
export const Default: Story = {
    args: {
        field: patientNameField,
        definition: patientNameDefinition,
        onChange: (value, updatedField) => console.log('Changed:', value, updatedField),
    },
};

/**
 * Read-only composite field
 */
export const ReadOnly: Story = {
    args: {
        field: {
            ...patientNameField,
            isEditable: false,
        },
        definition: patientNameDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field with subcomponents (nested structure)
 */
export const WithSubComponents: Story = {
    args: {
        field: {
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
                    ],
                },
            ],
        },
        definition: {
            description: 'Field with Subcomponents',
            components: {
                '1': 'Main Component',
                '2': 'Nested Component',
            },
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field without definition (no descriptions)
 */
export const WithoutDefinition: Story = {
    args: {
        field: patientNameField,
        definition: null,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Many components field
 */
export const ManyComponents: Story = {
    args: {
        field: {
            position: 6,
            value: 'A^B^C^D^E^F^G^H',
            isEditable: true,
            components: [
                { position: 1, value: 'A', subComponents: [] },
                { position: 2, value: 'B', subComponents: [] },
                { position: 3, value: 'C', subComponents: [] },
                { position: 4, value: 'D', subComponents: [] },
                { position: 5, value: 'E', subComponents: [] },
                { position: 6, value: 'F', subComponents: [] },
                { position: 7, value: 'G', subComponents: [] },
                { position: 8, value: 'H', subComponents: [] },
            ],
        },
        definition: {
            description: 'Extended Composite',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field with variable in component (highlighted, auto-expanded)
 */
export const WithVariableInComponent: Story = {
    args: {
        field: {
            position: 5,
            value: 'HELPERVARIABLE^John^M',
            isEditable: true,
            components: [
                { position: 1, value: 'HELPERVARIABLE', subComponents: [] },
                { position: 2, value: 'John', subComponents: [] },
                { position: 3, value: 'M', subComponents: [] },
            ],
        },
        definition: patientNameDefinition,
        onChange: (value) => console.log('Changed:', value),
        highlightVariable: true,
    },
};

/**
 * Empty components
 */
export const EmptyComponents: Story = {
    args: {
        field: {
            position: 5,
            value: '^^',
            isEditable: true,
            components: [
                { position: 1, value: '', subComponents: [] },
                { position: 2, value: '', subComponents: [] },
                { position: 3, value: '', subComponents: [] },
            ],
        },
        definition: patientNameDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Complex medical data structure
 */
export const MedicalData: Story = {
    args: {
        field: {
            position: 11,
            value: '12345^Hospital A^Building B&Floor 3',
            isEditable: true,
            components: [
                { position: 1, value: '12345', subComponents: [] },
                { position: 2, value: 'Hospital A', subComponents: [] },
                {
                    position: 3,
                    value: 'Building B&Floor 3',
                    subComponents: [
                        { position: 1, value: 'Building B', subComponents: [] },
                        { position: 2, value: 'Floor 3', subComponents: [] },
                    ],
                },
            ],
        },
        definition: {
            description: 'Patient Location',
            components: {
                '1': 'Location ID',
                '2': 'Facility Name',
                '3': 'Building/Floor',
            },
        },
        onChange: (value) => console.log('Changed:', value),
    },
};
