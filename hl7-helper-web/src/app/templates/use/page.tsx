'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Template } from '@/types/template';
import { SerializationInstance } from '@/types';
import { UniqueVariable, createInstanceId, InstanceId } from '@/types/serialization';
import { SAMPLE_TEMPLATES } from '@/data/templates';
import { NavigationHeader } from '@/components/NavigationHeader';
import { VariablesOnlyView } from '@/components/serialization/VariablesOnlyView';
import { parseHl7Message } from '@/utils/hl7Parser';
import { loadTemplatesFromStorage } from '@/utils/templateValidation';
import { applyVariableEditability, getVariableBadgeColor } from '@/utils/templateHelpers';
import {
  extractUniqueVariablesWithMetadata,
  computeInstanceOutput,
} from '@/utils/serializationHelpers';
import { runMigrations } from '@/services/persistence/migrations';

/**
 * Highlight HELPERVARIABLE placeholders in raw HL7 text
 * Supports HELPERVARIABLE (basic) and HELPERVARIABLE1-999 (numbered groups)
 */
const highlightVariablesInText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Match HELPERVARIABLE followed by optional 1-3 digit number (1-999)
  // The negative lookahead (?!\d) ensures plain HELPERVARIABLE doesn't match partial numbers
  const parts = text.split(/(HELPERVARIABLE[1-9]\d{0,2}|HELPERVARIABLE(?!\d))/g);
  return parts.map((part, index) => {
    const match = part.match(/^HELPERVARIABLE([1-9]\d{0,2})?$/);
    if (match) {
      const groupId = match[1] ? parseInt(match[1], 10) : undefined;
      const colorClass = getVariableBadgeColor(groupId);
      return (
        <span key={index} className={`${colorClass} px-1 rounded font-bold`}>
          {part}
        </span>
      );
    }
    return part;
  });
};

/**
 * Extract message type from HL7 content (MSH-9 field)
 */
const extractMessageType = (hl7Content: string): string => {
  try {
    const mshSegment = hl7Content.split(/\r|\n/)[0];
    const fields = mshSegment.split('|');
    if (fields.length >= 9) {
      const messageTypeField = fields[8]; // MSH-9
      return messageTypeField.replace('^', '-');
    }
  } catch {
    // Fallback
  }
  return 'UNKNOWN';
};

/**
 * Get default templates from SAMPLE_TEMPLATES
 */
const getDefaultTemplates = (): Template[] => {
  return Object.entries(SAMPLE_TEMPLATES).map(([name, content], idx) => ({
    id: `default-${idx}`,
    name,
    description: 'Standard Example',
    messageType: extractMessageType(content),
    content,
    createdAt: 0,
  }));
};

