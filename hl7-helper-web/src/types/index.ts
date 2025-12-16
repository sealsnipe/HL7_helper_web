export interface ComponentDto {
    position: number;
    value: string;
    subComponents: ComponentDto[];
}

export interface FieldDto {
    position: number;
    value: string;
    isEditable: boolean;
    components: ComponentDto[];
    repetitions?: FieldDto[];
    // Linked variable support
    variableId?: string;       // e.g., "HELPERVARIABLE1" or "HELPERVARIABLE"
    variableGroupId?: number;  // undefined for standalone, 1-999 for linked groups
}

export interface SegmentDto {
    id: string;
    name: string;
    fields: FieldDto[];
}

export interface SerializationInstance {
    /** Instance ID (use createInstanceId() from serialization.ts to create branded IDs) */
    id: string;
    segments: SegmentDto[];
    output: string;
    copyButtonText: string;
    /** Variable values for this instance (variableId -> value) */
    variableValues: Record<string, string>;
}

export interface GenerateRequest {
    originalHl7: string;
    segments: SegmentDto[];
}

export interface FieldDefinition {
    description: string;
    components?: Record<string, string>;
}

export interface SegmentDefinition {
    description: string;
    fields: Record<string, FieldDefinition>;
}

export interface Hl7Definition {
    messageType: string;
    description: string;
    segments: Record<string, SegmentDefinition>;
}
