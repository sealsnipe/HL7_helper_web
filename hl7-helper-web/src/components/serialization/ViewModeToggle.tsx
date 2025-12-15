import React from 'react';
import { ViewMode } from '@/types/serialization';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Toggle between Variables-Only and All-Fields view modes
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
}) => {
  // Handle keyboard arrow navigation (WAI-ARIA pattern)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const newMode: ViewMode = mode === 'variables-only' ? 'all-fields' : 'variables-only';
      onChange(newMode);
    }
  };

  return (
    <div
      className="inline-flex rounded-md border border-input overflow-hidden text-xs"
      role="group"
      aria-label="View mode toggle"
      data-testid="view-mode-toggle"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => onChange('variables-only')}
        className={`px-2 py-1 transition-colors ${
          mode === 'variables-only'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
        aria-pressed={mode === 'variables-only'}
        data-testid="view-mode-vars"
      >
        Vars
      </button>
      <button
        type="button"
        onClick={() => onChange('all-fields')}
        className={`px-2 py-1 border-l border-input transition-colors ${
          mode === 'all-fields'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
        aria-pressed={mode === 'all-fields'}
        data-testid="view-mode-all"
      >
        All
      </button>
    </div>
  );
};
