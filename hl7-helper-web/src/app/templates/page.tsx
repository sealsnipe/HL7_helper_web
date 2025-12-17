'use client';

import React, { useState, useEffect, useMemo, use, Suspense } from 'react';
import { Template } from '@/types/template';
import { NavigationHeader } from '@/components/NavigationHeader';
import { SAMPLE_TEMPLATES } from '@/data/templates';
import { MessageEditor } from '@/components/MessageEditor';
import { parseHl7Message } from '@/utils/hl7Parser';
import { generateHl7Message } from '@/utils/hl7Generator';
import { SegmentDto } from '@/types';
import { loadTemplatesFromStorage, saveTemplatesToStorage } from '@/utils/templateValidation';
import {
  fieldContainsVariable,
  getVariableCount,
  getVariableBadgeColor,
  applyVariableEditability,
} from '@/utils/templateHelpers';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataManagement } from '@/components/persistence';
import { runMigrations } from '@/services/persistence/migrations';
import { TemplatesSkeleton } from '@/components/TemplatesSkeleton';

// View mode for HELPERVARIABLE filtering
type VariableViewMode = 'all' | 'variables-only';

/**
 * Extract message type from HL7 content (MSH-9 field)
 */
function extractMessageType(hl7Content: string): string {
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
}

/**
 * Load templates from storage, initializing with defaults if empty.
 */
async function loadInitialTemplates(): Promise<Template[]> {
  await runMigrations();
  const customTemplates = await loadTemplatesFromStorage();

  if (customTemplates.length === 0) {
    const timestamp = Date.now();
    const defaultTemplates: Template[] = Object.entries(SAMPLE_TEMPLATES).map(
      ([name, content], idx) => ({
        id: `default-${idx}`,
        name,
        description: 'Standard Example',
        messageType: extractMessageType(content),
        content,
        createdAt: timestamp,
      })
    );
    await saveTemplatesToStorage(defaultTemplates);
    return defaultTemplates;
  }
  return customTemplates;
}

// Module-level promise cache for React 19 use() hook
let templatesPromise: Promise<Template[]> | null = null;

function getTemplatesPromise(): Promise<Template[]> {
  if (!templatesPromise) {
    templatesPromise = loadInitialTemplates();
  }
  return templatesPromise;
}

function resetTemplatesPromise(): void {
  templatesPromise = null;
}

/**
 * Shell component for consistent page layout.
 */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background font-sans transition-colors text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <NavigationHeader activePage="templates" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">{children}</div>
    </main>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <TemplatesSkeleton />
        </PageShell>
      }
    >
      <TemplateLoader />
    </Suspense>
  );
}

/**
 * Uses React 19's use() hook to suspend while templates load
 */
function TemplateLoader() {
  const templates = use(getTemplatesPromise());
  return <TemplateContent initialTemplates={templates} />;
}

/**
 * Main content component - receives pre-loaded templates
 */
