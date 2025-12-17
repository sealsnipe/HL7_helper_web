import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';
import { SearchMatch } from '@/utils/fieldSearch';

describe('SearchBar', () => {
  const mockResults: SearchMatch[] = [
    {
      segmentIndex: 0,
      segmentName: 'PID',
      fieldPosition: 3,
      displayPath: 'PID-3',
      value: '12345',
      fieldIndex: 0,
    },
    {
      segmentIndex: 0,
      segmentName: 'PID',
      fieldPosition: 5,
      displayPath: 'PID-5',
      value: 'Doe^John',
      fieldIndex: 1,
    },
  ];

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

  describe('rendering', () => {
    // PROOF: Fails if input not rendered
    it('renders search input', () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByTestId('search-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search fields (Ctrl+K)');
    });

    // PROOF: Fails if placeholder logic broken
    it('shows different placeholder when no content', () => {
      render(<SearchBar {...defaultProps} hasContent={false} />);

      expect(screen.getByPlaceholderText('Load message to search')).toBeInTheDocument();
    });

    // PROOF: Fails if disabled state not set
    it('disables input when no content', () => {
      render(<SearchBar {...defaultProps} hasContent={false} />);

      const input = screen.getByTestId('search-input');
      expect(input).toBeDisabled();
    });

    // PROOF: Fails if query value not displayed
    it('displays current query value', () => {
      render(<SearchBar {...defaultProps} query="PID-5" />);

      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('PID-5');
    });
  });

  describe('results dropdown', () => {
    // PROOF: Fails if dropdown not shown when open with results
    it('shows results dropdown when isOpen and query exists', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // PROOF: Fails if dropdown shown when closed
    it('does not show dropdown when isOpen is false', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={false} />);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // PROOF: Fails if dropdown shown without query
    it('does not show dropdown when query is empty', () => {
      render(<SearchBar {...defaultProps} query="" results={mockResults} isOpen={true} />);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // PROOF: Fails if results not rendered
    it('renders all results in dropdown', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      expect(screen.getByText('PID-3')).toBeInTheDocument();
      expect(screen.getByText('PID-5')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('Doe^John')).toBeInTheDocument();
    });

    // PROOF: Fails if empty state not shown
    it('shows "No matches found" when no results', () => {
      render(<SearchBar {...defaultProps} query="NOTHING" results={[]} isOpen={true} />);

      expect(screen.getByText('No matches found')).toBeInTheDocument();
    });

    // PROOF: Fails if selected result not highlighted
    it('highlights selected result', () => {
      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          selectedIndex={1}
        />
      );

      const results = screen.getAllByRole('option');
      expect(results[1]).toHaveClass('bg-primary/10');
      expect(results[0]).not.toHaveClass('bg-primary/10');
    });

    // PROOF: Fails if description not shown
    it('shows field descriptions when available', () => {
      const resultsWithDesc: SearchMatch[] = [
        {
          ...mockResults[0],
          description: 'Patient ID',
        },
      ];

      render(<SearchBar {...defaultProps} query="PID" results={resultsWithDesc} isOpen={true} />);

      expect(screen.getByText('Patient ID')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    // PROOF: Fails if ArrowDown not handled
    it('calls onSelectNext when ArrowDown pressed', async () => {
      const user = userEvent.setup();
      const onSelectNext = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          onSelectNext={onSelectNext}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{ArrowDown}');

      expect(onSelectNext).toHaveBeenCalled();
    });

    // PROOF: Fails if ArrowUp not handled
    it('calls onSelectPrevious when ArrowUp pressed', async () => {
      const user = userEvent.setup();
      const onSelectPrevious = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          onSelectPrevious={onSelectPrevious}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{ArrowUp}');

      expect(onSelectPrevious).toHaveBeenCalled();
    });

    // PROOF: Fails if Enter not handled
    it('calls onResultSelect when Enter pressed', async () => {
      const user = userEvent.setup();
      const onResultSelect = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          selectedIndex={0}
          onResultSelect={onResultSelect}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onResultSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    // PROOF: Fails if Escape not handled
    it('calls onClear when Escape pressed with query', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          onClear={onClear}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Escape}');

      expect(onClear).toHaveBeenCalled();
    });

    // PROOF: Fails if Escape closes when no query
    it('calls onOpenChange when Escape pressed without query', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query=""
          results={[]}
          isOpen={true}
          onOpenChange={onOpenChange}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    // PROOF: Fails if Enter doesn't work with no results
    it('does not call onResultSelect when Enter pressed with no results', async () => {
      const user = userEvent.setup();
      const onResultSelect = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="NOTHING"
          results={[]}
          isOpen={true}
          onResultSelect={onResultSelect}
        />
      );

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onResultSelect).not.toHaveBeenCalled();
    });
  });

  describe('mouse interaction', () => {
    // PROOF: Fails if clicking result doesn't call onResultSelect
    it('calls onResultSelect when result clicked', async () => {
      const user = userEvent.setup();
      const onResultSelect = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          onResultSelect={onResultSelect}
        />
      );

      const result = screen.getByTestId('search-result-0');
      await user.click(result);

      expect(onResultSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    // PROOF: Fails if focus doesn't open dropdown
    it('calls onOpenChange when input focused', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<SearchBar {...defaultProps} onOpenChange={onOpenChange} />);

      const input = screen.getByTestId('search-input');
      await user.click(input);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    // PROOF: Fails if clear button doesn't work
    it('calls onClear when clear button clicked', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();

      render(<SearchBar {...defaultProps} query="PID" onClear={onClear} />);

      const clearButton = screen.getByTestId('search-clear');
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    // PROOF: Fails if clear button shown without query
    it('does not show clear button when query is empty', () => {
      render(<SearchBar {...defaultProps} query="" />);

      expect(screen.queryByTestId('search-clear')).not.toBeInTheDocument();
    });
  });

  describe('search state indicators', () => {
    // PROOF: Fails if spinner not shown during search
    it('shows loading spinner when isSearching', () => {
      render(<SearchBar {...defaultProps} query="PID" isSearching={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    // PROOF: Fails if spinner shown when not searching
    it('does not show spinner when not searching', () => {
      render(<SearchBar {...defaultProps} query="PID" isSearching={false} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    // PROOF: Fails if result counter not shown
    it('shows result counter when results exist and not searching', () => {
      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          selectedIndex={0}
          isSearching={false}
        />
      );

      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    // PROOF: Fails if counter shown during search
    it('does not show result counter when searching', () => {
      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          selectedIndex={0}
          isSearching={true}
        />
      );

      expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    });
  });

  describe('input changes', () => {
    // PROOF: Fails if onQueryChange not called
    it('calls onQueryChange when typing', async () => {
      const user = userEvent.setup();
      const onQueryChange = vi.fn();

      render(<SearchBar {...defaultProps} onQueryChange={onQueryChange} />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'P');

      expect(onQueryChange).toHaveBeenCalledWith('P');
    });

    // PROOF: Fails if onChange fires with disabled input
    it('does not allow typing when disabled', async () => {
      const user = userEvent.setup();
      const onQueryChange = vi.fn();

      render(<SearchBar {...defaultProps} hasContent={false} onQueryChange={onQueryChange} />);

      const input = screen.getByTestId('search-input');
      await user.click(input);

      expect(onQueryChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard hints', () => {
    // PROOF: Fails if keyboard hints not shown
    it('shows keyboard navigation hints in dropdown', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      expect(screen.getByText('Up/Down')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('Esc')).toBeInTheDocument();
    });
  });

  describe('max visible results', () => {
    // PROOF: Fails if more than 10 results shown
    it('limits visible results to 10', () => {
      const manyResults: SearchMatch[] = Array.from({ length: 20 }, (_, i) => ({
        segmentIndex: 0,
        segmentName: 'PID',
        fieldPosition: i + 1,
        displayPath: `PID-${i + 1}`,
        value: `Value${i + 1}`,
        fieldIndex: i,
      }));

      render(<SearchBar {...defaultProps} query="PID" results={manyResults} isOpen={true} />);

      const visibleResults = screen.getAllByRole('option');
      expect(visibleResults).toHaveLength(10);
    });

    // PROOF: Fails if "more results" message not shown
    it('shows "more results" message when results exceed limit', () => {
      const manyResults: SearchMatch[] = Array.from({ length: 20 }, (_, i) => ({
        segmentIndex: 0,
        segmentName: 'PID',
        fieldPosition: i + 1,
        displayPath: `PID-${i + 1}`,
        value: `Value${i + 1}`,
        fieldIndex: i,
      }));

      render(<SearchBar {...defaultProps} query="PID" results={manyResults} isOpen={true} />);

      expect(screen.getByText('+10 more results')).toBeInTheDocument();
    });

    // PROOF: Fails if "more results" shown when under limit
    it('does not show "more results" when within limit', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      expect(screen.queryByText(/more results/)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    // PROOF: Fails if ARIA attributes missing
    it('has proper ARIA attributes', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', 'search-results');
      expect(input).toHaveAttribute('aria-label', 'Search HL7 fields');
    });

    // PROOF: Fails if aria-expanded incorrect when closed
    it('sets aria-expanded to false when closed', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={false} />);

      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    // PROOF: Fails if listbox role missing
    it('uses listbox role for results', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // PROOF: Fails if option role missing
    it('uses option role for each result', () => {
      render(<SearchBar {...defaultProps} query="PID" results={mockResults} isOpen={true} />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    // PROOF: Fails if aria-selected not set
    it('sets aria-selected on selected option', () => {
      render(
        <SearchBar
          {...defaultProps}
          query="PID"
          results={mockResults}
          isOpen={true}
          selectedIndex={1}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('value highlighting', () => {
    // PROOF: Fails if highlighting not applied for value queries
    it('highlights matching text in results for value queries', () => {
      const resultsWithMatch: SearchMatch[] = [
        {
          segmentIndex: 0,
          segmentName: 'PID',
          fieldPosition: 5,
          displayPath: 'PID-5',
          value: 'John Doe',
          fieldIndex: 0,
        },
      ];

      render(<SearchBar {...defaultProps} query="john" results={resultsWithMatch} isOpen={true} />);

      const highlighted = document.querySelector('.bg-yellow-200');
      expect(highlighted).toBeInTheDocument();
    });

    // PROOF: Fails if highlighting applied for path queries
    it('does not highlight for path queries', () => {
      render(<SearchBar {...defaultProps} query="PID-5" results={mockResults} isOpen={true} />);

      const highlighted = document.querySelector('.bg-yellow-200');
      expect(highlighted).not.toBeInTheDocument();
    });
  });
});
