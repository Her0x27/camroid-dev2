import { memo, useRef, useCallback } from "react";

export interface WatermarkPosition {
  x: number;
  y: number;
}

export type SeparatorPosition = "before-coords" | "after-coords" | "before-note" | "after-note";

export interface WatermarkSeparator {
  id: string;
  position: SeparatorPosition;
}

export type CoordinateFormat = "decimal" | "dms" | "ddm";

function formatCoordinates(lat: number, lng: number, format: CoordinateFormat): string {
  switch (format) {
    case "dms": {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      const absLat = Math.abs(lat);
      const absLng = Math.abs(lng);
      const latDeg = Math.floor(absLat);
      const latMin = Math.floor((absLat - latDeg) * 60);
      const latSec = ((absLat - latDeg - latMin / 60) * 3600).toFixed(1);
      const lngDeg = Math.floor(absLng);
      const lngMin = Math.floor((absLng - lngDeg) * 60);
      const lngSec = ((absLng - lngDeg - lngMin / 60) * 3600).toFixed(1);
      return `${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
    }
    case "ddm": {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      const absLat = Math.abs(lat);
      const absLng = Math.abs(lng);
      const latDeg = Math.floor(absLat);
      const latMin = ((absLat - latDeg) * 60).toFixed(4);
      const lngDeg = Math.floor(absLng);
      const lngMin = ((absLng - lngDeg) * 60).toFixed(4);
      return `${latDeg}°${latMin}'${latDir} ${lngDeg}°${lngMin}'${lngDir}`;
    }
    case "decimal":
    default: {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lng).toFixed(4)}°${lngDir}`;
    }
  }
}

export interface WatermarkStyle {
  backgroundColor: string;
  backgroundOpacity: number;
  fontColor: string;
  fontOpacity: number;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  width: number;
  height: number;
  rotation: number;
  note: string;
  notePlacement: "start" | "end";
  separators: WatermarkSeparator[];
  coordinateFormat: CoordinateFormat;
}

interface InteractiveWatermarkProps {
  position: WatermarkPosition;
  style: WatermarkStyle;
  isDragging: boolean;
  isSelected: boolean;
  onTap: () => void;
  onDragStart: () => void;
  onDrag: (position: WatermarkPosition) => void;
  onDragEnd: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const LONG_PRESS_DURATION = 500;

export const InteractiveWatermark = memo(function InteractiveWatermark({
  position,
  style,
  isDragging,
  isSelected,
  onTap,
  onDragStart,
  onDrag,
  onDragEnd,
  containerRef,
}: InteractiveWatermarkProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const elementPosRef = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getEventPosition = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  const calculateNewPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return position;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;

      const newX = Math.max(
        0,
        Math.min(rect.width - style.width, elementPosRef.current.x + deltaX)
      );
      const newY = Math.max(
        0,
        Math.min(rect.height - style.height, elementPosRef.current.y + deltaY)
      );

      return { x: newX, y: newY };
    },
    [containerRef, position, style.width, style.height]
  );

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const eventPos = getEventPosition(e);
      startPosRef.current = eventPos;
      elementPosRef.current = position;
      hasMoved.current = false;

      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        onDragStart();
      }, LONG_PRESS_DURATION);
    },
    [getEventPosition, position, onDragStart]
  );

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const eventPos = getEventPosition(e);
      const deltaX = Math.abs(eventPos.x - startPosRef.current.x);
      const deltaY = Math.abs(eventPos.y - startPosRef.current.y);

      if (deltaX > 10 || deltaY > 10) {
        hasMoved.current = true;
        clearLongPressTimer();
      }

      if (isDraggingRef.current) {
        e.preventDefault();
        const newPos = calculateNewPosition(eventPos.x, eventPos.y);
        onDrag(newPos);
      }
    },
    [getEventPosition, clearLongPressTimer, calculateNewPosition, onDrag]
  );

  const handleEnd = useCallback(() => {
    clearLongPressTimer();

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onDragEnd();
    } else if (!hasMoved.current) {
      onTap();
    }
  }, [clearLongPressTimer, onDragEnd, onTap]);

  const fontStyles: React.CSSProperties = {
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
  };

  return (
    <div
      className={`absolute select-none touch-none cursor-pointer transition-shadow ${
        isDragging ? "cursor-grabbing shadow-lg" : ""
      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: style.width,
        minHeight: style.height,
        backgroundColor: style.backgroundColor,
        opacity: style.backgroundOpacity / 100,
        transform: `rotate(${style.rotation}deg)`,
        borderRadius: 8,
        padding: "8px 12px",
      }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={() => {
        clearLongPressTimer();
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          onDragEnd();
        }
      }}
    >
      <div
        className="font-mono text-center whitespace-pre-wrap break-words"
        style={{
          color: style.fontColor,
          opacity: style.fontOpacity / 100,
          fontSize: style.fontSize,
          ...fontStyles,
        }}
      >
        {style.notePlacement === "start" && style.note && (
          <>
            <div>{style.note}</div>
            {(style.separators || []).filter(s => s.position === "before-coords").map(s => (
              <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
            ))}
          </>
        )}
        {style.notePlacement === "end" && (style.separators || []).filter(s => s.position === "before-coords").map(s => (
          <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
        ))}
        <div>{formatCoordinates(55.7558, 37.6173, style.coordinateFormat)}</div>
        {(style.separators || []).filter(s => s.position === "after-coords").map(s => (
          <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
        ))}
        <div>±5m · 180° S</div>
        {style.notePlacement === "start" && (style.separators || []).filter(s => s.position === "after-note").map(s => (
          <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
        ))}
        {style.notePlacement === "end" && style.note && (
          <>
            {(style.separators || []).filter(s => s.position === "before-note").map(s => (
              <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
            ))}
            <div>{style.note}</div>
            {(style.separators || []).filter(s => s.position === "after-note").map(s => (
              <div key={s.id} className="w-full h-px bg-current opacity-50 my-1" />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

export default InteractiveWatermark;
