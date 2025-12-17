import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SegmentDto } from '@/types';
import { ValidationResult } from '@/types/validation';
import { parseHl7Message } from '@/utils/hl7Parser';
import { generateHl7Message } from '@/utils/hl7Generator';
import { validateMessage, createEmptyValidationResult } from '@/utils/validation';

const PARSE_DEBOUNCE_MS = 300;
const HISTORY_DEBOUNCE_MS = 500;
const MAX_HISTORY_SIZE = 50;

interface EditorHistory {
  past: SegmentDto[][];
  future: SegmentDto[][];
}

export interface UseHl7EditorReturn {
  rawInput: string;
  segments: SegmentDto[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  canUndo: boolean;
  canRedo: boolean;
  validationResult: ValidationResult;

  setRawInput: (value: string) => void;
  updateSegments: (segments: SegmentDto[]) => void;
  updateRaw: () => void;
  clearMessage: () => void;
  loadMessage: (hl7: string) => void;
  undo: () => void;
  redo: () => void;
  validateNow: () => ValidationResult;
}

const isValidHl7Content = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  if (!/^[A-Z][A-Z0-9]{2}\|/.test(content)) return false;
  const validHl7Pattern = /^[\x20-\x7E\r\n\t]*$/;
  if (!validHl7Pattern.test(content)) return false;
  if (/<[a-zA-Z]|javascript:|data:/i.test(content)) return false;
  return true;
};

const applyEditability = (segments: SegmentDto[]): SegmentDto[] => {
  return segments.map((seg) => ({
    ...seg,
    fields: seg.fields.map((f) => ({
      ...f,
      isEditable: !(seg.name === 'MSH' && (f.position === 1 || f.position === 2)),
    })),
  }));
};

export function useHl7Editor(initialValue?: string): UseHl7EditorReturn {
  const [rawInput, setRawInputState] = useState<string>(initialValue ?? '');
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [history, setHistory] = useState<EditorHistory>({ past: [], future: [] });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUndoRedoRef = useRef<boolean>(false);
  const segmentsRef = useRef<SegmentDto[]>([]);

  const validationResult = useMemo<ValidationResult>(() => {
    if (segments.length === 0) {
      return createEmptyValidationResult();
    }
    return validateMessage(segments);
  }, [segments]);

  const validateNow = useCallback((): ValidationResult => {
    if (segments.length === 0) {
      return createEmptyValidationResult();
    }
    return validateMessage(segments);
  }, [segments]);

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

      if (data.length === 0) {
        setError('No valid HL7 segments found in the message.');
        setSegments([]);
        setIsLoading(false);
        return;
      }

      const invalidSegments = data.filter((seg) => !/^[A-Z][A-Z0-9]{2}$/.test(seg.name));
      if (invalidSegments.length > 0) {
        setError(
          `Invalid segment name(s): ${invalidSegments.map((s) => `"${s.name}"`).join(', ')}. HL7 segments must be 3 uppercase characters (e.g., MSH, PID, OBR).`
        );
        setSegments([]);
        setIsLoading(false);
        return;
      }

      const emptySegments = data.filter((seg) => seg.fields.length === 0);
      if (emptySegments.length === data.length) {
        setError('Message contains no valid field data.');
        setSegments([]);
        setIsLoading(false);
        return;
      }

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

  const setRawInput = useCallback(
    (newText: string) => {
      setRawInputState(newText);
      setIsTyping(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        parseMessage(newText);
      }, PARSE_DEBOUNCE_MS);
    },
    [parseMessage]
  );

  const pushToHistory = useCallback((previousSegments: SegmentDto[]) => {
    if (isUndoRedoRef.current) return;
    if (previousSegments.length === 0) return;

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }

    historyDebounceRef.current = setTimeout(() => {
      setHistory((prev) => ({
        past: [...prev.past.slice(-(MAX_HISTORY_SIZE - 1)), previousSegments],
        future: [],
      }));
    }, HISTORY_DEBOUNCE_MS);
  }, []);

  const updateSegments = useCallback(
    (updatedSegments: SegmentDto[]) => {
      if (segmentsRef.current.length > 0 && !isUndoRedoRef.current) {
        pushToHistory(segmentsRef.current);
      }
      setSegments(updatedSegments);
    },
    [pushToHistory]
  );

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

  const clearMessage = useCallback(() => {
    if (segmentsRef.current.length > 0) {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
      }
      setHistory((prev) => ({
        past: [...prev.past.slice(-(MAX_HISTORY_SIZE - 1)), segmentsRef.current],
        future: [],
      }));
    }
    setRawInputState('');
    setSegments([]);
    setError(null);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      isUndoRedoRef.current = true;
      setSegments(previous);
      try {
        const newHl7 = generateHl7Message(previous);
        setRawInputState(newHl7);
      } catch (err) {
        console.error('Generate error during undo:', err);
      }
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
      return { past: newPast, future: [segmentsRef.current, ...prev.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      isUndoRedoRef.current = true;
      setSegments(next);
      try {
        const newHl7 = generateHl7Message(next);
        setRawInputState(newHl7);
      } catch (err) {
        console.error('Generate error during redo:', err);
      }
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
      return { past: [...prev.past, segmentsRef.current], future: newFuture };
    });
  }, []);

  const loadMessage = useCallback(
    (hl7: string) => {
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

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialValue) parseMessage(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    rawInput,
    segments,
    isLoading,
    error,
    isTyping,
    canUndo,
    canRedo,
    validationResult,
    setRawInput,
    updateSegments,
    updateRaw,
    clearMessage,
    loadMessage,
    undo,
    redo,
    validateNow,
  };
}

export { isValidHl7Content };
