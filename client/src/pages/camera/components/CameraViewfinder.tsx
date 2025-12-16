import { memo, RefObject, useRef, useCallback, useState, useEffect } from "react";
import { Camera, EyeOff, FileText, Crosshair, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reticle } from "@/components/reticles";
import { LevelIndicator } from "@/components/level-indicator";
import { useI18n } from "@/lib/i18n";
import { useLongPress, type LongPressPositionPercent } from "@/hooks/use-long-press";
import { logger } from "@/lib/logger";
import { CAMERA, LONG_PRESS_INDICATOR } from "@/lib/constants";
import type { ReticleConfig, ReticlePosition } from "@shared/schema";

interface LongPressIndicatorProps {
  position: ReticlePosition;
  duration: number;
  containerRef: RefObject<HTMLDivElement>;
}

const LongPressIndicator = memo(function LongPressIndicator({ 
  position, 
  duration, 
  containerRef 
}: LongPressIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    const animationId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationId);
  }, [duration]);

  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const size = LONG_PRESS_INDICATOR.SIZE;
  const strokeWidth = LONG_PRESS_INDICATOR.STROKE_WIDTH;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg width={size} height={size} className="drop-shadow-lg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={CAMERA.DEFAULT_RETICLE_COLOR}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 16ms linear",
          }}
        />
      </svg>
    </div>
  );
});

interface CameraViewfinderProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  reticleConfig: ReticleConfig;
  reticleColor: string;
  orientationData: {
    heading: number | null;
    tilt: number | null;
    roll: number | null;
  };
  showMaskButton?: boolean;
  onMask?: () => void;
  note?: string;
  showLevelIndicator?: boolean;
  stabilizationEnabled?: boolean;
  stability?: number;
  isStable?: boolean;
  onLongPressCapture?: (position: ReticlePosition) => void;
  reticlePosition?: ReticlePosition | null;
  adjustmentMode?: boolean;
  frozenFrame?: string | null;
  adjustmentPosition?: ReticlePosition;
  onAdjustmentPositionChange?: (position: ReticlePosition) => void;
  onAdjustmentConfirm?: () => void;
  onAdjustmentCancel?: () => void;
  showPlaceholder?: boolean;
}

