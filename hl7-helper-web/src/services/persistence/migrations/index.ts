import { getPersistenceService } from '../PersistenceService';
import { StorageKey } from '@/types/persistence';
import type { Template } from '@/types/template';

const MIGRATION_KEY = 'hl7-helper:migrations';
const OLD_TEMPLATES_KEY = 'hl7_templates';

interface MigrationStatus {
  v1_templates_migrated: boolean;
}

/**
 * Check if a specific migration has run
 */
function getMigrationStatus(): MigrationStatus {
  if (typeof window === 'undefined') {
    return { v1_templates_migrated: false };
  }

  try {
    const status = localStorage.getItem(MIGRATION_KEY);
    return status ? JSON.parse(status) : { v1_templates_migrated: false };
  } catch {
    return { v1_templates_migrated: false };
  }
}

/**
 * Mark a migration as complete
 */
function setMigrationComplete(key: keyof MigrationStatus): void {
  if (typeof window === 'undefined') return;

  const status = getMigrationStatus();
  status[key] = true;
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
}

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
 * Migrate v0 templates from raw localStorage to PersistenceService
 *
 * This migration:
 * - Reads templates from old localStorage key 'hl7_templates'
 * - Validates the data structure
 * - Saves to new PersistenceService with envelope wrapping
 * - Verifies save succeeded
 * - Marks migration complete BEFORE removing old data (data safety)
 * - Removes old localStorage key on success
 * - Only runs once (tracked via migration status)
 *
 * @returns true if migration was performed, false if already done or nothing to migrate
 */
export async function migrateV0Templates(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const status = getMigrationStatus();
  if (status.v1_templates_migrated) {
    return false; // Already migrated
  }

  try {
    const oldData = localStorage.getItem(OLD_TEMPLATES_KEY);
    if (!oldData) {
      // No old data to migrate, mark as complete
      setMigrationComplete('v1_templates_migrated');
      return false;
    }

    // Parse and validate old data
    let templates: Template[];
    try {
      const parsed: unknown = JSON.parse(oldData);
      if (!isValidTemplateArray(parsed)) {
        console.warn('[Migration] Invalid template data in old storage, skipping migration');
        setMigrationComplete('v1_templates_migrated');
        return false;
      }
      templates = parsed;
    } catch (parseError) {
      console.error('[Migration] Failed to parse old template data:', parseError);
      setMigrationComplete('v1_templates_migrated');
      return false;
    }

    if (templates.length === 0) {
      // Empty array, nothing to migrate
      setMigrationComplete('v1_templates_migrated');
      localStorage.removeItem(OLD_TEMPLATES_KEY);
      return false;
    }

    // Save to new system
    const service = getPersistenceService();
    await service.save(StorageKey.TEMPLATES, templates);

    // Verify save succeeded
    const verified = await service.load<Template[]>(StorageKey.TEMPLATES);
    if (!verified || verified.length !== templates.length) {
      throw new Error('Migration verification failed - data not saved correctly');
    }

    // Mark migration complete FIRST (before removing old data)
    // This ensures if app crashes after this point, we won't retry migration
    setMigrationComplete('v1_templates_migrated');

    // Remove old data only after successful save and marking complete
    localStorage.removeItem(OLD_TEMPLATES_KEY);

    console.log(`[Migration] Successfully migrated ${templates.length} templates to new persistence system`);
    return true;
  } catch (error) {
    console.error('[Migration] Failed to migrate templates:', error);
    // Don't mark as complete so it will retry next time
    // Old data remains in localStorage for safety
    return false;
  }
}

/**
 * Run all pending migrations
 * Call this on app startup before loading any data
 *
 * This function is safe to call multiple times - migrations
 * that have already run will be skipped.
 */
export async function runMigrations(): Promise<void> {
  try {
    await migrateV0Templates();
  } catch (error) {
    console.error('[Migration] Error running migrations:', error);
    // Don't throw - allow app to continue even if migration fails
  }
}
