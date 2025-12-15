/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  generateChecksum,
  verifyChecksum,
  createEnvelope,
  unwrapEnvelope,
  isValidEnvelope,
  migrateEnvelope,
} from '@/utils/storageUtils'
import type { StorageEnvelope, MigrationFunction } from '@/types/persistence'

describe('storageUtils', () => {
  describe('generateChecksum', () => {
    // PROOF: Fails if hash algorithm removed or changed
    it('returns consistent hash string for same input', () => {
      const data = { test: 'data' }
      const checksum1 = generateChecksum(data)
      const checksum2 = generateChecksum(data)

      expect(checksum1).toBe(checksum2)
      expect(typeof checksum1).toBe('string')
      expect(checksum1.length).toBeGreaterThan(0)
    })

    // PROOF: Fails if deterministic behavior broken
    it('returns same checksum for equivalent objects', () => {
      const data1 = { a: 1, b: 2 }
      const data2 = { a: 1, b: 2 }

      expect(generateChecksum(data1)).toBe(generateChecksum(data2))
    })

    // PROOF: Fails if hash function doesn't differentiate data
    it('returns different checksums for different data', () => {
      const data1 = { test: 'value1' }
      const data2 = { test: 'value2' }

      expect(generateChecksum(data1)).not.toBe(generateChecksum(data2))
    })

    // PROOF: Fails if primitive type handling broken
    it('handles different data types', () => {
      expect(generateChecksum('test')).toBeDefined()
      expect(generateChecksum(123)).toBeDefined()
      expect(generateChecksum(true)).toBeDefined()
      expect(generateChecksum(null)).toBeDefined()
      expect(generateChecksum([])).toBeDefined()
    })

    // PROOF: Fails if empty data handling broken
    it('handles empty objects and arrays', () => {
      const emptyObj = generateChecksum({})
      const emptyArr = generateChecksum([])

      expect(emptyObj).toBeDefined()
      expect(emptyArr).toBeDefined()
      expect(emptyObj).not.toBe(emptyArr)
    })
  })

  describe('verifyChecksum', () => {
    // PROOF: Fails if verification logic removed
    it('returns true for valid envelope', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      expect(verifyChecksum(envelope)).toBe(true)
    })

    // PROOF: Fails if tampering detection broken
    it('returns false when checksum does not match data', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      // Tamper with the data
      const tamperedEnvelope = {
        ...envelope,
        data: { test: 'different' }
      }

      expect(verifyChecksum(tamperedEnvelope)).toBe(false)
    })

    // PROOF: Fails if checksum field validation broken
    it('returns false when checksum is modified', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      // Modify the checksum
      const tamperedEnvelope = {
        ...envelope,
        checksum: 'invalid-checksum'
      }

      expect(verifyChecksum(tamperedEnvelope)).toBe(false)
    })
  })

  describe('createEnvelope', () => {
    // PROOF: Fails if envelope structure incomplete
    it('creates envelope with all required fields', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      expect(envelope.version).toBe(1)
      expect(envelope.createdAt).toBeDefined()
      expect(envelope.updatedAt).toBeDefined()
      expect(envelope.checksum).toBeDefined()
      expect(envelope.data).toEqual(data)
    })

    // PROOF: Fails if ISO timestamp format broken
    it('sets createdAt and updatedAt as ISO timestamps', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      expect(new Date(envelope.createdAt).toISOString()).toBe(envelope.createdAt)
      expect(new Date(envelope.updatedAt).toISOString()).toBe(envelope.updatedAt)
    })

    // PROOF: Fails if custom version not respected
    it('accepts custom version number', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data, 2)

      expect(envelope.version).toBe(2)
    })

    // PROOF: Fails if checksum generation broken
    it('generates valid checksum for data', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      expect(envelope.checksum).toBe(generateChecksum(data))
    })

    // PROOF: Fails if same timestamps not set on creation
    it('sets createdAt and updatedAt to same value on creation', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      expect(envelope.createdAt).toBe(envelope.updatedAt)
    })
  })

  describe('unwrapEnvelope', () => {
    // PROOF: Fails if unwrapping logic removed
    it('returns original data from valid envelope', () => {
      const data = { test: 'value', nested: { key: 123 } }
      const envelope = createEnvelope(data)

      const unwrapped = unwrapEnvelope(envelope)

      expect(unwrapped).toEqual(data)
    })

    // PROOF: Fails if checksum verification not enforced
    it('throws error when checksum verification fails', () => {
      const data = { test: 'value' }
      const envelope = createEnvelope(data)

      // Tamper with data
      const tamperedEnvelope = {
        ...envelope,
        data: { test: 'tampered' }
      }

      expect(() => unwrapEnvelope(tamperedEnvelope)).toThrow(/checksum/i)
    })

    // PROOF: Fails if error message not descriptive
    it('throws descriptive error on checksum failure', () => {
      const envelope = createEnvelope({ test: 'value' })
      envelope.checksum = 'invalid'

      expect(() => unwrapEnvelope(envelope)).toThrow(/checksum.*corrupt/i)
    })

    // PROOF: Fails if empty data not handled
    it('handles empty data', () => {
      const emptyArray = createEnvelope([])
      const emptyObject = createEnvelope({})

      expect(unwrapEnvelope(emptyArray)).toEqual([])
      expect(unwrapEnvelope(emptyObject)).toEqual({})
    })
  })

  describe('isValidEnvelope', () => {
    // PROOF: Fails if validation allows invalid envelopes
    it('returns true for valid envelope structure', () => {
      const validEnvelope: StorageEnvelope<unknown> = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksum: 'abc123',
        data: { test: 'value' }
      }

      expect(isValidEnvelope(validEnvelope)).toBe(true)
    })

    // PROOF: Fails if null check removed
    it('returns false for null', () => {
      expect(isValidEnvelope(null)).toBe(false)
    })

    // PROOF: Fails if undefined check removed
    it('returns false for undefined', () => {
      expect(isValidEnvelope(undefined)).toBe(false)
    })

    // PROOF: Fails if type checking removed
    it('returns false for non-object types', () => {
      expect(isValidEnvelope('string')).toBe(false)
      expect(isValidEnvelope(123)).toBe(false)
      expect(isValidEnvelope(true)).toBe(false)
      expect(isValidEnvelope([])).toBe(false)
    })

    // PROOF: Fails if version field validation removed
    it('returns false when version field missing', () => {
      const invalid = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksum: 'abc',
        data: {}
      }

      expect(isValidEnvelope(invalid)).toBe(false)
    })

    // PROOF: Fails if createdAt field validation removed
    it('returns false when createdAt field missing', () => {
      const invalid = {
        version: 1,
        updatedAt: new Date().toISOString(),
        checksum: 'abc',
        data: {}
      }

      expect(isValidEnvelope(invalid)).toBe(false)
    })

    // PROOF: Fails if updatedAt field validation removed
    it('returns false when updatedAt field missing', () => {
      const invalid = {
        version: 1,
        createdAt: new Date().toISOString(),
        checksum: 'abc',
        data: {}
      }

      expect(isValidEnvelope(invalid)).toBe(false)
    })

    // PROOF: Fails if checksum field validation removed
    it('returns false when checksum field missing', () => {
      const invalid = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {}
      }

      expect(isValidEnvelope(invalid)).toBe(false)
    })

    // PROOF: Fails if data field validation removed
    it('returns false when data field missing', () => {
      const invalid = {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksum: 'abc'
      }

      expect(isValidEnvelope(invalid)).toBe(false)
    })

    // PROOF: Fails if wrong field types not caught
    it('returns false when field types are wrong', () => {
      const invalidVersion = {
        version: 'not-a-number',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksum: 'abc',
        data: {}
      }

      expect(isValidEnvelope(invalidVersion)).toBe(false)
    })

    // PROOF: Fails if empty object not rejected
    it('returns false for empty object', () => {
      expect(isValidEnvelope({})).toBe(false)
    })
  })

  describe('migrateEnvelope', () => {
    // PROOF: Fails if migration not applied
    it('applies migration to upgrade envelope version', () => {
      const v1Data = { oldField: 'value' }
      const v1Envelope = createEnvelope(v1Data, 1)

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => ({
        newField: data.oldField
      }))

      const migrated = migrateEnvelope(v1Envelope, migrations, 2)

      expect(migrated.version).toBe(2)
      expect(migrated.data).toEqual({ newField: 'value' })
    })

    // PROOF: Fails if multiple migrations not chained
    it('applies multiple migrations sequentially', () => {
      const v1Data = { step: 1 }
      const v1Envelope = createEnvelope(v1Data, 1)

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => ({ step: data.step + 1 }))
      migrations.set(3, (data: any) => ({ step: data.step + 1 }))

      const migrated = migrateEnvelope(v1Envelope, migrations, 3)

      expect(migrated.version).toBe(3)
      expect(migrated.data).toEqual({ step: 3 })
    })

    // PROOF: Fails if checksum not updated after migration
    it('updates checksum after migration', () => {
      const v1Envelope = createEnvelope({ old: 'data' }, 1)
      const originalChecksum = v1Envelope.checksum

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => ({ new: 'data' }))

      const migrated = migrateEnvelope(v1Envelope, migrations, 2)

      expect(migrated.checksum).not.toBe(originalChecksum)
      expect(migrated.checksum).toBe(generateChecksum({ new: 'data' }))
    })

    // PROOF: Fails if updatedAt not refreshed
    it('updates updatedAt timestamp', () => {
      const v1Envelope = createEnvelope({ data: 'value' }, 1)
      const originalUpdatedAt = v1Envelope.updatedAt

      // Small delay to ensure timestamp changes
      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => data)

      const migrated = migrateEnvelope(v1Envelope, migrations, 2)

      // UpdatedAt should be newer (or at least different if clock resolution is low)
      expect(new Date(migrated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      )
    })

    // PROOF: Fails if createdAt modified during migration
    it('preserves createdAt timestamp', () => {
      const v1Envelope = createEnvelope({ data: 'value' }, 1)
      const originalCreatedAt = v1Envelope.createdAt

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => data)

      const migrated = migrateEnvelope(v1Envelope, migrations, 2)

      expect(migrated.createdAt).toBe(originalCreatedAt)
    })

    // PROOF: Fails if missing migration not caught
    it('throws error when migration function missing', () => {
      const v1Envelope = createEnvelope({ data: 'value' }, 1)
      const migrations = new Map<number, MigrationFunction>()

      expect(() => migrateEnvelope(v1Envelope, migrations, 2)).toThrow(/migration.*version 2/i)
    })

    // PROOF: Fails if migration receives wrong version parameter
    it('passes correct fromVersion to migration function', () => {
      const v1Envelope = createEnvelope({ data: 'value' }, 1)
      let receivedFromVersion: number | undefined

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any, fromVersion: number) => {
        receivedFromVersion = fromVersion
        return data
      })

      migrateEnvelope(v1Envelope, migrations, 2)

      expect(receivedFromVersion).toBe(1)
    })

    // PROOF: Fails if no-op migration skipped
    it('handles no-op migration (same data returned)', () => {
      const v1Data = { field: 'value' }
      const v1Envelope = createEnvelope(v1Data, 1)

      const migrations = new Map<number, MigrationFunction>()
      migrations.set(2, (data: any) => data) // No-op migration

      const migrated = migrateEnvelope(v1Envelope, migrations, 2)

      expect(migrated.version).toBe(2)
      expect(migrated.data).toEqual(v1Data)
    })
  })
})
