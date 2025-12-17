'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageEditor } from '@/components/MessageEditor';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ValidationBadge } from '@/components/ValidationBadge';
import { useHl7Editor, isValidHl7Content } from '@/hooks/useHl7Editor';
import { useFieldSearch } from '@/hooks/useFieldSearch';
import { SAMPLE_TEMPLATES } from '@/data/templates';
import { Undo2, Redo2 } from 'lucide-react';
import { SearchMatch } from '@/utils/fieldSearch';

/** Highlighted field state for search results */
interface HighlightedField {
  segmentIndex: number;
  fieldPosition: number;
  componentPosition?: number;
}

export default function Home() {
  // Use the hook for all HL7 editor state management
  const {
    rawInput,
    segments,
    isLoading,
    error,
    isTyping,
    canUndo,
    canRedo,
    setRawInput,
    updateSegments,
    updateRaw,
    clearMessage,
    loadMessage,
    undo,
    redo,
    validationResult,
  } = useHl7Editor();

  // Field search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    selectedIndex: searchSelectedIndex,
    selectNext: searchSelectNext,
    selectPrevious: searchSelectPrevious,
    clear: searchClear,
    isSearching,
    isOpen: isSearchOpen,
    setIsOpen: setSearchOpen,
  } = useFieldSearch(segments);

  // UI-specific state (not related to HL7 parsing/editing)
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showNewMessageConfirm, setShowNewMessageConfirm] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [highlightedField, setHighlightedField] = useState<HighlightedField | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  // UI handlers
  const handleNewMessage = () => {
    setShowNewMessageConfirm(true);
  };

  const handleNewMessageConfirm = () => {
    clearMessage();
    setShowNewMessageConfirm(false);
  };

  const handleNewMessageCancel = () => {
    setShowNewMessageConfirm(false);
  };

  const handleClear = () => {
    clearMessage();
  };

  const handleTrySample = () => {
    const firstTemplate = Object.values(SAMPLE_TEMPLATES)[0];
    loadMessage(firstTemplate);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rawInput);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLoadTemplate = (templateKey: string) => {
    const template = SAMPLE_TEMPLATES[templateKey];
    setShowTemplateModal(false);
    loadMessage(template);
  };

  // Handle search result selection - expand segment and highlight field
  const handleSearchResultSelect = useCallback(
    (match: SearchMatch) => {
      // Expand the segment containing the match
      setExpandedSegments((prev) => {
        const newSet = new Set(prev);
        newSet.add(match.segmentIndex);
        return newSet;
      });

      // Set the highlighted field
      setHighlightedField({
        segmentIndex: match.segmentIndex,
        fieldPosition: match.fieldPosition,
        componentPosition: match.componentPosition,
      });

      // Clear highlight after animation
      setTimeout(() => {
        setHighlightedField(null);
      }, 2000);

      // Close search after selection
      setSearchOpen(false);
    },
    [setSearchOpen]
  );

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input or textarea
      const target = e.target as HTMLElement;
      const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Only handle shortcuts when not in the raw HL7 textarea (data-testid="raw-hl7-input")
      // to avoid conflicting with native undo/redo in that textarea
      if (isTextInput && target.getAttribute('data-testid') === 'raw-hl7-input') {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Check for generated message from template system
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('loadGenerated') === 'true') {
      const generated = localStorage.getItem('generated_hl7');
      if (generated && isValidHl7Content(generated)) {
        loadMessage(generated);
        localStorage.removeItem('generated_hl7');
      } else if (generated) {
        console.warn('Invalid HL7 content detected in localStorage, ignoring');
        localStorage.removeItem('generated_hl7');
      }
      window.history.replaceState({}, '', '/');
    }
  }, [loadMessage]);

  return (
    <main className="min-h-screen bg-background font-sans transition-colors relative text-foreground selection:bg-primary/20">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="bg-card/90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-2xl border border-border/50 ring-1 ring-white/10">
            <h3 className="text-2xl font-bold mb-6 text-card-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              Select Example Message
            </h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(SAMPLE_TEMPLATES).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLoadTemplate(key)}
                  className="w-full text-left px-5 py-4 hover:bg-primary/10 rounded-lg border border-border/50 hover:border-primary/50 text-card-foreground transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative font-medium">{key}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="mt-8 w-full px-4 py-3 bg-muted/50 text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Message Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showNewMessageConfirm}
        title="Clear Current Message"
        message="Are you sure you want to clear the current message? This action cannot be undone."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        onConfirm={handleNewMessageConfirm}
        onCancel={handleNewMessageCancel}
        variant="destructive"
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <NavigationHeader
            activePage="home"
            onNewMessage={handleNewMessage}
            onLoadExample={() => setShowTemplateModal(true)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            searchSelectedIndex={searchSelectedIndex}
            onSearchSelectNext={searchSelectNext}
            onSearchSelectPrevious={searchSelectPrevious}
            onSearchClear={searchClear}
            isSearching={isSearching}
            isSearchOpen={isSearchOpen}
            onSearchOpenChange={setSearchOpen}
            onSearchResultSelect={handleSearchResultSelect}
            hasSearchContent={segments.length > 0}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Main Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Input */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-card-foreground">
                      Raw HL7 Message
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Input your message string below
                    </span>
                  </div>
                </div>
              </div>

              <textarea
                className="flex-1 w-full min-h-[400px] p-4 border border-input/50 rounded-lg font-mono text-sm bg-background/50 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all resize-none custom-scrollbar"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="MSH|^~\&|..."
                spellCheck={false}
                data-testid="raw-hl7-input"
              />

              {/* Live parsing indicator */}
              {isTyping && rawInput.trim() && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Parsing...</span>
                </div>
              )}
            </div>

            {/* Only show error when not typing */}
            {error && !isTyping && (
              <div className="relative z-10 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Unable to Parse Message</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-lg text-sm font-medium transition-colors"
                    data-testid="error-clear-button"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleTrySample}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                    data-testid="error-try-sample-button"
                  >
                    Try Sample Message
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editor */}
          <div className="group relative h-full">
            <div className="absolute -inset-0.5 bg-gradient-to-l from-primary/30 to-purple-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-card/80 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-border/50 h-full min-h-[500px]">
              {segments.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-foreground">Visual Editor</h2>
                      <ValidationBadge validationResult={validationResult} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Undo (Ctrl+Z)"
                        data-testid="undo-button"
                        aria-label="Undo last change"
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Redo (Ctrl+Y)"
                        data-testid="redo-button"
                        aria-label="Redo last change"
                      >
                        <Redo2 className="h-4 w-4" />
                      </button>
                      <div className="w-px bg-border mx-1" />
                      <button
                        onClick={handleCopyToClipboard}
                        disabled={!rawInput}
                        className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                        data-testid="copy-to-clipboard-button"
                        aria-label="Copy HL7 message to clipboard"
                      >
                        {copySuccess ? (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={updateRaw}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600/90 hover:bg-green-600 text-white rounded-lg font-medium shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                        data-testid="regenerate-button"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Update Raw
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ErrorBoundary>
                      <MessageEditor
                        segments={segments}
                        onUpdate={updateSegments}
                        highlightedField={highlightedField}
                        expandedSegments={expandedSegments}
                        onExpandedSegmentsChange={setExpandedSegments}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-60">
                  <div className="p-6 bg-muted/50 rounded-full">
                    <svg
                      className="h-16 w-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="text-lg font-medium text-foreground">No Message Loaded</p>
                    <p className="text-sm mt-1">
                      Paste a message on the left or load an example to start editing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
