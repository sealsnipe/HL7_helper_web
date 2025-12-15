import React from 'react';
import {
  SerializationInstance,
  UniqueVariable,
  ViewMode,
  InstanceOutput,
  InstanceId,
  MAX_INSTANCES,
} from '@/types/serialization';
import { SegmentDto } from '@/types';
import { InstancePair } from './InstancePair';

interface InstanceListProps {
  instances: SerializationInstance[];
  outputs: InstanceOutput[];
  uniqueVariables: UniqueVariable[];
  parsedSegments: SegmentDto[];
  viewMode: ViewMode;
  onVariableChange: (instanceId: InstanceId, variableId: string, value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDelete: (id: InstanceId) => void;
  onDuplicate: (id: InstanceId) => void;
  onAddInstance: () => void;
  canAddInstance: boolean;
  canDeleteInstance: boolean;
  newlyAddedInstanceId?: InstanceId;
}

/**
 * List of all instance pairs with Add button
 */
export const InstanceList: React.FC<InstanceListProps> = ({
  instances,
  outputs,
  uniqueVariables,
  parsedSegments,
  viewMode,
  onVariableChange,
  onViewModeChange,
  onDelete,
  onDuplicate,
  onAddInstance,
  canAddInstance,
  canDeleteInstance,
  newlyAddedInstanceId,
}) => {
  // Pre-create a Map of outputs by instanceId to avoid O(n²) complexity
  const outputsMap = React.useMemo(() => {
    const map = new Map<InstanceId, InstanceOutput>();
    outputs.forEach(output => {
      map.set(output.instanceId, output);
    });
    return map;
  }, [outputs]);

  return (
    <div className="space-y-6" data-testid="instance-list">
      {/* Instance pairs */}
      {instances.map((instance) => {
        const output = outputsMap.get(instance.id);
        if (!output) return null;

        return (
          <InstancePair
            key={instance.id}
            instance={instance}
            output={output}
            uniqueVariables={uniqueVariables}
            parsedSegments={parsedSegments}
            viewMode={viewMode}
            onVariableChange={onVariableChange}
            onViewModeChange={onViewModeChange}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            canDelete={canDeleteInstance}
            focusFirst={instance.id === newlyAddedInstanceId}
          />
        );
      })}

      {/* Add Instance button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onAddInstance}
          disabled={!canAddInstance}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
            canAddInstance
              ? 'border-primary/50 text-primary hover:border-primary hover:bg-primary/5'
              : 'border-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label="Add new instance"
          data-testid="add-instance-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">
            Add Instance
            {!canAddInstance && ` (max ${MAX_INSTANCES})`}
          </span>
        </button>
      </div>

      {/* Instance count indicator */}
      <div className="text-center text-xs text-muted-foreground">
        {instances.length} of {MAX_INSTANCES} instances
      </div>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="instance-count-announcement"
      >
        {instances.length} instances active
      </div>
    </div>
  );
};
