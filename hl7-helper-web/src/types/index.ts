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
}

export interface SegmentDto {
    id: string;
    name: string;
    fields: FieldDto[];
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
