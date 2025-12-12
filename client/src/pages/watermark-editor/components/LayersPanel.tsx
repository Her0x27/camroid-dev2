import { useState, useRef, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  GripVertical,
  Type,
  Image,
  MapPin,
  Signal,
  Compass,
  RotateCcw,
  Clock,
  Minus,
  SeparatorVertical,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { WatermarkLayer, WatermarkObject, WatermarkObjectType } from "../types";

interface LayersPanelProps {
  layers: WatermarkLayer[];
  selectedLayerId: string | null;
  selectedObjectIds: string[];
  onLayerSelect: (layerId: string) => void;
  onObjectSelect: (objectId: string, multiSelect: boolean) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
  onObjectVisibilityToggle: (objectId: string) => void;
  onObjectLockToggle: (objectId: string) => void;
  onLayerRename: (layerId: string, name: string) => void;
  onLayerCollapse: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onReorderLayers: (layerIds: string[]) => void;
  onReorderObjects: (layerId: string, objectIds: string[]) => void;
}

const OBJECT_TYPE_ICONS: Record<WatermarkObjectType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  logo: Image,
  coordinates: MapPin,
  accuracy: Signal,
  heading: Compass,
  tilt: RotateCcw,
  timestamp: Clock,
  "separator-h": Minus,
  "separator-v": SeparatorVertical,
  reticle: Target,
};

