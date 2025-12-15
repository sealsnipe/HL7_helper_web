/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { LocalStorageAdapter } from '@/services/persistence/LocalStorageAdapter'

// Mock localStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] ?? null
  }

  get length(): number {
    return Object.keys(this.store).length
  }
}

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter
  let localStorageMock: LocalStorageMock

  beforeEach(() => {
    // Create fresh mock for each test
    localStorageMock = new LocalStorageMock()

    // Mock window object with localStorage
    global.window = {
      localStorage: localStorageMock
    } as any

    adapter = new LocalStorageAdapter()
  })

  afterEach(() => {
    // Clean up
    delete (global as any).window
  })

  describe('isAvailable', () => {
    // PROOF: Fails if SSR detection broken
    it('returns false when window is undefined', () => {
      delete (global as any).window
      const adapter = new LocalStorageAdapter()

      expect(adapter.isAvailable()).toBe(false)
    })

    // PROOF: Fails if availability test broken
    it('returns true when localStorage is available', () => {
      expect(adapter.isAvailable()).toBe(true)
    })

    // PROOF: Fails if error handling removed from availability check
    it('returns false when localStorage throws error', () => {
      // Mock localStorage that throws on access
      global.window = {
        localStorage: {
          setItem: () => { throw new Error('QuotaExceededError') },
          removeItem: () => {},
        }
      } as any

      const adapter = new LocalStorageAdapter()
      expect(adapter.isAvailable()).toBe(false)
    })
  })

  describe('get', () => {
    // PROOF: Fails if get operation broken
    it('retrieves stored value', async () => {
      await adapter.set('test-key', 'test-value')
      const value = await adapter.get<string>('test-key')

      expect(value).toBe('test-value')
    })

    // PROOF: Fails if null return broken
    it('returns null for non-existent key', async () => {
      const value = await adapter.get('non-existent')

      expect(value).toBeNull()
    })

    // PROOF: Fails if JSON parsing broken
    it('parses JSON correctly', async () => {
      const data = { nested: { key: 'value' }, array: [1, 2, 3] }
      await adapter.set('complex', data)
      const retrieved = await adapter.get<typeof data>('complex')

      expect(retrieved).toEqual(data)
    })

    // PROOF: Fails if malformed JSON not handled gracefully
    it('returns null for malformed JSON (recovery mode)', async () => {
      // Manually set invalid JSON
      localStorageMock.setItem('hl7-helper:bad-json', 'not-valid-json{]')

      const value = await adapter.get('bad-json')

      expect(value).toBeNull()
    })

    // PROOF: Fails if prefix not applied
    it('uses prefixed key in actual localStorage', async () => {
      await adapter.set('my-key', 'my-value')

      const rawValue = localStorageMock.getItem('hl7-helper:my-key')
      expect(rawValue).toBe(JSON.stringify('my-value'))
    })
  })

  describe('set', () => {
    // PROOF: Fails if set operation broken
    it('stores value correctly', async () => {
      await adapter.set('key', 'value')
      const value = await adapter.get<string>('key')

      expect(value).toBe('value')
    })

    // PROOF: Fails if JSON serialization broken
    it('serializes objects to JSON', async () => {
      const data = { test: 'object', number: 123 }
      await adapter.set('obj-key', data)

      const rawValue = localStorageMock.getItem('hl7-helper:obj-key')
      expect(rawValue).toBe(JSON.stringify(data))
    })

    // PROOF: Fails if prefix not applied
    it('prefixes keys with hl7-helper:', async () => {
      await adapter.set('my-key', 'value')

      expect(localStorageMock.getItem('hl7-helper:my-key')).toBeDefined()
      expect(localStorageMock.getItem('my-key')).toBeNull()
    })

    // PROOF: Fails if quota exceeded not caught
    it('throws descriptive error on quota exceeded', async () => {
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'

      // Create a setItem that passes the availability test but fails on actual use
      let callCount = 0
      localStorageMock.setItem = (key: string, value: string) => {
        callCount++
        // Let the first call (availability test) succeed
        if (key === '__storage_test__') {
          return
        }
        // Throw on actual usage
        throw quotaError
      }

      const testAdapter = new LocalStorageAdapter()

      await expect(testAdapter.set('key', 'value')).rejects.toThrow(/quota.*export/i)
    })

    // PROOF: Fails if other errors not propagated
    it('propagates non-quota errors', async () => {
      const otherError = new Error('Some other error')

      // Create a setItem that passes the availability test but fails on actual use
      localStorageMock.setItem = (key: string, value: string) => {
        // Let the first call (availability test) succeed
        if (key === '__storage_test__') {
          return
        }
        // Throw on actual usage
        throw otherError
      }

      const testAdapter = new LocalStorageAdapter()

      await expect(testAdapter.set('key', 'value')).rejects.toThrow('Some other error')
    })
  })

  describe('delete', () => {
    // PROOF: Fails if delete operation broken
    it('removes value from storage', async () => {
      await adapter.set('key', 'value')
      await adapter.delete('key')
      const value = await adapter.get('key')

      expect(value).toBeNull()
    })

    // PROOF: Fails if prefix not used in deletion
    it('deletes with prefixed key', async () => {
      localStorageMock.setItem('hl7-helper:key', '"value"')
      await adapter.delete('key')

      expect(localStorageMock.getItem('hl7-helper:key')).toBeNull()
    })

    // PROOF: Fails if deleting non-existent key throws
    it('handles deleting non-existent key gracefully', async () => {
      await expect(adapter.delete('non-existent')).resolves.not.toThrow()
    })
  })

  describe('getAllKeys', () => {
    // PROOF: Fails if key retrieval broken
    it('returns array of stored keys', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      const keys = await adapter.getAllKeys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toHaveLength(2)
    })

    // PROOF: Fails if prefix filtering broken
    it('only returns keys with app prefix', async () => {
      // Set app keys
      await adapter.set('app-key', 'value')

      // Manually add non-app key
      localStorageMock.setItem('other-app:key', 'value')

      const keys = await adapter.getAllKeys()

      expect(keys).toContain('app-key')
      expect(keys).not.toContain('other-app:key')
    })

    // PROOF: Fails if empty storage not handled
    it('returns empty array when no keys exist', async () => {
      const keys = await adapter.getAllKeys()

      expect(keys).toEqual([])
    })

    // PROOF: Fails if prefix not removed from returned keys
    it('returns unprefixed keys', async () => {
      await adapter.set('my-key', 'value')

      const keys = await adapter.getAllKeys()

      expect(keys).toContain('my-key')
      expect(keys).not.toContain('hl7-helper:my-key')
    })
  })

  describe('clear', () => {
    // PROOF: Fails if clear operation broken
    it('removes all app data', async () => {
      await adapter.set('key1', 'value1')
      await adapter.set('key2', 'value2')

      await adapter.clear()

      const keys = await adapter.getAllKeys()
      expect(keys).toHaveLength(0)
    })

    // PROOF: Fails if non-app data removed
    it('only clears app-prefixed keys', async () => {
      await adapter.set('app-key', 'value')
      localStorageMock.setItem('other-app:key', 'value')

      await adapter.clear()

      expect(localStorageMock.getItem('hl7-helper:app-key')).toBeNull()
      expect(localStorageMock.getItem('other-app:key')).toBe('value')
    })

    // PROOF: Fails if clearing empty storage throws
    it('handles clearing empty storage', async () => {
      await expect(adapter.clear()).resolves.not.toThrow()
    })
  })

  describe('edge cases', () => {
    // PROOF: Fails if different data types not handled
    it('handles different data types', async () => {
      await adapter.set('string', 'test')
      await adapter.set('number', 123)
      await adapter.set('boolean', true)
      await adapter.set('null', null)
      await adapter.set('array', [1, 2, 3])
      await adapter.set('object', { key: 'value' })

      expect(await adapter.get('string')).toBe('test')
      expect(await adapter.get('number')).toBe(123)
      expect(await adapter.get('boolean')).toBe(true)
      expect(await adapter.get('null')).toBeNull()
      expect(await adapter.get('array')).toEqual([1, 2, 3])
      expect(await adapter.get('object')).toEqual({ key: 'value' })
    })

    // PROOF: Fails if empty values not handled
    it('handles empty values', async () => {
      await adapter.set('empty-string', '')
      await adapter.set('empty-array', [])
      await adapter.set('empty-object', {})

      expect(await adapter.get('empty-string')).toBe('')
      expect(await adapter.get('empty-array')).toEqual([])
      expect(await adapter.get('empty-object')).toEqual({})
    })
  })
})
