import { memo, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera, Settings2, Images, FileText, CloudUpload, Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CameraControlsProps {
  onCapture: () => void;
  onNavigateGallery: () => void;
  onNavigateSettings: () => void;
  onOpenNote: () => void;
  isReady: boolean;
  isCapturing: boolean;
  isProcessing: boolean;
  accuracyBlocked: boolean;
  accuracy: number | null;
  hasNote: boolean;
  lastPhotoThumb: string | null;
  photoCount: number;
  cloudCount: number;
}

export const CameraControls = memo(function CameraControls({
  onCapture,
  onNavigateGallery,
  onNavigateSettings,
  onOpenNote,
  isReady,
  isCapturing,
  isProcessing,
  accuracyBlocked,
  accuracy,
  hasNote,
  lastPhotoThumb,
  photoCount,
  cloudCount,
}: CameraControlsProps) {
  return (
    <div className="safe-bottom absolute inset-x-0 bottom-0 z-20">
      <div className="relative flex items-center justify-center px-[5%] py-3 h-24">
        <CaptureButton
          onCapture={onCapture}
          isReady={isReady}
          isCapturing={isCapturing}
          accuracyBlocked={accuracyBlocked}
          accuracy={accuracy}
        />

        <GalleryButton
          onNavigate={onNavigateGallery}
          lastPhotoThumb={lastPhotoThumb}
          photoCount={photoCount}
          cloudCount={cloudCount}
          isProcessing={isProcessing}
        />

        <RightControls
          onOpenNote={onOpenNote}
          onNavigateSettings={onNavigateSettings}
          hasNote={hasNote}
        />
      </div>
    </div>
  );
});

interface CaptureButtonProps {
  onCapture: () => void;
  isReady: boolean;
  isCapturing: boolean;
  accuracyBlocked: boolean;
  accuracy: number | null;
}

const CaptureButton = memo(function CaptureButton({
  onCapture,
  isReady,
  isCapturing,
  accuracyBlocked,
  accuracy,
}: CaptureButtonProps) {
  const formatAccuracy = (acc: number | null): string => {
    if (acc === null) return "---";
    return `±${Math.round(acc)}m`;
  };

  return (
    <button
      onClick={onCapture}
      disabled={!isReady || isCapturing || accuracyBlocked}
      className={`relative aspect-square w-20 h-20 rounded-full flex items-center justify-center transition-all overflow-visible ${
        accuracyBlocked
          ? ""
          : isReady && !isCapturing
            ? "active:scale-95"
            : ""
      }`}
      data-testid="button-capture"
    >
      {isReady && !isCapturing && !accuracyBlocked && (
        <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" style={{ animationDuration: '2s' }} />
      )}
      
      <span className={`absolute inset-0 rounded-full border-4 transition-all ${
        accuracyBlocked
          ? "border-destructive/60 shadow-[0_0_15px_hsl(var(--destructive)/0.4)]"
          : isReady && !isCapturing
            ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            : "border-muted-foreground/40"
      }`} />
      
      <span className={`absolute inset-1 rounded-full transition-all ${
        accuracyBlocked
          ? "bg-destructive/15"
          : isReady && !isCapturing
            ? "bg-card/60 backdrop-blur-sm"
            : "bg-muted/30"
      }`} />
      
      <div 
        className={`relative z-10 w-[65%] h-[65%] rounded-full transition-all flex items-center justify-center shadow-lg ${
          accuracyBlocked
            ? "bg-destructive/40 border-2 border-destructive/60"
            : isCapturing 
              ? "bg-primary scale-75 border-2 border-primary-foreground/30" 
              : isReady 
                ? "bg-primary border-2 border-primary-foreground/30 shadow-[0_0_12px_hsl(var(--primary)/0.6)]" 
                : "bg-muted border-2 border-muted-foreground/30"
        }`}
      >
        <span 
          className={`text-[11px] font-bold font-mono ${
            accuracyBlocked 
              ? "text-destructive-foreground" 
              : isReady || isCapturing
                ? "text-primary-foreground" 
                : "text-muted-foreground"
          }`}
          data-testid="text-accuracy"
        >
          {formatAccuracy(accuracy)}
        </span>
      </div>
    </button>
  );
});

interface GalleryButtonProps {
  onNavigate: () => void;
  lastPhotoThumb: string | null;
  photoCount: number;
  cloudCount: number;
  isProcessing: boolean;
}

const GalleryButton = memo(function GalleryButton({
  onNavigate,
  lastPhotoThumb,
  photoCount,
  cloudCount,
  isProcessing,
}: GalleryButtonProps) {
  const { t } = useI18n();
  
  return (
    <div className="absolute left-4 flex items-center">
      <button
        className="text-primary relative flex items-center justify-center w-14 h-14 transition-opacity active:opacity-70"
        onClick={onNavigate}
        data-testid="button-gallery"
      >
        {lastPhotoThumb ? (
          <img 
            src={lastPhotoThumb} 
            alt={t.camera.lastPhoto} 
            className="w-12 h-12 object-cover rounded-lg shadow-lg"
          />
        ) : (
          <Images className="w-7 h-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
        )}
        {isProcessing && (
          <span 
            className="absolute inset-0 rounded-lg border-2 border-white/60 animate-pulse"
            data-testid="indicator-processing"
          />
        )}
        {photoCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 min-w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center gap-0.5 px-1 shadow-md"
            data-testid="badge-photo-count"
          >
            <Camera className="w-2.5 h-2.5" />
            {photoCount > 99 ? "99+" : photoCount}
          </span>
        )}
        {cloudCount > 0 && (
          <span 
            className="absolute -bottom-1 -right-1 min-w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center gap-0.5 px-1 shadow-md"
            data-testid="badge-cloud-count"
          >
            <CloudUpload className="w-2.5 h-2.5" />
            {cloudCount > 99 ? "99+" : cloudCount}
          </span>
        )}
      </button>
    </div>
  );
});

interface RightControlsProps {
  onOpenNote: () => void;
  onNavigateSettings: () => void;
  hasNote: boolean;
}

const RightControls = memo(function RightControls({
  onOpenNote,
  onNavigateSettings,
  hasNote,
}: RightControlsProps) {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDropdownOpen(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPress.current) {
      onNavigateSettings();
    }
  }, [onNavigateSettings]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleVisualEditor = useCallback(() => {
    setDropdownOpen(false);
    navigate("/visualEditorWatermark");
  }, [navigate]);

  return (
    <div className="absolute right-4 flex items-center gap-3">
      <button
        className="text-primary relative flex items-center justify-center w-14 h-14 transition-opacity active:opacity-70"
        onClick={onOpenNote}
        data-testid="button-note"
      >
        <FileText className="w-7 h-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
        {hasNote && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_6px_hsl(var(--primary))]" />
        )}
      </button>

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="text-primary flex items-center justify-center w-14 h-14 transition-opacity active:opacity-70"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
            onClick={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            data-testid="button-settings"
          >
            <Settings2 className="w-7 h-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem onClick={handleVisualEditor} className="gap-2">
            <Palette className="w-4 h-4" />
            {t.camera.visualEditor}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
