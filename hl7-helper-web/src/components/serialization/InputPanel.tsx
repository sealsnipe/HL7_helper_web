import React, { useState } from 'react';
import { SerializationInstance, UniqueVariable, ViewMode } from '@/types/serialization';
import { SegmentDto } from '@/types';
import { VariablesOnlyView } from './VariablesOnlyView';
import { ViewModeToggle } from './ViewModeToggle';
import { MessageEditor } from '@/components/MessageEditor';
import { instanceHasModifiedValues } from '@/utils/serializationHelpers';

interface InputPanelProps {
  instance: SerializationInstance;
  uniqueVariables: UniqueVariable[];
  parsedSegments: SegmentDto[];
  viewMode: ViewMode;
  onVariableChange: (variableId: string, value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
  focusFirst?: boolean;
}

/**
 * Input panel for editing variables in an instance
 */
export const InputPanel: React.FC<InputPanelProps> = ({
  instance,
  uniqueVariables,
  parsedSegments,
  viewMode,
  onVariableChange,
  onViewModeChange,
  onDelete,
  onDuplicate,
  canDelete,
  focusFirst = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasModifiedValues = instanceHasModifiedValues(instance, uniqueVariables);

  const handleDelete = () => {
    if (hasModifiedValues) {
      setShowDeleteConfirm(true);
    } else {
      onDelete();
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  // Create segments with variable values applied for MessageEditor
  const segmentsWithValues = parsedSegments.map(seg => ({
    ...seg,
    fields: seg.fields.map(field => ({
      ...field,
      value: field.variableId
        ? instance.variableValues[field.variableId] || field.value
        : field.value,
    })),
  }));

  // Convert Record to Map for MessageEditor compatibility
  const variableValuesMap = new Map(Object.entries(instance.variableValues));

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col"
      data-testid={`input-panel-${instance.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-card-foreground">
          {instance.name}
        </span>

        <div className="flex items-center gap-2">
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />

          <button
            onClick={onDuplicate}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Duplicate instance"
            aria-label={`Duplicate ${instance.name}`}
            data-testid={`duplicate-btn-${instance.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className={`p-1 transition-colors ${
              canDelete
                ? 'text-muted-foreground hover:text-destructive'
                : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
            title={canDelete ? 'Delete instance' : 'Cannot delete last instance'}
            aria-label={`Delete ${instance.name}`}
            data-testid={`delete-btn-${instance.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center justify-between">
          <span className="text-xs text-destructive">Delete instance with entered values?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80"
              data-testid={`cancel-delete-${instance.name}`}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-2 py-0.5 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid={`confirm-delete-${instance.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'variables-only' ? (
          <VariablesOnlyView
            uniqueVariables={uniqueVariables}
            variableValues={instance.variableValues}
            onVariableChange={onVariableChange}
            focusFirst={focusFirst}
          />
        ) : (
          <div className="p-2">
            {/* MessageEditor displays all fields with variable substitution applied.
                 Editing happens via onVariableChange, not onUpdate (MessageEditor is read-only here). */}
            <MessageEditor
              segments={segmentsWithValues}
              onUpdate={() => {/* Intentionally empty - editing handled via onVariableChange */}}
              highlightVariable={true}
              variableValues={variableValuesMap}
              onVariableChange={(variableId, value) => onVariableChange(variableId, value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
