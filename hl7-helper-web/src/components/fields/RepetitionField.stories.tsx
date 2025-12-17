import type { Meta, StoryObj } from '@storybook/react';
import { RepetitionField } from './RepetitionField';
import { FieldDto, FieldDefinition } from '@/types';

const meta: Meta<typeof RepetitionField> = {
    title: 'Fields/RepetitionField',
    component: RepetitionField,
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
type Story = StoryObj<typeof RepetitionField>;

// Phone numbers with repetitions
const phoneField: FieldDto = {
    position: 13,
    value: '555-1234~555-5678',
    isEditable: true,
    components: [],
    repetitions: [
        { position: 1, value: '555-1234', isEditable: true, components: [] },
        { position: 2, value: '555-5678', isEditable: true, components: [] },
    ],
};

const phoneDefinition: FieldDefinition = {
    description: 'Phone Number',
    components: {},
};

/**
 * Default repetition field with two values
 */
export const Default: Story = {
    args: {
        field: phoneField,
        definition: phoneDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Read-only repetition field
 */
export const ReadOnly: Story = {
    args: {
        field: {
            ...phoneField,
            isEditable: false,
        },
        definition: phoneDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Single repetition
 */
export const SingleRepetition: Story = {
    args: {
        field: {
            position: 13,
            value: '555-1234',
            isEditable: true,
            components: [],
            repetitions: [
                { position: 1, value: '555-1234', isEditable: true, components: [] },
            ],
        },
        definition: phoneDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Many repetitions
 */
export const ManyRepetitions: Story = {
    args: {
        field: {
            position: 6,
            value: 'First~Second~Third~Fourth~Fifth',
            isEditable: true,
            components: [],
            repetitions: [
                { position: 1, value: 'First', isEditable: true, components: [] },
                { position: 2, value: 'Second', isEditable: true, components: [] },
                { position: 3, value: 'Third', isEditable: true, components: [] },
                { position: 4, value: 'Fourth', isEditable: true, components: [] },
                { position: 5, value: 'Fifth', isEditable: true, components: [] },
            ],
        },
        definition: {
            description: 'Multi-value Field',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Repetitions with components inside
 */
export const RepetitionsWithComponents: Story = {
    args: {
        field: {
            position: 5,
            value: 'Doe^John~Smith^Jane',
            isEditable: true,
            components: [],
            repetitions: [
                {
                    position: 1,
                    value: 'Doe^John',
                    isEditable: true,
                    components: [
                        { position: 1, value: 'Doe', subComponents: [] },
                        { position: 2, value: 'John', subComponents: [] },
                    ],
                },
                {
                    position: 2,
                    value: 'Smith^Jane',
                    isEditable: true,
                    components: [
                        { position: 1, value: 'Smith', subComponents: [] },
                        { position: 2, value: 'Jane', subComponents: [] },
                    ],
                },
            ],
        },
        definition: {
            description: 'Names',
            components: {
                '1': 'Family Name',
                '2': 'Given Name',
            },
        },
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Field without definition
 */
export const WithoutDefinition: Story = {
    args: {
        field: phoneField,
        definition: null,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Repetitions with variable placeholder
 */
export const WithVariable: Story = {
    args: {
        field: {
            position: 6,
            value: 'HELPERVARIABLE~Second Value',
            isEditable: true,
            components: [],
            variableId: 'HELPERVARIABLE',
            repetitions: [
                { position: 1, value: 'HELPERVARIABLE', isEditable: true, components: [] },
                { position: 2, value: 'Second Value', isEditable: true, components: [] },
            ],
        },
        definition: {
            description: 'Identifier',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
        highlightVariable: true,
    },
};

/**
 * Empty repetitions
 */
export const EmptyRepetitions: Story = {
    args: {
        field: {
            position: 6,
            value: '~~',
            isEditable: true,
            components: [],
            repetitions: [
                { position: 1, value: '', isEditable: true, components: [] },
                { position: 2, value: '', isEditable: true, components: [] },
                { position: 3, value: '', isEditable: true, components: [] },
            ],
        },
        definition: phoneDefinition,
        onChange: (value) => console.log('Changed:', value),
    },
};

/**
 * Insurance identifiers example
 */
export const InsuranceIdentifiers: Story = {
    args: {
        field: {
            position: 2,
            value: 'INS001^Primary~INS002^Secondary~INS003^Tertiary',
            isEditable: true,
            components: [],
            repetitions: [
                {
                    position: 1,
                    value: 'INS001^Primary',
                    isEditable: true,
                    components: [
                        { position: 1, value: 'INS001', subComponents: [] },
                        { position: 2, value: 'Primary', subComponents: [] },
                    ],
                },
                {
                    position: 2,
                    value: 'INS002^Secondary',
                    isEditable: true,
                    components: [
                        { position: 1, value: 'INS002', subComponents: [] },
                        { position: 2, value: 'Secondary', subComponents: [] },
                    ],
                },
                {
                    position: 3,
                    value: 'INS003^Tertiary',
                    isEditable: true,
                    components: [
                        { position: 1, value: 'INS003', subComponents: [] },
                        { position: 2, value: 'Tertiary', subComponents: [] },
                    ],
                },
            ],
        },
        definition: {
            description: 'Insurance Plan ID',
            components: {
                '1': 'Plan ID',
                '2': 'Plan Type',
            },
        },
        onChange: (value) => console.log('Changed:', value),
    },
};
