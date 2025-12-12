import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Grid3X3, RotateCcw, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToolbarPanel, LayersPanel, PropertyPanel, WatermarkCanvas } from "./components";
import { useWatermarkEditor } from "./hooks";
import type { WatermarkObjectType } from "./types";
import previewBackground from "@/assets/preview-background.jpg";

export default function WatermarkEditorPage() {
  const [, navigate] = useLocation();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  
  const {
    state,
    selectedObject,
    addObject,
    updateObject,
    deleteObject,
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
    duplicateSelected,
    resetState,
  } = useWatermarkEditor();

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleToolSelect = useCallback((toolId: string) => {
    setActiveTool(toolId);
  }, [setActiveTool]);

  const handleAddObject = useCallback((type: WatermarkObjectType) => {
    addObject(type);
  }, [addObject]);

  const handleObjectVisibilityToggle = useCallback((objectId: string) => {
    const obj = state.layers.flatMap(l => l.objects).find(o => o.id === objectId);
    if (obj) {
      updateObject(objectId, { visible: !obj.visible });
    }
  }, [state.layers, updateObject]);

  const handleObjectLockToggle = useCallback((objectId: string) => {
    const obj = state.layers.flatMap(l => l.objects).find(o => o.id === objectId);
    if (obj) {
      updateObject(objectId, { locked: !obj.locked });
    }
  }, [state.layers, updateObject]);

  const handleLayerVisibilityToggle = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  }, [state.layers, updateLayer]);

  const handleLayerLockToggle = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  }, [state.layers, updateLayer]);

  const handleLayerRename = useCallback((layerId: string, name: string) => {
    updateLayer(layerId, { name });
  }, [updateLayer]);

  const handleLayerCollapse = useCallback((layerId: string) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { collapsed: !layer.collapsed });
    }
  }, [state.layers, updateLayer]);

  const handleReorderObjects = useCallback((layerId: string, objectIds: string[]) => {
    const layer = state.layers.find(l => l.id === layerId);
    if (layer) {
      const reorderedObjects = objectIds
        .map(id => layer.objects.find(o => o.id === id))
        .filter((o): o is NonNullable<typeof o> => o !== undefined);
      updateLayer(layerId, { objects: reorderedObjects });
    }
  }, [state.layers, updateLayer]);

  const handleReset = useCallback(() => {
    if (confirm("Сбросить все изменения?")) {
      resetState();
    }
  }, [resetState]);

  return (
    <TooltipProvider>
      <div className="fixed inset-0 flex flex-col bg-background">
        <header className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Назад</TooltipContent>
            </Tooltip>
            <h1 className="text-base sm:text-lg font-semibold truncate">Редактор водяных знаков</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="grid-toggle"
                checked={state.gridEnabled}
                onCheckedChange={toggleGrid}
              />
              <Label htmlFor="grid-toggle" className="text-sm flex items-center gap-1">
                <Grid3X3 className="w-4 h-4" />
                Сетка
              </Label>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Сбросить</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="relative flex items-stretch">
            {leftPanelOpen && (
              <ToolbarPanel
                activeTool={state.activeToolId}
                onToolSelect={handleToolSelect}
                onAddObject={handleAddObject}
                onAddLayer={addLayer}
                onGroupSelected={groupSelected}
                onUngroupSelected={ungroupSelected}
                hasSelection={state.selectedObjectIds.length > 0}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-6 rounded-none bg-background/80 border-y border-r border-border/60 hover:bg-muted flex-shrink-0"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              aria-label={leftPanelOpen ? "Свернуть панель инструментов" : "Развернуть панель инструментов"}
            >
              {leftPanelOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex-1 relative">
            <WatermarkCanvas
              backgroundImage={previewBackground}
              layers={state.layers}
              selectedObjectIds={state.selectedObjectIds}
              activeTool={state.activeToolId}
              zoom={state.zoom}
              panOffset={state.panOffset}
              gridEnabled={state.gridEnabled}
              gridSize={state.gridSize}
              onObjectSelect={selectObject}
              onObjectMove={moveObject}
              onObjectResize={resizeObject}
              onObjectRotate={rotateObject}
              onZoomChange={setZoom}
              onPanChange={setPanOffset}
              onDeselectAll={deselectAll}
            />
          </div>

          <div className="relative flex items-stretch">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-6 rounded-none bg-background/80 border-y border-l border-border/60 hover:bg-muted flex-shrink-0"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              aria-label={rightPanelOpen ? "Свернуть панель слоёв" : "Развернуть панель слоёв"}
            >
              {rightPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
            {rightPanelOpen && (
              <div className="flex flex-col border-l border-border/60 bg-background/95 backdrop-blur-sm overflow-hidden w-56">
                <div className="flex-1 overflow-y-auto">
                  <LayersPanel
                    layers={state.layers}
                    selectedLayerId={state.selectedLayerId}
                    selectedObjectIds={state.selectedObjectIds}
                    onLayerSelect={selectLayer}
                    onObjectSelect={selectObject}
                    onLayerVisibilityToggle={handleLayerVisibilityToggle}
                    onLayerLockToggle={handleLayerLockToggle}
                    onObjectVisibilityToggle={handleObjectVisibilityToggle}
                    onObjectLockToggle={handleObjectLockToggle}
                    onLayerRename={handleLayerRename}
                    onLayerCollapse={handleLayerCollapse}
                    onAddLayer={addLayer}
                    onDeleteLayer={deleteLayer}
                    onReorderLayers={reorderLayers}
                    onReorderObjects={handleReorderObjects}
                  />
                </div>

                <div className="border-t border-border/60">
                  <PropertyPanel
                    selectedObject={selectedObject}
                    onUpdateObject={(updates) => {
                      if (selectedObject) {
                        updateObject(selectedObject.id, updates);
                      }
                    }}
                    onDuplicateObject={duplicateSelected}
                    onDeleteObject={() => {
                      if (selectedObject) {
                        deleteObject(selectedObject.id);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
