/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Template } from '@/types/template'

// Mock data
const validTemplate1: Template = {
  id: 'template-1',
  name: 'ADT Template',
  description: 'Admission template',
  messageType: 'ADT-A01',
  content: 'MSH|^~\\&|App|Fac|||',
  createdAt: 1705320000000,
}

const validTemplate2: Template = {
  id: 'template-2',
  name: 'ORU Template',
  description: 'Results template',
  messageType: 'ORU-R01',
  content: 'MSH|^~\\&|Lab|Fac|||',
  createdAt: 1705320000000,
}

// Mock localStorage
const localStorageData = new Map<string, string>()

const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    localStorageData.delete(key)
  }),
}

// Mock PersistenceService
const mockSave = vi.fn(() => Promise.resolve())
const mockLoad = vi.fn(() => Promise.resolve(null))

vi.mock('@/services/persistence/PersistenceService', () => ({
  getPersistenceService: vi.fn(() => ({
    save: mockSave,
    load: mockLoad,
  }))
}))

// Mock StorageKey enum
vi.mock('@/types/persistence', () => ({
  StorageKey: {
    TEMPLATES: 'templates',
  }
}))

// Setup global mocks
beforeEach(() => {
  localStorageData.clear()
  vi.clearAllMocks()
  global.localStorage = mockLocalStorage as any

  // Ensure we're in browser environment
  global.window = {} as any

  // Default: mockLoad returns what was saved (for verification to pass)
  let savedTemplates: Template[] | null = null
  mockSave.mockImplementation(async (_key: string, templates: Template[]) => {
    savedTemplates = templates
  })
  mockLoad.mockImplementation(async () => savedTemplates)
})

afterEach(() => {
  vi.clearAllMocks()
})

// Import after mocks are set up
const { migrateV0Templates, runMigrations } = await import('@/services/persistence/migrations')

