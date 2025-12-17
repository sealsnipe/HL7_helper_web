/**
 * Zod Schemas for Runtime Validation
 *
 * This module provides Zod schemas for validating data at runtime,
 * particularly for data loaded from localStorage/IndexedDB and imported files.
 *
 * Usage:
 * - Import schemas to validate external data
 * - Use safeParse() for non-throwing validation
 * - Schemas match TypeScript types in src/types/
 */

// DTO schemas
export {
  ComponentDtoSchema,
  FieldDtoSchema,
  SegmentDtoSchema,
  SegmentDtoArraySchema,
  SimpleSerializationInstanceSchema,
  GenerateRequestSchema,
  FieldDefinitionSchema,
  SegmentDefinitionSchema,
  Hl7DefinitionSchema,
} from './dto.schemas';

// Template schemas
export { TemplateSchema, TemplateArraySchema } from './template.schemas';

// Serialization schemas
export {
  ViewModeSchema,
  SerializationInstanceSchema,
  UniqueVariableSchema,
  SerializationStateSchema,
  InstanceOutputSchema,
} from './serialization.schemas';

// Persistence schemas
export {
  UserSettingsSchema,
  createStorageEnvelopeSchema,
  TemplatesEnvelopeSchema,
  SettingsEnvelopeSchema,
  SerializationStateEnvelopeSchema,
  ExportBundleSchema,
  StorageKeySchema,
  ImportResultSchema,
  BackupEntrySchema,
  StorageInfoSchema,
} from './persistence.schemas';

/**
 * Validation helper for safe parsing with logging
 * Returns null if validation fails, logs warning in development
 */
export function safeValidate<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { message: string } } },
  data: unknown,
  context: string
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Validation] ${context} failed:`, result.error?.message);
    }
    return null;
  }

  return result.data as T;
}

/**
 * Validation helper that throws on failure (for cases where invalid data is critical)
 */
export function strictValidate<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    throw new Error(`[Validation] ${context} failed: ${message}`);
  }
}