export function LayersPanel({
  layers,
  selectedLayerId,
  selectedObjectIds,
  onLayerSelect,
  onObjectSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onObjectVisibilityToggle,
  onObjectLockToggle,
  onLayerRename,
  onLayerCollapse,
  onAddLayer,
  onDeleteLayer,
  onReorderLayers,
  onReorderObjects,
}: LayersPanelProps) {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragOverObjectId, setDragOverObjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLayerDoubleClick = useCallback((layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingName(currentName);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingLayerId && editingName.trim()) {
      onLayerRename(editingLayerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName("");
  }, [editingLayerId, editingName, onLayerRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditingLayerId(null);
      setEditingName("");
    }
  }, [handleRenameSubmit]);

  const handleLayerDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", layerId);
  }, []);

  const handleLayerDragOver = useCallback((e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  }, [draggedLayerId]);

  const handleLayerDrop = useCallback((e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== targetLayerId) {
      const layerIds = layers.map(l => l.id);
      const fromIndex = layerIds.indexOf(draggedLayerId);
      const toIndex = layerIds.indexOf(targetLayerId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const newOrder = [...layerIds];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedLayerId);
        onReorderLayers(newOrder);
      }
    }
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  }, [draggedLayerId, layers, onReorderLayers]);

  const handleObjectDragStart = useCallback((e: React.DragEvent, objectId: string, layerId: string) => {
    e.stopPropagation();
    setDraggedObjectId(objectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${layerId}:${objectId}`);
  }, []);

  const handleObjectDragOver = useCallback((e: React.DragEvent, objectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedObjectId && draggedObjectId !== objectId) {
      setDragOverObjectId(objectId);
    }
  }, [draggedObjectId]);

  const handleObjectDrop = useCallback((e: React.DragEvent, targetObjectId: string, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedObjectId && draggedObjectId !== targetObjectId) {
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        const objectIds = layer.objects.map(o => o.id);
        const fromIndex = objectIds.indexOf(draggedObjectId);
        const toIndex = objectIds.indexOf(targetObjectId);
        if (fromIndex !== -1 && toIndex !== -1) {
          const newOrder = [...objectIds];
          newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, draggedObjectId);
          onReorderObjects(layerId, newOrder);
        }
      }
    }
    setDraggedObjectId(null);
    setDragOverObjectId(null);
  }, [draggedObjectId, layers, onReorderObjects]);

  const handleDragEnd = useCallback(() => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setDraggedObjectId(null);
    setDragOverObjectId(null);
  }, []);

  const handleObjectClick = useCallback((e: React.MouseEvent, objectId: string) => {
    const multiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
    onObjectSelect(objectId, multiSelect);
  }, [onObjectSelect]);

  const renderObjectIcon = (type: WatermarkObjectType) => {
    const IconComponent = OBJECT_TYPE_ICONS[type];
    return IconComponent ? <IconComponent className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null;
  };

  const renderObject = (object: WatermarkObject, layerId: string) => {
    const isSelected = selectedObjectIds.includes(object.id);
    const isDragOver = dragOverObjectId === object.id;

    return (
      <div
        key={object.id}
        draggable
        onDragStart={(e) => handleObjectDragStart(e, object.id, layerId)}
        onDragOver={(e) => handleObjectDragOver(e, object.id)}
        onDrop={(e) => handleObjectDrop(e, object.id, layerId)}
        onDragEnd={handleDragEnd}
        onClick={(e) => handleObjectClick(e, object.id)}
        className={cn(
          "flex items-center gap-1 py-1 px-2 ml-4 rounded text-xs cursor-pointer transition-colors",
          isSelected && "bg-primary/20 text-primary",
          !isSelected && "hover:bg-muted/50",
          isDragOver && "border-t-2 border-primary"
        )}
      >
        <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50 cursor-grab" />
        {renderObjectIcon(object.type)}
        <span className={cn(
          "flex-1 truncate",
          !object.visible && "opacity-50"
        )}>
          {object.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onObjectVisibilityToggle(object.id);
          }}
          className="p-0.5 hover:bg-muted rounded transition-colors"
        >
          {object.visible ? (
            <Eye className="h-3 w-3 text-muted-foreground" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground/50" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onObjectLockToggle(object.id);
          }}
          className="p-0.5 hover:bg-muted rounded transition-colors"
        >
          {object.locked ? (
            <Lock className="h-3 w-3 text-amber-500" />
          ) : (
            <Unlock className="h-3 w-3 text-muted-foreground/50" />
          )}
        </button>
      </div>
    );
  };

  const renderLayer = (layer: WatermarkLayer) => {
    const isSelected = selectedLayerId === layer.id;
    const isDragOver = dragOverLayerId === layer.id;
    const isEditing = editingLayerId === layer.id;

    return (
      <div
        key={layer.id}
        className={cn(
          "border-b border-border/40 last:border-b-0",
          isDragOver && "border-t-2 border-primary"
        )}
      >
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleLayerDragStart(e, layer.id)}
          onDragOver={(e) => handleLayerDragOver(e, layer.id)}
          onDrop={(e) => handleLayerDrop(e, layer.id)}
          onDragEnd={handleDragEnd}
          onClick={() => onLayerSelect(layer.id)}
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 cursor-pointer transition-colors",
            isSelected && "bg-primary/15",
            !isSelected && "hover:bg-muted/30"
          )}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 cursor-grab" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLayerCollapse(layer.id);
            }}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {layer.collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-background border border-border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleLayerDoubleClick(layer.id, layer.name);
              }}
              className={cn(
                "flex-1 truncate text-sm",
                !layer.visible && "opacity-50"
              )}
            >
              {layer.name}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLayerVisibilityToggle(layer.id);
            }}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLayerLockToggle(layer.id);
            }}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {layer.locked ? (
              <Lock className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
          </button>
        </div>

        {!layer.collapsed && layer.objects.length > 0 && (
          <div className="pb-1">
            {layer.objects.map((obj) => renderObject(obj, layer.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-48 sm:w-56 bg-background/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
        <span className="text-xs font-medium text-muted-foreground">Слои</span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
            onClick={onAddLayer}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
              selectedLayerId
                ? "hover:bg-destructive/10 hover:text-destructive"
                : "opacity-50 cursor-not-allowed"
            )}
            onClick={() => selectedLayerId && onDeleteLayer(selectedLayerId)}
            disabled={!selectedLayerId}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-[300px]">
        <div className="py-1">
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <Layers className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-xs">Нет слоёв</span>
            </div>
          ) : (
            layers.map(renderLayer)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
