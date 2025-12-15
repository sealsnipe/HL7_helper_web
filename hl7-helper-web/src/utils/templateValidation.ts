import { Template } from '@/types/template';
import { getPersistenceService } from '@/services/persistence';
import { StorageKey } from '@/types/persistence';

/**
 * Type guard to validate a single Template object
 */
function isValidTemplate(obj: unknown): obj is Template {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const t = obj as Record<string, unknown>;

  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.messageType === 'string' &&
    typeof t.content === 'string' &&
    typeof t.createdAt === 'number'
  );
}

/**
 * Type guard to validate an array of Template objects
 */
function isValidTemplateArray(data: unknown): data is Template[] {
  return Array.isArray(data) && data.every(isValidTemplate);
}

/**
 * Load templates from persistence storage
 * Returns empty array if data is invalid or missing
 *
 * @returns Promise resolving to array of templates
 */
export async function loadTemplatesFromStorage(): Promise<Template[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const service = getPersistenceService();
    const templates = await service.load<Template[]>(StorageKey.TEMPLATES);

    if (!templates) {
      return [];
    }

    // Validate loaded data
    if (!isValidTemplateArray(templates)) {
      console.warn('Invalid template data in storage, clearing...');
      await service.delete(StorageKey.TEMPLATES);
      return [];
    }

    return templates;
  } catch (error) {
    console.error('Failed to load templates from storage:', error);
    return [];
  }
}

/**
 * Save templates to persistence storage
 *
 * @param templates - Array of templates to save
 * @throws Error if save operation fails
 */
export async function saveTemplatesToStorage(templates: Template[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const service = getPersistenceService();
    await service.save(StorageKey.TEMPLATES, templates);
  } catch (error) {
    console.error('Failed to save templates to storage:', error);
    throw error;
  }
}
