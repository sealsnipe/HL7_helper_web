/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ExportBundle, StorageEnvelope } from '@/types/persistence'

// Mock data
const mockBundle: ExportBundle = {
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
        { id: '1', name: 'Template 1', content: 'MSH|...', variables: [] }
      ]
    } as StorageEnvelope<any>,
  }
}

// Mock getPersistenceService
const mockExportAll = vi.fn(() => Promise.resolve(mockBundle))
const mockImportAll = vi.fn()

vi.mock('@/services/persistence/PersistenceService', () => ({
  getPersistenceService: vi.fn(() => ({
    exportAll: mockExportAll,
    importAll: mockImportAll,
  }))
}))

// Mock browser APIs
const mockCreateObjectURL = vi.fn(() => 'mock-blob-url')
const mockRevokeObjectURL = vi.fn()
const mockClick = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()

const mockLinkElement = {
  href: '',
  download: '',
  click: mockClick,
}

const mockCreateElement = vi.fn(() => mockLinkElement)

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks()

  // Mock Blob - must use constructor function for 'new Blob()'
  global.Blob = class MockBlob {
    content: BlobPart[]
    options: BlobPropertyBag | undefined
    size: number
    type: string

    constructor(content: BlobPart[], options?: BlobPropertyBag) {
      this.content = content
      this.options = options
      this.size = JSON.stringify(content).length
      this.type = options?.type || ''
    }
  } as any

  // Mock URL
  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  } as any

  // Mock document
  global.document = {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  } as any

  // Use fake timers for deterministic dates
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// Import after mocks are set up
const { createExportBundle, downloadAsJson, exportAndDownload } = await import('@/services/persistence/exportService')

