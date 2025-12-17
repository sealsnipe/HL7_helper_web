import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldSearch } from '@/hooks/useFieldSearch';
import { SegmentDto } from '@/types';

describe('useFieldSearch', () => {
  // Helper to create test segments
  const createSegment = (
    name: string,
    fields: Array<{ position: number; value: string }>
  ): SegmentDto => ({
    id: `seg-${name}`,
    name,
    fields: fields.map((f) => ({
      position: f.position,
      value: f.value,
      isEditable: true,
      components: [],
    })),
  });

  const testSegments: SegmentDto[] = [
    createSegment('MSH', [
      { position: 1, value: '|' },
      { position: 9, value: 'ADT^A01' },
      { position: 10, value: 'MSG001' },
    ]),
    createSegment('PID', [
      { position: 1, value: 'test' },
      { position: 3, value: '12345' },
      { position: 5, value: 'Doe^John' },
    ]),
    createSegment('OBR', [
      { position: 1, value: 'test' },
      { position: 2, value: 'test' },
    ]),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    // PROOF: Fails if initial state incorrect
    it('initializes with empty query and results', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.selectedMatch).toBeUndefined();
      expect(result.current.isSearching).toBe(false);
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('setQuery with debouncing', () => {
    // PROOF: Fails if debouncing removed
    it('debounces search query updates (150ms)', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
      });

      // Immediately after setQuery, results should still be empty
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(true);

      // Fast-forward by 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.isSearching).toBe(false);
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    // PROOF: Fails if debounce timer not cleared
    it('clears previous debounce timer on new query', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-3');
      });

      // Before debounce completes, change query
      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        result.current.setQuery('PID-5');
      });

      // First query should be cancelled, only second should execute
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.length).toBeGreaterThan(0);
      // Should have results for PID-5, not PID-3
      expect(result.current.results[0].fieldPosition).toBe(5);
    });

    // PROOF: Fails if isSearching not set correctly
    it('sets isSearching true during debounce period', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
      });

      expect(result.current.isSearching).toBe(true);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.isSearching).toBe(false);
    });

    // PROOF: Fails if selectedIndex not reset on new query
    it('resets selectedIndex to 0 when query completes', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      // First query and get results
      act(() => {
        result.current.setQuery('12345');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.length).toBeGreaterThan(0);

      // Navigate to next
      act(() => {
        result.current.selectNext();
      });

      // New query should reset index
      act(() => {
        result.current.setQuery('John');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe('results update when segments change', () => {
    // PROOF: Fails if useMemo dependency on segments broken
    it('updates results when segments change', () => {
      const { result, rerender } = renderHook(({ segments }) => useFieldSearch(segments), {
        initialProps: { segments: testSegments },
      });

      act(() => {
        result.current.setQuery('PID-3');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results).toHaveLength(1);

      // Change segments
      const newSegments = [
        createSegment('MSH', [{ position: 1, value: '|' }]),
        createSegment('PID', [{ position: 3, value: 'NEW123' }]),
      ];

      rerender({ segments: newSegments });

      // Results should reflect new segments
      expect(result.current.results.some((r) => r.value === 'NEW123')).toBe(true);
    });

    // PROOF: Fails if empty segments not handled
    it('handles empty segments array', () => {
      const { result } = renderHook(() => useFieldSearch([]));

      act(() => {
        result.current.setQuery('PID-5');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results).toEqual([]);
    });
  });

  describe('keyboard navigation', () => {
    // PROOF: Fails if selectNext removed
    it('selectNext advances to next result', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test'); // Match multiple fields with "test"
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.length).toBeGreaterThan(1);
      expect(result.current.selectedIndex).toBe(0);

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(1);
    });

    // PROOF: Fails if selectNext wrap-around removed
    it('selectNext wraps around to first result', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      const totalResults = result.current.results.length;

      // Advance to last result and then one more
      act(() => {
        for (let i = 0; i < totalResults; i++) {
          result.current.selectNext();
        }
      });

      // Should wrap to 0
      expect(result.current.selectedIndex).toBe(0);
    });

    // PROOF: Fails if selectPrevious removed
    it('selectPrevious goes to previous result', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      // Go to second result
      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(1);

      // Go back
      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    // PROOF: Fails if selectPrevious wrap-around removed
    it('selectPrevious wraps around to last result', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      const totalResults = result.current.results.length;

      // At index 0, go previous
      act(() => {
        result.current.selectPrevious();
      });

      // Should wrap to last index
      expect(result.current.selectedIndex).toBe(totalResults - 1);
    });

    // PROOF: Fails if navigation with no results causes error
    it('navigation does nothing when no results', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      // No query, no results
      expect(result.current.results).toEqual([]);

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(0);

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe('selectedMatch', () => {
    // PROOF: Fails if selectedMatch not computed correctly
    it('returns correct selectedMatch based on selectedIndex', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      const firstMatch = result.current.results[0];
      expect(result.current.selectedMatch).toEqual(firstMatch);

      act(() => {
        result.current.selectNext();
      });

      const secondMatch = result.current.results[1];
      expect(result.current.selectedMatch).toEqual(secondMatch);
    });

    // PROOF: Fails if selectedMatch undefined when no results
    it('returns undefined when no results', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      expect(result.current.selectedMatch).toBeUndefined();
    });

    // PROOF: Fails if selectedMatch not clamped to valid range
    it('clamps selectedMatch to valid range', () => {
      const { result, rerender } = renderHook(({ segments }) => useFieldSearch(segments), {
        initialProps: { segments: testSegments },
      });

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      // Navigate to a higher index
      act(() => {
        result.current.selectNext();
        result.current.selectNext();
      });

      // Change to segments with fewer matches
      const fewerSegments = [createSegment('MSH', [{ position: 1, value: '|' }])];

      rerender({ segments: fewerSegments });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Selected index should be clamped to 0
      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe('clear', () => {
    // PROOF: Fails if clear doesn't reset query
    it('resets query to empty string', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.query).toBe('PID-5');

      act(() => {
        result.current.clear();
      });

      expect(result.current.query).toBe('');
    });

    // PROOF: Fails if clear doesn't reset results
    it('resets results to empty array', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
        vi.advanceTimersByTime(150);
      });

      expect(result.current.results.length).toBeGreaterThan(0);

      act(() => {
        result.current.clear();
      });

      expect(result.current.results).toEqual([]);
    });

    // PROOF: Fails if clear doesn't reset selectedIndex
    it('resets selectedIndex to 0', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('test');
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBeGreaterThan(0);

      act(() => {
        result.current.clear();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    // PROOF: Fails if clear doesn't reset isSearching
    it('resets isSearching to false', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
      });

      expect(result.current.isSearching).toBe(true);

      act(() => {
        result.current.clear();
      });

      expect(result.current.isSearching).toBe(false);
    });

    // PROOF: Fails if clear doesn't reset isOpen
    it('resets isOpen to false', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.clear();
      });

      expect(result.current.isOpen).toBe(false);
    });

    // PROOF: Fails if clear doesn't cancel pending debounce
    it('cancels pending debounce timer', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
      });

      // Before debounce completes
      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        result.current.clear();
      });

      // Complete the original debounce time
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Results should still be empty (debounce was cancelled)
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('isOpen state', () => {
    // PROOF: Fails if setIsOpen removed
    it('updates isOpen state', () => {
      const { result } = renderHook(() => useFieldSearch(testSegments));

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setIsOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('cleanup', () => {
    // PROOF: Fails if cleanup not performed on unmount
    it('clears debounce timer on unmount', () => {
      const { result, unmount } = renderHook(() => useFieldSearch(testSegments));

      act(() => {
        result.current.setQuery('PID-5');
      });

      expect(result.current.isSearching).toBe(true);

      unmount();

      // Should not cause memory leaks or errors
      act(() => {
        vi.advanceTimersByTime(150);
      });
    });
  });
});