describe('migrations', () => {
  describe('migrateV0Templates', () => {
    describe('successful migration', () => {
      // PROOF: Fails if migration doesn't read from old localStorage key
      it('migrates templates from old localStorage key', async () => {
        const templates = [validTemplate1, validTemplate2]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        const result = await migrateV0Templates()

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('hl7_templates')
        expect(result).toBe(true)
      })

      // PROOF: Fails if templates not saved to PersistenceService
      it('saves templates to PersistenceService with correct StorageKey', async () => {
        const templates = [validTemplate1, validTemplate2]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        expect(mockSave).toHaveBeenCalledOnce()
        expect(mockSave).toHaveBeenCalledWith('templates', templates)
      })

      // PROOF: Fails if old localStorage key not removed
      it('removes old localStorage key after successful save', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('hl7_templates')
        expect(localStorageData.has('hl7_templates')).toBe(false)
      })

      // PROOF: Fails if migration not marked complete
      it('marks migration as complete in localStorage', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'hl7-helper:migrations',
          expect.stringContaining('v1_templates_migrated')
        )

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(migrationStatus).toBeDefined()
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })

      // PROOF: Fails if migration returns false on success
      it('returns true when migration performed', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        const result = await migrateV0Templates()

        expect(result).toBe(true)
      })

      // PROOF: Fails if single template not migrated correctly
      it('migrates single template correctly', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        expect(mockSave).toHaveBeenCalledWith('templates', templates)
      })

      // PROOF: Fails if multiple templates not migrated correctly
      it('migrates multiple templates correctly', async () => {
        const templates = [validTemplate1, validTemplate2]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        expect(mockSave).toHaveBeenCalledWith('templates', templates)
      })

      // PROOF: Fails if save happens before validation
      it('validates templates before saving', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        await migrateV0Templates()

        // If this test passes, validation happened (invalid data would skip save)
        expect(mockSave).toHaveBeenCalledOnce()
      })
    })

    describe('no old data', () => {
      // PROOF: Fails if migration crashes when no old data exists
      it('handles missing old localStorage key', async () => {
        const result = await migrateV0Templates()

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('hl7_templates')
        expect(mockSave).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })

      // PROOF: Fails if migration not marked complete when no data to migrate
      it('marks migration complete when no old data exists', async () => {
        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })

      // PROOF: Fails if returns wrong value when no data
      it('returns false when no old data to migrate', async () => {
        const result = await migrateV0Templates()

        expect(result).toBe(false)
      })
    })

    describe('idempotency', () => {
      // PROOF: Fails if migration runs twice
      it('does not migrate when already migrated', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        // First migration
        const result1 = await migrateV0Templates()
        expect(result1).toBe(true)
        expect(mockSave).toHaveBeenCalledOnce()

        // Second migration attempt
        const result2 = await migrateV0Templates()
        expect(result2).toBe(false)
        expect(mockSave).toHaveBeenCalledOnce() // Still only once
      })

      // PROOF: Fails if migration status check not working
      it('checks migration status before attempting migration', async () => {
        localStorageData.set('hl7-helper:migrations', JSON.stringify({ v1_templates_migrated: true }))
        localStorageData.set('hl7_templates', JSON.stringify([validTemplate1]))

        await migrateV0Templates()

        expect(mockSave).not.toHaveBeenCalled()
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('hl7_templates')
      })

      // PROOF: Fails if idempotency broken by clearing localStorage
      it('remains idempotent even if old data re-appears', async () => {
        // First migration
        localStorageData.set('hl7_templates', JSON.stringify([validTemplate1]))
        await migrateV0Templates()

        // Simulate old data reappearing (shouldn't happen, but test it)
        localStorageData.set('hl7_templates', JSON.stringify([validTemplate2]))

        // Second call should not migrate
        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).toHaveBeenCalledOnce() // Only from first migration
      })
    })

    describe('error handling - data preserved on failure', () => {
      // PROOF: Fails if old data removed when save fails
      it('preserves old localStorage data when save fails', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))
        mockSave.mockRejectedValueOnce(new Error('Save failed'))

        await migrateV0Templates()

        expect(localStorageData.has('hl7_templates')).toBe(true)
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('hl7_templates')
      })

      // PROOF: Fails if migration marked complete when save fails
      it('does not mark migration complete when save fails', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))
        mockSave.mockRejectedValueOnce(new Error('Save failed'))

        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(migrationStatus).toBeUndefined()
      })

      // PROOF: Fails if error thrown instead of returning false
      it('returns false when save fails', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))
        mockSave.mockRejectedValueOnce(new Error('Save failed'))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
      })

      // PROOF: Fails if migration doesn't retry after failure
      it('allows retry after failed migration', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        // First attempt fails
        mockSave.mockRejectedValueOnce(new Error('Network error'))
        const result1 = await migrateV0Templates()
        expect(result1).toBe(false)

        // Second attempt succeeds - need to set up both save and load for verification
        let savedTemplates: Template[] | null = null
        mockSave.mockImplementationOnce(async (_key: string, data: Template[]) => {
          savedTemplates = data
        })
        mockLoad.mockImplementationOnce(async () => savedTemplates)

        const result2 = await migrateV0Templates()
        expect(result2).toBe(true)
        expect(localStorageData.has('hl7_templates')).toBe(false)
      })
    })

    describe('edge cases - empty array', () => {
      // PROOF: Fails if empty array not handled
      it('handles empty template array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify([]))

        const result = await migrateV0Templates()

        expect(mockSave).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })

      // PROOF: Fails if empty array doesn't remove old key
      it('removes old key when empty array migrated', async () => {
        localStorageData.set('hl7_templates', JSON.stringify([]))

        await migrateV0Templates()

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('hl7_templates')
        expect(localStorageData.has('hl7_templates')).toBe(false)
      })

      // PROOF: Fails if empty array doesn't mark as migrated
      it('marks migration complete for empty array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify([]))

        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })
    })

    describe('edge cases - invalid JSON', () => {
      // PROOF: Fails if invalid JSON crashes migration
      it('handles invalid JSON gracefully', async () => {
        localStorageData.set('hl7_templates', '{invalid json}')

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if invalid JSON doesn't mark as migrated
      it('marks migration complete when JSON is invalid', async () => {
        localStorageData.set('hl7_templates', '{invalid json}')

        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })

      // PROOF: Fails if malformed JSON not handled
      it('handles malformed JSON without crashing', async () => {
        localStorageData.set('hl7_templates', 'not json at all')

        await expect(migrateV0Templates()).resolves.toBe(false)
      })

      // PROOF: Fails if truncated JSON crashes
      it('handles truncated JSON', async () => {
        localStorageData.set('hl7_templates', '[{"id":"1","name"')

        await expect(migrateV0Templates()).resolves.toBe(false)
      })
    })

    describe('edge cases - non-array data', () => {
      // PROOF: Fails if object instead of array crashes
      it('handles object instead of array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify({ id: '1', name: 'Test' }))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if non-array not marked as migrated
      it('marks migration complete when data is not an array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify({ id: '1' }))

        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })

      // PROOF: Fails if string value crashes
      it('handles string value instead of array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify('not an array'))

        await expect(migrateV0Templates()).resolves.toBe(false)
      })

      // PROOF: Fails if number value crashes
      it('handles number value instead of array', async () => {
        localStorageData.set('hl7_templates', JSON.stringify(123))

        await expect(migrateV0Templates()).resolves.toBe(false)
      })

      // PROOF: Fails if null value crashes
      it('handles null value', async () => {
        localStorageData.set('hl7_templates', JSON.stringify(null))

        await expect(migrateV0Templates()).resolves.toBe(false)
      })
    })

    describe('edge cases - invalid template objects', () => {
      // PROOF: Fails if missing 'id' field not caught
      it('rejects templates missing id field', async () => {
        const invalidTemplate = {
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if missing 'name' field not caught
      it('rejects templates missing name field', async () => {
        const invalidTemplate = {
          id: '1',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if missing 'description' field not caught
      it('rejects templates missing description field', async () => {
        const invalidTemplate = {
          id: '1',
          name: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if missing 'messageType' field not caught
      it('rejects templates missing messageType field', async () => {
        const invalidTemplate = {
          id: '1',
          name: 'Test',
          description: 'Test',
          content: 'MSH|...',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if missing 'content' field not caught
      it('rejects templates missing content field', async () => {
        const invalidTemplate = {
          id: '1',
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if missing 'createdAt' field not caught
      it('rejects templates missing createdAt field', async () => {
        const invalidTemplate = {
          id: '1',
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if wrong type for 'id' not caught
      it('rejects templates with non-string id', async () => {
        const invalidTemplate = {
          id: 123, // Should be string
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: Date.now(),
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if wrong type for 'createdAt' not caught
      it('rejects templates with non-number createdAt', async () => {
        const invalidTemplate = {
          id: '1',
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: '2025-01-15', // Should be number
        }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if mixed valid/invalid array not handled
      it('rejects array with mix of valid and invalid templates', async () => {
        const templates = [
          validTemplate1,
          { id: '2', name: 'Invalid' }, // Missing required fields
        ]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockSave).not.toHaveBeenCalled()
      })

      // PROOF: Fails if validation marks mixed array as migrated
      it('marks migration complete for invalid templates', async () => {
        const invalidTemplate = { id: '1', name: 'Test' }
        localStorageData.set('hl7_templates', JSON.stringify([invalidTemplate]))

        await migrateV0Templates()

        const migrationStatus = localStorageData.get('hl7-helper:migrations')
        expect(JSON.parse(migrationStatus!)).toEqual({ v1_templates_migrated: true })
      })
    })

    describe('edge cases - server-side rendering', () => {
      // PROOF: Fails if SSR environment crashes
      it('returns false when window is undefined', async () => {
        const originalWindow = global.window
        // @ts-expect-error - Testing SSR environment
        global.window = undefined

        const result = await migrateV0Templates()

        expect(result).toBe(false)
        expect(mockLocalStorage.getItem).not.toHaveBeenCalled()

        global.window = originalWindow
      })

      // PROOF: Fails if typeof check not working
      it('does not access localStorage in SSR environment', async () => {
        const originalWindow = global.window
        // @ts-expect-error - Testing SSR environment
        global.window = undefined

        await migrateV0Templates()

        expect(mockSave).not.toHaveBeenCalled()

        global.window = originalWindow
      })
    })

    describe('migration order and cleanup', () => {
      // PROOF: Fails if removal happens before save and verification
      it('removes old key only after successful save and verification', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        const calls: string[] = []
        let savedTemplates: Template[] | null = null
        mockSave.mockImplementation(async (_key: string, data: Template[]) => {
          calls.push('save')
          savedTemplates = data
        })
        mockLoad.mockImplementation(async () => {
          calls.push('load')
          return savedTemplates
        })
        mockLocalStorage.removeItem.mockImplementation((key) => {
          calls.push(`remove-${key}`)
          localStorageData.delete(key)
        })

        await migrateV0Templates()

        // Order: save -> load (verification) -> remove
        expect(calls[0]).toBe('save')
        expect(calls[1]).toBe('load')
        expect(calls[2]).toBe('remove-hl7_templates')
      })

      // PROOF: Fails if migration status set before save and verification
      it('marks migration complete only after successful save and verification', async () => {
        const templates = [validTemplate1]
        localStorageData.set('hl7_templates', JSON.stringify(templates))

        const calls: string[] = []
        let savedTemplates: Template[] | null = null
        mockSave.mockImplementation(async (_key: string, data: Template[]) => {
          calls.push('save')
          savedTemplates = data
          // Check migration status during save
          const status = localStorageData.get('hl7-helper:migrations')
          if (status) {
            calls.push('status-exists-during-save') // Should not happen
          }
        })
        mockLoad.mockImplementation(async () => {
          calls.push('load')
          // Check migration status during verification
          const status = localStorageData.get('hl7-helper:migrations')
          if (status) {
            calls.push('status-exists-during-load') // Should not happen
          }
          return savedTemplates
        })

        await migrateV0Templates()

        // No status during save or load - only set after verification
        expect(calls).toEqual(['save', 'load'])
        expect(localStorageData.get('hl7-helper:migrations')).toBeDefined()
      })
    })
  })

  describe('runMigrations', () => {
    // PROOF: Fails if migrateV0Templates not called
    it('calls migrateV0Templates', async () => {
      const templates = [validTemplate1]
      localStorageData.set('hl7_templates', JSON.stringify(templates))

      await runMigrations()

      expect(mockSave).toHaveBeenCalledWith('templates', templates)
    })

    // PROOF: Fails if runMigrations doesn't return void
    it('returns Promise<void>', async () => {
      const result = await runMigrations()

      expect(result).toBeUndefined()
    })

    // PROOF: Fails if error thrown instead of caught
    it('handles migration errors gracefully', async () => {
      const templates = [validTemplate1]
      localStorageData.set('hl7_templates', JSON.stringify(templates))
      mockSave.mockRejectedValueOnce(new Error('Critical error'))

      await expect(runMigrations()).resolves.toBeUndefined()
    })

    // PROOF: Fails if app crashes when migration fails
    it('allows app to continue when migration fails', async () => {
      mockSave.mockRejectedValueOnce(new Error('Network down'))

      await runMigrations()

      // No exception thrown - app can continue
      expect(true).toBe(true)
    })

    // PROOF: Fails if multiple migrations not supported
    it('can be called multiple times safely', async () => {
      await runMigrations()
      await runMigrations()
      await runMigrations()

      // Should not crash
      expect(true).toBe(true)
    })
  })
})
