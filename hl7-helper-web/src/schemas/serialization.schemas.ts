/**
 * Zod schemas for Serialization types
 * Matches src/types/serialization.ts
 */
import { z } from 'zod';
import { SegmentDtoSchema } from './dto.schemas';

/**
 * Schema for ViewMode
 */
export const ViewModeSchema = z.enum(['variables-only', 'all-fields']);

/**
 * Schema for SerializationInstance (from serialization.ts)
 * This is the more detailed version with name, createdAt, isExpanded
 */
export const SerializationInstanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  variableValues: z.record(z.string(), z.string()),
  createdAt: z.number(),
  isExpanded: z.boolean(),
});

/**
 * Schema for UniqueVariable
 */
export const UniqueVariableSchema = z.object({
  variableId: z.string(),
  groupId: z.number().optional(),
  occurrenceCount: z.number(),
  fieldPositions: z.array(z.string()),
});

/**
 * Schema for SerializationState (from serialization.ts)
 * Full state for the serialization page
 */
export const SerializationStateSchema = z.object({
  instances: z.array(SerializationInstanceSchema),
  selectedTemplateId: z.string(),
  currentTemplateContent: z.string(),
  parsedSegments: z.array(SegmentDtoSchema),
  uniqueVariables: z.array(UniqueVariableSchema),
  viewMode: ViewModeSchema,
});

/**
 * Schema for InstanceOutput
 */
export const InstanceOutputSchema = z.object({
  instanceId: z.string(),
  segments: z.array(SegmentDtoSchema),
  serializedHl7: z.string(),
  hasUnfilledVariables: z.boolean(),
});
