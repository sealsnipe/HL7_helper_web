import type {
  IPersistenceService,
  IStorageAdapter,
  StorageEnvelope,
  ExportBundle,
  ImportResult,
  BackupEntry,
  StorageInfo,
  MigrationFunction,
  UserSettings,
  SerializationState,
} from '@/types/persistence';
import { StorageKey } from '@/types/persistence';
import type { Template } from '@/types/template';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import {
  createEnvelope,
  unwrapEnvelope,
  isValidEnvelope,
  verifyChecksum,
  migrateEnvelope,
} from '@/utils/storageUtils';
import {
  TemplateArraySchema,
  UserSettingsSchema,
  SerializationStateSchema,
} from '@/schemas';
import type { ZodSchema } from 'zod';

const CURRENT_VERSION = 1;
const MAX_BACKUPS_PER_KEY = 5;

/**
 * Schema map for validating data by storage key
 */
const SCHEMA_MAP: Partial<Record<StorageKey, ZodSchema>> = {
  [StorageKey.TEMPLATES]: TemplateArraySchema,
  [StorageKey.SETTINGS]: UserSettingsSchema,
  [StorageKey.SERIALIZATION_STATE]: SerializationStateSchema,
};

/**
 * Main persistence service with adapter fallback and envelope management
 */
class PersistenceService implements IPersistenceService {
  private adapter: IStorageAdapter;
  private migrations: Map<number, MigrationFunction> = new Map();

