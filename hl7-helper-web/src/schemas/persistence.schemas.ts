/**
 * Zod schemas for Persistence types
 * Matches src/types/persistence.ts
 */
import { z } from 'zod';
import { TemplateArraySchema } from './template.schemas';
import { SerializationStateSchema } from './serialization.schemas';

/**
 * Schema for UserSettings
 */
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  autoSave: z.boolean().optional(),
  backupEnabled: z.boolean().optional(),
});

/**
 * Generic schema factory for StorageEnvelope<T>
 * Creates a schema that wraps any data type with envelope metadata
 */
export function createStorageEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    version: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    checksum: z.string(),
    data: dataSchema,
  });
}

/**
 * Pre-built envelope schemas for common types
 */
export const TemplatesEnvelopeSchema = createStorageEnvelopeSchema(TemplateArraySchema);
export const SettingsEnvelopeSchema = createStorageEnvelopeSchema(UserSettingsSchema);
export const SerializationStateEnvelopeSchema = createStorageEnvelopeSchema(SerializationStateSchema);

/**
 * Schema for ExportBundle
 */
export const ExportBundleSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  application: z.literal('hl7-helper-web'),
  data: z.object({
    templates: TemplatesEnvelopeSchema.optional(),
    settings: SettingsEnvelopeSchema.optional(),
    serializationState: SerializationStateEnvelopeSchema.optional(),
  }),
});

/**
 * Schema for StorageKey enum values
 */
export const StorageKeySchema = z.enum([
  'templates',
  'settings',
  'serializationState',
  'backups',
]);

/**
 * Schema for ImportResult
 */
export const ImportResultSchema = z.object({
  success: z.boolean(),
  imported: z.array(StorageKeySchema),
  skipped: z.array(StorageKeySchema),
  errors: z.array(
    z.object({
      key: StorageKeySchema,
      error: z.string(),
    })
  ),
});

/**
 * Schema for BackupEntry
 */
export const BackupEntrySchema = z.object({
  id: z.string(),
  key: StorageKeySchema,
  timestamp: z.string(),
  envelope: z.object({
    version: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    checksum: z.string(),
    data: z.unknown(),
  }),
});

/**
 * Schema for StorageInfo
 */
export const StorageInfoSchema = z.object({
  availableSpace: z.number(),
  usedSpace: z.number(),
  quotaLimit: z.number(),
  adapterType: z.enum(['indexeddb', 'localstorage']),
});
