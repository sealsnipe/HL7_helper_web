import type { IStorageAdapter } from '@/types/persistence';

const DB_NAME = 'hl7-helper-db';
const DB_VERSION = 1;
const STORE_NAME = 'keyvalue';

/**
 * IndexedDB storage adapter (primary storage)
 *
 * Features:
 * - Large storage capacity (~50MB+)
 * - Transactional operations
 * - Async API
 * - Automatic retry on transient failures
 */
export class IndexedDBAdapter implements IStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Check if IndexedDB is available in current environment
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return 'indexedDB' in window && window.indexedDB !== null;
  }

  /**
   * Open or create database
   */
  private async openDatabase(): Promise<IDBDatabase> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    try {
      return await this.dbPromise;
    } catch (error) {
      this.dbPromise = null; // Clear on error
      throw error;
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
    }

    throw lastError;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.executeWithRetry(async () => {
      const db = await this.openDatabase();

      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.executeWithRetry(async () => {
      const db = await this.openDatabase();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      });
    });
  }

  async delete(key: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const db = await this.openDatabase();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      });
    });
  }

  async getAllKeys(): Promise<string[]> {
    return this.executeWithRetry(async () => {
      const db = await this.openDatabase();

      return new Promise<string[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      });
    });
  }

  async clear(): Promise<void> {
    return this.executeWithRetry(async () => {
      const db = await this.openDatabase();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
        this.dbPromise = null; // Clear on error so retry is possible
        reject(request.error);
      };
      });
    });
  }
}