function TemplateContent({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('ADT-A01');
  const [editContent, setEditContent] = useState('');

  // Parsed segments for the currently expanded/editing template
  const [segments, setSegments] = useState<SegmentDto[]>([]);

  // HELPERVARIABLE view mode
  const [variableViewMode, setVariableViewMode] = useState<VariableViewMode>('all');

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  /**
   * Highlight HELPERVARIABLE placeholders in raw HL7 text with group-specific colors
   * Used for read-only display (not for editable textareas to avoid cursor issues)
   *
   * @param text - The HL7 text to highlight
   */
  const highlightVariablesInText = (text: string): React.ReactNode => {
    if (!text) return null;

    // Normalize line endings: HL7 uses \r but CSS whitespace-pre-wrap needs \n for line breaks
    const normalizedText = text.replace(/\r\n?/g, '\n');

    // Split on any HELPERVARIABLE with optional number (1-999)
    const parts = normalizedText.split(/(HELPERVARIABLE[1-9]\d{0,2}|HELPERVARIABLE(?!\d))/g);
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

  // Parse content when it changes (for expanded view)
  // Apply variable editability to set variableId and variableGroupId for badge display
  useEffect(() => {
    if (expandedId) {
      if (editingId) {
        const parsed = parseHl7Message(editContent);
        setSegments(applyVariableEditability(parsed));
      } else {
        const template = templates.find((t) => t.id === expandedId);
        if (template) {
          const parsed = parseHl7Message(template.content);
          setSegments(applyVariableEditability(parsed));
        }
      }
    } else {
      setSegments([]);
    }
  }, [expandedId, editingId, editContent, templates]);

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      // Collapse
      setExpandedId(null);
      setEditingId(null);
    } else {
      // Expand
      // If we were editing another one, cancel that edit?
      // User requirement: "Cancel discards all changes and collapses the row again."
      // So switching rows implies cancel.
      setEditingId(null);
      setExpandedId(id);
    }
  };

  const handleCreate = async () => {
    const newId = crypto.randomUUID();
    // eslint-disable-next-line react-hooks/purity -- Event handler, not render
    const timestamp = Date.now();
    const newTemplate: Template = {
      id: newId,
      name: 'New Template',
      description: '',
      messageType: 'ADT-A01',
      content:
        'MSH|^~\\&|App|Fac|App|Fac|20230101||ADT^A01|MSGID|P|2.5\rPID|1||12345^^^MRN||Doe^John',
      createdAt: timestamp,
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    await saveTemplatesToStorage(updated);
    resetTemplatesPromise(); // Invalidate cache after mutation

    // Auto expand and edit
    setExpandedId(newId);
    startEditing(newTemplate);
  };

  const startEditing = (template: Template) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditDesc(template.description);
    setEditType(template.messageType || 'ADT-A01');
    setEditContent(template.content);

    // Ensure row is expanded
    if (expandedId !== template.id) {
      setExpandedId(template.id);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExpandedId(null); // Collapse on cancel as per requirements
  };

  const handleSave = async () => {
    if (!editingId) return;

    const updatedTemplates = templates.map((t) => {
      if (t.id === editingId) {
        return {
          ...t,
          name: editName,
          description: editDesc,
          messageType: editType,
          content: editContent,
        };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    await saveTemplatesToStorage(updatedTemplates);
    resetTemplatesPromise(); // Invalidate cache after mutation
    setEditingId(null);
    // Keep expanded to show result? Or collapse?
    // User requirement: "Changes in edit mode should only be saved when the user explicitly clicks 'Save'."
    // Doesn't say to collapse. Usually keeping it expanded to see result is nice.
  };

  const handleDeleteClick = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    setDeleteConfirm({ id: template.id, name: template.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const updated = templates.filter((t) => t.id !== deleteConfirm.id);
    setTemplates(updated);
    await saveTemplatesToStorage(updated);
    resetTemplatesPromise(); // Invalidate cache after mutation
    if (expandedId === deleteConfirm.id) setExpandedId(null);
    setDeleteConfirm(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    const newId = crypto.randomUUID();

    // Generate unique name
    const baseName = template.name;
    let newName = `${baseName} copy`;
    let counter = 2;
    while (templates.some((t) => t.name === newName)) {
      newName = `${baseName} copy ${counter}`;
      counter++;
    }

    const timestamp = Date.now();
    const newTemplate: Template = {
      ...template,
      id: newId,
      name: newName,
      createdAt: timestamp,
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    await saveTemplatesToStorage(updated);
    resetTemplatesPromise(); // Invalidate cache after mutation

    setExpandedId(newId);
    startEditing(newTemplate);
  };

  // Handle updates from MessageEditor
  const handleEditorUpdate = (updatedSegments: SegmentDto[]) => {
    if (!editingId) return; // Should only happen in edit mode

    // Regenerate HL7 string
    const newHl7 = generateHl7Message(updatedSegments);
    setEditContent(newHl7);
    setSegments(updatedSegments); // Update local segments state to reflect change immediately
  };

  // Prepare segments for display
  // If editing, we mark them as editable. If not, read-only.
  // IMPORTANT: MSH-1 (field separator) and MSH-2 (encoding characters) must NEVER be editable
  const displaySegments = useMemo(() => {
    if (!segments) return [];

    let processedSegments = segments;

    // Apply variable view filter
    if (variableViewMode === 'variables-only') {
      processedSegments = processedSegments
        .map((s) => ({
          ...s,
          fields: s.fields.filter((f) => fieldContainsVariable(f)),
        }))
        .filter((s) => s.fields.length > 0);
    }

    if (editingId) {
      // In edit mode, we want fields to be editable
      // But parseHl7Message sets isEditable=false by default.
      // We need to override this, except for MSH-1 and MSH-2.
      return processedSegments.map((s) => ({
        ...s,
        fields: s.fields.map((f) => ({
          ...f,
          isEditable: !(s.name === 'MSH' && (f.position === 1 || f.position === 2)),
        })),
      }));
    }
    return processedSegments;
  }, [segments, editingId, variableViewMode]);

  return (
    <PageShell>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Template Management</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm font-medium flex items-center gap-2"
        >
          <span>+</span> New Template
        </button>
      </div>

      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-5 py-1 bg-muted/50 border-b border-border font-medium text-xs text-muted-foreground leading-none">
          <div className="flex-1 min-w-0">Name</div>
          <div className="w-32 flex-shrink-0">Type</div>
          <div className="w-24 flex-shrink-0 text-center">Variables</div>
          <div className="w-48 flex-shrink-0 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No templates found. Create one to get started.
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="bg-card">
                {/* Row Header */}
                <div
                  onClick={() => handleExpand(template.id)}
                  className={`flex items-center px-5 py-1 cursor-pointer transition-colors leading-none ${expandedId === template.id ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
                >
                  <div
                    className="flex-1 min-w-0 font-medium text-foreground text-xs leading-none flex items-center truncate"
                    title={template.description || template.name}
                  >
                    <span className="truncate">{template.name}</span>
                    {template.description && (
                      <span className="ml-1 text-xs text-muted-foreground font-normal truncate">
                        - {template.description}
                      </span>
                    )}
                  </div>
                  <div className="w-32 flex-shrink-0 leading-none flex items-center">
                    <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary-foreground text-xs font-medium leading-none whitespace-nowrap">
                      {template.messageType || 'ADT-A01'}
                    </span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center text-muted-foreground text-xs leading-none flex items-center justify-center">
                    {getVariableCount(template.content)}
                  </div>
                  <div className="w-48 flex-shrink-0 flex justify-end gap-2 leading-none items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(template);
                      }}
                      className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors leading-none whitespace-nowrap"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(e, template)}
                      className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground rounded text-xs font-medium hover:bg-secondary/20 transition-colors leading-none whitespace-nowrap"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, template)}
                      className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs font-medium hover:bg-destructive/20 transition-colors leading-none whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === template.id && (
                  <div className="border-t border-border p-6 bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {editingId === template.id ? (
                      // Edit Mode
                      <div className="space-y-6">
                        {/* Metadata Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card border border-border rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Message Type
                            </label>
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              className="w-full p-2 border border-input rounded bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                            >
                              <option value="ADT-A01">ADT-A01</option>
                              <option value="ORU-R01">ORU-R01</option>
                            </select>
                          </div>
                        </div>

                        {/* Editor Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                          <div className="flex flex-col space-y-2 h-full">
                            <label className="text-sm font-medium">Raw HL7 Message</label>
                            {/* Plain textarea without overlay - cursor position accuracy is critical */}
                            {/* HELPERVARIABLE highlighting is shown in the Structured View on the right */}
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 w-full p-4 border border-input rounded-md font-mono text-sm bg-background focus:ring-2 focus:ring-ring outline-none resize-none"
                              data-testid="edit-content-textarea"
                            />
                          </div>
                          <div className="flex flex-col space-y-2 h-full overflow-hidden">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Structured View</label>
                              {/* HELPERVARIABLE View Toggle (also in edit mode) */}
                              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                <button
                                  onClick={() => setVariableViewMode('all')}
                                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                    variableViewMode === 'all'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  All Fields
                                </button>
                                <button
                                  onClick={() => setVariableViewMode('variables-only')}
                                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                    variableViewMode === 'variables-only'
                                      ? 'bg-amber-500 text-white'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Variables Only
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
                              <MessageEditor
                                segments={displaySegments}
                                onUpdate={handleEditorUpdate}
                                highlightVariable={true}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Read-Only View
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                        <div className="flex flex-col space-y-2 h-full">
                          <label className="text-sm font-medium text-muted-foreground">
                            Raw HL7 Message
                          </label>
                          {/* Highlighted raw content with HELPERVARIABLE markers */}
                          <div className="w-full flex-1 p-4 border border-border rounded bg-muted font-mono text-sm overflow-auto whitespace-pre-wrap">
                            {highlightVariablesInText(template.content)}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 h-full overflow-hidden">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">
                              Structured View
                            </label>
                            {/* HELPERVARIABLE View Toggle */}
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                              <button
                                onClick={() => setVariableViewMode('all')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                  variableViewMode === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                data-testid="view-mode-all"
                              >
                                All Fields
                              </button>
                              <button
                                onClick={() => setVariableViewMode('variables-only')}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                  variableViewMode === 'variables-only'
                                    ? 'bg-amber-500 text-white'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                data-testid="view-mode-variables"
                              >
                                Variables Only
                              </button>
                            </div>
                          </div>
                          {/* Removed pointer-events-none to allow Expand/Collapse buttons to work */}
                          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
                            <MessageEditor
                              segments={displaySegments}
                              onUpdate={() => {}}
                              highlightVariable={true}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <DataManagement />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="destructive"
      />
    </PageShell>
  );
}
