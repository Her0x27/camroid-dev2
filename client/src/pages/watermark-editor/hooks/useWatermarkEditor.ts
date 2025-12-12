import { useReducer, useCallback, useMemo } from "react";
import type {
  WatermarkEditorState,
  WatermarkEditorAction,
  WatermarkObject,
  WatermarkLayer,
  WatermarkObjectType,
  WatermarkObjectPosition,
  WatermarkObjectSize,
} from "../types";
import {
  initialEditorState,
  createDefaultObject,
  createDefaultLayer,
  generateId,
} from "../types";

function editorReducer(
  state: WatermarkEditorState,
  action: WatermarkEditorAction
): WatermarkEditorState {
  switch (action.type) {
    case "ADD_OBJECT": {
      const { layerId, object } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? { ...layer, objects: [...layer.objects, object] }
            : layer
        ),
        selectedObjectIds: [object.id],
      };
    }

    case "UPDATE_OBJECT": {
      const { objectId, updates } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.id === objectId ? { ...obj, ...updates } : obj
          ),
        })),
      };
    }

    case "DELETE_OBJECT": {
      const { objectId } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.filter((obj) => obj.id !== objectId),
        })),
        selectedObjectIds: state.selectedObjectIds.filter(
          (id) => id !== objectId
        ),
      };
    }

    case "SELECT_OBJECTS": {
      return {
        ...state,
        selectedObjectIds: action.payload.objectIds,
      };
    }

    case "DESELECT_ALL": {
      return {
        ...state,
        selectedObjectIds: [],
      };
    }

    case "MOVE_OBJECT": {
      const { objectId, position } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.id === objectId ? { ...obj, position } : obj
          ),
        })),
      };
    }

    case "RESIZE_OBJECT": {
      const { objectId, size } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.id === objectId ? { ...obj, size } : obj
          ),
        })),
      };
    }

    case "ROTATE_OBJECT": {
      const { objectId, rotation } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.id === objectId ? { ...obj, rotation } : obj
          ),
        })),
      };
    }

    case "GROUP_OBJECTS": {
      const { objectIds, groupName } = action.payload;
      const groupId = generateId();
      return {
        ...state,
        groups: [...state.groups, { id: groupId, name: groupName, objectIds }],
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            objectIds.includes(obj.id) ? { ...obj, groupId } : obj
          ),
        })),
      };
    }

    case "UNGROUP_OBJECTS": {
      const { groupId } = action.payload;
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== groupId),
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.groupId === groupId ? { ...obj, groupId: undefined } : obj
          ),
        })),
      };
    }

    case "ADD_LAYER": {
      return {
        ...state,
        layers: [...state.layers, action.payload.layer],
        selectedLayerId: action.payload.layer.id,
      };
    }

    case "DELETE_LAYER": {
      const { layerId } = action.payload;
      const newLayers = state.layers.filter((l) => l.id !== layerId);
      return {
        ...state,
        layers: newLayers.length > 0 ? newLayers : [createDefaultLayer()],
        selectedLayerId:
          state.selectedLayerId === layerId
            ? newLayers[0]?.id || null
            : state.selectedLayerId,
        selectedObjectIds: state.selectedObjectIds.filter(
          (objId) =>
            !state.layers
              .find((l) => l.id === layerId)
              ?.objects.some((o) => o.id === objId)
        ),
      };
    }

    case "UPDATE_LAYER": {
      const { layerId, updates } = action.payload;
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        ),
      };
    }

    case "SELECT_LAYER": {
      return {
        ...state,
        selectedLayerId: action.payload.layerId,
      };
    }

    case "REORDER_LAYERS": {
      const { layerIds } = action.payload;
      const orderedLayers = layerIds
        .map((id) => state.layers.find((l) => l.id === id))
        .filter((l): l is WatermarkLayer => l !== undefined);
      return {
        ...state,
        layers: orderedLayers,
      };
    }

    case "SET_ACTIVE_TOOL": {
      return {
        ...state,
        activeToolId: action.payload.toolId,
      };
    }

    case "SET_ZOOM": {
      return {
        ...state,
        zoom: Math.max(0.25, Math.min(4, action.payload.zoom)),
      };
    }

    case "SET_PAN_OFFSET": {
      return {
        ...state,
        panOffset: action.payload.offset,
      };
    }

    case "TOGGLE_GRID": {
      return {
        ...state,
        gridEnabled: action.payload.enabled,
      };
    }

    case "TOGGLE_SNAP_TO_GRID": {
      return {
        ...state,
        snapToGrid: action.payload.enabled,
      };
    }

    case "SET_GRID_SIZE": {
      return {
        ...state,
        gridSize: action.payload.size,
      };
    }

    case "LOAD_STATE": {
      return action.payload.state;
    }

    case "RESET_STATE": {
      return initialEditorState;
    }

    default:
      return state;
  }
}

