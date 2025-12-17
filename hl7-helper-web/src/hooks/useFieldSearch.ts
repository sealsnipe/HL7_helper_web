import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SegmentDto } from '@/types';
import { searchFields, SearchMatch } from '@/utils/fieldSearch';

/**
 * Debounce delay for search (ms)
 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Return type for the useFieldSearch hook
 */
export interface UseFieldSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchMatch[];
  /** Currently selected result index */
  selectedIndex: number;
  /** Currently selected match (or undefined if none) */
  selectedMatch: SearchMatch | undefined;
  /** Select next result (wrap around) */
  selectNext: () => void;
  /** Select previous result (wrap around) */
  selectPrevious: () => void;
  /** Clear search and reset state */
  clear: () => void;
  /** Whether search is currently processing */
  isSearching: boolean;
  /** Whether search bar is open/focused */
  isOpen: boolean;
  /** Set whether search bar is open */
  setIsOpen: (open: boolean) => void;
}

/**
 * Hook for managing field search state with debounced search.
 *
 * @param segments - Current HL7 segments to search
 * @returns Search state and navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   selectedMatch,
 *   selectNext,
 *   selectPrevious,
 *   clear,
 * } = useFieldSearch(segments);
 * ```
 */
export function useFieldSearch(segments: SegmentDto[]): UseFieldSearchReturn {
  const [query, setQueryState] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Ref for debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Compute results using useMemo (pure derivation, no state setting in effect)
   */
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }
    return searchFields(segments, debouncedQuery);
  }, [segments, debouncedQuery]);

  /**
   * Set query with debounced search
   */
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setIsSearching(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(newQuery);
      setIsSearching(false);
      setSelectedIndex(0);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  /**
   * Select next result (with wrap-around)
   */
  const selectNext = useCallback(() => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  /**
   * Select previous result (with wrap-around)
   */
  const selectPrevious = useCallback(() => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  /**
   * Clear search and reset state
   */
  const clear = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setSelectedIndex(0);
    setIsSearching(false);
    setIsOpen(false);

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Compute the effective selected index (clamped to valid range)
   */
  const effectiveSelectedIndex = useMemo(() => {
    if (results.length === 0) return 0;
    if (selectedIndex >= results.length) return 0;
    return selectedIndex;
  }, [results.length, selectedIndex]);

  /**
   * Get currently selected match
   */
  const selectedMatch = useMemo(() => {
    if (results.length === 0) {
      return undefined;
    }
    return results[effectiveSelectedIndex];
  }, [results, effectiveSelectedIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    selectedIndex: effectiveSelectedIndex,
    selectedMatch,
    selectNext,
    selectPrevious,
    clear,
    isSearching,
    isOpen,
    setIsOpen,
  };
}
