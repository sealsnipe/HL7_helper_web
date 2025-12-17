import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidationBadge } from '@/components/ValidationBadge';
import { ValidationResult } from '@/types/validation';

describe('ValidationBadge - onErrorClick functionality', () => {
  const errorWithSegmentIndex: ValidationResult = {
    isValid: false,
    errors: [
      {
        severity: 'error',
        code: 'MISSING_MSH_9',
        message: 'MSH-9 is required',
        path: 'MSH-9',
        segmentIndex: 0,
        fieldPosition: 9,
      },
    ],
    warnings: [],
    info: [],
  };

  const errorWithoutSegmentIndex: ValidationResult = {
    isValid: false,
    errors: [
      {
        severity: 'error',
        code: 'GLOBAL_ERROR',
        message: 'Global validation error',
        path: 'GLOBAL',
      },
    ],
    warnings: [],
    info: [],
  };

  // PROOF: Fails if onErrorClick not called with correct parameters
  it('calls onErrorClick when clicking error with segmentIndex', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-MISSING_MSH_9');
    await user.click(errorItem);

    expect(onErrorClick).toHaveBeenCalledWith(errorWithSegmentIndex.errors[0]);
    expect(onErrorClick).toHaveBeenCalledWith(
      expect.objectContaining({
        segmentIndex: 0,
        fieldPosition: 9,
      })
    );
  });

  // PROOF: Fails if app crashes when clicking error without segmentIndex
  it('does not crash when clicking error without segmentIndex', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithoutSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-GLOBAL_ERROR');
    await user.click(errorItem);

    // Should not call onErrorClick for errors without segmentIndex
    expect(onErrorClick).not.toHaveBeenCalled();
  });

  // PROOF: Fails if "Click to navigate" not shown when onErrorClick provided
  it('shows "Click to navigate" text when onErrorClick provided and segmentIndex exists', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    expect(screen.getByText('Click to navigate')).toBeInTheDocument();
  });

  // PROOF: Fails if "Click to navigate" shown when no onErrorClick
  it('does not show "Click to navigate" when onErrorClick not provided', async () => {
    const user = userEvent.setup();

    render(<ValidationBadge validationResult={errorWithSegmentIndex} />);

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    expect(screen.queryByText('Click to navigate')).not.toBeInTheDocument();
  });

  // PROOF: Fails if "Click to navigate" shown for error without segmentIndex
  it('does not show "Click to navigate" for errors without segmentIndex', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithoutSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    expect(screen.queryByText('Click to navigate')).not.toBeInTheDocument();
  });

  // PROOF: Fails if Enter key doesn't trigger click
  it('triggers onErrorClick when Enter key pressed on clickable error', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-MISSING_MSH_9');
    errorItem.focus();
    await user.keyboard('{Enter}');

    expect(onErrorClick).toHaveBeenCalledWith(errorWithSegmentIndex.errors[0]);
  });

  // PROOF: Fails if Space key doesn't trigger click
  it('triggers onErrorClick when Space key pressed on clickable error', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-MISSING_MSH_9');
    errorItem.focus();
    await user.keyboard(' ');

    expect(onErrorClick).toHaveBeenCalledWith(errorWithSegmentIndex.errors[0]);
  });

  // PROOF: Fails if clickable error not focusable
  it('makes clickable errors keyboard focusable', async () => {
    const user = userEvent.setup();
    const onErrorClick = vi.fn();

    render(
      <ValidationBadge validationResult={errorWithSegmentIndex} onErrorClick={onErrorClick} />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-MISSING_MSH_9');
    expect(errorItem).toHaveAttribute('tabIndex', '0');
    expect(errorItem).toHaveAttribute('role', 'button');
  });

  // PROOF: Fails if non-clickable error is focusable
  it('does not make non-clickable errors focusable', async () => {
    const user = userEvent.setup();

    render(<ValidationBadge validationResult={errorWithSegmentIndex} />);

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    const errorItem = screen.getByTestId('validation-item-MISSING_MSH_9');
    expect(errorItem).not.toHaveAttribute('tabIndex');
    expect(errorItem).not.toHaveAttribute('role', 'button');
  });
});

describe('ValidationBadge - controlled mode', () => {
  const errorResult: ValidationResult = {
    isValid: false,
    errors: [
      {
        severity: 'error',
        code: 'MISSING_MSH',
        message: 'MSH segment is required',
        path: 'MSH',
      },
    ],
    warnings: [],
    info: [],
  };

  // PROOF: Fails if controlled isExpanded not respected
  it('respects controlled isExpanded prop', () => {
    const { rerender } = render(
      <ValidationBadge validationResult={errorResult} isExpanded={false} />
    );

    expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();

    rerender(<ValidationBadge validationResult={errorResult} isExpanded={true} />);

    expect(screen.getByTestId('validation-details')).toBeInTheDocument();
  });

  // PROOF: Fails if onExpandedChange not called when badge clicked
  it('calls onExpandedChange when badge clicked in controlled mode', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <ValidationBadge
        validationResult={errorResult}
        isExpanded={false}
        onExpandedChange={onExpandedChange}
      />
    );

    const badge = screen.getByTestId('validation-badge');
    await user.click(badge);

    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  // PROOF: Fails if onExpandedChange not called when close button clicked
  it('calls onExpandedChange when close button clicked in controlled mode', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <ValidationBadge
        validationResult={errorResult}
        isExpanded={true}
        onExpandedChange={onExpandedChange}
      />
    );

    const closeButton = screen.getByLabelText('Close validation details');
    await user.click(closeButton);

    expect(onExpandedChange).toHaveBeenCalledWith(false);
  });

  // PROOF: Fails if controlled and uncontrolled mode don't work together
  it('works in uncontrolled mode when isExpanded not provided', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(<ValidationBadge validationResult={errorResult} onExpandedChange={onExpandedChange} />);

    const badge = screen.getByTestId('validation-badge');

    // Should be collapsed initially
    expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();

    // Click to expand
    await user.click(badge);
    expect(onExpandedChange).toHaveBeenCalledWith(true);

    // Click to collapse
    await user.click(badge);
    expect(onExpandedChange).toHaveBeenCalledWith(false);
  });

  // PROOF: Fails if internal state conflicts with controlled state
  it('controlled state takes precedence over internal state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ValidationBadge validationResult={errorResult} isExpanded={false} />
    );

    const badge = screen.getByTestId('validation-badge');

    // Try to open by clicking (but controlled prop keeps it closed)
    await user.click(badge);

    // Should still be closed because isExpanded={false}
    expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();

    // Now allow it to be open
    rerender(<ValidationBadge validationResult={errorResult} isExpanded={true} />);

    expect(screen.getByTestId('validation-details')).toBeInTheDocument();
  });
});
