import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTemplatesFromStorage, saveTemplatesToStorage } from '@/utils/templateValidation';
import { Template } from '@/types/template';

describe('templateValidation', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadTemplatesFromStorage', () => {
    // PROOF: Catches bug where empty localStorage returns undefined instead of empty array
    it('returns empty array when localStorage has no data', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('hl7_templates');
    });

    // PROOF: Catches bug where valid templates are not properly parsed
    it('returns valid templates from localStorage', () => {
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
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validTemplates));

      const result = loadTemplatesFromStorage();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
      expect(result[0].name).toBe('Test Template');
    });

    // PROOF: Catches security bug where corrupted data could crash the app
    it('clears corrupted JSON and returns empty array', () => {
      localStorageMock.getItem.mockReturnValue('not valid json{{{');

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hl7_templates');
      expect(console.error).toHaveBeenCalled();
    });

    // PROOF: Catches security bug where malformed data could inject properties
    it('clears data with missing required fields and returns empty array', () => {
      const invalidTemplates = [
        { id: 'test-1', name: 'Missing fields' }, // Missing description, messageType, content, createdAt
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidTemplates));

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hl7_templates');
      expect(console.warn).toHaveBeenCalled();
    });

    // PROOF: Catches bug where non-array data could crash the app
    it('clears non-array data and returns empty array', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ notAnArray: true }));

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hl7_templates');
    });

    // PROOF: Catches bug where wrong field types could cause runtime errors
    it('validates field types correctly', () => {
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
      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidTemplates));

      const result = loadTemplatesFromStorage();

      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hl7_templates');
    });
  });

  describe('saveTemplatesToStorage', () => {
    // PROOF: Catches bug where templates are not serialized correctly
    it('saves templates to localStorage', () => {
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

      saveTemplatesToStorage(templates);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hl7_templates',
        JSON.stringify(templates)
      );
    });

    // PROOF: Catches bug where localStorage errors crash the app
    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => saveTemplatesToStorage([])).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
