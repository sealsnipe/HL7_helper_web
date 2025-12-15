import React, { useState } from 'react';
import { InstanceOutput } from '@/types/serialization';
import { formatAllOutputsForCopy } from '@/utils/serializationHelpers';

interface ActionBarProps {
  instanceCount: number;
  outputs: InstanceOutput[];
  onSerializeAndLoad: () => void;
}

/**
 * Bottom action bar with Copy All and Serialize & Load buttons
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  instanceCount,
  outputs,
  onSerializeAndLoad,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopyAll = async () => {
    try {
      const allOutputs = formatAllOutputsForCopy(outputs);
      await navigator.clipboard.writeText(allOutputs);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Check if any output has unfilled variables
  const hasUnfilledVariables = outputs.some(o => o.hasUnfilledVariables);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg"
      data-testid="action-bar"
    >
      {/* Instance count badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {instanceCount} instance{instanceCount !== 1 ? 's' : ''}
        </span>
        {hasUnfilledVariables && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            (some have unfilled variables)
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopyAll}
          disabled={outputs.length === 0}
          className={`px-4 py-2 text-sm rounded transition-colors ${
            outputs.length > 0
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label={`Copy all ${instanceCount} messages to clipboard`}
          data-testid="copy-all-btn"
        >
          {copyStatus === 'copied'
            ? 'Copied!'
            : copyStatus === 'failed'
            ? 'Failed'
            : `Copy All (${instanceCount})`}
        </button>

        <button
          onClick={onSerializeAndLoad}
          disabled={outputs.length === 0}
          className={`px-4 py-2 text-sm rounded transition-colors ${
            outputs.length > 0
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label="Serialize first instance and load into main editor"
          data-testid="serialize-and-load-btn"
        >
          Serialize & Load
        </button>
      </div>

      {/* Live region for copy status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copyStatus === 'copied' && 'All messages copied to clipboard.'}
        {copyStatus === 'failed' && 'Failed to copy to clipboard. Please try again.'}
      </div>
    </div>
  );
};
