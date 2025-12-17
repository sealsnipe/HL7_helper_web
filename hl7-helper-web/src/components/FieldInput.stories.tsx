import type { Meta, StoryObj } from '@storybook/react';
import { FieldInput } from './FieldInput';

const meta: Meta<typeof FieldInput> = {
    title: 'Components/FieldInput',
    component: FieldInput,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
The FieldInput component is a router that renders the appropriate field type:
- **SimpleField**: For basic single-value fields
- **CompositeField**: For fields with components (^ separated)
- **RepetitionField**: For fields with repetitions (~ separated)

The component automatically detects the field type based on the presence of \`components\` or \`repetitions\` arrays.
                `,
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FieldInput>;

/**
 * Simple field - routes to SimpleField
 */
export const SimpleFieldRouting: Story = {
    args: {
        field: {
            position: 3,
            value: 'Simple Value',
            isEditable: true,
            components: [],
        },
        definition: {
            description: 'Patient ID',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
    parameters: {
        docs: {
            description: {
                story: 'When field has no components or repetitions, FieldInput routes to SimpleField.',
            },
        },
    },
};

/**
 * Composite field - routes to CompositeField
 */
export const CompositeFieldRouting: Story = {
    args: {
        field: {
            position: 5,
            value: 'Doe^John^M',
            isEditable: true,
            components: [
                { position: 1, value: 'Doe', subComponents: [] },
                { position: 2, value: 'John', subComponents: [] },
                { position: 3, value: 'M', subComponents: [] },
            ],
        },
        definition: {
            description: 'Patient Name',
            components: {
                '1': 'Family Name',
                '2': 'Given Name',
                '3': 'Middle Name',
            },
        },
        onChange: (value, updatedField) => console.log('Changed:', value, updatedField),
    },
    parameters: {
        docs: {
            description: {
                story: 'When field has components array with items, FieldInput routes to CompositeField.',
            },
        },
    },
};

/**
 * Repetition field - routes to RepetitionField
 */
export const RepetitionFieldRouting: Story = {
    args: {
        field: {
            position: 13,
            value: '555-1234~555-5678',
            isEditable: true,
            components: [],
            repetitions: [
                { position: 1, value: '555-1234', isEditable: true, components: [] },
                { position: 2, value: '555-5678', isEditable: true, components: [] },
            ],
        },
        definition: {
            description: 'Phone Number',
            components: {},
        },
        onChange: (value) => console.log('Changed:', value),
    },
    parameters: {
        docs: {
            description: {
                story: 'When field has repetitions array with items, FieldInput routes to RepetitionField. Repetitions take priority over components.',
            },
        },
    },
};

/**
 * All field types showcase
 */
export const AllFieldTypes: Story = {
    render: () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Simple Field</h3>
                <FieldInput
                    field={{
                        position: 3,
                        value: 'Patient123',
                        isEditable: true,
                        components: [],
                    }}
                    definition={{
                        description: 'Patient ID',
                        components: {},
                    }}
                    onChange={(value) => console.log('Simple changed:', value)}
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Composite Field</h3>
                <FieldInput
                    field={{
                        position: 5,
                        value: 'Doe^John^M',
                        isEditable: true,
                        components: [
                            { position: 1, value: 'Doe', subComponents: [] },
                            { position: 2, value: 'John', subComponents: [] },
                            { position: 3, value: 'M', subComponents: [] },
                        ],
                    }}
                    definition={{
                        description: 'Patient Name',
                        components: {
                            '1': 'Family Name',
                            '2': 'Given Name',
                            '3': 'Middle Initial',
                        },
                    }}
                    onChange={(value) => console.log('Composite changed:', value)}
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Repetition Field</h3>
                <FieldInput
                    field={{
                        position: 13,
                        value: '555-1234~555-5678',
                        isEditable: true,
                        components: [],
                        repetitions: [
                            { position: 1, value: '555-1234', isEditable: true, components: [] },
                            { position: 2, value: '555-5678', isEditable: true, components: [] },
                        ],
                    }}
                    definition={{
                        description: 'Phone Numbers',
                        components: {},
                    }}
                    onChange={(value) => console.log('Repetition changed:', value)}
                />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Comparison of all three field types rendered by FieldInput.',
            },
        },
    },
};

/**
 * Read-only states
 */
export const ReadOnlyStates: Story = {
    render: () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Read-only Simple Field (MSH-1)</h3>
                <FieldInput
                    field={{
                        position: 1,
                        value: '|',
                        isEditable: false,
                        components: [],
                    }}
                    definition={{
                        description: 'Field Separator',
                        components: {},
                    }}
                    onChange={(value) => console.log('Changed:', value)}
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Read-only Composite Field</h3>
                <FieldInput
                    field={{
                        position: 5,
                        value: 'Doe^John',
                        isEditable: false,
                        components: [
                            { position: 1, value: 'Doe', subComponents: [] },
                            { position: 2, value: 'John', subComponents: [] },
                        ],
                    }}
                    definition={{
                        description: 'Patient Name',
                        components: {},
                    }}
                    onChange={(value) => console.log('Changed:', value)}
                />
            </div>
        </div>
    ),
};

/**
 * Variable highlighting mode
 */
export const VariableHighlighting: Story = {
    render: () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Simple Field with Variable</h3>
                <FieldInput
                    field={{
                        position: 3,
                        value: 'HELPERVARIABLE',
                        isEditable: true,
                        components: [],
                        variableId: 'HELPERVARIABLE',
                        variableGroupId: 0,
                    }}
                    definition={{
                        description: 'Patient ID',
                        components: {},
                    }}
                    onChange={(value) => console.log('Changed:', value)}
                    highlightVariable={true}
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Linked Variables (same group)</h3>
                <div className="space-y-2">
                    <FieldInput
                        field={{
                            position: 3,
                            value: 'John',
                            isEditable: true,
                            components: [],
                            variableId: 'HELPERVARIABLE1',
                            variableGroupId: 1,
                        }}
                        definition={{
                            description: 'First Name',
                            components: {},
                        }}
                        onChange={(value) => console.log('Changed:', value)}
                        highlightVariable={true}
                        variableValues={new Map([['HELPERVARIABLE1', 'John']])}
                        onVariableChange={(id, value) => console.log('Variable:', id, value)}
                    />
                    <FieldInput
                        field={{
                            position: 8,
                            value: 'John',
                            isEditable: true,
                            components: [],
                            variableId: 'HELPERVARIABLE1',
                            variableGroupId: 1,
                        }}
                        definition={{
                            description: 'Duplicate First Name',
                            components: {},
                        }}
                        onChange={(value) => console.log('Changed:', value)}
                        highlightVariable={true}
                        variableValues={new Map([['HELPERVARIABLE1', 'John']])}
                        onVariableChange={(id, value) => console.log('Variable:', id, value)}
                    />
                </div>
            </div>
        </div>
    ),
};