  constructor() {
    // Select adapter: IndexedDB → localStorage fallback
    const indexedDBAdapter = new IndexedDBAdapter();
    const localStorageAdapter = new LocalStorageAdapter();

    if (indexedDBAdapter.isAvailable()) {
      this.adapter = indexedDBAdapter;
      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistenceService] Using IndexedDB adapter');
      }
    } else if (localStorageAdapter.isAvailable()) {
      this.adapter = localStorageAdapter;
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PersistenceService] IndexedDB unavailable, using localStorage fallback');
      }
    } else {
      throw new Error('No storage adapter available');
    }
  }

  /**
   * Register a migration function for a specific version
   */
  registerMigration<T>(targetVersion: number, migration: MigrationFunction<T>): void {
    this.migrations.set(targetVersion, migration as MigrationFunction);
  }

  /**
   * Validate data against schema for a given storage key
   * Returns validated data or null if validation fails
   */
  private validateData<T>(key: StorageKey, data: unknown): T | null {
    const schema = SCHEMA_MAP[key];

    // No schema defined for this key - pass through without validation
    if (!schema) {
      return data as T;
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      console.warn(
        `[PersistenceService] Schema validation failed for ${key}:`,
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      );
      return null;
    }

    return result.data as T;
  }


  /**
   * Save data with automatic envelope wrapping
   */
  async save<T>(key: StorageKey, data: T): Promise<void> {
    try {
      // Create backup before overwriting (blocking for data safety)
      try {
        await this.createBackup(key);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[PersistenceService] Backup creation failed for ${key}:`, err);
        }
        // Continue with save even if backup fails
      }

      const envelope = createEnvelope(data, CURRENT_VERSION);
      await this.adapter.set(key, envelope);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PersistenceService] Saved ${key}`);
      }
    } catch (error) {
      console.error(`[PersistenceService] Error saving ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load data with automatic envelope unwrapping and validation
   */
  async load<T>(key: StorageKey): Promise<T | null> {
    try {
      const stored = await this.adapter.get<StorageEnvelope<T>>(key);

      if (!stored) {
        return null;
      }

      // Validate envelope structure
      if (!isValidEnvelope(stored)) {
        console.error(`[PersistenceService] Invalid envelope for ${key}`);
        return null;
      }

      // Verify checksum
      if (!verifyChecksum(stored)) {
        console.error(`[PersistenceService] Checksum verification failed for ${key}`);
        throw new Error(`Data corruption detected for ${key}`);
      }

      // Apply migrations if needed
      let envelope = stored;
      if (envelope.version < CURRENT_VERSION) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PersistenceService] Migrating ${key} from v${envelope.version} to v${CURRENT_VERSION}`);
        }
        envelope = migrateEnvelope(envelope, this.migrations as Map<number, MigrationFunction<T>>, CURRENT_VERSION);
        // Save migrated version
        await this.adapter.set(key, envelope);
      }

      // Unwrap envelope to get raw data
      const rawData = unwrapEnvelope(envelope);

      // Validate data against schema (returns null if validation fails)
      const validatedData = this.validateData<T>(key, rawData);

      if (validatedData === null && rawData !== null) {
        // Data exists but failed validation - log but do not crash
        console.warn(`[PersistenceService] Data for ${key} failed schema validation, returning null`);
        return null;
      }

      return validatedData;
    } catch (error) {
      console.error(`[PersistenceService] Error loading ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete data by key
   */
  async delete(key: StorageKey): Promise<void> {
    try {
      // Create backup before deleting
      await this.createBackup(key);
      await this.adapter.delete(key);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PersistenceService] Deleted ${key}`);
      }
    } catch (error) {
      console.error(`[PersistenceService] Error deleting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Export all data as bundle
   */
  async exportAll(): Promise<ExportBundle> {
    try {
      const templates = await this.adapter.get<StorageEnvelope<unknown>>(StorageKey.TEMPLATES);
      const settings = await this.adapter.get<StorageEnvelope<unknown>>(StorageKey.SETTINGS);
      const serializationState = await this.adapter.get<StorageEnvelope<unknown>>(
        StorageKey.SERIALIZATION_STATE
      );

      const bundle: ExportBundle = {
        version: CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        application: 'hl7-helper-web',
        data: {},
      };

      if (templates) bundle.data.templates = templates as StorageEnvelope<Template[]>;
      if (settings) bundle.data.settings = settings as StorageEnvelope<UserSettings>;
      if (serializationState) bundle.data.serializationState = serializationState as StorageEnvelope<SerializationState>;

      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistenceService] Export completed');
      }
      return bundle;
    } catch (error) {
      console.error('[PersistenceService] Export failed:', error);
      throw error;
    }
  }

  /**
   * Import data from bundle
   */
  async importAll(bundle: ExportBundle): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: [],
      skipped: [],
      errors: [],
    };

    try {
      // Validate bundle structure
      if (!bundle.application || bundle.application !== 'hl7-helper-web') {
        throw new Error('Invalid bundle: incorrect application identifier');
      }

      // Import each key
      for (const [key, envelope] of Object.entries(bundle.data)) {
        if (!envelope) continue;

        try {
          // Validate that key is a valid StorageKey
          const validKeys = Object.values(StorageKey);
          if (!validKeys.includes(key as StorageKey)) {
            result.skipped.push(key as StorageKey);
            continue;
          }

          const storageKey = key as StorageKey;

          // Validate envelope
          if (!isValidEnvelope(envelope)) {
            throw new Error('Invalid envelope structure');
          }

          // Verify checksum
          if (!verifyChecksum(envelope as StorageEnvelope<unknown>)) {
            throw new Error('Checksum verification failed - data may be corrupted');
          }

          // Validate data payload against schema
          const schema = SCHEMA_MAP[storageKey];
          if (schema) {
            const validationResult = schema.safeParse(envelope.data);
            if (!validationResult.success) {
              const errorMessages = validationResult.error.issues
                .map((i) => `${i.path.join('.')}: ${i.message}`)
                .join('; ');
              throw new Error(`Data validation failed: ${errorMessages}`);
            }
          }

          // Apply migrations if needed
          let targetEnvelope: StorageEnvelope<unknown> = envelope;
          if (envelope.version < CURRENT_VERSION) {
            targetEnvelope = migrateEnvelope(envelope, this.migrations as Map<number, MigrationFunction>, CURRENT_VERSION);
          }

          await this.adapter.set(storageKey, targetEnvelope);
          result.imported.push(storageKey);
        } catch (error) {
          result.success = false;
          result.errors.push({
            key: key as StorageKey,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistenceService] Import completed:', result);
      }
      return result;
    } catch (error) {
      console.error('[PersistenceService] Import failed:', error);
      result.success = false;
      throw error;
    }
  }

  /**
   * Create backup for a key
   */
  private async createBackup(key: StorageKey): Promise<void> {
    try {
      const data = await this.adapter.get<StorageEnvelope<unknown>>(key);
      if (!data) return;

      const backupId = `${key}_${Date.now()}`;
      const backup: BackupEntry = {
        id: backupId,
        key,
        timestamp: new Date().toISOString(),
        envelope: data,
      };

      // Get existing backups
      const backupsKey = `${StorageKey.BACKUPS}:${key}`;
      const existingBackups = await this.adapter.get<BackupEntry[]>(backupsKey) || [];

      // Add new backup and keep only last N
      const updatedBackups = [backup, ...existingBackups].slice(0, MAX_BACKUPS_PER_KEY);

      await this.adapter.set(backupsKey, updatedBackups);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[PersistenceService] Backup creation failed for ${key}:`, error);
      }
      // Don't throw - backup failure shouldn't block main operation
    }
  }

  /**
   * Get backups for a specific key
   */
  async getBackups(key: StorageKey): Promise<BackupEntry[]> {
    const backupsKey = `${StorageKey.BACKUPS}:${key}`;
    return await this.adapter.get<BackupEntry[]>(backupsKey) || [];
  }

  /**
   * Restore from backup
   */
  async restoreBackup(key: StorageKey, backupId: string): Promise<void> {
    try {
      const backups = await this.getBackups(key);
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      await this.adapter.set(key, backup.envelope);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PersistenceService] Restored ${key} from backup ${backupId}`);
      }
    } catch (error) {
      console.error(`[PersistenceService] Restore failed:`, error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    try {
      await this.adapter.clear();
      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistenceService] All data cleared');
      }
    } catch (error) {
      console.error('[PersistenceService] Clear failed:', error);
      throw error;
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const adapterType = this.adapter instanceof IndexedDBAdapter ? 'indexeddb' : 'localstorage';

      // Estimate storage usage (simplified)
      let quotaLimit = 0;
      let usedSpace = 0;

      if (typeof window !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quotaLimit = estimate.quota || 0;
        usedSpace = estimate.usage || 0;
      } else {
        // Fallback for browsers without Storage API
        quotaLimit = adapterType === 'indexeddb' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        usedSpace = 0; // Can't estimate accurately
      }

      return {
        availableSpace: quotaLimit - usedSpace,
        usedSpace,
        quotaLimit,
        adapterType,
      };
    } catch (error) {
      console.error('[PersistenceService] Storage info failed:', error);
      throw error;
    }
  }
}

// Singleton instance (lazy initialization for SSR safety)
let _instance: PersistenceService | null = null;

/**
 * Get singleton instance of PersistenceService
 * Throws error if called in SSR context (no window available)
 */
export function getPersistenceService(): PersistenceService {
  if (typeof window === 'undefined') {
    throw new Error('PersistenceService can only be used in browser environment');
  }
  if (!_instance) {
    _instance = new PersistenceService();
  }
  return _instance;
}
