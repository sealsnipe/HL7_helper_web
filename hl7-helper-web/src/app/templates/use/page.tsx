"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@/types/template';
import { SegmentDto } from '@/types';
import { SAMPLE_TEMPLATES } from '@/data/templates';
import { NavigationHeader } from '@/components/NavigationHeader';
import { MessageEditor } from '@/components/MessageEditor';
import { parseHl7Message } from '@/utils/hl7Parser';
import { generateHl7Message } from '@/utils/hl7Generator';
import { loadTemplatesFromStorage } from '@/utils/templateValidation';
import { applyVariableEditability } from '@/utils/templateHelpers';

/**
 * Highlight HELPERVARIABLE placeholders in raw HL7 text
 */
const highlightVariablesInText = (text: string): React.ReactNode => {
    if (!text) return null;

    const parts = text.split(/(HELPERVARIABLE)/g);
    return parts.map((part, index) => {
        if (part === 'HELPERVARIABLE') {
            return (
                <span
                    key={index}
                    className="bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-1 rounded font-bold"
                >
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
        description: "Standard Example",
        messageType: extractMessageType(content),
        content,
        createdAt: 0
    }));
};

export default function UseTemplatePage() {
    const router = useRouter();
    // Initialize with empty array to avoid duplicates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [currentTemplateContent, setCurrentTemplateContent] = useState('');
    const [editedSegments, setEditedSegments] = useState<SegmentDto[]>([]);
    const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

    // Load templates from localStorage on client-side only
    useEffect(() => {
        const customTemplates = loadTemplatesFromStorage();
        const defaultTemplates = getDefaultTemplates();

        if (customTemplates.length > 0) {
            setTemplates(customTemplates); // Use saved templates (includes defaults)
        } else {
            setTemplates(defaultTemplates); // Fresh defaults
        }
    }, []);

    // Parse the template content and apply variable editability
    const parsedSegments = useMemo(() => {
        if (!currentTemplateContent) {
            return [];
        }
        const segments = parseHl7Message(currentTemplateContent);
        return applyVariableEditability(segments);
    }, [currentTemplateContent]);

    // Update edited segments when template changes
    useEffect(() => {
        setEditedSegments(parsedSegments);
    }, [parsedSegments]);

    // Generate the raw HL7 output from edited segments (live update)
    const rawHl7Output = useMemo(() => {
        if (editedSegments.length === 0) {
            return currentTemplateContent;
        }
        return generateHl7Message(editedSegments);
    }, [editedSegments, currentTemplateContent]);

    // Check if template has any variables
    const hasVariables = useMemo(() => {
        return currentTemplateContent.includes('HELPERVARIABLE');
    }, [currentTemplateContent]);

    const handleTemplateSelect = (id: string) => {
        setSelectedTemplateId(id);
        const template = templates.find(t => t.id === id);
        if (template) {
            setCurrentTemplateContent(template.content);
        } else {
            setCurrentTemplateContent('');
            setEditedSegments([]);
        }
    };

    // Handle segment updates from MessageEditor
    const handleSegmentsUpdate = useCallback((newSegments: SegmentDto[]) => {
        setEditedSegments(newSegments);
    }, []);

    const handleSerialize = () => {
        // Save the generated HL7 to localStorage to pass to main page
        localStorage.setItem('generated_hl7', rawHl7Output);
        router.push('/?loadGenerated=true');
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(rawHl7Output);
            setCopyButtonText('Copied!');
            setTimeout(() => {
                setCopyButtonText('Copy to Clipboard');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setCopyButtonText('Failed to copy');
            setTimeout(() => {
                setCopyButtonText('Copy to Clipboard');
            }, 2000);
        }
    };

    return (
        <main className="min-h-screen bg-background font-sans transition-colors text-foreground">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <NavigationHeader activePage="serialize" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                <h2 className="text-2xl font-bold text-foreground">Serialize from Template</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Template Selection & Raw HL7 Output */}
                    <div className="space-y-4">
                        <div className="bg-card p-6 rounded-lg shadow border border-border space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">Select Template</label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    data-testid="template-select"
                                    className="w-full p-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                                >
                                    <option value="">-- Choose a template --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1">
                                    Raw HL7 Output
                                    {hasVariables && (
                                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
                                            (HELPERVARIABLE placeholders highlighted)
                                        </span>
                                    )}
                                </label>
                                <div
                                    className="w-full h-96 p-4 border border-input rounded-md font-mono text-sm bg-muted text-muted-foreground overflow-auto whitespace-pre-wrap"
                                    data-testid="raw-hl7-output"
                                >
                                    {selectedTemplateId
                                        ? highlightVariablesInText(currentTemplateContent.replace(/\r/g, '\n'))
                                        : <span className="text-muted-foreground italic">Select a template to view its content...</span>
                                    }
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-card-foreground">
                                        Serialized Output
                                        {hasVariables && (
                                            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                                                (Variables replaced)
                                            </span>
                                        )}
                                    </label>
                                    {selectedTemplateId && rawHl7Output && (
                                        <button
                                            onClick={handleCopyToClipboard}
                                            data-testid="copy-button"
                                            aria-label="Copy serialized HL7 to clipboard"
                                            className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                                        >
                                            {copyButtonText}
                                        </button>
                                    )}
                                </div>
                                <div
                                    className="w-full h-64 p-4 border border-input rounded-md font-mono text-sm bg-background text-foreground overflow-auto whitespace-pre-wrap"
                                    data-testid="serialized-output"
                                >
                                    {selectedTemplateId
                                        ? rawHl7Output.replace(/\r/g, '\n')
                                        : <span className="text-muted-foreground italic">Select a template to view serialized output...</span>
                                    }
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {selectedTemplateId && (
                                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                    <button
                                        onClick={() => router.push('/')}
                                        data-testid="cancel-button"
                                        className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSerialize}
                                        data-testid="serialize-button"
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                    >
                                        Serialize & Load
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Parsed Structure View */}
                    <div className="space-y-4">
                        {selectedTemplateId ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-card-foreground">
                                        Parsed Structure View
                                        {hasVariables && (
                                            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
                                                (Edit highlighted fields)
                                            </span>
                                        )}
                                    </label>
                                    {!hasVariables && (
                                        <span className="text-xs text-muted-foreground italic">
                                            No HELPERVARIABLE placeholders - all fields read-only
                                        </span>
                                    )}
                                </div>
                                <MessageEditor
                                    segments={editedSegments}
                                    onUpdate={handleSegmentsUpdate}
                                    highlightVariable={true}
                                    variableOnlyEditing={true}
                                />
                            </div>
                        ) : (
                            <div className="bg-card p-6 rounded-lg shadow border border-border h-full flex items-center justify-center min-h-[400px]">
                                <p className="text-muted-foreground">
                                    Please select a template from the left to view its structure.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
