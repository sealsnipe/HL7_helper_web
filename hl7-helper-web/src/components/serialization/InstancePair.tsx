import React from 'react';
import {
  SerializationInstance,
  UniqueVariable,
  ViewMode,
  InstanceOutput,
  InstanceId,
} from '@/types/serialization';
import { SegmentDto } from '@/types';
import { OutputPanel } from './OutputPanel';
import { InputPanel } from './InputPanel';

interface InstancePairProps {
  instance: SerializationInstance;
  output: InstanceOutput;
  uniqueVariables: UniqueVariable[];
  parsedSegments: SegmentDto[];
  viewMode: ViewMode;
  onVariableChange: (instanceId: InstanceId, variableId: string, value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDelete: (id: InstanceId) => void;
  onDuplicate: (id: InstanceId) => void;
  canDelete: boolean;
  focusFirst?: boolean;
}

/**
 * Horizontal pair of Output (left) and Input (right) panels for a single instance
 */
export const InstancePair: React.FC<InstancePairProps> = ({
  instance,
  output,
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
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      data-testid={`instance-pair-${instance.name}`}
    >
      {/* Output Panel (Left on desktop, Top on mobile) */}
      <OutputPanel
        instanceName={instance.name}
        serializedHl7={output.serializedHl7}
        hasUnfilledVariables={output.hasUnfilledVariables}
      />

      {/* Input Panel (Right on desktop, Bottom on mobile) */}
      <InputPanel
        instance={instance}
        uniqueVariables={uniqueVariables}
        parsedSegments={parsedSegments}
        viewMode={viewMode}
        onVariableChange={(variableId, value) => onVariableChange(instance.id, variableId, value)}
        onViewModeChange={onViewModeChange}
        onDelete={() => onDelete(instance.id)}
        onDuplicate={() => onDuplicate(instance.id)}
        canDelete={canDelete}
        focusFirst={focusFirst}
      />
    </div>
  );
};
