import type { StorageEnvelope, MigrationFunction } from '@/types/persistence';

/**
 * Generate a simple checksum for data integrity verification
 * Uses a basic string hash for lightweight verification
 */
export function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify envelope checksum integrity
 */
export function verifyChecksum<T>(envelope: StorageEnvelope<T>): boolean {
  const currentChecksum = generateChecksum(envelope.data);
  return currentChecksum === envelope.checksum;
}

/**
 * Create a storage envelope wrapping data with metadata
 */
export function createEnvelope<T>(data: T, version: number = 1): StorageEnvelope<T> {
  const now = new Date().toISOString();
  return {
    version,
    createdAt: now,
    updatedAt: now,
    checksum: generateChecksum(data),
    data,
  };
}

/**
 * Unwrap and return data from envelope
 * @throws {Error} if checksum verification fails
 */
export function unwrapEnvelope<T>(envelope: StorageEnvelope<T>): T {
  if (!verifyChecksum(envelope)) {
    throw new Error('Checksum verification failed - data may be corrupted');
  }
  return envelope.data;
}

/**
 * Type guard to check if unknown data is a valid envelope
 */
export function isValidEnvelope(data: unknown): data is StorageEnvelope<unknown> {
  if (!data || typeof data !== 'object') return false;
  const envelope = data as Record<string, unknown>;

  return (
    typeof envelope.version === 'number' &&
    typeof envelope.createdAt === 'string' &&
    typeof envelope.updatedAt === 'string' &&
    typeof envelope.checksum === 'string' &&
    'data' in envelope
  );
}

/**
 * Migrate envelope to target version using migration functions
 * @param envelope - The envelope to migrate
 * @param migrations - Map of version -> migration function
 * @returns Migrated envelope
 */
export function migrateEnvelope<T>(
  envelope: StorageEnvelope<T>,
  migrations: Map<number, MigrationFunction<T>>,
  targetVersion: number
): StorageEnvelope<T> {
  let currentVersion = envelope.version;
  let migratedData = envelope.data;

  // Apply migrations sequentially
  while (currentVersion < targetVersion) {
    const nextVersion = currentVersion + 1;
    const migration = migrations.get(nextVersion);

    if (!migration) {
      throw new Error(`No migration found for version ${nextVersion}`);
    }

    migratedData = migration(migratedData, currentVersion);
    currentVersion = nextVersion;
  }

  // Return new envelope with migrated data
  return {
    ...envelope,
    version: targetVersion,
    updatedAt: new Date().toISOString(),
    data: migratedData,
    checksum: generateChecksum(migratedData),
  };
}
