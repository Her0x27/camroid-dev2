import { memo, RefObject } from "react";
import { Camera, EyeOff, FileText, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reticle } from "@/components/reticles";
import { LevelIndicator } from "@/components/level-indicator";
import { useI18n } from "@/lib/i18n";
import type { ReticleConfig } from "@shared/schema";

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
}: CameraViewfinderProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {isLoading && <LoadingOverlay />}
      {error && <ErrorOverlay error={error} onRetry={onRetry} />}

      <div className="absolute inset-0 viewfinder-overlay pointer-events-none" />

      {isReady && <Reticle config={reticleConfig} dynamicColor={reticleColor} />}

      {isReady && note && (
        <NoteOverlay note={note} />
      )}

      {isReady && showLevelIndicator && (
        <LevelIndicator
          tilt={orientationData.tilt}
          roll={orientationData.roll}
        />
      )}

      {isReady && stabilizationEnabled && (
        <StabilityIndicator stability={stability ?? 0} isStable={isStable ?? false} />
      )}

      {showMaskButton && onMask && (
        <button
          className="absolute right-4 top-32 z-30 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-primary hover:bg-card flex items-center justify-center w-12 h-12 shadow-lg transition-colors safe-top"
          onClick={onMask}
          data-testid="button-mask"
        >
          <EyeOff className="w-5 h-5 drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" />
        </button>
      )}
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
          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" />
          <p className="font-sans text-sm text-foreground/90 leading-tight line-clamp-3" data-testid="text-note-overlay">
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