export function useWatermarkEditor(initialState?: Partial<WatermarkEditorState>) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialEditorState,
    ...initialState,
  });

  const addObject = useCallback(
    (type: WatermarkObjectType) => {
      const layerId = state.selectedLayerId || state.layers[0]?.id;
      if (!layerId) return;

      const objectTemplate = createDefaultObject(type);
      const object: WatermarkObject = {
        ...objectTemplate,
        id: generateId(),
      };

      dispatch({ type: "ADD_OBJECT", payload: { layerId, object } });
    },
    [state.selectedLayerId, state.layers]
  );

  const updateObject = useCallback(
    (objectId: string, updates: Partial<WatermarkObject>) => {
      dispatch({ type: "UPDATE_OBJECT", payload: { objectId, updates } });
    },
    []
  );

  const deleteObject = useCallback((objectId: string) => {
    dispatch({ type: "DELETE_OBJECT", payload: { objectId } });
  }, []);

  const selectObjects = useCallback((objectIds: string[]) => {
    dispatch({ type: "SELECT_OBJECTS", payload: { objectIds } });
  }, []);

  const selectObject = useCallback(
    (objectId: string, multiSelect: boolean) => {
      if (multiSelect) {
        const newIds = state.selectedObjectIds.includes(objectId)
          ? state.selectedObjectIds.filter((id) => id !== objectId)
          : [...state.selectedObjectIds, objectId];
        dispatch({ type: "SELECT_OBJECTS", payload: { objectIds: newIds } });
      } else {
        dispatch({ type: "SELECT_OBJECTS", payload: { objectIds: [objectId] } });
      }
    },
    [state.selectedObjectIds]
  );

  const deselectAll = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const moveObject = useCallback(
    (objectId: string, position: WatermarkObjectPosition) => {
      dispatch({ type: "MOVE_OBJECT", payload: { objectId, position } });
    },
    []
  );

  const resizeObject = useCallback(
    (objectId: string, size: WatermarkObjectSize) => {
      dispatch({ type: "RESIZE_OBJECT", payload: { objectId, size } });
    },
    []
  );

  const rotateObject = useCallback((objectId: string, rotation: number) => {
    dispatch({ type: "ROTATE_OBJECT", payload: { objectId, rotation } });
  }, []);

  const groupSelected = useCallback(() => {
    if (state.selectedObjectIds.length < 2) return;
    dispatch({
      type: "GROUP_OBJECTS",
      payload: {
        objectIds: state.selectedObjectIds,
        groupName: `Группа ${state.groups.length + 1}`,
      },
    });
  }, [state.selectedObjectIds, state.groups.length]);

  const ungroupSelected = useCallback(() => {
    const selectedObject = state.layers
      .flatMap((l) => l.objects)
      .find((o) => state.selectedObjectIds.includes(o.id) && o.groupId);
    if (selectedObject?.groupId) {
      dispatch({
        type: "UNGROUP_OBJECTS",
        payload: { groupId: selectedObject.groupId },
      });
    }
  }, [state.layers, state.selectedObjectIds]);

  const addLayer = useCallback(() => {
    const newLayer = createDefaultLayer(`Слой ${state.layers.length + 1}`);
    dispatch({ type: "ADD_LAYER", payload: { layer: newLayer } });
  }, [state.layers.length]);

  const deleteLayer = useCallback((layerId: string) => {
    dispatch({ type: "DELETE_LAYER", payload: { layerId } });
  }, []);

  const updateLayer = useCallback(
    (layerId: string, updates: Partial<WatermarkLayer>) => {
      dispatch({ type: "UPDATE_LAYER", payload: { layerId, updates } });
    },
    []
  );

  const selectLayer = useCallback((layerId: string) => {
    dispatch({ type: "SELECT_LAYER", payload: { layerId } });
  }, []);

  const reorderLayers = useCallback((layerIds: string[]) => {
    dispatch({ type: "REORDER_LAYERS", payload: { layerIds } });
  }, []);

  const setActiveTool = useCallback((toolId: string | null) => {
    dispatch({ type: "SET_ACTIVE_TOOL", payload: { toolId } });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: { zoom } });
  }, []);

  const setPanOffset = useCallback((offset: WatermarkObjectPosition) => {
    dispatch({ type: "SET_PAN_OFFSET", payload: { offset } });
  }, []);

  const toggleGrid = useCallback((enabled: boolean) => {
    dispatch({ type: "TOGGLE_GRID", payload: { enabled } });
  }, []);

  const toggleSnapToGrid = useCallback((enabled: boolean) => {
    dispatch({ type: "TOGGLE_SNAP_TO_GRID", payload: { enabled } });
  }, []);

  const setGridSize = useCallback((size: number) => {
    dispatch({ type: "SET_GRID_SIZE", payload: { size } });
  }, []);

  const loadState = useCallback((newState: WatermarkEditorState) => {
    dispatch({ type: "LOAD_STATE", payload: { state: newState } });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  const selectedObject = useMemo(() => {
    if (state.selectedObjectIds.length !== 1) return null;
    const objectId = state.selectedObjectIds[0];
    for (const layer of state.layers) {
      const obj = layer.objects.find((o) => o.id === objectId);
      if (obj) return obj;
    }
    return null;
  }, [state.layers, state.selectedObjectIds]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObject) return;
    const layerId = state.selectedLayerId || state.layers[0]?.id;
    if (!layerId) return;

    const newObject: WatermarkObject = {
      ...selectedObject,
      id: generateId(),
      name: `${selectedObject.name} (копия)`,
      position: {
        x: selectedObject.position.x + 20,
        y: selectedObject.position.y + 20,
      },
    };

    dispatch({ type: "ADD_OBJECT", payload: { layerId, object: newObject } });
  }, [selectedObject, state.selectedLayerId, state.layers]);

  return {
    state,
    selectedObject,
    addObject,
    updateObject,
    deleteObject,
    selectObjects,
    selectObject,
    deselectAll,
    moveObject,
    resizeObject,
    rotateObject,
    groupSelected,
    ungroupSelected,
    addLayer,
    deleteLayer,
    updateLayer,
    selectLayer,
    reorderLayers,
    setActiveTool,
    setZoom,
    setPanOffset,
    toggleGrid,
    toggleSnapToGrid,
    setGridSize,
    loadState,
    resetState,
    duplicateSelected,
  };
}
