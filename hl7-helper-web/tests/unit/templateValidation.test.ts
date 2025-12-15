import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTemplatesFromStorage, saveTemplatesToStorage } from '@/utils/templateValidation';
import { Template } from '@/types/template';
import { StorageKey } from '@/types/persistence';

// Mock the persistence service
const mockPersistenceService = {
  load: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  exportAll: vi.fn(),
  importAll: vi.fn(),
  getBackups: vi.fn(),
  restoreBackup: vi.fn(),
  clearAll: vi.fn(),
  getStorageInfo: vi.fn(),
};

vi.mock('@/services/persistence', () => ({
  getPersistenceService: () => mockPersistenceService,
}));

describe('templateValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadTemplatesFromStorage', () => {
    // PROOF: Catches bug where empty storage returns undefined instead of empty array
    it('returns empty array when storage has no data', async () => {
      mockPersistenceService.load.mockResolvedValue(null);

      const result = await loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(mockPersistenceService.load).toHaveBeenCalledWith(StorageKey.TEMPLATES);
    });

    // PROOF: Catches bug where valid templates are not properly loaded
    it('returns valid templates from storage', async () => {
      const validTemplates: Template[] = [
        {
          id: 'test-1',
          name: 'Test Template',
          description: 'A test template',
          messageType: 'ADT-A01',
          content: 'MSH|^~\\&|...',
          createdAt: Date.now(),
        },
      ];
      mockPersistenceService.load.mockResolvedValue(validTemplates);

      const result = await loadTemplatesFromStorage();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
      expect(result[0].name).toBe('Test Template');
    });

    // PROOF: Catches security bug where storage errors could crash the app
    it('handles storage errors and returns empty array', async () => {
      mockPersistenceService.load.mockRejectedValue(new Error('Storage error'));

      const result = await loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    // PROOF: Catches security bug where malformed data could inject properties
    it('clears data with missing required fields and returns empty array', async () => {
      const invalidTemplates = [
        { id: 'test-1', name: 'Missing fields' }, // Missing description, messageType, content, createdAt
      ];
      mockPersistenceService.load.mockResolvedValue(invalidTemplates);

      const result = await loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(mockPersistenceService.delete).toHaveBeenCalledWith(StorageKey.TEMPLATES);
      expect(console.warn).toHaveBeenCalled();
    });

    // PROOF: Catches bug where non-array data could crash the app
    it('clears non-array data and returns empty array', async () => {
      mockPersistenceService.load.mockResolvedValue({ notAnArray: true });

      const result = await loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(mockPersistenceService.delete).toHaveBeenCalledWith(StorageKey.TEMPLATES);
    });

    // PROOF: Catches bug where wrong field types could cause runtime errors
    it('validates field types correctly', async () => {
      const invalidTemplates = [
        {
          id: 123, // Should be string
          name: 'Test',
          description: 'Test',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: Date.now(),
        },
      ];
      mockPersistenceService.load.mockResolvedValue(invalidTemplates);

      const result = await loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(mockPersistenceService.delete).toHaveBeenCalledWith(StorageKey.TEMPLATES);
    });
  });

  describe('saveTemplatesToStorage', () => {
    // PROOF: Catches bug where templates are not saved correctly
    it('saves templates to storage', async () => {
      const templates: Template[] = [
        {
          id: 'test-1',
          name: 'Test Template',
          description: 'Description',
          messageType: 'ADT-A01',
          content: 'MSH|...',
          createdAt: 12345,
        },
      ];

      await saveTemplatesToStorage(templates);

      expect(mockPersistenceService.save).toHaveBeenCalledWith(
        StorageKey.TEMPLATES,
        templates
      );
    });

    // PROOF: Catches bug where storage errors crash the app
    it('handles storage errors gracefully', async () => {
      mockPersistenceService.save.mockRejectedValue(new Error('QuotaExceededError'));

      // Should throw since the implementation now throws
      await expect(saveTemplatesToStorage([])).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
