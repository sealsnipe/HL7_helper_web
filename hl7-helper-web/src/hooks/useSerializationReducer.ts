import { useReducer, useCallback, useMemo } from 'react';
import {
  SerializationState,
  InstanceAction,
  ViewMode,
  InstanceId,
  MAX_INSTANCES,
  MIN_INSTANCES,
} from '@/types/serialization';
import {
  createDefaultInstance,
  duplicateInstance,
  computeInstanceOutput,
  extractUniqueVariablesWithMetadata,
} from '@/utils/serializationHelpers';
import { parseHl7Message } from '@/utils/hl7Parser';
import { applyVariableEditability } from '@/utils/templateHelpers';

/**
 * Initial state for the serialization page
 */
export const initialState: SerializationState = {
  instances: [],
  selectedTemplateId: '',
  currentTemplateContent: '',
  parsedSegments: [],
  uniqueVariables: [],
  viewMode: 'variables-only',
};

/**
 * Reducer for serialization state management
 */
export function serializationReducer(
  state: SerializationState,
  action: InstanceAction
): SerializationState {
  switch (action.type) {
    case 'ADD_INSTANCE': {
      if (state.instances.length >= MAX_INSTANCES) {
        return state; // Don't add if at max
      }
      const newInstance = createDefaultInstance(state.uniqueVariables, state.instances);
      return {
        ...state,
        instances: [...state.instances, newInstance],
      };
    }

    case 'REMOVE_INSTANCE': {
      if (state.instances.length <= MIN_INSTANCES) {
        return state; // Don't remove if at min
      }
      return {
        ...state,
        instances: state.instances.filter(i => i.id !== action.id),
      };
    }

    case 'DUPLICATE_INSTANCE': {
      if (state.instances.length >= MAX_INSTANCES) {
        return state; // Don't duplicate if at max
      }
      const instanceToDuplicate = state.instances.find(i => i.id === action.id);
      if (!instanceToDuplicate) return state;

      const newInstance = duplicateInstance(instanceToDuplicate, state.instances);
      const index = state.instances.findIndex(i => i.id === action.id);

      // Insert after the duplicated instance
      const newInstances = [
        ...state.instances.slice(0, index + 1),
        newInstance,
        ...state.instances.slice(index + 1),
      ];

      return {
        ...state,
        instances: newInstances,
      };
    }

    case 'UPDATE_VARIABLE': {
      return {
        ...state,
        instances: state.instances.map(inst =>
          inst.id === action.instanceId
            ? {
                ...inst,
                variableValues: {
                  ...inst.variableValues,
                  [action.variableId]: action.value,
                },
              }
            : inst
        ),
      };
    }

    case 'SET_TEMPLATE': {
      // Create first default instance with variables provided in action
      // Pass empty array since this is the first instance
      const firstInstance = createDefaultInstance(action.variables, []);

      return {
        ...state,
        selectedTemplateId: action.templateId,
        currentTemplateContent: action.content,
        parsedSegments: action.segments,
        uniqueVariables: action.variables,
        instances: [firstInstance],
      };
    }

    case 'TOGGLE_EXPAND': {
      return {
        ...state,
        instances: state.instances.map(inst =>
          inst.id === action.id
            ? { ...inst, isExpanded: !inst.isExpanded }
            : inst
        ),
      };
    }

    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.mode,
      };
    }

    case 'RESET_INSTANCES': {
      const firstInstance = createDefaultInstance(state.uniqueVariables, []);
      return {
        ...state,
        instances: [firstInstance],
      };
    }

    default:
      return state;
  }
}

/**
 * Hook to manage serialization state with memoized outputs
 */
export function useSerializationReducer() {
  const [state, dispatch] = useReducer(serializationReducer, initialState);

  // Memoized instance outputs - only recomputes when instances or segments change
  const instanceOutputs = useMemo(() => {
    return state.instances.map(instance =>
      computeInstanceOutput(instance, state.parsedSegments)
    );
  }, [state.instances, state.parsedSegments]);

  // Action creators
  const addInstance = useCallback(() => {
    dispatch({ type: 'ADD_INSTANCE' });
  }, []);

  const removeInstance = useCallback((id: InstanceId) => {
    dispatch({ type: 'REMOVE_INSTANCE', id });
  }, []);

  const duplicateInstanceAction = useCallback((id: InstanceId) => {
    dispatch({ type: 'DUPLICATE_INSTANCE', id });
  }, []);

  const updateVariable = useCallback(
    (instanceId: InstanceId, variableId: string, value: string) => {
      dispatch({ type: 'UPDATE_VARIABLE', instanceId, variableId, value });
    },
    []
  );

  const setTemplate = useCallback((templateId: string, content: string) => {
    const parsed = parseHl7Message(content);
    const segments = applyVariableEditability(parsed);
    const variables = extractUniqueVariablesWithMetadata(segments);
    dispatch({
      type: 'SET_TEMPLATE',
      templateId,
      content,
      segments,
      variables,
    });
  }, []);

  const toggleExpand = useCallback((id: InstanceId) => {
    dispatch({ type: 'TOGGLE_EXPAND', id });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  }, []);

  const resetInstances = useCallback(() => {
    dispatch({ type: 'RESET_INSTANCES' });
  }, []);

  // Computed properties
  const hasVariables = state.uniqueVariables.length > 0;
  const canAddInstance = state.instances.length < MAX_INSTANCES;
  const canRemoveInstance = state.instances.length > MIN_INSTANCES;
  const instanceCount = state.instances.length;

  return {
    state,
    instanceOutputs,
    dispatch,
    // Action creators
    addInstance,
    removeInstance,
    duplicateInstance: duplicateInstanceAction,
    updateVariable,
    setTemplate,
    toggleExpand,
    setViewMode,
    resetInstances,
    // Computed properties
    hasVariables,
    canAddInstance,
    canRemoveInstance,
    instanceCount,
  };
}