export const CameraViewfinder = memo(function CameraViewfinder({
  videoRef,
  canvasRef,
  isReady,
  isLoading,
  error,
  onRetry,
  reticleConfig,
  reticleColor,
  orientationData,
  showMaskButton,
  onMask,
  note,
  showLevelIndicator,
  stabilizationEnabled,
  stability,
  isStable,
  onLongPressCapture,
  reticlePosition,
  adjustmentMode,
  frozenFrame,
  adjustmentPosition,
  onAdjustmentPositionChange,
  onAdjustmentConfirm,
  onAdjustmentCancel,
  showPlaceholder,
}: CameraViewfinderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tempPosition, setTempPosition] = useState<ReticlePosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 10;

  const handleLongPressWithPosition = useCallback(
    (pos: LongPressPositionPercent) => {
      const screenPosition: ReticlePosition = { x: pos.percentX, y: pos.percentY };
      setIsLongPressing(false);
      
      logger.debug('[LongPress] using screen position directly', { screenPosition });
      onLongPressCapture?.(screenPosition);
      
      setTempPosition(null);
    },
    [onLongPressCapture]
  );

  const longPressHandlers = useLongPress({
    onLongPressWithPosition: reticleConfig.tapToPosition ? handleLongPressWithPosition : undefined,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    disabled: !isReady || !reticleConfig.tapToPosition || adjustmentMode,
    delay: reticleConfig.longPressDelay || 500,
  });

  const handleAdjustmentDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!adjustmentMode) return;
    e.preventDefault();
    setIsDragging(true);
  }, [adjustmentMode]);

  const handleAdjustmentDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!adjustmentMode || !isDragging) return;
    
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    if (!rect) return;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    onAdjustmentPositionChange?.({ x: percentX, y: percentY });
  }, [adjustmentMode, isDragging, onAdjustmentPositionChange]);

  const handleAdjustmentDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStartWrapper = useCallback(
    (e: React.TouchEvent) => {
      if (reticleConfig.tapToPosition && isReady && e.touches.length === 1) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const touch = e.touches[0];
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
          const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));
          setTempPosition({ x: percentX, y: percentY });
          setIsLongPressing(true);
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
      longPressHandlers.onTouchStart(e);
    },
    [reticleConfig.tapToPosition, isReady, longPressHandlers]
  );

  const handleTouchEndWrapper = useCallback(() => {
    setTempPosition(null);
    setIsLongPressing(false);
    touchStartRef.current = null;
    longPressHandlers.onTouchEnd();
  }, [longPressHandlers]);

  const handleTouchMoveWrapper = useCallback(
    (e: React.TouchEvent) => {
      if (reticleConfig.tapToPosition && isReady && e.touches.length === 1) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const touch = e.touches[0];
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
          const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));
          setTempPosition({ x: percentX, y: percentY });
          
          if (touchStartRef.current && isLongPressing) {
            const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
            if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
              setIsLongPressing(false);
            }
          }
        }
      }
      longPressHandlers.onTouchMove(e);
    },
    [reticleConfig.tapToPosition, isReady, longPressHandlers, isLongPressing]
  );

  const displayPosition = (() => {
    if (adjustmentMode && adjustmentPosition) {
      return adjustmentPosition;
    }
    
    if (tempPosition) {
      return tempPosition;
    }
    
    if (reticlePosition) {
      return reticlePosition;
    }
    
    return null;
  })();

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      onTouchStart={adjustmentMode ? handleAdjustmentDragStart : handleTouchStartWrapper}
      onTouchEnd={adjustmentMode ? handleAdjustmentDragEnd : handleTouchEndWrapper}
      onTouchMove={adjustmentMode ? handleAdjustmentDrag : handleTouchMoveWrapper}
      onMouseDown={adjustmentMode ? handleAdjustmentDragStart : longPressHandlers.onMouseDown}
      onMouseUp={adjustmentMode ? handleAdjustmentDragEnd : longPressHandlers.onMouseUp}
      onMouseMove={adjustmentMode ? handleAdjustmentDrag : longPressHandlers.onMouseMove}
      onMouseLeave={adjustmentMode ? handleAdjustmentDragEnd : longPressHandlers.onMouseLeave}
    >
      <canvas ref={canvasRef} className="hidden" />

      {adjustmentMode && frozenFrame ? (
        <img
          src={frozenFrame}
          alt="Frozen frame"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />
      )}

      {showPlaceholder && !adjustmentMode && <PlaceholderOverlay />}
      {isLoading && !adjustmentMode && !showPlaceholder && <LoadingOverlay />}
      {error && !adjustmentMode && !showPlaceholder && <ErrorOverlay error={error} onRetry={onRetry} />}

      <div className="absolute inset-0 viewfinder-overlay pointer-events-none" />

      {(isReady || adjustmentMode) && <Reticle config={reticleConfig} dynamicColor={reticleColor} position={displayPosition} />}

      {isReady && isLongPressing && tempPosition && reticleConfig.tapToPosition && !adjustmentMode && (
        <LongPressIndicator
          position={tempPosition}
          duration={longPressHandlers.delay}
          containerRef={containerRef}
        />
      )}

      {isReady && note && !adjustmentMode && (
        <NoteOverlay note={note} />
      )}

      {isReady && showLevelIndicator && !adjustmentMode && (
        <LevelIndicator
          tilt={orientationData.tilt}
          roll={orientationData.roll}
        />
      )}

      {isReady && stabilizationEnabled && !adjustmentMode && (
        <StabilityIndicator stability={stability ?? 0} isStable={isStable ?? false} />
      )}

      {showMaskButton && onMask && !adjustmentMode && (
        <button
          className="absolute right-4 top-32 z-30 safe-top bg-card/80 backdrop-blur-md rounded-xl p-2 border border-border/50 shadow-lg hover:bg-card transition-colors"
          onClick={onMask}
          data-testid="button-mask"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 border border-primary/40">
            <EyeOff className="w-4 h-4 text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" />
          </div>
        </button>
      )}

      {adjustmentMode && (
        <AdjustmentControls
          onConfirm={onAdjustmentConfirm}
          onCancel={onAdjustmentCancel}
        />
      )}
    </div>
  );
});

