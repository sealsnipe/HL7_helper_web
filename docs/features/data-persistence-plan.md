# Data Persistence System - Comprehensive Plan

## Executive Summary

This document outlines a robust data persistence architecture for HL7 Helper Web that ensures **zero data loss** while keeping the solution lightweight and avoiding server burden.

### Current State Problems
- All data stored in browser localStorage only (single point of failure)
- No backup/export mechanism
- No recovery from corrupted data
- Inconsistent storage API usage
- No cross-device synchronization
- Serialization page state lost on refresh

### Solution Overview
A **multi-tier persistence architecture** that:
1. Uses IndexedDB as primary client-side storage (more reliable than localStorage)
2. Falls back to localStorage for older browsers
3. Provides user-controlled Export/Import for backups
4. Adds optional server-side backup using lightweight JSON file storage
5. Implements proper versioning, validation, and recovery mechanisms

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │    User Action      │
                              │ (Save/Load/Export)  │
                              └──────────┬──────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE SERVICE LAYER                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  PersistenceService (src/services/persistence/PersistenceService.ts)      │  │
│  │  - Unified API for all storage operations                                 │  │
│  │  - save<T>(key, data), load<T>(key), delete(key), export(), import()     │  │
│  │  - Handles versioning, validation, error recovery                         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│   PRIMARY STORAGE     │  │   BACKUP STORAGE      │  │   EXPORT/IMPORT       │
│   (IndexedDB)         │  │   (Server Files)      │  │   (User Files)        │
├───────────────────────┤  ├───────────────────────┤  ├───────────────────────┤
│ - Large capacity      │  │ - Optional feature    │  │ - JSON download       │
│ - Async API           │  │ - /api/backup routes  │  │ - File upload         │
│ - Structured data     │  │ - JSON files in       │  │ - Cross-device        │
│ - Transaction support │  │   /data/backups/      │  │   transfer            │
│                       │  │ - Per-session backup  │  │ - Version migration   │
│ FALLBACK:             │  │ - No authentication   │  │                       │
│ - localStorage        │  │   (local dev only)    │  │                       │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘


                              DATA SCHEMA VERSIONING
