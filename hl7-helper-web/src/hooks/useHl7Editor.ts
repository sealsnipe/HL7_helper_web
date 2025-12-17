import { useState, useCallback, useEffect, useRef } from 'react';
import { SegmentDto } from '@/types';
import { parseHl7Message } from '@/utils/hl7Parser';
import { generateHl7Message } from '@/utils/hl7Generator';

// Debounce delay for live parsing (ms)
const PARSE_DEBOUNCE_MS = 300;

/**
 * Return type for the useHl7Editor hook
 */
export interface UseHl7EditorReturn {
  // State
  rawInput: string;
  segments: SegmentDto[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;

  // Actions
  setRawInput: (value: string) => void;
  updateSegments: (segments: SegmentDto[]) => void;
  updateRaw: () => void;
  clearMessage: () => void;
  loadMessage: (hl7: string) => void;
}

/**
 * Validates that a string looks like valid HL7 content.
 * HL7 messages should only contain printable ASCII characters and specific delimiters.
 * This helps prevent XSS attacks from localStorage injection.
 */
const isValidHl7Content = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;

  // HL7 messages must start with a valid segment name (3 uppercase letters/digits)
  // Most commonly MSH for a complete message
  if (!/^[A-Z][A-Z0-9]{2}\|/.test(content)) return false;

  // HL7 should only contain printable ASCII (0x20-0x7E), CR (\r), LF (\n), and tab
  // This prevents injection of HTML/script tags
  const validHl7Pattern = /^[\x20-\x7E\r\n\t]*$/;
  if (!validHl7Pattern.test(content)) return false;

  // Reject content that looks like HTML/script injection
  if (/<[a-zA-Z]|javascript:|data:/i.test(content)) return false;

  return true;
};

/**
 * Makes fields editable based on HL7 rules.
 * MSH-1 (field separator) and MSH-2 (encoding characters) are never editable.
 */
const applyEditability = (segments: SegmentDto[]): SegmentDto[] => {
  return segments.map((seg) => ({
    ...seg,
    fields: seg.fields.map((f) => ({
      ...f,
      isEditable: !(seg.name === 'MSH' && (f.position === 1 || f.position === 2)),
    })),
  }));
};

/**
 * Custom hook for managing HL7 editor state.
 * Encapsulates all editor logic including parsing, generation, and state management.
 *
 * @param initialValue - Optional initial HL7 message to load
 * @returns Editor state and actions
 *
 * @example
 * ```tsx
 * const {
 *   rawInput,
 *   segments,
 *   isLoading,
 *   error,
 *   setRawInput,
 *   updateSegments,
 *   updateRaw,
 *   clearMessage,
 *   loadMessage,
 * } = useHl7Editor();
 * ```
 */
export function useHl7Editor(initialValue?: string): UseHl7EditorReturn {
  const [rawInput, setRawInputState] = useState<string>(initialValue ?? '');
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Ref for debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Parse HL7 text into segments with validation
   */
  const parseMessage = useCallback((text: string) => {
    if (!text.trim()) {
      setSegments([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = parseHl7Message(text);

      // Validate the parsed result - check for valid HL7 structure
      if (data.length === 0) {
        setError('No valid HL7 segments found in the message.');
        setSegments([]);
        setIsLoading(false);
        return;
      }

      // Check if segments have valid names (3 uppercase alphanumeric starting with letter)
      const invalidSegments = data.filter((seg) => !/^[A-Z][A-Z0-9]{2}$/.test(seg.name));
      if (invalidSegments.length > 0) {
        setError(
          `Invalid segment name(s): ${invalidSegments.map((s) => `"${s.name}"`).join(', ')}. HL7 segments must be 3 uppercase characters (e.g., MSH, PID, OBR).`
        );
        setSegments([]);
        setIsLoading(false);
        return;
      }

      // Check if segments have fields (at least the segment name counts as content)
      const emptySegments = data.filter((seg) => seg.fields.length === 0);
      if (emptySegments.length === data.length) {
        setError('Message contains no valid field data.');
        setSegments([]);
        setIsLoading(false);
        return;
      }

      // Make fields editable except for MSH-1 and MSH-2
      const editableSegments = applyEditability(data);
      setSegments(editableSegments);
      setError(null);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse message');
      setSegments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle raw input changes with debounced parsing
   */
  const setRawInput = useCallback(
    (newText: string) => {
      setRawInputState(newText);
      setIsTyping(true);

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        parseMessage(newText);
      }, PARSE_DEBOUNCE_MS);
    },
    [parseMessage]
  );

  /**
   * Update segments directly (e.g., from visual editor)
   */
  const updateSegments = useCallback((updatedSegments: SegmentDto[]) => {
    setSegments(updatedSegments);
  }, []);

  /**
   * Regenerate raw HL7 from current segments
   */
  const updateRaw = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const newHl7 = generateHl7Message(segments);
      setRawInputState(newHl7);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    } finally {
      setIsLoading(false);
    }
  }, [segments]);

  /**
   * Clear the message completely
   */
  const clearMessage = useCallback(() => {
    setRawInputState('');
    setSegments([]);
    setError(null);
  }, []);

  /**
   * Load a new HL7 message (from template, file, etc.)
   * Parses immediately without debounce
   */
  const loadMessage = useCallback(
    (hl7: string) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setIsTyping(false);
      setRawInputState(hl7);
      setError(null);
      parseMessage(hl7);
    },
    [parseMessage]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Parse initial value if provided
  useEffect(() => {
    if (initialValue) {
      parseMessage(initialValue);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    rawInput,
    segments,
    isLoading,
    error,
    isTyping,

    // Actions
    setRawInput,
    updateSegments,
    updateRaw,
    clearMessage,
    loadMessage,
  };
}

// Re-export the validation helper for use in page.tsx for localStorage validation
export { isValidHl7Content };
