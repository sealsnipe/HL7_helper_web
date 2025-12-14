import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test message',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up body styles
    document.body.style.overflow = '';
  });

  // PROOF: Catches bug where dialog renders when it should be hidden
  it('renders nothing when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // PROOF: Catches bug where dialog doesn't render when opened
  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  // PROOF: Catches bug where title is not displayed
  it('displays title correctly', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  // PROOF: Catches bug where message is not displayed
  it('displays message correctly', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  // PROOF: Catches bug where confirm callback is not called
  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  // PROOF: Catches bug where cancel callback is not called
  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // PROOF: Catches accessibility bug where Escape doesn't close dialog
  it('calls onCancel when Escape pressed', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // PROOF: Catches bug where backdrop click doesn't close dialog
  it('calls onCancel when backdrop clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Click on backdrop (the div with onClick={onCancel})
    const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  // PROOF: Catches bug where custom labels are not used
  it('displays custom confirmLabel and cancelLabel', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  // PROOF: Catches visual bug where destructive variant doesn't have red button
  it('destructive variant uses correct button styling', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  // PROOF: Catches visual bug where default variant doesn't have green button
  it('default variant uses correct button styling', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);

    const confirmButton = screen.getByTestId('confirm-dialog-confirm');
    expect(confirmButton).toHaveClass('bg-green-600');
  });

  // PROOF: Catches accessibility bug where body scroll is not prevented
  it('prevents body scroll when dialog is open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  // PROOF: Catches bug where body scroll is not restored on close
  it('restores body scroll when dialog closes', () => {
    const { rerender } = render(<ConfirmDialog {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(document.body.style.overflow).toBe('');
  });
});