describe('exportService', () => {
  describe('createExportBundle', () => {
    // PROOF: Fails if getPersistenceService().exportAll() not called
    it('calls getPersistenceService().exportAll()', async () => {
      const result = await createExportBundle()

      expect(mockExportAll).toHaveBeenCalledOnce()
      expect(result).toEqual(mockBundle)
    })

    // PROOF: Fails if Promise not properly awaited
    it('returns Promise that resolves to ExportBundle', async () => {
      const result = await createExportBundle()

      expect(result).toBeDefined()
      expect(result.application).toBe('hl7-helper-web')
      expect(result.version).toBe(1)
      expect(result.exportedAt).toBeDefined()
      expect(result.data).toBeDefined()
    })
  })

  describe('downloadAsJson', () => {
    // PROOF: Fails if Blob not created with correct type
    it('creates Blob with application/json type', () => {
      downloadAsJson(mockBundle)

      // Verify Blob was created by checking URL.createObjectURL was called
      expect(mockCreateObjectURL).toHaveBeenCalledOnce()
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'application/json' })
      )
    })

    // PROOF: Fails if JSON not properly formatted
    it('creates Blob with formatted JSON content', () => {
      downloadAsJson(mockBundle)

      const expectedJson = JSON.stringify(mockBundle, null, 2)
      // Verify content by checking what was passed to createObjectURL
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [expectedJson],
          type: 'application/json'
        })
      )
    })

    // PROOF: Fails if default filename format broken
    it('uses default filename format hl7-helper-backup-YYYY-MM-DD.json', () => {
      downloadAsJson(mockBundle)

      expect(mockLinkElement.download).toBe('hl7-helper-backup-2025-01-15.json')
    })

    // PROOF: Fails if custom filename not used
    it('uses custom filename when provided', () => {
      downloadAsJson(mockBundle, 'my-backup.json')

      expect(mockLinkElement.download).toBe('my-backup.json')
    })

    // PROOF: Fails if custom filename with path not used correctly
    it('accepts custom filename with path separators', () => {
      downloadAsJson(mockBundle, 'backups/2025/my-backup.json')

      expect(mockLinkElement.download).toBe('backups/2025/my-backup.json')
    })

    // PROOF: Fails if URL.createObjectURL not called
    it('creates object URL from Blob', () => {
      downloadAsJson(mockBundle)

      expect(mockCreateObjectURL).toHaveBeenCalledOnce()
      expect(mockLinkElement.href).toBe('mock-blob-url')
    })

    // PROOF: Fails if link element not created
    it('creates anchor element for download', () => {
      downloadAsJson(mockBundle)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    // PROOF: Fails if link not clicked
    it('triggers download by clicking link', () => {
      downloadAsJson(mockBundle)

      expect(mockAppendChild).toHaveBeenCalledWith(mockLinkElement)
      expect(mockClick).toHaveBeenCalledOnce()
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLinkElement)
    })

    // PROOF: Fails if URL not cleaned up (memory leak)
    it('cleans up object URL after download', () => {
      downloadAsJson(mockBundle)

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
    })

    // PROOF: Fails if cleanup happens before click
    it('cleans up URL after link is removed from DOM', () => {
      const calls: string[] = []

      mockClick.mockImplementation(() => calls.push('click'))
      mockRemoveChild.mockImplementation(() => calls.push('removeChild'))
      mockRevokeObjectURL.mockImplementation(() => calls.push('revokeObjectURL'))

      downloadAsJson(mockBundle)

      expect(calls).toEqual(['click', 'removeChild', 'revokeObjectURL'])
    })

    // PROOF: Fails if empty bundle crashes
    it('handles empty bundle without crashing', () => {
      const emptyBundle: ExportBundle = {
        version: 1,
        exportedAt: '2025-01-15T10:00:00.000Z',
        application: 'hl7-helper-web',
        data: {}
      }

      expect(() => downloadAsJson(emptyBundle)).not.toThrow()
      expect(mockClick).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if null data section crashes
    it('handles bundle with null-like data without crashing', () => {
      const bundleWithEmptyData: ExportBundle = {
        version: 1,
        exportedAt: '2025-01-15T10:00:00.000Z',
        application: 'hl7-helper-web',
        data: {
          templates: undefined,
          settings: undefined,
        }
      }

      expect(() => downloadAsJson(bundleWithEmptyData)).not.toThrow()
    })
  })

  describe('exportAndDownload', () => {
    // PROOF: Fails if createExportBundle not called
    it('calls createExportBundle', async () => {
      await exportAndDownload()

      expect(mockExportAll).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if downloadAsJson not called with bundle
    it('calls downloadAsJson with created bundle', async () => {
      await exportAndDownload()

      // Verify downloadAsJson was called by checking Blob creation and click
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [JSON.stringify(mockBundle, null, 2)],
          type: 'application/json'
        })
      )
      expect(mockClick).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if custom filename not passed through
    it('passes custom filename to downloadAsJson', async () => {
      await exportAndDownload('custom-export.json')

      expect(mockLinkElement.download).toBe('custom-export.json')
    })

    // PROOF: Fails if default filename not used when no filename provided
    it('uses default filename when no filename provided', async () => {
      await exportAndDownload()

      expect(mockLinkElement.download).toBe('hl7-helper-backup-2025-01-15.json')
    })

    // PROOF: Fails if operations not executed in sequence
    it('creates bundle before downloading', async () => {
      const calls: string[] = []

      mockExportAll.mockImplementation(async () => {
        calls.push('exportAll')
        return mockBundle
      })
      mockClick.mockImplementation(() => calls.push('click'))

      await exportAndDownload()

      expect(calls).toEqual(['exportAll', 'click'])
    })

    // PROOF: Fails if Promise not returned
    it('returns Promise that resolves when download complete', async () => {
      const result = exportAndDownload()

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeUndefined()
    })

    // PROOF: Fails if cleanup not executed on success
    it('cleans up resources after successful export', async () => {
      await exportAndDownload()

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLinkElement)
    })
  })

  describe('edge cases', () => {
    // PROOF: Fails if special characters break filename
    it('handles filename with special characters', () => {
      downloadAsJson(mockBundle, 'backup (2025-01-15) [test].json')

      expect(mockLinkElement.download).toBe('backup (2025-01-15) [test].json')
      expect(mockClick).toHaveBeenCalledOnce()
    })

    // PROOF: Fails if empty filename defaults incorrectly
    it('uses default filename when empty string provided', () => {
      downloadAsJson(mockBundle, '')

      expect(mockLinkElement.download).toBe('hl7-helper-backup-2025-01-15.json')
    })

    // PROOF: Fails if date formatting broken
    it('generates correct filename for different dates', () => {
      vi.setSystemTime(new Date('2024-12-25T00:00:00.000Z'))

      downloadAsJson(mockBundle)

      expect(mockLinkElement.download).toBe('hl7-helper-backup-2024-12-25.json')
    })

    // PROOF: Fails if large bundle crashes JSON.stringify
    it('handles large bundle without crashing', () => {
      const largeBundle: ExportBundle = {
        version: 1,
        exportedAt: '2025-01-15T10:00:00.000Z',
        application: 'hl7-helper-web',
        data: {
          templates: {
            version: 1,
            createdAt: '2025-01-15T09:00:00.000Z',
            updatedAt: '2025-01-15T09:30:00.000Z',
            checksum: 'abc123',
            data: Array(100).fill({ id: '1', name: 'Template', content: 'MSH|...', variables: [] })
          } as StorageEnvelope<any>,
        }
      }

      expect(() => downloadAsJson(largeBundle)).not.toThrow()
    })
  })
})
