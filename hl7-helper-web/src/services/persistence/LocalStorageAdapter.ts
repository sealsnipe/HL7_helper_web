import type { IStorageAdapter } from '@/types/persistence';

const STORAGE_PREFIX = 'hl7-helper:';

/**
 * LocalStorage adapter (fallback storage)
 *
 * Features:
 * - Universal browser support
 * - Synchronous API wrapped in async
 * - Quota exceeded handling
 * - JSON parse error recovery
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add prefix to key for namespacing
   */
  private prefixKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * Remove prefix from key
   */
  private unprefixKey(key: string): string {
    return key.replace(STORAGE_PREFIX, '');
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    try {
      const item = window.localStorage.getItem(this.prefixKey(key));
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing localStorage item "${key}":`, error);
      // Return null instead of throwing to allow recovery
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(this.prefixKey(key), serialized);
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please export your data and clear some space.');
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    window.localStorage.removeItem(this.prefixKey(key));
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(this.unprefixKey(key));
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const keys = await this.getAllKeys();
    keys.forEach(key => window.localStorage.removeItem(this.prefixKey(key)));
  }
}