interface AdjustmentControlsProps {
  onConfirm?: () => void;
  onCancel?: () => void;
}

const AdjustmentControls = memo(function AdjustmentControls({ onConfirm, onCancel }: AdjustmentControlsProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6">
      <button
        className="w-14 h-14 rounded-full bg-red-500/90 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
        onClick={onCancel}
        data-testid="button-adjustment-cancel"
      >
        <X className="w-7 h-7" />
      </button>
      <button
        className="w-14 h-14 rounded-full bg-emerald-500/90 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-emerald-600 flex items-center justify-center shadow-lg transition-colors"
        onClick={onConfirm}
        data-testid="button-adjustment-confirm"
      >
        <Check className="w-7 h-7" />
      </button>
    </div>
  );
});

const PlaceholderOverlay = memo(function PlaceholderOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 rounded-full bg-muted/20 border border-border/30 flex items-center justify-center">
          <Camera className="w-10 h-10 text-muted-foreground/50" />
        </div>
      </div>
    </div>
  );
});

const LoadingOverlay = memo(function LoadingOverlay() {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" style={{ animationDuration: '1.5s' }} />
          <div className="relative w-16 h-16 rounded-full bg-card/80 border border-border/50 flex items-center justify-center shadow-lg">
            <Camera className="w-8 h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          </div>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{t.camera.startingCamera}</span>
      </div>
    </div>
  );
});

interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
}

const ErrorOverlay = memo(function ErrorOverlay({ error, onRetry }: ErrorOverlayProps) {
  const { t } = useI18n();
  
  const getLocalizedError = (errorCode: string): string => {
    switch (errorCode) {
      case "CAMERA_ACCESS_DENIED":
        return t.errors.cameraAccessDenied;
      case "CAMERA_NOT_FOUND":
        return t.errors.cameraNotFound;
      case "REQUESTED_DEVICE_NOT_FOUND":
        return t.errors.requestedDeviceNotFound;
      case "CAMERA_UNKNOWN_ERROR":
        return t.errors.cameraUnknownError;
      default:
        return t.errors.cameraUnknownError;
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md p-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center shadow-lg">
          <Camera className="w-8 h-8 text-destructive drop-shadow-[0_0_6px_hsl(var(--destructive)/0.5)]" />
        </div>
        <span className="text-sm text-foreground">{getLocalizedError(error)}</span>
        <Button onClick={onRetry} variant="outline" size="sm" data-testid="button-retry-camera">
          {t.camera.retry}
        </Button>
      </div>
    </div>
  );
});

interface NoteOverlayProps {
  note: string;
}

const NoteOverlay = memo(function NoteOverlay({ note }: NoteOverlayProps) {
  if (!note.trim()) return null;
  
  return (
    <div className="absolute top-4 left-4 z-20 safe-top max-w-[60%]">
      <div className="bg-card/80 backdrop-blur-md rounded-xl px-3 py-2.5 border border-border/50 shadow-lg">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20 border border-primary/40">
            <FileText className="w-4 h-4 text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" />
          </div>
          <p className="font-sans text-sm text-foreground/90 leading-tight line-clamp-3 pt-1.5" data-testid="text-note-overlay">
            {note}
          </p>
        </div>
      </div>
    </div>
  );
});

interface StabilityIndicatorProps {
  stability: number;
  isStable: boolean;
}

const StabilityIndicator = memo(function StabilityIndicator({ stability, isStable }: StabilityIndicatorProps) {
  const { t } = useI18n();
  
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-card/80 backdrop-blur-md rounded-xl px-3 py-2.5 border border-border/50 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isStable 
              ? 'bg-emerald-500/20 border border-emerald-500/40' 
              : 'bg-amber-500/20 border border-amber-500/40'
          }`}>
            <Crosshair 
              className={`w-4 h-4 ${
                isStable 
                  ? 'text-emerald-500 drop-shadow-[0_0_4px_rgb(16,185,129)]' 
                  : 'text-amber-500 drop-shadow-[0_0_4px_rgb(245,158,11)]'
              }`}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs text-foreground font-medium" data-testid="text-stability">
              {stability}%
            </span>
            <span className={`text-[10px] font-medium ${isStable ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isStable ? t.camera.stable : t.camera.stabilizing}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
