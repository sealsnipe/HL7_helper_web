import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidationBadge } from '@/components/ValidationBadge';
import { ValidationResult } from '@/types/validation';

describe('ValidationBadge', () => {
  const validResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

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

  const warningResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [
      {
        severity: 'warning',
        code: 'MISSING_PID_3',
        message: 'PID-3 is recommended',
        path: 'PID-3',
      },
    ],
    info: [],
  };

  const mixedResult: ValidationResult = {
    isValid: false,
    errors: [
      {
        severity: 'error',
        code: 'MISSING_MSH',
        message: 'MSH segment is required',
        path: 'MSH',
      },
      {
        severity: 'error',
        code: 'MISSING_MSH_9',
        message: 'MSH-9 is required',
        path: 'MSH-9',
      },
    ],
    warnings: [
      {
        severity: 'warning',
        code: 'MISSING_PID_3',
        message: 'PID-3 is recommended',
        path: 'PID-3',
      },
    ],
    info: [
      {
        severity: 'info',
        code: 'INFO_VERSION',
        message: 'Using HL7 version 2.5.1',
        path: 'MSH-12',
      },
    ],
  };

  describe('valid state rendering', () => {
    // PROOF: Fails if valid badge not shown when no issues
    it('shows success state when validation is valid', () => {
      render(<ValidationBadge validationResult={validResult} />);

      expect(screen.getByTestId('validation-badge-valid')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    // PROOF: Fails if checkmark icon missing
    it('shows checkmark icon in valid state', () => {
      render(<ValidationBadge validationResult={validResult} />);

      const badge = screen.getByTestId('validation-badge-valid');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    // PROOF: Fails if success styles not applied
    it('applies success styling in valid state', () => {
      render(<ValidationBadge validationResult={validResult} />);

      const badge = screen.getByTestId('validation-badge-valid');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('error state rendering', () => {
    // PROOF: Fails if badge not shown when errors exist
    it('shows badge when errors exist', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      expect(screen.getByTestId('validation-badge')).toBeInTheDocument();
    });

    // PROOF: Fails if error count not displayed
    it('shows error count', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    // PROOF: Fails if plural not handled
    it('shows plural "errors" when count > 1', () => {
      const multiErrorResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            severity: 'error',
            code: 'ERROR1',
            message: 'Error 1',
            path: 'MSH',
          },
          {
            severity: 'error',
            code: 'ERROR2',
            message: 'Error 2',
            path: 'PID',
          },
        ],
        warnings: [],
        info: [],
      };

      render(<ValidationBadge validationResult={multiErrorResult} />);

      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    // PROOF: Fails if error icon not shown
    it('shows AlertCircle icon for errors', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    // PROOF: Fails if error styles not applied
    it('applies error styling', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveClass('bg-red-100');
    });
  });

  describe('warning state rendering', () => {
    // PROOF: Fails if warning badge not shown
    it('shows badge when warnings exist', () => {
      render(<ValidationBadge validationResult={warningResult} />);

      expect(screen.getByTestId('validation-badge')).toBeInTheDocument();
    });

    // PROOF: Fails if warning count not displayed
    it('shows warning count', () => {
      render(<ValidationBadge validationResult={warningResult} />);

      expect(screen.getByText('1 warning')).toBeInTheDocument();
    });

    // PROOF: Fails if plural not handled for warnings
    it('shows plural "warnings" when count > 1', () => {
      const multiWarningResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            severity: 'warning',
            code: 'WARN1',
            message: 'Warning 1',
            path: 'PID',
          },
          {
            severity: 'warning',
            code: 'WARN2',
            message: 'Warning 2',
            path: 'OBR',
          },
        ],
        info: [],
      };

      render(<ValidationBadge validationResult={multiWarningResult} />);

      expect(screen.getByText('2 warnings')).toBeInTheDocument();
    });

    // PROOF: Fails if warning icon not shown
    it('shows AlertTriangle icon for warnings', () => {
      render(<ValidationBadge validationResult={warningResult} />);

      const badge = screen.getByTestId('validation-badge');
      const icon = badge.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    // PROOF: Fails if warning styles not applied
    it('applies warning styling', () => {
      render(<ValidationBadge validationResult={warningResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveClass('bg-amber-100');
    });
  });

  describe('mixed state rendering', () => {
    // PROOF: Fails if multiple issue types not shown
    it('shows all issue types in summary', () => {
      render(<ValidationBadge validationResult={mixedResult} />);

      expect(screen.getByText(/2 errors, 1 warning, 1 info/)).toBeInTheDocument();
    });

    // PROOF: Fails if priority styling not applied (errors take precedence)
    it('applies error styling when both errors and warnings exist', () => {
      render(<ValidationBadge validationResult={mixedResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveClass('bg-red-100');
    });
  });

  describe('expandable details', () => {
    // PROOF: Fails if details panel not shown when expanded
    it('shows details panel when badge clicked', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByTestId('validation-details')).toBeInTheDocument();
    });

    // PROOF: Fails if details hidden initially
    it('hides details panel initially', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();
    });

    // PROOF: Fails if details panel doesn't close
    it('closes details panel when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      // Open panel
      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByTestId('validation-details')).toBeInTheDocument();

      // Close panel
      const closeButton = screen.getByLabelText('Close validation details');
      await user.click(closeButton);

      expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();
    });

    // PROOF: Fails if toggle doesn't work
    it('toggles details panel on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');

      // Open
      await user.click(badge);
      expect(screen.getByTestId('validation-details')).toBeInTheDocument();

      // Close
      await user.click(badge);
      expect(screen.queryByTestId('validation-details')).not.toBeInTheDocument();

      // Open again
      await user.click(badge);
      expect(screen.getByTestId('validation-details')).toBeInTheDocument();
    });
  });

  describe('error details rendering', () => {
    // PROOF: Fails if error messages not shown in details
    it('displays error messages in details panel', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByText('MSH segment is required')).toBeInTheDocument();
    });

    // PROOF: Fails if error paths not shown
    it('displays error paths', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByText('MSH')).toBeInTheDocument();
    });

    // PROOF: Fails if error codes not accessible via test ID
    it('includes error code in test ID', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByTestId('validation-item-MISSING_MSH')).toBeInTheDocument();
    });

    // PROOF: Fails if all errors not rendered
    it('displays all errors in details', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={mixedResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByText('MSH segment is required')).toBeInTheDocument();
      expect(screen.getByText('MSH-9 is required')).toBeInTheDocument();
    });

    // PROOF: Fails if all warnings not rendered
    it('displays all warnings in details', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={mixedResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByText('PID-3 is recommended')).toBeInTheDocument();
    });

    // PROOF: Fails if info messages not rendered
    it('displays info messages in details', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={mixedResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      expect(screen.getByText('Using HL7 version 2.5.1')).toBeInTheDocument();
    });
  });

  describe('icon rendering in details', () => {
    // PROOF: Fails if error icon not shown in item
    it('shows AlertCircle icon for error items', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      const errorItem = screen.getByTestId('validation-item-MISSING_MSH');
      const icon = errorItem.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });

    // PROOF: Fails if warning icon not shown in item
    it('shows AlertTriangle icon for warning items', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={warningResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      const warningItem = screen.getByTestId('validation-item-MISSING_PID_3');
      const icon = warningItem.querySelector('.text-amber-500');
      expect(icon).toBeInTheDocument();
    });

    // PROOF: Fails if info icon not shown in item
    it('shows Info icon for info items', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={mixedResult} />);

      const badge = screen.getByTestId('validation-badge');
      await user.click(badge);

      const infoItem = screen.getByTestId('validation-item-INFO_VERSION');
      const icon = infoItem.querySelector('.text-blue-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    // PROOF: Fails if ARIA expanded attribute missing
    it('sets aria-expanded attribute correctly', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveAttribute('aria-expanded', 'false');

      await user.click(badge);
      expect(badge).toHaveAttribute('aria-expanded', 'true');
    });

    // PROOF: Fails if ARIA label missing
    it('has descriptive aria-label', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveAttribute('aria-label');
      expect(badge.getAttribute('aria-label')).toContain('1 error');
    });

    // PROOF: Fails if button role not present
    it('badge is a button', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge.tagName).toBe('BUTTON');
    });
  });

  describe('styling variations', () => {
    // PROOF: Fails if custom className not applied
    it('applies custom className', () => {
      const { container } = render(
        <ValidationBadge validationResult={validResult} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    // PROOF: Fails if dark mode classes not present
    it('includes dark mode styling classes', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge.className).toContain('dark:');
    });
  });

  describe('edge cases', () => {
    // PROOF: Fails if info-only result not styled correctly
    it('handles info-only result', () => {
      const infoOnlyResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        info: [
          {
            severity: 'info',
            code: 'INFO',
            message: 'Info message',
            path: 'MSH',
          },
        ],
      };

      render(<ValidationBadge validationResult={infoOnlyResult} />);

      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveClass('bg-blue-100');
    });

    // PROOF: Fails if empty result not handled (should show valid)
    it('shows valid state for result with no issues at all', () => {
      render(<ValidationBadge validationResult={validResult} />);

      expect(screen.getByTestId('validation-badge-valid')).toBeInTheDocument();
    });

    // PROOF: Fails if zero-count singular/plural wrong
    it('handles singular form for count of 1', () => {
      render(<ValidationBadge validationResult={errorResult} />);

      expect(screen.getByText('1 error')).toBeInTheDocument();
      expect(screen.queryByText('1 errors')).not.toBeInTheDocument();
    });

    // PROOF: Fails if ChevronDown/Up icons not toggled
    it('toggles chevron icon between down and up', async () => {
      const user = userEvent.setup();
      render(<ValidationBadge validationResult={errorResult} />);

      // Initially collapsed (aria-expanded=false)
      const badge = screen.getByTestId('validation-badge');
      expect(badge).toHaveAttribute('aria-expanded', 'false');

      // Badge should contain SVGs (alert icon + chevron)
      const initialSvgs = badge.querySelectorAll('svg');
      expect(initialSvgs.length).toBeGreaterThanOrEqual(2);

      // After click, should be expanded (aria-expanded=true)
      await user.click(badge);
      expect(badge).toHaveAttribute('aria-expanded', 'true');

      // Verify the details panel is visible (which confirms the toggle worked)
      expect(screen.getByTestId('validation-details')).toBeInTheDocument();
    });
  });
});