export default function UseTemplatePage() {
  // Initialize with empty array to avoid duplicates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentTemplateContent, setCurrentTemplateContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Multiple serializations state
  const [serializations, setSerializations] = useState<SerializationInstance[]>([]);

  // Load templates from storage on client-side only
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Run migrations first
        await runMigrations();

        // Load templates from storage
        const customTemplates = await loadTemplatesFromStorage();
        const defaultTemplates = getDefaultTemplates();

        if (customTemplates.length > 0) {
          setTemplates(customTemplates); // Use saved templates (includes defaults)
        } else {
          setTemplates(defaultTemplates); // Fresh defaults
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        setError('Failed to load templates. Please refresh the page.');
        setTemplates(getDefaultTemplates());
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Parse the template content and apply variable editability
  const parsedSegments = useMemo(() => {
    if (!currentTemplateContent) {
      return [];
    }
    const segments = parseHl7Message(currentTemplateContent);
    return applyVariableEditability(segments);
  }, [currentTemplateContent]);

  // Extract unique variables from parsed segments
  const uniqueVariables: UniqueVariable[] = useMemo(() => {
    return extractUniqueVariablesWithMetadata(parsedSegments);
  }, [parsedSegments]);

  // Create initial variable values (placeholder -> placeholder)
  const createInitialVariableValues = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};
    for (const v of uniqueVariables) {
      values[v.variableId] = v.variableId; // Initialize with placeholder
    }
    return values;
  }, [uniqueVariables]);

  // Initialize first serialization when template changes
  useEffect(() => {
    if (parsedSegments.length > 0) {
      const instanceId = createInstanceId();
      const initialVariableValues = createInitialVariableValues();
      const initialOutput = computeInstanceOutput(
        {
          id: instanceId,
          name: '',
          variableValues: initialVariableValues,
          createdAt: 0,
          isExpanded: true,
        },
        parsedSegments
      );
      const firstInstance: SerializationInstance = {
        id: instanceId,
        segments: structuredClone(parsedSegments),
        output: initialOutput.serializedHl7,
        copyButtonText: 'Copy to Clipboard',
        variableValues: initialVariableValues,
      };
      setSerializations([firstInstance]);
    } else {
      setSerializations([]);
    }
  }, [parsedSegments, createInitialVariableValues]);

  // Check if template has any variables (basic or numbered HELPERVARIABLE1-999)
  const hasVariables = useMemo(() => {
    return /HELPERVARIABLE(?:\d{1,3})?/.test(currentTemplateContent);
  }, [currentTemplateContent]);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setCurrentTemplateContent(template.content);
    } else {
      setCurrentTemplateContent('');
    }
  };

  // Add new serialization
  const handleAddSerialization = () => {
    const instanceId = createInstanceId();
    const initialVariableValues = createInitialVariableValues();
    const initialOutput = computeInstanceOutput(
      {
        id: instanceId,
        name: '',
        variableValues: initialVariableValues,
        createdAt: 0,
        isExpanded: true,
      },
      parsedSegments
    );
    const newInstance: SerializationInstance = {
      id: instanceId,
      segments: structuredClone(parsedSegments),
      output: initialOutput.serializedHl7,
      copyButtonText: 'Copy to Clipboard',
      variableValues: initialVariableValues,
    };

    setSerializations((prev) => [...prev, newInstance]);

    // Scroll to new serialization
    setTimeout(() => {
      const element = document.querySelector(
        `[data-testid="serialization-block-${newInstance.id}"]`
      );
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Remove serialization
  const handleRemoveSerialization = (id: string) => {
    setSerializations((prev) => prev.filter((s) => s.id !== id));
  };

  // Copy individual serialization to clipboard
  const handleCopySerializationToClipboard = async (id: string) => {
    const instance = serializations.find((s) => s.id === id);
    if (!instance) return;

    try {
      await navigator.clipboard.writeText(instance.output);
      setSerializations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, copyButtonText: 'Copied!' } : s))
      );
      setTimeout(() => {
        setSerializations((prev) =>
          prev.map((s) => (s.id === id ? { ...s, copyButtonText: 'Copy to Clipboard' } : s))
        );
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setSerializations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, copyButtonText: 'Failed to copy' } : s))
      );
      setTimeout(() => {
        setSerializations((prev) =>
          prev.map((s) => (s.id === id ? { ...s, copyButtonText: 'Copy to Clipboard' } : s))
        );
      }, 2000);
    }
  };

  // Handle variable value change for a specific serialization
  const handleVariableChange = useCallback(
    (serializationId: string, variableId: string, value: string) => {
      setSerializations((prev) =>
        prev.map((s) => {
          if (s.id !== serializationId) return s;

          // Update the variable value
          const newVariableValues = {
            ...s.variableValues,
            [variableId]: value,
          };

          // Recompute the output with updated variable values
          const output = computeInstanceOutput(
            {
              id: s.id as InstanceId,
              name: '',
              variableValues: newVariableValues,
              createdAt: 0,
              isExpanded: true,
            },
            parsedSegments
          );

          return {
            ...s,
            variableValues: newVariableValues,
            output: output.serializedHl7,
          };
        })
      );
    },
    [parsedSegments]
  );

  return (
    <main className="min-h-screen bg-background font-sans transition-colors text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <NavigationHeader activePage="serialize" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Error Display */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg"
            data-testid="error-message"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <h2 className="text-2xl font-bold text-foreground">Serialize from Template</h2>

        {/* Template Selection - Full Width */}
        <div className="bg-card p-6 rounded-lg shadow border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Select Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              data-testid="template-select"
              disabled={isLoading}
              className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoading ? '-- Loading templates... --' : '-- Choose a template --'}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplateId && (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Raw Template
                {hasVariables && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
                    (HELPERVARIABLE placeholders highlighted)
                  </span>
                )}
              </label>
              <div
                className="w-full max-h-64 p-4 border border-input rounded-md font-mono text-sm bg-muted text-muted-foreground overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all"
                data-testid="raw-hl7-template"
              >
                {highlightVariablesInText(currentTemplateContent.replace(/\r/g, '\n'))}
              </div>
            </div>
          )}
        </div>

        {/* Serialization Pairs */}
        {selectedTemplateId && serializations.length > 0 && (
          <div className="space-y-4">
            {serializations.map((ser, index) => (
              <div
                key={ser.id}
                data-testid={`serialization-pair-${ser.id}`}
                className="bg-card rounded-lg shadow border border-border overflow-hidden"
              >
                {/* Pair Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">
                    Serialization #{index + 1}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopySerializationToClipboard(ser.id)}
                      data-testid={`copy-button-${ser.id}`}
                      aria-label="Copy serialization to clipboard"
                      className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                    >
                      {ser.copyButtonText}
                    </button>
                    {index > 0 && (
                      <button
                        onClick={() => handleRemoveSerialization(ser.id)}
                        data-testid={`remove-serialization-${ser.id}`}
                        aria-label="Remove serialization"
                        className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/80 transition-colors"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Pair Content: Output (left) + Editor (right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {/* Left: Serialized Output */}
                  <div className="p-4 space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Serialized Output
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                        (Variables replaced)
                      </span>
                    </label>
                    <div
                      className="w-full h-64 p-3 border border-input rounded-md font-mono text-xs bg-background text-foreground overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all"
                      data-testid={`serialization-output-${ser.id}`}
                    >
                      {ser.output.replace(/\r/g, '\n')}
                    </div>
                  </div>

                  {/* Right: Compact Variables Editor */}
                  <div className="p-4 space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Edit Variables
                      {hasVariables && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
                          ({uniqueVariables.length} variable
                          {uniqueVariables.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                    <div className="h-64 overflow-auto border border-border rounded-lg bg-muted/30">
                      <VariablesOnlyView
                        uniqueVariables={uniqueVariables}
                        variableValues={ser.variableValues}
                        onVariableChange={(variableId, value) =>
                          handleVariableChange(ser.id, variableId, value)
                        }
                        focusFirst={index === 0}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Serialization Button - Full Width */}
            <button
              onClick={handleAddSerialization}
              data-testid="add-serialization-button"
              className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
            >
              + Add Serialization
            </button>
          </div>
        )}

        {/* Empty State */}
        {!selectedTemplateId && (
          <div className="bg-card p-12 rounded-lg shadow border border-border flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Select a template above to start creating serializations.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
