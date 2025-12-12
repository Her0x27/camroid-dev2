import { useRef, useState, useCallback, useEffect, memo } from "react";
import { MapPin, Crosshair, Compass, Smartphone, Clock, Plus, Minus } from "lucide-react";
import { ReticleShapeRenderer } from "./ReticleShapes";
import type {
  WatermarkLayer,
  WatermarkObject,
  WatermarkObjectPosition,
  WatermarkObjectSize,
  WatermarkObjectType,
} from "../types";

interface WatermarkCanvasProps {
  backgroundImage: string | null;
  layers: WatermarkLayer[];
  selectedObjectIds: string[];
  activeTool: string | null;
  zoom: number;
  panOffset: WatermarkObjectPosition;
  gridEnabled: boolean;
  gridSize: number;
  onObjectSelect: (objectId: string, multiSelect: boolean) => void;
  onObjectMove: (objectId: string, position: WatermarkObjectPosition) => void;
  onObjectResize: (objectId: string, size: WatermarkObjectSize) => void;
  onObjectRotate: (objectId: string, rotation: number) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (offset: WatermarkObjectPosition) => void;
  onDeselectAll: () => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'pan';
  objectId?: string;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startObjectX?: number;
  startObjectY?: number;
  startWidth?: number;
  startHeight?: number;
  startRotation?: number;
  centerX?: number;
  centerY?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

const TYPE_ICONS: Partial<Record<WatermarkObjectType, typeof MapPin>> = {
  coordinates: MapPin,
  accuracy: Crosshair,
  heading: Compass,
  tilt: Smartphone,
  timestamp: Clock,
};

const ObjectRenderer = memo(function ObjectRenderer({
  object,
  onMouseDown,
}: {
  object: WatermarkObject;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  if (!object.visible) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: object.position.x,
    top: object.position.y,
    width: object.size.width,
    height: object.size.height,
    transform: `rotate(${object.rotation}deg)`,
    opacity: object.style.opacity / 100,
    cursor: object.locked ? 'not-allowed' : 'move',
    userSelect: 'none',
    pointerEvents: object.locked ? 'none' : 'auto',
  };

  const renderContent = () => {
    switch (object.type) {
      case 'text':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              color: object.style.color,
              fontSize: object.style.fontSize,
              fontFamily: object.style.fontFamily,
              fontWeight: object.style.fontWeight,
              textAlign: object.style.textAlign,
              backgroundColor: object.style.backgroundColor || 'transparent',
              borderRadius: object.style.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: object.style.textAlign === 'center' ? 'center' : 
                             object.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
              padding: '2px 4px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {object.content || 'Текст'}
          </div>
        );

      case 'logo':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: object.style.backgroundColor || 'rgba(100, 100, 100, 0.5)',
              borderRadius: object.style.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px dashed ${object.style.color}`,
            }}
          >
            {object.customIconUrl ? (
              <img
                src={object.customIconUrl}
                alt="logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: object.style.color, fontSize: 12 }}>LOGO</span>
            )}
          </div>
        );

      case 'coordinates':
      case 'accuracy':
      case 'heading':
      case 'tilt':
      case 'timestamp': {
        const IconComponent = TYPE_ICONS[object.type];
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              color: object.style.color,
              fontSize: object.style.fontSize,
              fontFamily: object.style.fontFamily,
              fontWeight: object.style.fontWeight,
              backgroundColor: object.style.backgroundColor || 'transparent',
              borderRadius: object.style.borderRadius,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 4px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {IconComponent && <IconComponent size={object.style.fontSize || 14} />}
            <span>{object.content}</span>
          </div>
        );
      }

      case 'separator-h':
        return (
          <div
            style={{
              width: '100%',
              height: object.style.strokeWidth || 2,
              backgroundColor: object.style.color,
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        );

      case 'separator-v':
        return (
          <div
            style={{
              width: object.style.strokeWidth || 2,
              height: '100%',
              backgroundColor: object.style.color,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        );

      case 'reticle':
        return (
          <ReticleShapeRenderer
            shape={object.reticleShape || 'crosshair'}
            size={Math.min(object.size.width, object.size.height)}
            color={object.style.color}
            strokeWidth={object.style.strokeWidth || 2}
            opacity={object.style.opacity}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      data-object-id={object.id}
    >
      {renderContent()}
    </div>
  );
});

const SelectionBox = memo(function SelectionBox({
  object,
  zoom,
  onResizeStart,
  onRotateStart,
}: {
  object: WatermarkObject;
  zoom: number;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}) {
  const handleSize = 8 / zoom;
  const rotateHandleDistance = 24 / zoom;

  const handles: { position: ResizeHandle; style: React.CSSProperties }[] = [
    { position: 'nw', style: { left: -handleSize / 2, top: -handleSize / 2, cursor: 'nw-resize' } },
    { position: 'n', style: { left: '50%', top: -handleSize / 2, transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { position: 'ne', style: { right: -handleSize / 2, top: -handleSize / 2, cursor: 'ne-resize' } },
    { position: 'e', style: { right: -handleSize / 2, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' } },
    { position: 'se', style: { right: -handleSize / 2, bottom: -handleSize / 2, cursor: 'se-resize' } },
    { position: 's', style: { left: '50%', bottom: -handleSize / 2, transform: 'translateX(-50%)', cursor: 's-resize' } },
    { position: 'sw', style: { left: -handleSize / 2, bottom: -handleSize / 2, cursor: 'sw-resize' } },
    { position: 'w', style: { left: -handleSize / 2, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' } },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: object.position.x,
        top: object.position.y,
        width: object.size.width,
        height: object.size.height,
        transform: `rotate(${object.rotation}deg)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -1,
          border: '2px solid #3b82f6',
          pointerEvents: 'none',
        }}
      />
      
      {handles.map(({ position, style }) => (
        <div
          key={position}
          style={{
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            backgroundColor: '#ffffff',
            border: '1px solid #3b82f6',
            borderRadius: 1,
            pointerEvents: 'auto',
            ...style,
          }}
          onMouseDown={(e) => onResizeStart(e, position)}
        />
      ))}
      
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -rotateHandleDistance - handleSize,
          transform: 'translateX(-50%)',
          width: handleSize,
          height: handleSize,
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={onRotateStart}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -rotateHandleDistance,
          width: 1,
          height: rotateHandleDistance - handleSize / 2,
          backgroundColor: '#3b82f6',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

const Grid = memo(function Grid({
  width,
  height,
  gridSize,
  zoom,
}: {
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
}) {
  const scaledGridSize = gridSize * zoom;
  
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
});

export const WatermarkCanvas = memo(function WatermarkCanvas({
  backgroundImage,
  layers,
  selectedObjectIds,
  activeTool,
  zoom,
  panOffset,
  gridEnabled,
  gridSize,
  onObjectSelect,
  onObjectMove,
  onObjectResize,
  onObjectRotate,
  onZoomChange,
  onPanChange,
  onDeselectAll,
}: WatermarkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const allObjects = layers
    .filter(layer => layer.visible)
    .flatMap(layer => layer.objects.filter(obj => obj.visible));

  const selectedObjects = allObjects.filter(obj => selectedObjectIds.includes(obj.id));

  const getObjectById = useCallback((id: string): WatermarkObject | undefined => {
    for (const layer of layers) {
      const obj = layer.objects.find(o => o.id === id);
      if (obj) return obj;
    }
    return undefined;
  }, [layers]);

  const screenToCanvas = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - panOffset.x) / zoom,
      y: (screenY - rect.top - panOffset.y) / zoom,
    };
  }, [zoom, panOffset]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (activeTool === 'pan') {
        setDragState({
          type: 'pan',
          startX: e.clientX,
          startY: e.clientY,
        });
      } else {
        onDeselectAll();
      }
    }
  }, [activeTool, onDeselectAll]);

  const handleObjectMouseDown = useCallback((e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    
    const object = getObjectById(objectId);
    if (!object || object.locked) return;

    const multiSelect = e.shiftKey;
    onObjectSelect(objectId, multiSelect);

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    setDragState({
      type: 'move',
      objectId,
      startX: canvasPos.x,
      startY: canvasPos.y,
      startObjectX: object.position.x,
      startObjectY: object.position.y,
    });
  }, [getObjectById, onObjectSelect, screenToCanvas]);

  const handleResizeStart = useCallback((e: React.MouseEvent, objectId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    
    const object = getObjectById(objectId);
    if (!object || object.locked) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    setDragState({
      type: 'resize',
      objectId,
      handle,
      startX: canvasPos.x,
      startY: canvasPos.y,
      startObjectX: object.position.x,
      startObjectY: object.position.y,
      startWidth: object.size.width,
      startHeight: object.size.height,
    });
  }, [getObjectById, screenToCanvas]);

  const handleRotateStart = useCallback((e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    
    const object = getObjectById(objectId);
    if (!object || object.locked) return;

    const centerX = object.position.x + object.size.width / 2;
    const centerY = object.position.y + object.size.height / 2;
    
    setDragState({
      type: 'rotate',
      objectId,
      startX: e.clientX,
      startY: e.clientY,
      startRotation: object.rotation,
      centerX,
      centerY,
    });
  }, [getObjectById]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;

    if (dragState.type === 'pan') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      onPanChange({
        x: panOffset.x + dx,
        y: panOffset.y + dy,
      });
      setDragState({
        ...dragState,
        startX: e.clientX,
        startY: e.clientY,
      });
      return;
    }

    if (!dragState.objectId) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (dragState.type === 'move') {
      const dx = canvasPos.x - dragState.startX;
      const dy = canvasPos.y - dragState.startY;
      onObjectMove(dragState.objectId, {
        x: (dragState.startObjectX || 0) + dx,
        y: (dragState.startObjectY || 0) + dy,
      });
    } else if (dragState.type === 'resize' && dragState.handle) {
      const dx = canvasPos.x - dragState.startX;
      const dy = canvasPos.y - dragState.startY;
      
      let newWidth = dragState.startWidth || 0;
      let newHeight = dragState.startHeight || 0;
      let newX = dragState.startObjectX || 0;
      let newY = dragState.startObjectY || 0;

      switch (dragState.handle) {
        case 'e':
          newWidth += dx;
          break;
        case 'w':
          newWidth -= dx;
          newX += dx;
          break;
        case 's':
          newHeight += dy;
          break;
        case 'n':
          newHeight -= dy;
          newY += dy;
          break;
        case 'se':
          newWidth += dx;
          newHeight += dy;
          break;
        case 'sw':
          newWidth -= dx;
          newHeight += dy;
          newX += dx;
          break;
        case 'ne':
          newWidth += dx;
          newHeight -= dy;
          newY += dy;
          break;
        case 'nw':
          newWidth -= dx;
          newHeight -= dy;
          newX += dx;
          newY += dy;
          break;
      }

      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      onObjectResize(dragState.objectId, { width: newWidth, height: newHeight });
      onObjectMove(dragState.objectId, { x: newX, y: newY });
    } else if (dragState.type === 'rotate') {
      const centerX = dragState.centerX || 0;
      const centerY = dragState.centerY || 0;
      
      const canvasCenterScreenX = centerX * zoom + panOffset.x + (containerRef.current?.getBoundingClientRect().left || 0);
      const canvasCenterScreenY = centerY * zoom + panOffset.y + (containerRef.current?.getBoundingClientRect().top || 0);
      
      const startAngle = Math.atan2(
        dragState.startY - canvasCenterScreenY,
        dragState.startX - canvasCenterScreenX
      );
      const currentAngle = Math.atan2(
        e.clientY - canvasCenterScreenY,
        e.clientX - canvasCenterScreenX
      );
      
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      let newRotation = (dragState.startRotation || 0) + angleDiff;
      
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      
      onObjectRotate(dragState.objectId, newRotation);
    }
  }, [dragState, screenToCanvas, onObjectMove, onObjectResize, onObjectRotate, onPanChange, panOffset, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
      onZoomChange(newZoom);
    } else if (activeTool === 'pan' || e.shiftKey) {
      onPanChange({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY,
      });
    }
  }, [zoom, panOffset, activeTool, onZoomChange, onPanChange]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragState(null);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: activeTool === 'pan' ? (dragState?.type === 'pan' ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          style={{
            position: 'absolute',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: '#1a1a1a',
          }}
        >
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt="Background"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <div>Нет изображения</div>
              </div>
            </div>
          )}

          {gridEnabled && (
            <Grid
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              gridSize={gridSize}
              zoom={1}
            />
          )}

          {allObjects.map(object => (
            <ObjectRenderer
              key={object.id}
              object={object}
              onMouseDown={(e) => handleObjectMouseDown(e, object.id)}
            />
          ))}

          {selectedObjects.map(object => (
            <SelectionBox
              key={`selection-${object.id}`}
              object={object}
              zoom={zoom}
              onResizeStart={(e, handle) => handleResizeStart(e, object.id, handle)}
              onRotateStart={(e) => handleRotateStart(e, object.id)}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-neutral-800/90 rounded-lg p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-neutral-700 rounded transition-colors text-white"
          title="Увеличить"
        >
          <Plus size={18} />
        </button>
        <div className="text-center text-xs text-neutral-400 py-1">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-neutral-700 rounded transition-colors text-white"
          title="Уменьшить"
        >
          <Minus size={18} />
        </button>
      </div>

      <div className="absolute top-4 left-4 text-xs text-neutral-500 bg-neutral-800/70 px-2 py-1 rounded">
        {CANVAS_WIDTH} × {CANVAS_HEIGHT}
      </div>
    </div>
  );
});

export default WatermarkCanvas;
