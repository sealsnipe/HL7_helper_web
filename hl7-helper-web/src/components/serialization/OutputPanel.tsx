import React, { useState } from 'react';

interface OutputPanelProps {
  instanceName: string;
  serializedHl7: string;
  hasUnfilledVariables: boolean;
}

/**
 * Panel displaying the serialized HL7 output for an instance
 */
export const OutputPanel: React.FC<OutputPanelProps> = ({
  instanceName,
  serializedHl7,
  hasUnfilledVariables,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serializedHl7);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Format for display (replace \r with \n for CSS line breaks)
  const displayText = serializedHl7.replace(/\r/g, '\n');

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col"
      data-testid={`output-panel-${instanceName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-card-foreground">
            {instanceName}
          </span>
          {hasUnfilledVariables && (
            <span
              className="text-xs text-amber-600 dark:text-amber-400"
              title="Contains unfilled HELPERVARIABLE placeholders"
            >
              (unfilled)
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          aria-label={`Copy ${instanceName} output to clipboard`}
          data-testid={`copy-btn-${instanceName}`}
        >
          {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Failed' : 'Copy'}
        </button>
      </div>

      {/* Output content */}
      <div
        className="flex-1 p-3 font-mono text-xs bg-muted/20 overflow-auto whitespace-pre-wrap min-h-[100px] max-h-[300px]"
        data-testid={`output-content-${instanceName}`}
      >
        {displayText || (
          <span className="text-muted-foreground italic">
            Output will appear here...
          </span>
        )}
      </div>
    </div>
  );
};
