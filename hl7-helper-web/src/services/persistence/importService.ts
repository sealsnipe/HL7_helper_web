import { getPersistenceService } from './PersistenceService';
import type { ExportBundle, ImportResult } from '@/types/persistence';
import {
  TemplateArraySchema,
  UserSettingsSchema,
  SerializationStateSchema,
} from '@/schemas';

/**
 * Parse import file to ExportBundle
 */
export async function parseImportFile(file: File): Promise<ExportBundle> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as unknown;

        // Validate basic structure before casting
        if (!parsed || typeof parsed !== 'object') {
          reject(new Error('Failed to parse import file: Invalid JSON structure'));
          return;
        }

        const bundle = parsed as ExportBundle;
        resolve(bundle);
      } catch {
        reject(new Error('Failed to parse import file: Invalid JSON'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read import file'));
    reader.readAsText(file);
  });
}

/**
 * Validation result for import bundle
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    templatesCount: number;
    hasSettings: boolean;
    hasSerializationState: boolean;
    exportedAt: string;
    version: number;
  };
}

/**
 * Validate import bundle structure and content
 */
export function validateImportBundle(bundle: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic type check
  if (!bundle || typeof bundle !== 'object') {
    return {
      valid: false,
      errors: ['Invalid bundle: not an object'],
      warnings,
      summary: {
        templatesCount: 0,
        hasSettings: false,
        hasSerializationState: false,
        exportedAt: '',
        version: 0
      }
    };
  }

  const b = bundle as Record<string, unknown>;

  // Required fields
  if (b.application !== 'hl7-helper-web') {
    errors.push('Invalid application identifier');
  }

  if (typeof b.version !== 'number') {
    errors.push('Missing or invalid version');
  }

  if (typeof b.exportedAt !== 'string') {
    errors.push('Missing export timestamp');
  }

  if (!b.data || typeof b.data !== 'object') {
    errors.push('Missing data section');
  }

  // Count data items
  const data = (b.data || {}) as Record<string, unknown>;
  const templates = data.templates as { data?: unknown[] } | undefined;
  const templatesCount = Array.isArray(templates?.data) ? templates.data.length : 0;

  // Deep validation of data payloads using Zod schemas
  if (data.templates && typeof data.templates === 'object') {
    const templatesEnvelope = data.templates as { data?: unknown };
    if (templatesEnvelope.data) {
      const result = TemplateArraySchema.safeParse(templatesEnvelope.data);
      if (!result.success) {
        errors.push(`Invalid templates data: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
      }
    }
  }

  if (data.settings && typeof data.settings === 'object') {
    const settingsEnvelope = data.settings as { data?: unknown };
    if (settingsEnvelope.data) {
      const result = UserSettingsSchema.safeParse(settingsEnvelope.data);
      if (!result.success) {
        errors.push(`Invalid settings data: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
      }
    }
  }

  if (data.serializationState && typeof data.serializationState === 'object') {
    const serializationEnvelope = data.serializationState as { data?: unknown };
    if (serializationEnvelope.data) {
      const result = SerializationStateSchema.safeParse(serializationEnvelope.data);
      if (!result.success) {
        errors.push(`Invalid serialization state: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
      }
    }
  }

  // Warnings
  if (templatesCount === 0) {
    warnings.push('No templates in bundle');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      templatesCount,
      hasSettings: !!data.settings,
      hasSerializationState: !!data.serializationState,
      exportedAt: String(b.exportedAt || ''),
      version: Number(b.version || 0),
    },
  };
}

/**
 * Import bundle into storage
 */
export async function importBundle(bundle: ExportBundle): Promise<ImportResult> {
  const service = getPersistenceService();
  return service.importAll(bundle);
}

/**
 * Full import flow: parse, validate, import
 */
export async function importFromFile(file: File): Promise<{ validation: ValidationResult; result?: ImportResult }> {
  const bundle = await parseImportFile(file);
  const validation = validateImportBundle(bundle);

  if (!validation.valid) {
    return { validation };
  }

  const result = await importBundle(bundle);
  return { validation, result };
}
