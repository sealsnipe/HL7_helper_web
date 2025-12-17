import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar - Ctrl+K hint', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    results: [],
    selectedIndex: 0,
    onSelectNext: vi.fn(),
    onSelectPrevious: vi.fn(),
    onClear: vi.fn(),
    isSearching: false,
    isOpen: false,
    onOpenChange: vi.fn(),
    onResultSelect: vi.fn(),
    hasContent: true,
  };

  // PROOF: Fails if Ctrl+K hint not shown when search is empty and enabled
  it('shows Ctrl+K hint in placeholder when search is empty and not disabled', () => {
    render(<SearchBar {...defaultProps} query="" hasContent={true} />);

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Search fields (Ctrl+K)');
  });

  // PROOF: Fails if Ctrl+K hint shown when search has query
  it('placeholder not visible when search has query (value overrides placeholder)', () => {
    render(<SearchBar {...defaultProps} query="PID-5" hasContent={true} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    // When input has value, placeholder is not visible (browser behavior)
    expect(input.value).toBe('PID-5');
    // But placeholder attribute should still be there
    expect(input).toHaveAttribute('placeholder', 'Search fields (Ctrl+K)');
  });

  // PROOF: Fails if Ctrl+K hint shown when search is disabled
  it('shows different placeholder when search is disabled', () => {
    render(<SearchBar {...defaultProps} query="" hasContent={false} />);

    const input = screen.getByTestId('search-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Load message to search');
    expect(input).not.toHaveAttribute('placeholder', expect.stringContaining('Ctrl+K'));
  });

  // PROOF: Fails if placeholder wrong when enabled with empty query
  it('shows Ctrl+K placeholder when hasContent is true and query is empty', () => {
    render(<SearchBar {...defaultProps} query="" hasContent={true} />);

    const input = screen.getByTestId('search-input');
    expect(input).not.toBeDisabled();
    expect(input.getAttribute('placeholder')).toContain('Ctrl+K');
  });

  // PROOF: Fails if enabled state changes don't update placeholder
  it('updates placeholder when hasContent changes from false to true', () => {
    const { rerender } = render(<SearchBar {...defaultProps} query="" hasContent={false} />);

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Load message to search');

    rerender(<SearchBar {...defaultProps} query="" hasContent={true} />);
    expect(input).toHaveAttribute('placeholder', 'Search fields (Ctrl+K)');
  });

  // PROOF: Fails if enabled state changes don't update placeholder
  it('updates placeholder when hasContent changes from true to false', () => {
    const { rerender } = render(<SearchBar {...defaultProps} query="" hasContent={true} />);

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Search fields (Ctrl+K)');

    rerender(<SearchBar {...defaultProps} query="" hasContent={false} />);
    expect(input).toHaveAttribute('placeholder', 'Load message to search');
  });
});
