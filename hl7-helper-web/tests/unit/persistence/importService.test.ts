/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExportBundle, StorageEnvelope, ImportResult } from '@/types/persistence'

// Mock data
const validBundle: ExportBundle = {
  version: 1,
  exportedAt: '2025-01-15T10:00:00.000Z',
  application: 'hl7-helper-web',
  data: {
    templates: {
      version: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-01-15T09:30:00.000Z',
      checksum: 'abc123',
      data: [
        { id: '1', name: 'Template 1', description: 'Test template 1', messageType: 'ADT-A01', content: 'MSH|...', createdAt: 1705312800000 },
        { id: '2', name: 'Template 2', description: 'Test template 2', messageType: 'ADT-A01', content: 'MSH|...', createdAt: 1705312800000 },
        { id: '3', name: 'Template 3', description: 'Test template 3', messageType: 'ADT-A01', content: 'MSH|...', createdAt: 1705312800000 },
      ]
    } as StorageEnvelope<any>,
    settings: {
      version: 1,
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-01-15T09:30:00.000Z',
      checksum: 'def456',
      data: { theme: 'dark' as const, autoSave: true }
    } as StorageEnvelope<any>,
  }
}

const mockImportResult: ImportResult = {
  success: true,
  imported: [],
  skipped: [],
  errors: []
}

// Mock getPersistenceService
const mockImportAll = vi.fn(() => Promise.resolve(mockImportResult))

vi.mock('@/services/persistence/PersistenceService', () => ({
  getPersistenceService: vi.fn(() => ({
    importAll: mockImportAll,
  }))
}))

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  result: string | null = null

  readAsText(file: File) {
    // Simulate async file reading
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 0)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// Import after mocks are set up
const {
  validateImportBundle,
  importBundle,
  parseImportFile,
  importFromFile
} = await import('@/services/persistence/importService')

