import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  Info,
  X,
  Cloud,
  Link,
  Loader2,
  ChevronUp,
  ChevronDown,
  Camera,
  Images,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageLoader } from "@/components/page-loader";
import { PhotoMetadataPanel } from "@/components/photo-metadata-panel";
import { createCleanImageBlob, updatePhoto } from "@/lib/db";
import { usePhotoMutations } from "@/hooks/use-photo-mutations";
import { usePhotoNavigator } from "@/hooks/use-photo-navigator";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { cloudProviderRegistry } from "@/cloud-providers";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
const VERTICAL_SWIPE_THRESHOLD = 80;
const VERTICAL_VELOCITY_THRESHOLD = 0.5;

interface SwipeIndicatorProps {
  direction: "up" | "down";
  opacity: number;
  label: string;
  icon: React.ReactNode;
}

function SwipeIndicator({ direction, opacity, label, icon }: SwipeIndicatorProps) {
  if (opacity <= 0.1) return null;
  
  const smoothOpacity = Math.min(1, opacity * 1.5);
  const smoothScale = 0.9 + opacity * 0.1;
  
  return (
    <div 
      className={cn(
        "absolute left-1/2 z-60 pointer-events-none",
        "flex flex-col items-center gap-1 px-4 py-2 rounded-full",
        "bg-black/70 backdrop-blur-sm text-white",
        direction === "up" ? "top-20" : "bottom-20"
      )}
      style={{ 
        opacity: smoothOpacity,
        transform: `translateX(-50%) scale(${smoothScale})`,
        transition: 'opacity 100ms ease-out, transform 100ms ease-out',
      }}
    >
      {direction === "up" && icon}
      <span className="text-xs font-medium whitespace-nowrap">{label}</span>
      {direction === "down" && icon}
    </div>
  );
}

interface BreadcrumbsProps {
  folderName: string | null | undefined;
  photoName: string;
  onGalleryClick: () => void;
}

function Breadcrumbs({ folderName, photoName, onGalleryClick }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-white/70 overflow-hidden">
      <button 
        onClick={onGalleryClick}
        className="flex items-center gap-1 hover:text-white transition-colors shrink-0 touch-manipulation active:opacity-70"
      >
        <Images className="w-3 h-3" />
        <span>Галерея</span>
      </button>
      
      {folderName && (
        <>
          <ChevronRight className="w-3 h-3 shrink-0 text-white/40" />
          <span className="flex items-center gap-1 shrink-0 text-white/60">
            <Folder className="w-3 h-3" />
            <span className="max-w-[80px] truncate">{folderName}</span>
          </span>
        </>
      )}
      
      <ChevronRight className="w-3 h-3 shrink-0 text-white/40" />
      <span className="text-white/50 truncate max-w-[100px]">{photoName}</span>
    </nav>
  );
}

