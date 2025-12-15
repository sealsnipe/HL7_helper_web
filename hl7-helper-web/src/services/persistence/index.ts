/**
 * Persistence module barrel export
 */
export { getPersistenceService } from './PersistenceService';
export { IndexedDBAdapter } from './IndexedDBAdapter';
export { LocalStorageAdapter } from './LocalStorageAdapter';
export { createExportBundle, downloadAsJson, exportAndDownload } from './exportService';
export { parseImportFile, validateImportBundle, importBundle, importFromFile, type ValidationResult } from './importService';
export { runMigrations, migrateV0Templates } from './migrations';
export type {
  IPersistenceService,
  IStorageAdapter,
  StorageEnvelope,
  ExportBundle,
  ImportResult,
  BackupEntry,
  StorageInfo,
  UserSettings,
  SerializationState,
} from '@/types/persistence';
export { StorageKey } from '@/types/persistence';
