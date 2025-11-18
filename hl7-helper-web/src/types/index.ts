export interface FieldDto {
    position: number;
    value: string;
    isEditable: boolean;
}

export interface SegmentDto {
    name: string;
    fields: FieldDto[];
}

export interface GenerateRequest {
    originalHl7: string;
    segments: SegmentDto[];
}
