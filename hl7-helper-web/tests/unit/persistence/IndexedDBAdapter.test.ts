import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IndexedDBAdapter } from '@/services/persistence/IndexedDBAdapter'

describe('IndexedDBAdapter', () => {
  describe('isAvailable', () => {
    // PROOF: Fails if SSR detection broken
    it('returns false in Node.js environment (no window)', () => {
      const adapter = new IndexedDBAdapter()
      expect(adapter.isAvailable()).toBe(false)
    })

    // PROOF: Fails if window check removed
    it('returns false when window is undefined', () => {
      const adapter = new IndexedDBAdapter()
      expect(adapter.isAvailable()).toBe(false)
    })
  })

  // NOTE: Full IndexedDB mocking tests would require fake-indexeddb package
  // or a browser environment. Since we're in Node.js (Vitest), we test
  // the availability check which is the critical SSR safety feature.
  //
  // The actual CRUD operations are better tested in E2E tests with real browser,
  // or with fake-indexeddb package which can be added later if needed.

  describe('error handling', () => {
    // PROOF: Fails if unavailable check not enforced
    it('openDatabase throws when IndexedDB not available', async () => {
      const adapter = new IndexedDBAdapter()

      // Try to access a method that calls openDatabase
      await expect(adapter.get('test-key')).rejects.toThrow('IndexedDB is not available')
    })

    // PROOF: Fails if set operation doesn't check availability
    it('set throws when IndexedDB not available', async () => {
      const adapter = new IndexedDBAdapter()

      await expect(adapter.set('test-key', 'test-value')).rejects.toThrow('IndexedDB is not available')
    })

    // PROOF: Fails if delete operation doesn't check availability
    it('delete throws when IndexedDB not available', async () => {
      const adapter = new IndexedDBAdapter()

      await expect(adapter.delete('test-key')).rejects.toThrow('IndexedDB is not available')
    })

    // PROOF: Fails if getAllKeys doesn't check availability
    it('getAllKeys throws when IndexedDB not available', async () => {
      const adapter = new IndexedDBAdapter()

      await expect(adapter.getAllKeys()).rejects.toThrow('IndexedDB is not available')
    })

    // PROOF: Fails if clear doesn't check availability
    it('clear throws when IndexedDB not available', async () => {
      const adapter = new IndexedDBAdapter()

      await expect(adapter.clear()).rejects.toThrow('IndexedDB is not available')
    })
  })

  // Integration tests with real IndexedDB would be added here with fake-indexeddb
  // For now, we verify the critical SSR safety and error handling
})

/**
 * Mock IndexedDB tests (for reference - requires browser environment or fake-indexeddb)
 *
 * If fake-indexeddb is added:
 * npm install -D fake-indexeddb
 *
 * Then add these tests:
 *
 * import 'fake-indexeddb/auto'
 *
 * describe('IndexedDBAdapter CRUD operations (with fake-indexeddb)', () => {
 *   let adapter: IndexedDBAdapter
 *
 *   beforeEach(() => {
 *     // Reset fake IndexedDB
 *     indexedDB = new FDBFactory()
 *     adapter = new IndexedDBAdapter()
 *   })
 *
 *   it('set and get value', async () => {
 *     await adapter.set('test-key', 'test-value')
 *     const value = await adapter.get('test-key')
 *     expect(value).toBe('test-value')
 *   })
 *
 *   it('returns null for non-existent key', async () => {
 *     const value = await adapter.get('non-existent')
 *     expect(value).toBeNull()
 *   })
 *
 *   it('delete removes value', async () => {
 *     await adapter.set('test-key', 'value')
 *     await adapter.delete('test-key')
 *     const value = await adapter.get('test-key')
 *     expect(value).toBeNull()
 *   })
 *
 *   it('getAllKeys returns stored keys', async () => {
 *     await adapter.set('key1', 'value1')
 *     await adapter.set('key2', 'value2')
 *     const keys = await adapter.getAllKeys()
 *     expect(keys).toContain('key1')
 *     expect(keys).toContain('key2')
 *   })
 *
 *   it('clear removes all data', async () => {
 *     await adapter.set('key1', 'value1')
 *     await adapter.set('key2', 'value2')
 *     await adapter.clear()
 *     const keys = await adapter.getAllKeys()
 *     expect(keys).toHaveLength(0)
 *   })
 * })
 */