describe('importService', () => {
  describe('validateImportBundle', () => {
    describe('valid bundles', () => {
      // PROOF: Fails if valid bundle marked as invalid
      it('returns { valid: true, errors: [] } for valid bundle', () => {
        const result = validateImportBundle(validBundle)

        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
      })

      // PROOF: Fails if template counting broken
      it('counts templates correctly in summary', () => {
        const result = validateImportBundle(validBundle)

        expect(result.summary.templatesCount).toBe(3)
      })

      // PROOF: Fails if zero templates counted incorrectly
      it('returns templatesCount 0 when no templates', () => {
        const bundleWithNoTemplates: ExportBundle = {
          ...validBundle,
          data: {
            templates: {
              version: 1,
              createdAt: '2025-01-15T09:00:00.000Z',
              updatedAt: '2025-01-15T09:30:00.000Z',
              checksum: 'abc123',
              data: []
            } as StorageEnvelope<any>
          }
        }

        const result = validateImportBundle(bundleWithNoTemplates)

        expect(result.summary.templatesCount).toBe(0)
      })

      // PROOF: Fails if hasSettings flag broken
      it('sets hasSettings flag correctly', () => {
        const result = validateImportBundle(validBundle)
        expect(result.summary.hasSettings).toBe(true)

        const bundleWithoutSettings: ExportBundle = {
          ...validBundle,
          data: {
            templates: validBundle.data.templates
          }
        }
        const result2 = validateImportBundle(bundleWithoutSettings)
        expect(result2.summary.hasSettings).toBe(false)
      })

      // PROOF: Fails if hasSerializationState flag broken
      it('sets hasSerializationState flag correctly', () => {
        const result = validateImportBundle(validBundle)
        expect(result.summary.hasSerializationState).toBe(false)

        const bundleWithSerialization: ExportBundle = {
          ...validBundle,
          data: {
            ...validBundle.data,
            serializationState: {
              version: 1,
              createdAt: '2025-01-15T09:00:00.000Z',
              updatedAt: '2025-01-15T09:30:00.000Z',
              checksum: 'ghi789',
              data: { instances: [] }
            } as StorageEnvelope<any>
          }
        }
        const result2 = validateImportBundle(bundleWithSerialization)
        expect(result2.summary.hasSerializationState).toBe(true)
      })

      // PROOF: Fails if summary fields not populated
      it('populates all summary fields correctly', () => {
        const result = validateImportBundle(validBundle)

        expect(result.summary.templatesCount).toBe(3)
        expect(result.summary.hasSettings).toBe(true)
        expect(result.summary.hasSerializationState).toBe(false)
        expect(result.summary.exportedAt).toBe('2025-01-15T10:00:00.000Z')
        expect(result.summary.version).toBe(1)
      })

      // PROOF: Fails if warnings not empty for valid bundle with data
      it('returns empty warnings for valid bundle with templates', () => {
        const result = validateImportBundle(validBundle)

        expect(result.warnings).toEqual([])
      })
    })

    describe('invalid bundles - type validation', () => {
      // PROOF: Fails if null not detected
      it('returns error for null bundle', () => {
        const result = validateImportBundle(null)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid bundle: not an object')
      })

      // PROOF: Fails if undefined not detected
      it('returns error for undefined bundle', () => {
        const result = validateImportBundle(undefined)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid bundle: not an object')
      })

      // PROOF: Fails if primitive types not detected
      it('returns error for string bundle', () => {
        const result = validateImportBundle('not an object')

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid bundle: not an object')
      })

      // PROOF: Fails if array accepted without required fields
      it('returns errors for array bundle (arrays are objects in JS)', () => {
        const result = validateImportBundle([])

        // Arrays pass the typeof check but fail field validation
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid application identifier')
        expect(result.errors).toContain('Missing or invalid version')
      })
    })

    describe('invalid bundles - missing required fields', () => {
      // PROOF: Fails if empty object passes validation
      it('returns multiple errors for empty object', () => {
        const result = validateImportBundle({})

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid application identifier')
        expect(result.errors).toContain('Missing or invalid version')
        expect(result.errors).toContain('Missing export timestamp')
        expect(result.errors).toContain('Missing data section')
        expect(result.errors.length).toBeGreaterThanOrEqual(4)
      })

      // PROOF: Fails if wrong application identifier accepted
      it('returns error for wrong application identifier', () => {
        const bundle = {
          ...validBundle,
          application: 'wrong-app'
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid application identifier')
      })

      // PROOF: Fails if missing version accepted
      it('returns error for missing version', () => {
        const bundle = {
          ...validBundle,
          version: undefined
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing or invalid version')
      })

      // PROOF: Fails if non-number version accepted
      it('returns error for non-number version', () => {
        const bundle = {
          ...validBundle,
          version: '1' // string instead of number
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing or invalid version')
      })

      // PROOF: Fails if missing exportedAt accepted
      it('returns error for missing exportedAt', () => {
        const bundle = {
          ...validBundle,
          exportedAt: undefined
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing export timestamp')
      })

      // PROOF: Fails if non-string exportedAt accepted
      it('returns error for non-string exportedAt', () => {
        const bundle = {
          ...validBundle,
          exportedAt: 123456789
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing export timestamp')
      })

      // PROOF: Fails if missing data section accepted
      it('returns error for missing data section', () => {
        const bundle = {
          application: 'hl7-helper-web',
          version: 1,
          exportedAt: '2025-01-15T10:00:00.000Z'
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing data section')
      })

      // PROOF: Fails if null data section accepted
      it('returns error for null data section', () => {
        const bundle = {
          ...validBundle,
          data: null
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Missing data section')
      })
    })

    describe('warnings', () => {
      // PROOF: Fails if no-templates warning not generated
      it('adds warning when bundle has no templates', () => {
        const bundleWithNoTemplates: ExportBundle = {
          ...validBundle,
          data: {
            templates: {
              version: 1,
              createdAt: '2025-01-15T09:00:00.000Z',
              updatedAt: '2025-01-15T09:30:00.000Z',
              checksum: 'abc123',
              data: []
            } as StorageEnvelope<any>
          }
        }

        const result = validateImportBundle(bundleWithNoTemplates)

        expect(result.valid).toBe(true) // Warning, not error
        expect(result.warnings).toContain('No templates in bundle')
      })

      // PROOF: Fails if warning added when templates exist
      it('does not add warning when templates exist', () => {
        const result = validateImportBundle(validBundle)

        expect(result.warnings).not.toContain('No templates in bundle')
      })

      // PROOF: Fails if missing templates field crashes
      it('adds warning when templates field missing entirely', () => {
        const bundleWithoutTemplates: ExportBundle = {
          ...validBundle,
          data: {
            settings: validBundle.data.settings
          }
        }

        const result = validateImportBundle(bundleWithoutTemplates)

        expect(result.valid).toBe(true)
        expect(result.warnings).toContain('No templates in bundle')
      })

      // PROOF: Fails if templates without data array crashes
      it('handles templates without data array', () => {
        const bundleWithInvalidTemplates: ExportBundle = {
          ...validBundle,
          data: {
            templates: {
              version: 1,
              createdAt: '2025-01-15T09:00:00.000Z',
              updatedAt: '2025-01-15T09:30:00.000Z',
              checksum: 'abc123',
              // data field missing
            } as any
          }
        }

        const result = validateImportBundle(bundleWithInvalidTemplates)

        expect(result.valid).toBe(true)
        expect(result.warnings).toContain('No templates in bundle')
        expect(result.summary.templatesCount).toBe(0)
      })
    })

    describe('edge cases', () => {
      // PROOF: Fails if empty data object crashes validation
      it('handles empty data object without crashing', () => {
        const bundle: ExportBundle = {
          application: 'hl7-helper-web',
          version: 1,
          exportedAt: '2025-01-15T10:00:00.000Z',
          data: {}
        }

        const result = validateImportBundle(bundle)

        expect(result.valid).toBe(true)
        expect(result.summary.templatesCount).toBe(0)
        expect(result.summary.hasSettings).toBe(false)
      })

      // PROOF: Fails if extra fields cause validation to fail
      it('accepts bundle with extra fields', () => {
        const bundleWithExtra = {
          ...validBundle,
          extraField: 'should be ignored',
          data: {
            ...validBundle.data,
            extraData: 'also ignored'
          }
        }

        const result = validateImportBundle(bundleWithExtra)

        expect(result.valid).toBe(true)
      })

      // PROOF: Fails if summary defaults incorrect for invalid bundle
      it('returns default summary for invalid bundle', () => {
        const result = validateImportBundle(null)

        expect(result.summary.templatesCount).toBe(0)
        expect(result.summary.hasSettings).toBe(false)
        expect(result.summary.hasSerializationState).toBe(false)
        expect(result.summary.exportedAt).toBe('')
        expect(result.summary.version).toBe(0)
      })
    })
  })

  describe('importBundle', () => {
    // PROOF: Fails if getPersistenceService().importAll() not called
    it('calls getPersistenceService().importAll()', async () => {
      await importBundle(validBundle)

      expect(mockImportAll).toHaveBeenCalledOnce()
      expect(mockImportAll).toHaveBeenCalledWith(validBundle)
    })

    // PROOF: Fails if ImportResult not returned
    it('returns ImportResult from persistence service', async () => {
      const result = await importBundle(validBundle)

      expect(result).toEqual(mockImportResult)
      expect(result.success).toBe(true)
      expect(result.imported).toBeDefined()
      expect(result.skipped).toBeDefined()
      expect(result.errors).toBeDefined()
    })

    // PROOF: Fails if Promise not properly awaited
    it('returns Promise that resolves to ImportResult', async () => {
      const promise = importBundle(validBundle)

      expect(promise).toBeInstanceOf(Promise)
      await expect(promise).resolves.toEqual(mockImportResult)
    })
  })

  describe('parseImportFile', () => {
    // PROOF: Fails if FileReader not used
    it('uses FileReader to read file', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      const constructorSpy = vi.fn()
      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          constructorSpy()
          this.result = JSON.stringify(validBundle)
        }
      } as any

      const promise = parseImportFile(mockFile)

      expect(constructorSpy).toHaveBeenCalledOnce()
      await promise
    })

    // PROOF: Fails if readAsText not called
    it('calls FileReader.readAsText with file', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })
      const mockReadAsText = vi.fn(function(this: MockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: this.result } })
          }
        }, 0)
      })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(validBundle)
          this.readAsText = mockReadAsText
        }
      } as any

      await parseImportFile(mockFile)

      expect(mockReadAsText).toHaveBeenCalledWith(mockFile)
    })

    // PROOF: Fails if JSON parsing broken
    it('parses JSON content to ExportBundle', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(validBundle)
        }
      } as any

      const result = await parseImportFile(mockFile)
      expect(result).toEqual(validBundle)
    })

    // PROOF: Fails if invalid JSON not rejected
    it('rejects with error for invalid JSON', async () => {
      const mockFile = new File(['invalid json{{{'], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = 'invalid json{{{'
        }
      } as any

      await expect(parseImportFile(mockFile)).rejects.toThrow('Failed to parse import file: Invalid JSON')
    })

    // PROOF: Fails if FileReader error not handled
    it('rejects when FileReader encounters error', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read failed') as any)
            }
          }, 0)
        }
      } as any

      await expect(parseImportFile(mockFile)).rejects.toThrow('Failed to read import file')
    })

    // PROOF: Fails if empty file crashes parser
    it('handles empty file content', async () => {
      const mockFile = new File([''], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = ''
        }
      } as any

      await expect(parseImportFile(mockFile)).rejects.toThrow('Failed to parse import file: Invalid JSON')
    })

    // PROOF: Fails if BOM handling not consistent
    it('rejects file with BOM (Byte Order Mark)', async () => {
      const mockFile = new File(['\uFEFF' + JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          // BOM + valid JSON - JSON.parse does NOT handle BOM in Node.js
          this.result = '\uFEFF' + JSON.stringify(validBundle)
        }
      } as any

      // BOM causes JSON.parse to fail, which is expected behavior
      // Users should save files as UTF-8 without BOM
      await expect(parseImportFile(mockFile)).rejects.toThrow('Failed to parse import file: Invalid JSON')
    })
  })

  describe('importFromFile', () => {
    beforeEach(() => {
      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(validBundle)
        }
      } as any
    })

    // PROOF: Fails if parseImportFile not called
    it('calls parseImportFile to read file', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })
      const constructorSpy = vi.fn()

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          constructorSpy()
          this.result = JSON.stringify(validBundle)
        }
      } as any

      await importFromFile(mockFile)
      expect(constructorSpy).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if validateImportBundle not called
    it('calls validateImportBundle on parsed bundle', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      const result = await importFromFile(mockFile)
      expect(result.validation).toBeDefined()
      expect(result.validation.valid).toBe(true)
    })

    // PROOF: Fails if importBundle called when validation fails
    it('does not call importBundle when validation fails', async () => {
      const invalidBundle = { invalid: 'bundle' }
      const mockFile = new File([JSON.stringify(invalidBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(invalidBundle)
        }
      } as any

      mockImportAll.mockClear()

      const result = await importFromFile(mockFile)
      expect(result.validation.valid).toBe(false)
      expect(result.result).toBeUndefined()
      expect(mockImportAll).not.toHaveBeenCalled()
    })

    // PROOF: Fails if importBundle not called when validation passes
    it('calls importBundle when validation passes', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      mockImportAll.mockClear()

      const result = await importFromFile(mockFile)
      expect(result.validation.valid).toBe(true)
      expect(result.result).toBeDefined()
      expect(mockImportAll).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if result structure incorrect
    it('returns validation and result for valid file', async () => {
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      const result = await importFromFile(mockFile)
      expect(result).toHaveProperty('validation')
      expect(result).toHaveProperty('result')
      expect(result.validation.valid).toBe(true)
      expect(result.result).toEqual(mockImportResult)
    })

    // PROOF: Fails if result structure incorrect for invalid file
    it('returns only validation for invalid file', async () => {
      const invalidBundle = { invalid: 'bundle' }
      const mockFile = new File([JSON.stringify(invalidBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(invalidBundle)
        }
      } as any

      const result = await importFromFile(mockFile)
      expect(result).toHaveProperty('validation')
      expect(result.validation.valid).toBe(false)
      expect(result.result).toBeUndefined()
    })

    // PROOF: Fails if operations not executed in order
    it('executes operations in correct order: parse → validate → import', async () => {
      const calls: string[] = []
      const mockFile = new File([JSON.stringify(validBundle)], 'test.json', { type: 'application/json' })

      global.FileReader = class extends MockFileReader {
        constructor() {
          super()
          this.result = JSON.stringify(validBundle)
        }

        readAsText(file: File) {
          calls.push('parse')
          super.readAsText(file)
        }
      } as any

      mockImportAll.mockImplementation(async () => {
        calls.push('import')
        return mockImportResult
      })

      await importFromFile(mockFile)

      // Validation happens synchronously between parse and import
      expect(calls).toEqual(['parse', 'import'])
    })
  })
})