┌─────────────────────────────────────────────────────────────────────────────────┐
│  StorageEnvelope<T> {                                                           │
│    version: number;           // Schema version for migrations                  │
│    createdAt: string;         // ISO timestamp                                  │
│    updatedAt: string;         // ISO timestamp                                  │
│    checksum: string;          // Data integrity verification                   │
│    data: T;                   // Actual payload                                │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Meta Layer: Architectural Decisions

### Decision 1: Client-First with Optional Server Backup

**Choice**: IndexedDB primary, localStorage fallback, optional server file backup

**Rationale**:
- IndexedDB has ~50MB+ storage (vs localStorage's 5-10MB)
- IndexedDB is more reliable (transactional, structured)
- Server backup is optional - doesn't burden server unless enabled
- File-based server backup avoids database complexity
- Works offline, syncs when online

**Trade-offs**:
- More complex than localStorage-only
- IndexedDB API is async (requires adapting code)
- Server backup only works in development/self-hosted scenarios

### Decision 2: JSON File Server Storage (Not Database)

**Choice**: Store backups as JSON files in `/data/backups/` directory

**Rationale**:
- Zero configuration required
- No database setup/maintenance
- Human-readable backup files
- Easy to version control or manually inspect
- Works with any hosting (no database required)
- Can be disabled entirely for static hosting

**Trade-offs**:
- Not suitable for multi-user production deployment
- No query capabilities
- File I/O slightly slower than database

### Decision 3: User-Controlled Export/Import

**Choice**: Downloadable JSON files for user backups

**Rationale**:
- Users own their data
- Works across any browser/device
- No server dependency
- Compliant with data portability requirements
- Simple to implement

### Decision 4: Envelope Pattern with Versioning

**Choice**: Wrap all stored data in a versioned envelope

**Rationale**:
- Enables safe schema migrations
- Data integrity verification via checksum
- Audit trail via timestamps
- Clear separation of metadata and payload

---

## Feature Specification

### Feature 1: Unified Persistence Service

A centralized service that abstracts storage operations.

```typescript
interface IPersistenceService {
  // Core operations
  save<T>(key: StorageKey, data: T): Promise<void>;
  load<T>(key: StorageKey): Promise<T | null>;
  delete(key: StorageKey): Promise<void>;

  // Bulk operations
  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<ImportResult>;

  // Recovery
  getBackups(key: StorageKey): Promise<BackupEntry[]>;
  restoreBackup(key: StorageKey, backupId: string): Promise<void>;

  // Maintenance
  clearAll(): Promise<void>;
  getStorageInfo(): Promise<StorageInfo>;
}
```

### Feature 2: IndexedDB Storage Adapter

Primary storage using IndexedDB with localStorage fallback.

```typescript
// Database schema
const DB_NAME = 'hl7-helper-db';
const DB_VERSION = 1;

interface DBSchema {
  templates: StorageEnvelope<Template[]>;
  settings: StorageEnvelope<UserSettings>;
  serializationState: StorageEnvelope<SerializationState>;
  backups: BackupEntry[];
}
```

### Feature 3: Export/Import System

User-controlled backup via downloadable JSON files.

```typescript
interface ExportBundle {
  version: number;
  exportedAt: string;
  application: 'hl7-helper-web';
  data: {
    templates: StorageEnvelope<Template[]>;
    settings?: StorageEnvelope<UserSettings>;
  };
}
```

### Feature 4: Server Backup (Optional)

Lightweight file-based backup via Next.js API routes.

```typescript
// API Routes
POST /api/backup          // Save backup
GET  /api/backup          // List backups
GET  /api/backup/:id      // Get specific backup
DELETE /api/backup/:id    // Delete backup
```

### Feature 5: Auto-Recovery System

Automatic recovery from corrupted data.

```typescript
interface RecoveryOptions {
  maxBackups: number;          // Keep last N backups
  autoBackupOnChange: boolean; // Backup before each write
  corruptionHandling: 'recover' | 'prompt' | 'clear';
}
```

---

## Detailed Task List

### Phase 1: Foundation (Core Infrastructure)

#### Task 1.1: Create Persistence Type Definitions
**File**: `src/types/persistence.ts`

- **1.1.1**: Define `StorageKey` enum (templates, settings, serializationState, etc.)
- **1.1.2**: Define `StorageEnvelope<T>` interface with version, timestamps, checksum
- **1.1.3**: Define `ExportBundle` interface for import/export
- **1.1.4**: Define `BackupEntry` interface for backup management
- **1.1.5**: Define `StorageInfo` interface for storage status reporting
- **1.1.6**: Define `ImportResult` interface with success/error details
- **1.1.7**: Define `MigrationFunction` type for schema migrations
- **1.1.8**: Add JSDoc documentation to all types

#### Task 1.2: Implement Storage Utility Functions
**File**: `src/utils/storageUtils.ts`

- **1.2.1**: Implement `generateChecksum(data: unknown): string` using simple hash
- **1.2.2**: Implement `verifyChecksum(envelope: StorageEnvelope): boolean`
- **1.2.3**: Implement `createEnvelope<T>(data: T, version: number): StorageEnvelope<T>`
- **1.2.4**: Implement `unwrapEnvelope<T>(envelope: StorageEnvelope<T>): T`
- **1.2.5**: Implement `isValidEnvelope(data: unknown): boolean` type guard
- **1.2.6**: Implement `migrateEnvelope(envelope, migrations): StorageEnvelope` for version upgrades
- **1.2.7**: Add unit tests for all utility functions

#### Task 1.3: Implement IndexedDB Adapter
**File**: `src/services/persistence/IndexedDBAdapter.ts`

- **1.3.1**: Create `IndexedDBAdapter` class implementing `IStorageAdapter`
- **1.3.2**: Implement `openDatabase(): Promise<IDBDatabase>` with version handling
- **1.3.3**: Implement `get<T>(store: string, key: string): Promise<T | null>`
- **1.3.4**: Implement `set<T>(store: string, key: string, value: T): Promise<void>`
- **1.3.5**: Implement `delete(store: string, key: string): Promise<void>`
- **1.3.6**: Implement `getAllKeys(store: string): Promise<string[]>`
- **1.3.7**: Implement `clear(store: string): Promise<void>`
- **1.3.8**: Implement `isAvailable(): boolean` feature detection
- **1.3.9**: Add error handling with specific error types
- **1.3.10**: Add transaction retry logic for transient failures

#### Task 1.4: Implement LocalStorage Adapter (Fallback)
**File**: `src/services/persistence/LocalStorageAdapter.ts`

- **1.4.1**: Create `LocalStorageAdapter` class implementing `IStorageAdapter`
- **1.4.2**: Implement same interface as IndexedDBAdapter
- **1.4.3**: Add quota exceeded handling
- **1.4.4**: Add JSON parse error recovery
- **1.4.5**: Implement `isAvailable(): boolean` feature detection

#### Task 1.5: Implement Persistence Service
**File**: `src/services/persistence/PersistenceService.ts`

- **1.5.1**: Create `PersistenceService` class implementing `IPersistenceService`
- **1.5.2**: Implement adapter selection (IndexedDB → localStorage fallback)
- **1.5.3**: Implement `save<T>(key, data)` with envelope wrapping
- **1.5.4**: Implement `load<T>(key)` with envelope unwrapping and validation
- **1.5.5**: Implement `delete(key)` with optional backup creation
- **1.5.6**: Implement automatic backup before destructive operations
- **1.5.7**: Implement checksum verification on load
- **1.5.8**: Implement version migration on load
- **1.5.9**: Create singleton instance export
- **1.5.10**: Add comprehensive error handling and logging

---

### Phase 2: Export/Import System

#### Task 2.1: Implement Export Functionality
**File**: `src/services/persistence/exportService.ts`

- **2.1.1**: Implement `createExportBundle(): Promise<ExportBundle>`
- **2.1.2**: Implement `downloadAsJson(bundle: ExportBundle, filename: string): void`
- **2.1.3**: Add export timestamp and version metadata
- **2.1.4**: Add data validation before export
- **2.1.5**: Implement selective export (templates only, all data, etc.)

#### Task 2.2: Implement Import Functionality
**File**: `src/services/persistence/importService.ts`

- **2.2.1**: Implement `parseImportFile(file: File): Promise<ExportBundle>`
- **2.2.2**: Implement `validateImportBundle(bundle: unknown): ValidationResult`
- **2.2.3**: Implement `importBundle(bundle: ExportBundle): Promise<ImportResult>`
- **2.2.4**: Add version migration for older export formats
- **2.2.5**: Implement merge strategy selection (replace, merge, skip duplicates)
- **2.2.6**: Add rollback on import failure

#### Task 2.3: Create Export/Import UI Components
**Files**: `src/components/persistence/`

- **2.3.1**: Create `ExportButton.tsx` component with download trigger
- **2.3.2**: Create `ImportButton.tsx` component with file picker
- **2.3.3**: Create `ImportPreview.tsx` dialog showing what will be imported
- **2.3.4**: Create `ImportConflictResolver.tsx` for handling duplicates
- **2.3.5**: Add to Settings or Templates page UI
- **2.3.6**: Add success/error toast notifications

---

### Phase 3: Server Backup System (Optional)

#### Task 3.1: Create Backup API Routes
**Files**: `src/app/api/backup/`

- **3.1.1**: Create `route.ts` with POST handler for saving backups
- **3.1.2**: Add GET handler for listing all backups
- **3.1.3**: Create `[id]/route.ts` for single backup operations
- **3.1.4**: Implement file-based storage in `/data/backups/`
- **3.1.5**: Add backup file naming with timestamps
- **3.1.6**: Implement backup rotation (keep last N backups)
- **3.1.7**: Add request validation and error handling
- **3.1.8**: Make backup feature toggleable via environment variable

#### Task 3.2: Create Backup Client Service
**File**: `src/services/persistence/backupClient.ts`

- **3.2.1**: Implement `saveToServer(data: ExportBundle): Promise<void>`
- **3.2.2**: Implement `loadFromServer(): Promise<ExportBundle[]>`
- **3.2.3**: Implement `deleteFromServer(id: string): Promise<void>`
- **3.2.4**: Add offline detection and queuing
- **3.2.5**: Add automatic periodic backup (configurable interval)

#### Task 3.3: Create Backup Management UI
**Files**: `src/components/persistence/`

- **3.3.1**: Create `BackupManager.tsx` component
- **3.3.2**: Display list of server backups with timestamps
- **3.3.3**: Add restore from backup functionality
- **3.3.4**: Add delete backup functionality
- **3.3.5**: Add manual "Backup Now" button
- **3.3.6**: Show backup status indicator in header

---

### Phase 4: Migration & Integration

#### Task 4.1: Create Migration System
**File**: `src/services/persistence/migrations/`

- **4.1.1**: Create `migrationRegistry.ts` for registering migrations
- **4.1.2**: Implement `runMigrations(envelope): StorageEnvelope`
- **4.1.3**: Create migration for existing localStorage templates (v0 → v1)
- **4.1.4**: Add migration logging and error handling
- **4.1.5**: Create rollback mechanism for failed migrations

#### Task 4.2: Migrate Existing Code to New System
**Files**: Various existing files

- **4.2.1**: Update `src/app/templates/page.tsx` to use PersistenceService
- **4.2.2**: Update `src/app/templates/create/page.tsx` to use PersistenceService
- **4.2.3**: Update `src/app/templates/use/page.tsx` to use PersistenceService
- **4.2.4**: Update `src/app/page.tsx` to use PersistenceService
- **4.2.5**: Remove old `templateValidation.ts` localStorage functions
- **4.2.6**: Add persistence for serialization page state (instances, variables)
- **4.2.7**: Update all tests to work with new persistence layer

#### Task 4.3: Add Cross-Tab Synchronization
**File**: `src/hooks/usePersistenceSync.ts`

- **4.3.1**: Create hook that listens to storage events
- **4.3.2**: Implement state refresh on external changes
- **4.3.3**: Add conflict resolution for concurrent edits
- **4.3.4**: Integrate with template pages

---

### Phase 5: UI/UX Enhancements

#### Task 5.1: Add Storage Status UI
**Files**: `src/components/persistence/`

- **5.1.1**: Create `StorageStatus.tsx` component showing usage
- **5.1.2**: Display storage quota and usage percentage
- **5.1.3**: Add warning when approaching storage limit
- **5.1.4**: Add "Clear All Data" with confirmation
- **5.1.5**: Add to Settings page or footer

#### Task 5.2: Add Recovery UI
**Files**: `src/components/persistence/`

- **5.2.1**: Create `DataRecoveryDialog.tsx` for corrupted data scenarios
- **5.2.2**: Show recovery options (restore backup, clear, export corrupted)
- **5.2.3**: Add automatic recovery prompt on data corruption detection
- **5.2.4**: Log recovery actions for debugging

#### Task 5.3: Add Loading/Sync States
**Files**: Various components

- **5.3.1**: Add loading skeletons during data load
- **5.3.2**: Add "Saving..." indicator during writes
- **5.3.3**: Add "Synced" indicator when backup completes
- **5.3.4**: Add error states with retry options

---

### Phase 6: Testing & Documentation

#### Task 6.1: Unit Tests
**Files**: `tests/unit/persistence/`

- **6.1.1**: Test `storageUtils.ts` functions
- **6.1.2**: Test `IndexedDBAdapter` with mock IndexedDB
- **6.1.3**: Test `LocalStorageAdapter` with mock localStorage
- **6.1.4**: Test `PersistenceService` with mock adapters
- **6.1.5**: Test export/import services
- **6.1.6**: Test migration functions
- **6.1.7**: Achieve >90% coverage on persistence code

#### Task 6.2: Integration Tests
**Files**: `tests/e2e/`

- **6.2.1**: Test full save/load cycle
- **6.2.2**: Test export/import flow
- **6.2.3**: Test data recovery scenarios
- **6.2.4**: Test cross-tab synchronization
- **6.2.5**: Test server backup flow (when enabled)

#### Task 6.3: Documentation
**Files**: `docs/`

- **6.3.1**: Update README with persistence information
- **6.3.2**: Create `docs/persistence.md` with architecture details
- **6.3.3**: Document export file format for interoperability
- **6.3.4**: Add troubleshooting guide for data issues

---

## Implementation Priority

### MVP (Must Have)
1. Task 1.1-1.5: Core persistence infrastructure
2. Task 2.1-2.3: Export/Import system
3. Task 4.1-4.2: Migration and integration
4. Task 6.1: Unit tests

### Phase 2 (Should Have)
5. Task 5.1-5.3: UI/UX enhancements
6. Task 4.3: Cross-tab synchronization
7. Task 6.2: Integration tests

### Phase 3 (Nice to Have)
8. Task 3.1-3.3: Server backup system
9. Task 6.3: Documentation

---

## Success Criteria

1. **Zero Data Loss**: Templates survive browser refresh, restart, and reasonable user errors
2. **User Control**: Users can export/import their data at any time
3. **Graceful Degradation**: Works with localStorage if IndexedDB unavailable
4. **Recovery Options**: Corrupted data can be recovered from backups
5. **No Server Burden**: Primary storage is client-side; server backup is optional
6. **Backward Compatible**: Existing localStorage data is migrated automatically
7. **Test Coverage**: >90% coverage on persistence code
8. **Performance**: Save/load operations complete in <100ms for typical data sizes

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| IndexedDB not available | LocalStorage fallback automatically selected |
| Data corruption | Checksum verification + automatic backup before writes |
| Schema changes break data | Version field + migration system |
| Large data exceeds quota | Storage monitoring + user warnings + export option |
| Server backup fails | Client storage is primary; server is optional backup |
| Import file malformed | Strict validation + preview before import |
| Concurrent tab edits | Storage event listener + conflict resolution |

---

## Timeline Estimate

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1: Foundation | 1.1 - 1.5 | Core infrastructure |
| Phase 2: Export/Import | 2.1 - 2.3 | User backup capability |
| Phase 3: Server Backup | 3.1 - 3.3 | Optional server storage |
| Phase 4: Migration | 4.1 - 4.3 | Integrate with existing code |
| Phase 5: UI/UX | 5.1 - 5.3 | Polish and usability |
| Phase 6: Testing | 6.1 - 6.3 | Quality assurance |

**Note**: No time estimates provided per project guidelines. Tasks are ordered by dependency and priority.
