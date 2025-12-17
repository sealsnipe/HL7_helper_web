'use client';

import React, { useState } from 'react';
import { ValidationResult, ValidationError } from '@/types/validation';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ValidationBadgeProps {
  validationResult: ValidationResult;
  className?: string;
  onErrorClick?: (error: ValidationError) => void;
  /** Controlled expanded state (optional) */
  isExpanded?: boolean;
  /** Callback when expanded state changes (optional) */
  onExpandedChange?: (expanded: boolean) => void;
}

export function ValidationBadge({
  validationResult,
  className = '',
  onErrorClick,
  isExpanded: controlledExpanded,
  onExpandedChange,
}: ValidationBadgeProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  const setIsExpanded = (expanded: boolean) => {
    // Only update internal state in uncontrolled mode
    if (!isControlled) {
      setInternalExpanded(expanded);
    }
    onExpandedChange?.(expanded);
  };

  const errorCount = validationResult.errors.length;
  const warningCount = validationResult.warnings.length;
  const infoCount = validationResult.info.length;
  const totalIssues = errorCount + warningCount + infoCount;

  if (totalIssues === 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium ${className}`}
        data-testid="validation-badge-valid"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Valid</span>
      </div>
    );
  }

  const getBadgeStyles = () => {
    if (errorCount > 0) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    }
    if (warningCount > 0) {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  const getSummaryText = () => {
    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    if (infoCount > 0) parts.push(`${infoCount} info`);
    return parts.join(', ');
  };

  const handleErrorClick = (error: ValidationError) => {
    if (onErrorClick && error.segmentIndex !== undefined) {
      onErrorClick(error);
    }
  };

  const isClickable = (error: ValidationError) => {
    return onErrorClick !== undefined && error.segmentIndex !== undefined;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:opacity-90 ${getBadgeStyles()}`}
        data-testid="validation-badge"
        aria-expanded={isExpanded}
        aria-label={`Validation: ${getSummaryText()}. Click to ${isExpanded ? 'hide' : 'show'} details.`}
      >
        {errorCount > 0 && <AlertCircle className="w-4 h-4" />}
        {errorCount === 0 && warningCount > 0 && <AlertTriangle className="w-4 h-4" />}
        {errorCount === 0 && warningCount === 0 && <Info className="w-4 h-4" />}
        <span>{getSummaryText()}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div
          className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50"
          data-testid="validation-details"
        >
          <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-card border-b border-border">
            <span className="font-semibold text-sm text-card-foreground">Validation Issues</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Close validation details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {validationResult.errors.map((error, index) => (
              <ValidationErrorItem
                key={`error-${index}`}
                error={error}
                onClick={() => handleErrorClick(error)}
                isClickable={isClickable(error)}
              />
            ))}
            {validationResult.warnings.map((warning, index) => (
              <ValidationErrorItem
                key={`warning-${index}`}
                error={warning}
                onClick={() => handleErrorClick(warning)}
                isClickable={isClickable(warning)}
              />
            ))}
            {validationResult.info.map((info, index) => (
              <ValidationErrorItem
                key={`info-${index}`}
                error={info}
                onClick={() => handleErrorClick(info)}
                isClickable={isClickable(info)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ValidationErrorItemProps {
  error: ValidationError;
  onClick?: () => void;
  isClickable?: boolean;
}

function ValidationErrorItem({ error, onClick, isClickable = false }: ValidationErrorItemProps) {
  const getIcon = () => {
    switch (error.severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getBgColor = () => {
    switch (error.severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30';
    }
  };

  const baseClasses = `flex items-start gap-2 p-2 rounded-md transition-colors ${getBgColor()}`;
  const clickableClasses = isClickable ? 'cursor-pointer' : '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`${baseClasses} ${clickableClasses}`}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      data-testid={`validation-item-${error.code}`}
      aria-label={isClickable ? `Go to ${error.path || error.code}: ${error.message}` : undefined}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {error.path || error.code}
          </span>
          {isClickable && <span className="text-xs text-primary">Click to navigate</span>}
        </div>
        <p className="text-sm text-card-foreground mt-0.5">{error.message}</p>
      </div>
    </div>
  );
}

export default ValidationBadge;
