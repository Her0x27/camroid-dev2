import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Download, Grid3X3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToolbarPanel, LayersPanel, PropertyPanel, WatermarkCanvas } from "./components";
import { useWatermarkEditor } from "./hooks";
import type { WatermarkObjectType } from "./types";

export default function WatermarkEditorPage() {
  const [, navigate] = useLocation();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
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

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

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

  const handleExport = useCallback(() => {
    console.log("Export watermark config:", state);
  }, [state]);

  const handleReset = useCallback(() => {
    if (confirm("Сбросить все изменения?")) {
      resetState();
      setBackgroundImage(null);
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
            <h1 className="text-lg font-semibold">Редактор водяных знаков</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
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
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-1" />
                    Фото
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Загрузить фото для превью</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" />
                  Экспорт
                </Button>
              </TooltipTrigger>
              <TooltipContent>Сохранить конфигурацию</TooltipContent>
            </Tooltip>

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
          <ToolbarPanel
            activeTool={state.activeToolId}
            onToolSelect={handleToolSelect}
            onAddObject={handleAddObject}
            onAddLayer={addLayer}
            onGroupSelected={groupSelected}
            onUngroupSelected={ungroupSelected}
            hasSelection={state.selectedObjectIds.length > 0}
          />

          <div className="flex-1 relative">
            <WatermarkCanvas
              backgroundImage={backgroundImage}
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

          <div className="flex flex-col border-l border-border/60 bg-background/95 backdrop-blur-sm overflow-hidden">
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
        </div>
      </div>
    </TooltipProvider>
  );
}
