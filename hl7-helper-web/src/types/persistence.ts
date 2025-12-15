import type { Template } from './template';

/**
 * Storage keys enum for type-safe access
 */
export enum StorageKey {
  TEMPLATES = 'templates',
  SETTINGS = 'settings',
  SERIALIZATION_STATE = 'serializationState',
  BACKUPS = 'backups',
}

/**
 * Storage envelope that wraps all persisted data with metadata
 * @template T - The type of data being stored
 */
export interface StorageEnvelope<T> {
  /** Schema version for migration support */
  version: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Checksum for data integrity verification */
  checksum: string;
  /** Actual data payload */
  data: T;
}

/**
 * Export bundle for user-controlled backups
 */
export interface ExportBundle {
  /** Bundle format version */
  version: number;
  /** ISO timestamp of export */
  exportedAt: string;
  /** Application identifier */
  application: 'hl7-helper-web';
  /** Exported data with envelopes */
  data: {
    templates?: StorageEnvelope<Template[]>;
    settings?: StorageEnvelope<UserSettings>;
    serializationState?: StorageEnvelope<SerializationState>;
  };
}

/**
 * Backup entry for internal backup tracking
 */
export interface BackupEntry {
  /** Unique backup identifier */
  id: string;
  /** Storage key this backup belongs to */
  key: StorageKey;
  /** ISO timestamp of backup creation */
  timestamp: string;
  /** The backed-up envelope */
  envelope: StorageEnvelope<unknown>;
}

/**
 * Storage information for quota monitoring
 */
export interface StorageInfo {
  /** Available space in bytes (estimated) */
  availableSpace: number;
  /** Used space in bytes (estimated) */
  usedSpace: number;
  /** Total quota limit in bytes */
  quotaLimit: number;
  /** Active storage adapter type */
  adapterType: 'indexeddb' | 'localstorage';
}

/**
 * Result of import operation
 */
export interface ImportResult {
  /** Overall success status */
  success: boolean;
  /** Keys that were successfully imported */
  imported: StorageKey[];
  /** Keys that were skipped */
  skipped: StorageKey[];
  /** Errors encountered during import */
  errors: Array<{ key: StorageKey; error: string }>;
}

/**
 * Migration function type for schema upgrades
 * @template T - The data type being migrated
 */
export type MigrationFunction<T = unknown> = (data: T, fromVersion: number) => T;

/**
 * Storage adapter interface for abstracting storage backends
 */
export interface IStorageAdapter {
  /** Get a value by key */
  get<T>(key: string): Promise<T | null>;
  /** Set a value by key */
  set<T>(key: string, value: T): Promise<void>;
  /** Delete a value by key */
  delete(key: string): Promise<void>;
  /** Get all storage keys */
  getAllKeys(): Promise<string[]>;
  /** Clear all storage */
  clear(): Promise<void>;
  /** Check if adapter is available in current environment */
  isAvailable(): boolean;
}

/**
 * Main persistence service interface
 */
export interface IPersistenceService {
  /** Save data with automatic envelope wrapping */
  save<T>(key: StorageKey, data: T): Promise<void>;
  /** Load data with automatic envelope unwrapping and validation */
  load<T>(key: StorageKey): Promise<T | null>;
  /** Delete data by key */
  delete(key: StorageKey): Promise<void>;
  /** Export all data as bundle */
  exportAll(): Promise<ExportBundle>;
  /** Import data from bundle */
  importAll(bundle: ExportBundle): Promise<ImportResult>;
  /** Get backups for a specific key */
  getBackups(key: StorageKey): Promise<BackupEntry[]>;
  /** Restore from backup */
  restoreBackup(key: StorageKey, backupId: string): Promise<void>;
  /** Clear all data */
  clearAll(): Promise<void>;
  /** Get storage information */
  getStorageInfo(): Promise<StorageInfo>;
}

/**
 * User settings type (placeholder for now)
 */
export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  autoSave?: boolean;
  backupEnabled?: boolean;
}

/**
 * Serialization state type (placeholder - will be defined in Phase 4)
 */
export interface SerializationState {
  instances?: unknown[];
  variables?: Record<string, string>;
  lastUpdated?: string;
}