export default function PhotoDetailPage() {
  const [, params] = useRoute("/photo/:id");
  const [, navigate] = useLocation();
  const { deletePhotoById } = usePhotoMutations();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t } = useI18n();
  
  const photoId = params?.id;
  
  const {
    photo,
    isLoading,
    currentIndex,
    total,
    hasPrevious,
    hasNext,
    goToPrevious,
    goToNext,
    refreshIds,
    updateCurrentPhoto,
  } = usePhotoNavigator(photoId);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [verticalSwipeOffset, setVerticalSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"horizontal" | "vertical" | null>(null);

  const isImgbbValidated = settings.imgbb?.isValidated ?? false;
  const isPhotoUploaded = !!photo?.cloud?.url;
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    touchStartRef.current = null;
    setSwipeOffset(0);
    setVerticalSwipeOffset(0);
    setIsSwipeActive(false);
    setSwipeDirection(null);
  }, [photoId]);
  
  const handleBackToGallery = useCallback(() => {
    navigate("/gallery");
  }, [navigate]);

  const handleExitToCamera = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        handleBackToGallery();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, handleBackToGallery]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwipeActive(true);
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (swipeDirection === null && (absDeltaX > 10 || absDeltaY > 10)) {
      setSwipeDirection(absDeltaY > absDeltaX ? "vertical" : "horizontal");
    }
    
    if (swipeDirection === "vertical" || (swipeDirection === null && absDeltaY > absDeltaX)) {
      setVerticalSwipeOffset(deltaY * 0.4);
      setSwipeOffset(0);
      return;
    }
    
    if (swipeDirection === "horizontal" || (swipeDirection === null && absDeltaX > absDeltaY)) {
      const canSwipeLeft = hasNext && deltaX < 0;
      const canSwipeRight = hasPrevious && deltaX > 0;
      
      if (canSwipeLeft || canSwipeRight) {
        setSwipeOffset(deltaX * 0.3);
      }
      setVerticalSwipeOffset(0);
    }
  }, [hasNext, hasPrevious, swipeDirection]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;
    
    const deltaTime = Date.now() - touchStartRef.current.time;
    const verticalDelta = verticalSwipeOffset / 0.4;
    const verticalVelocity = Math.abs(verticalDelta) / deltaTime;
    const hasEnoughDistance = Math.abs(verticalDelta) >= VERTICAL_SWIPE_THRESHOLD;
    const hasEnoughVelocity = verticalVelocity >= VERTICAL_VELOCITY_THRESHOLD;
    const verticalSwipeShouldTrigger = hasEnoughDistance && hasEnoughVelocity;
    
    if (swipeDirection === "vertical" && verticalSwipeShouldTrigger) {
      if (verticalDelta < 0) {
        handleBackToGallery();
      } else {
        handleExitToCamera();
      }
    } else if (swipeDirection === "horizontal") {
      const deltaX = swipeOffset / 0.3;
      const velocity = Math.abs(deltaX) / deltaTime;
      const shouldSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
      
      if (shouldSwipe) {
        if (deltaX > 0 && hasPrevious) {
          goToPrevious();
        } else if (deltaX < 0 && hasNext) {
          goToNext();
        }
      }
    }
    
    touchStartRef.current = null;
    setSwipeOffset(0);
    setVerticalSwipeOffset(0);
    setIsSwipeActive(false);
    setSwipeDirection(null);
  }, [swipeOffset, verticalSwipeOffset, hasPrevious, hasNext, goToPrevious, goToNext, handleBackToGallery, handleExitToCamera, swipeDirection]);

  const handleDelete = useCallback(async () => {
    if (!photoId) return;
    
    setShowDeleteDialog(false);
    
    const result = await deletePhotoById(photoId);
    
    if (result.success) {
      await refreshIds();
      
      if (hasNext && total > 1) {
        goToNext();
      } else if (hasPrevious) {
        goToPrevious();
      } else {
        setTimeout(() => handleBackToGallery(), 100);
      }
    } else {
      logger.error("Failed to delete photo", result.error);
    }
  }, [photoId, deletePhotoById, hasNext, hasPrevious, total, goToNext, goToPrevious, handleBackToGallery, refreshIds]);

  const handleExport = useCallback(async () => {
    if (!photo) return;
    
    try {
      const blob = await createCleanImageBlob(photo.imageData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zeroday-${new Date(photo.metadata.timestamp).toISOString().slice(0, 10)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Failed to export photo", error);
    }
  }, [photo]);

  const handleShare = useCallback(async () => {
    if (!photo || !navigator.share) return;
    
    try {
      const blob = await createCleanImageBlob(photo.imageData);
      const file = new File([blob], `zeroday-photo.jpg`, { type: "image/jpeg" });
      
      await navigator.share({
        files: [file],
        title: t.photoDetail.shareTitle,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        logger.error("Failed to share photo", error);
      }
    }
  }, [photo, t.photoDetail.shareTitle]);

  const handleUploadToCloud = useCallback(async () => {
    if (!photo || isUploading || !settings.imgbb?.isValidated) return;

    setIsUploading(true);
    
    try {
      const providerId = settings.cloud?.selectedProvider || "imgbb";
      const provider = cloudProviderRegistry.get(providerId);
      
      if (!provider) {
        throw new Error("Cloud provider not found");
      }

      const providerSettings = providerId === "imgbb" 
        ? {
            isValidated: settings.imgbb.isValidated,
            apiKey: settings.imgbb.apiKey || "",
            expiration: settings.imgbb.expiration ?? 0,
          }
        : settings.cloud?.providers?.[providerId];
      
      if (!providerSettings?.isValidated) {
        throw new Error("Provider not configured");
      }

      const result = await provider.upload(photo.imageData, providerSettings);
      
      if (result.success && result.cloudData) {
        await updatePhoto(photo.id, { cloud: result.cloudData });
        updateCurrentPhoto({ cloud: result.cloudData });
        
        toast({
          title: t.gallery.uploadComplete,
          description: t.photoDetail.uploadToCloud,
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      logger.error("Failed to upload to cloud", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : t.common.unknownError,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [photo, isUploading, settings, updateCurrentPhoto, toast, t]);

  const handleCopyLink = useCallback(async () => {
    if (!photo?.cloud?.url) return;
    
    try {
      await navigator.clipboard.writeText(photo.cloud.url);
      toast({
        title: t.gallery.copied,
        description: t.photoDetail.copyLink,
      });
    } catch (error) {
      logger.error("Failed to copy link", error);
      toast({
        title: t.common.error,
        description: t.gallery.copyFailed,
        variant: "destructive",
      });
    }
  }, [photo?.cloud?.url, toast, t]);

  const swipeUpProgress = useMemo(() => {
    if (verticalSwipeOffset >= 0) return 0;
    return Math.min(1, Math.abs(verticalSwipeOffset) / 80);
  }, [verticalSwipeOffset]);

  const swipeDownProgress = useMemo(() => {
    if (verticalSwipeOffset <= 0) return 0;
    return Math.min(1, verticalSwipeOffset / 80);
  }, [verticalSwipeOffset]);

  const photoDisplayName = useMemo(() => {
    if (!photo) return "";
    return `IMG_${new Date(photo.metadata.timestamp).toISOString().slice(0, 10).replace(/-/g, "")}`;
  }, [photo]);

  if (isLoading) {
    return <PageLoader variant="fullscreen" />;
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-semibold mb-2">{t.photoDetail.photoNotFound}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t.photoDetail.mayHaveBeenDeleted}
        </p>
        <Button onClick={handleBackToGallery} data-testid="button-back-to-gallery">
          {t.common.backToGallery}
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black select-none touch-pan-y overflow-hidden"
      style={{
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100dvh',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center"
      >
        <img
          src={photo.imageData}
          alt={t.gallery.photo}
          className="w-full h-full object-contain transition-all duration-200 ease-out"
          style={{
            transform: isSwipeActive 
              ? `translate(${swipeOffset}px, ${verticalSwipeOffset}px) scale(${1 - Math.abs(verticalSwipeOffset) / 500})`
              : 'translate(0, 0) scale(1)',
            opacity: isSwipeActive && verticalSwipeOffset !== 0 
              ? Math.max(0.4, 1 - Math.abs(verticalSwipeOffset) / 150)
              : 1,
          }}
          data-testid="photo-image"
          draggable={false}
        />
      </div>

      <SwipeIndicator
        direction="up"
        opacity={swipeUpProgress}
        label="Назад в галерею"
        icon={<ChevronUp className="w-4 h-4" />}
      />

      <SwipeIndicator
        direction="down"
        opacity={swipeDownProgress}
        label="Выход на камеру"
        icon={<ChevronDown className="w-4 h-4" />}
      />

      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 text-white hover:bg-black/60 z-40 rounded-full touch-manipulation active:scale-95 transition-transform"
          onClick={goToPrevious}
          data-testid="button-previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 text-white hover:bg-black/60 z-40 rounded-full touch-manipulation active:scale-95 transition-transform"
          onClick={goToNext}
          data-testid="button-next"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/60 to-transparent safe-top">
        <div className="flex items-center gap-3 px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToGallery}
            className="text-white hover:bg-white/20 shrink-0 w-10 h-10 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-back-gallery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <Breadcrumbs
              folderName={photo.note}
              photoName={photoDisplayName}
              onGalleryClick={handleBackToGallery}
            />
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 shrink-0">
                {currentIndex + 1}/{total}
              </span>
              <span className="text-xs text-white/60">
                {new Date(photo.metadata.timestamp).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitToCamera}
            className="text-white hover:bg-white/20 shrink-0 w-10 h-10 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-exit-camera"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <footer className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 via-black/60 to-transparent safe-bottom">
        <div className="flex items-center justify-center gap-1 py-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoPanel(true)}
            className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-info"
          >
            <Info className="w-5 h-5" />
          </Button>
          {typeof navigator.share === "function" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
              data-testid="button-share"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-export"
          >
            <Download className="w-5 h-5" />
          </Button>
          {isImgbbValidated && !isPhotoUploaded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUploadToCloud}
              disabled={isUploading}
              className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
              data-testid="button-upload-cloud"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </Button>
          )}
          {isPhotoUploaded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLink}
              className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
              data-testid="button-copy-link"
            >
              <Link className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-400 hover:bg-white/20 hover:text-red-400 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-delete"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitToCamera}
            className="text-white hover:bg-white/20 w-11 h-11 rounded-full touch-manipulation active:scale-95 transition-transform"
            data-testid="button-close-gallery"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t.photoDetail.deleteConfirmTitle}
        description={t.photoDetail.deleteConfirmDescription}
        confirmText={t.common.delete}
        onConfirm={handleDelete}
        variant="destructive"
        confirmTestId="button-confirm-delete-dialog"
        cancelTestId="button-cancel-delete-dialog"
      />

      <PhotoMetadataPanel
        photo={photo}
        open={showInfoPanel}
        onOpenChange={setShowInfoPanel}
      />
    </div>
  );
}
