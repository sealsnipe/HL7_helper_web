'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { SearchMatch } from '@/utils/fieldSearch';

interface NavigationHeaderProps {
  activePage?: 'home' | 'create' | 'serialize' | 'templates';
  onLoadExample?: () => void;
  // Search props (optional - only used on home page)
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchResults?: SearchMatch[];
  searchSelectedIndex?: number;
  onSearchSelectNext?: () => void;
  onSearchSelectPrevious?: () => void;
  onSearchClear?: () => void;
  isSearching?: boolean;
  isSearchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  onSearchResultSelect?: (match: SearchMatch) => void;
  hasSearchContent?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activePage = 'home',
  onLoadExample,
  // Search props
  searchQuery = '',
  onSearchQueryChange,
  searchResults = [],
  searchSelectedIndex = 0,
  onSearchSelectNext,
  onSearchSelectPrevious,
  onSearchClear,
  isSearching = false,
  isSearchOpen = false,
  onSearchOpenChange,
  onSearchResultSelect,
  hasSearchContent = false,
}) => {
  const router = useRouter();
  const isHome = activePage === 'home';

  // Handle Ctrl+K / Cmd+K keyboard shortcut
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpenChange?.(true);
      }
    },
    [onSearchOpenChange]
  );

  // Register global keyboard shortcut
  useEffect(() => {
    if (isHome && onSearchOpenChange) {
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [isHome, handleGlobalKeyDown, onSearchOpenChange]);

  // Render action button based on current page:
  // - Home page: "Load Example Message" (triggers onLoadExample)
  // - Other pages: "New Message" (navigates to home page)
  const renderActionButton = () => {
    if (isHome) {
      // On home page: show "Load Example Message" if handler provided
      if (!onLoadExample) {
        return null;
      }
      return (
        <button
          onClick={onLoadExample}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
          data-testid="load-example-button"
        >
          Load Example Message
        </button>
      );
    } else {
      // On other pages: show "New Message" button that navigates to home
      return (
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm transition-all"
          data-testid="new-message-button"
        >
          New Message
        </button>
      );
    }
  };

  // Render search bar (only on home page with search props)
  const renderSearchBar = () => {
    if (!isHome || !onSearchQueryChange || !onSearchResultSelect) {
      return null;
    }

    return (
      <SearchBar
        query={searchQuery}
        onQueryChange={onSearchQueryChange}
        results={searchResults}
        selectedIndex={searchSelectedIndex}
        onSelectNext={onSearchSelectNext || (() => {})}
        onSelectPrevious={onSearchSelectPrevious || (() => {})}
        onClear={onSearchClear || (() => {})}
        isSearching={isSearching}
        isOpen={isSearchOpen}
        onOpenChange={onSearchOpenChange || (() => {})}
        onResultSelect={onSearchResultSelect}
        hasContent={hasSearchContent}
      />
    );
  };

  // Build className for templates link
  const templatesClassName =
    activePage === 'templates'
      ? 'px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
      : 'px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all bg-card border border-border text-card-foreground hover:bg-muted';

  // Build className for serialize link
  const serializeClassName =
    activePage === 'serialize'
      ? 'px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-2 ring-offset-2 ring-secondary'
      : 'px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80';

  return (
    <header className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link href="/">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">MARIS HL7 Helper</h1>
            <p className="text-muted-foreground mt-1">Web Edition</p>
          </div>
        </Link>
        <ThemeSwitcher />
      </div>
      <div className="flex items-center gap-3">
        {/* Search Bar - positioned before other buttons */}
        {renderSearchBar()}

        <Link href="/templates" className={templatesClassName}>
          Templates
        </Link>
        <Link href="/templates/use" className={serializeClassName}>
          Serialize from Template
        </Link>

        {renderActionButton()}
      </div>
    </header>
  );
};
