/**
 * Zod schemas for DTO types (SegmentDto, FieldDto, ComponentDto)
 * These validate data loaded from localStorage/IndexedDB
 */
import { z } from 'zod';

/**
 * Schema for ComponentDto
 * Recursive structure for HL7 components and subcomponents
 */
export const ComponentDtoSchema: z.ZodType<{
  position: number;
  value: string;
  subComponents: unknown[];
}> = z.lazy(() =>
  z.object({
    position: z.number(),
    value: z.string(),
    subComponents: z.array(ComponentDtoSchema),
  })
);

/**
 * Schema for FieldDto
 * Includes optional repetitions (recursive) and variable linking
 */
export const FieldDtoSchema: z.ZodType<{
  position: number;
  value: string;
  isEditable: boolean;
  components: unknown[];
  repetitions?: unknown[];
  variableId?: string;
  variableGroupId?: number;
}> = z.lazy(() =>
  z.object({
    position: z.number(),
    value: z.string(),
    isEditable: z.boolean(),
    components: z.array(ComponentDtoSchema),
    repetitions: z.array(FieldDtoSchema).optional(),
    variableId: z.string().optional(),
    variableGroupId: z.number().optional(),
  })
);

/**
 * Schema for SegmentDto
 */
export const SegmentDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FieldDtoSchema),
});

/**
 * Schema for array of SegmentDto
 */
export const SegmentDtoArraySchema = z.array(SegmentDtoSchema);

/**
 * Schema for SerializationInstance from src/types/index.ts
 * Note: This is the simpler version used in the main types
 */
export const SimpleSerializationInstanceSchema = z.object({
  id: z.string(),
  segments: z.array(SegmentDtoSchema),
  output: z.string(),
  copyButtonText: z.string(),
  variableValues: z.record(z.string(), z.string()),
});

/**
 * Schema for GenerateRequest
 */
export const GenerateRequestSchema = z.object({
  originalHl7: z.string(),
  segments: z.array(SegmentDtoSchema),
});

/**
 * Schema for FieldDefinition
 */
export const FieldDefinitionSchema = z.object({
  description: z.string(),
  components: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema for SegmentDefinition
 */
export const SegmentDefinitionSchema = z.object({
  description: z.string(),
  fields: z.record(z.string(), FieldDefinitionSchema),
});

/**
 * Schema for Hl7Definition
 */
export const Hl7DefinitionSchema = z.object({
  messageType: z.string(),
  description: z.string(),
  segments: z.record(z.string(), SegmentDefinitionSchema),
});
