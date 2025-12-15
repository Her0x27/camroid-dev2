import { memo, useRef, useCallback, useEffect } from "react";
import { MapPin, Target, Mountain, Smartphone, Compass, FileText, Clock } from "lucide-react";
import { LONG_PRESS } from "@/lib/constants";

export interface WatermarkPosition {
  x: number;
  y: number;
}

export type SeparatorPosition = "before-coords" | "after-coords" | "before-note" | "after-note";

export interface WatermarkSeparator {
  id: string;
  position: SeparatorPosition;
}

export type CoordinateFormat = "decimal" | "dms" | "ddm" | "simple";

export type LogoPosition = "left" | "right";

export type FontFamily = "system" | "roboto" | "montserrat" | "oswald" | "playfair";

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
    case "simple": {
      return `${lat.toFixed(5)} ${lng.toFixed(5)}`;
    }
    case "decimal":
    default: {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lng).toFixed(4)}°${lngDir}`;
    }
  }
}

export type TextAlign = "left" | "center" | "right";

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
  autoSize: boolean;
  rotation: number;
  note: string;
  notePlacement: "start" | "end";
  separators: WatermarkSeparator[];
  coordinateFormat: CoordinateFormat;
  logoUrl: string | null;
  logoPosition: LogoPosition;
  logoSize: number;
  logoOpacity: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  showCoordinates: boolean;
  showGyroscope: boolean;
  showReticle: boolean;
  showNote: boolean;
  showTimestamp: boolean;
}

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  roboto: "var(--font-roboto)",
  montserrat: "var(--font-montserrat)",
  oswald: "var(--font-oswald)",
  playfair: "var(--font-playfair)",
};

export interface WatermarkBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
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
  onBoundsChange?: (bounds: WatermarkBounds) => void;
}

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
  onBoundsChange,
}: InteractiveWatermarkProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const elementPosRef = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const watermarkRef = useRef<HTMLDivElement>(null);

  const calculateBounds = useCallback(() => {
    if (!watermarkRef.current || !containerRef.current) return;
    
    const watermarkRect = watermarkRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const left = ((watermarkRect.left - containerRect.left) / containerRect.width) * 100;
    const right = ((watermarkRect.right - containerRect.left) / containerRect.width) * 100;
    const top = ((watermarkRect.top - containerRect.top) / containerRect.height) * 100;
    const bottom = ((watermarkRect.bottom - containerRect.top) / containerRect.height) * 100;
    
    onBoundsChange?.({
      left,
      right,
      top,
      bottom,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    });
  }, [containerRef, onBoundsChange]);

  useEffect(() => {
    if (!watermarkRef.current) return;
    
    const observer = new ResizeObserver(() => {
      calculateBounds();
    });
    
    observer.observe(watermarkRef.current);
    calculateBounds();
    
    return () => observer.disconnect();
  }, [calculateBounds]);

  useEffect(() => {
    calculateBounds();
  }, [position, style, calculateBounds]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getEventPosition = useCallback((e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY };
    }
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  const calculateNewPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return position;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;

      // Convert pixel delta to percentage delta
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      // Calculate max bounds - when autoSize, use smaller constraint (20% for auto-sized content)
      const maxXOffset = style.autoSize ? 20 : style.width;
      const maxYOffset = style.autoSize ? 10 : style.height;

      // Calculate new position in percentages, clamped to valid range
      const newX = Math.max(
        0,
        Math.min(100 - maxXOffset, elementPosRef.current.x + deltaXPercent)
      );
      const newY = Math.max(
        0,
        Math.min(100 - maxYOffset, elementPosRef.current.y + deltaYPercent)
      );

      return { x: newX, y: newY };
    },
    [containerRef, position, style.width, style.height, style.autoSize]
  );

  const handleStart = useCallback(
    (e: React.PointerEvent) => {
      const eventPos = getEventPosition(e);
      startPosRef.current = eventPos;
      elementPosRef.current = position;
      hasMoved.current = false;

      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        onDragStart();
      }, LONG_PRESS.DURATION_MS);
    },
    [getEventPosition, position, onDragStart]
  );

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
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

  const handleEnd = useCallback((_e: React.PointerEvent) => {
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

  const renderLogo = () => {
    if (!style.logoUrl) return null;
    return (
      <img
        src={style.logoUrl}
        alt="Logo"
        className="object-contain flex-shrink-0"
        style={{
          width: style.logoSize,
          height: style.logoSize,
          opacity: (style.logoOpacity ?? 100) / 100,
        }}
      />
    );
  };

  const renderTextContent = () => (
    <div
      className="whitespace-pre-wrap break-words flex-1"
      style={{
        color: style.fontColor,
        opacity: style.fontOpacity / 100,
        fontSize: `${style.fontSize}vmin`,
        fontFamily: FONT_FAMILY_MAP[style.fontFamily ?? "system"],
        textAlign: style.textAlign ?? "left",
        ...fontStyles,
      }}
    >
      {style.showNote !== false && style.notePlacement === "start" && style.note && (
        <>
          <div className="flex items-center gap-1">
            <FileText className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
            <span>{style.note}</span>
          </div>
          {(style.separators || []).filter(s => s.position === "before-coords").map(s => (
            <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
          ))}
        </>
      )}
      {style.showNote !== false && style.notePlacement === "end" && (style.separators || []).filter(s => s.position === "before-coords").map(s => (
        <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
      ))}
      {style.showCoordinates !== false && (
        <div className="flex items-center gap-1">
          <MapPin className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>{formatCoordinates(55.7558, 37.6173, style.coordinateFormat)}</span>
          <Target className="inline-block flex-shrink-0 ml-1" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>±5m</span>
        </div>
      )}
      {style.showCoordinates !== false && (style.separators || []).filter(s => s.position === "after-coords").map(s => (
        <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
      ))}
      {style.showGyroscope !== false && (
        <div className="flex items-center gap-1">
          <Mountain className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>156m</span>
          <span className="mx-0.5">|</span>
          <Smartphone className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>12°</span>
          <span className="mx-0.5">|</span>
          <Compass className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>180° S</span>
        </div>
      )}
      {style.showTimestamp && (
        <div className="flex items-center gap-1">
          <Clock className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
          <span>{new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      )}
      {style.showNote !== false && style.notePlacement === "start" && (style.separators || []).filter(s => s.position === "after-note").map(s => (
        <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
      ))}
      {style.showNote !== false && style.notePlacement === "end" && style.note && (
        <>
          {(style.separators || []).filter(s => s.position === "before-note").map(s => (
            <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
          ))}
          <div className="flex items-center gap-1">
            <FileText className="inline-block flex-shrink-0" style={{ width: `${style.fontSize * 0.8}vmin`, height: `${style.fontSize * 0.8}vmin` }} />
            <span>{style.note}</span>
          </div>
          {(style.separators || []).filter(s => s.position === "after-note").map(s => (
            <div key={s.id} className="w-full h-px bg-current opacity-50 mt-1 mb-2" />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div
      ref={watermarkRef}
      className={`absolute select-none touch-none cursor-pointer transition-shadow ${
        isDragging ? "cursor-grabbing shadow-lg" : ""
      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: style.autoSize ? 'auto' : `${style.width}%`,
        minHeight: style.autoSize ? 'auto' : `${style.height}%`,
        maxWidth: style.autoSize ? '90%' : undefined,
        transform: `rotate(${style.rotation}deg)`,
        borderRadius: 8,
      }}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={(e) => {
        e.stopPropagation();
        handleEnd(e);
      }}
      onPointerLeave={() => {
        clearLongPressTimer();
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          onDragEnd();
        }
      }}
    >
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundColor: style.backgroundColor,
          opacity: style.backgroundOpacity / 100,
        }}
      />
      <div className="relative flex items-center gap-2 p-2">
        {style.logoUrl && style.logoPosition === "left" && renderLogo()}
        {renderTextContent()}
        {style.logoUrl && style.logoPosition === "right" && renderLogo()}
      </div>
    </div>
  );
});

export default InteractiveWatermark;
