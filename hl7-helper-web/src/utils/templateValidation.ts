import { Template } from '@/types/template';

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
 * Safely load templates from localStorage with validation
 * Returns empty array if data is invalid or missing
 * Clears corrupted data automatically
 */
export function loadTemplatesFromStorage(): Template[] {
  try {
    const stored = localStorage.getItem('hl7_templates');
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!isValidTemplateArray(parsed)) {
      console.warn('Invalid template data in localStorage, clearing...');
      localStorage.removeItem('hl7_templates');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse templates from localStorage:', error);
    localStorage.removeItem('hl7_templates');
    return [];
  }
}

/**
 * Safely save templates to localStorage
 */
export function saveTemplatesToStorage(templates: Template[]): void {
  try {
    localStorage.setItem('hl7_templates', JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save templates to localStorage:', error);
  }
}
