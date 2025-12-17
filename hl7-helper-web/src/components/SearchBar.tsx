'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { SearchMatch, highlightMatch, isPathQuery } from '@/utils/fieldSearch';

/**
 * Props for SearchBar component
 */
interface SearchBarProps {
  /** Current search query */
  query: string;
  /** Set search query */
  onQueryChange: (query: string) => void;
  /** Search results */
  results: SearchMatch[];
  /** Currently selected index */
  selectedIndex: number;
  /** Select next result */
  onSelectNext: () => void;
  /** Select previous result */
  onSelectPrevious: () => void;
  /** Clear search */
  onClear: () => void;
  /** Whether search is processing */
  isSearching: boolean;
  /** Whether search bar is open */
  isOpen: boolean;
  /** Set whether search bar is open */
  onOpenChange: (open: boolean) => void;
  /** Callback when a result is selected (Enter pressed) */
  onResultSelect: (match: SearchMatch) => void;
  /** Whether there's content to search */
  hasContent: boolean;
}

/**
 * Maximum number of visible results in dropdown
 */
const MAX_VISIBLE_RESULTS = 10;

/**
 * Search bar component with dropdown results.
 * Supports keyboard navigation (Up/Down arrows, Enter, Escape).
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  results,
  selectedIndex,
  onSelectNext,
  onSelectPrevious,
  onClear,
  isSearching,
  isOpen,
  onOpenChange,
  onResultSelect,
  hasContent,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedResultRef = useRef<HTMLDivElement>(null);

  // Focus input when search bar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected result into view
  useEffect(() => {
    if (selectedResultRef.current && dropdownRef.current) {
      selectedResultRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        onSelectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onSelectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && selectedIndex < results.length) {
          onResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (query) {
          onClear();
        } else {
          onOpenChange(false);
        }
        break;
    }
  };

  // Handle clicking a result
  const handleResultClick = (match: SearchMatch) => {
    onResultSelect(match);
  };

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        // Don't close if clicking on the search container
        const container = inputRef.current.closest('[data-search-container]');
        if (container && container.contains(e.target as Node)) {
          return;
        }
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Render highlighted value
  const renderHighlightedValue = (value: string) => {
    if (isPathQuery(query)) {
      // For path queries, just show the value
      return <span className="text-foreground">{value}</span>;
    }

    const highlight = highlightMatch(value, query);
    if (!highlight) {
      return <span className="text-foreground">{value}</span>;
    }

    return (
      <span className="text-foreground">
        {highlight.before}
        <span className="bg-yellow-200 dark:bg-yellow-700 font-semibold">{highlight.match}</span>
        {highlight.after}
      </span>
    );
  };

  const visibleResults = results.slice(0, MAX_VISIBLE_RESULTS);
  const hasMoreResults = results.length > MAX_VISIBLE_RESULTS;

  return (
    <div className="relative" data-search-container>
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground pointer-events-none">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => onOpenChange(true)}
          onKeyDown={handleKeyDown}
          placeholder={hasContent ? 'Search fields (Ctrl+K)' : 'Load message to search'}
          disabled={!hasContent}
          className={`
            w-64 pl-10 pr-20 py-2 text-sm
            bg-background border border-input rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
            placeholder:text-muted-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
          `}
          data-testid="search-input"
          aria-label="Search HL7 fields"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results"
          role="combobox"
          autoComplete="off"
        />

        {/* Right side controls */}
        <div className="absolute right-2 flex items-center gap-1">
          {isSearching && (
            <div className="animate-spin h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full" />
          )}
          {query && !isSearching && results.length > 0 && (
            <span className="text-xs text-muted-foreground px-1">
              {selectedIndex + 1}/{results.length}
            </span>
          )}
          {query && (
            <button
              onClick={onClear}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              data-testid="search-clear"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && query && (
        <div
          ref={dropdownRef}
          id="search-results"
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 && !isSearching && (
            <div className="p-3 text-sm text-muted-foreground text-center">No matches found</div>
          )}

          {results.length > 0 && (
            <>
              <div className="max-h-80 overflow-y-auto">
                {visibleResults.map((match, index) => (
                  <div
                    key={`${match.segmentIndex}-${match.fieldPosition}-${match.componentPosition ?? ''}-${match.subcomponentPosition ?? ''}`}
                    ref={index === selectedIndex ? selectedResultRef : null}
                    onClick={() => handleResultClick(match)}
                    className={`
                      px-3 py-2 cursor-pointer border-b border-border/50 last:border-b-0
                      ${
                        index === selectedIndex
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-muted/50'
                      }
                    `}
                    role="option"
                    aria-selected={index === selectedIndex}
                    data-testid={`search-result-${index}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {match.displayPath}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPrevious();
                          }}
                          className="p-0.5 hover:bg-muted rounded text-muted-foreground"
                          aria-label="Previous result"
                          tabIndex={-1}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNext();
                          }}
                          className="p-0.5 hover:bg-muted rounded text-muted-foreground"
                          aria-label="Next result"
                          tabIndex={-1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {match.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {match.description}
                      </div>
                    )}
                    <div className="text-sm mt-1 font-mono truncate">
                      {renderHighlightedValue(match.value)}
                    </div>
                  </div>
                ))}
              </div>

              {hasMoreResults && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">
                  +{results.length - MAX_VISIBLE_RESULTS} more results
                </div>
              )}
            </>
          )}

          {/* Keyboard hints */}
          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-t border-border flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Up/Down</kbd> navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
