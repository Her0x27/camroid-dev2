import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  Info,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageLoader } from "@/components/page-loader";
import { PhotoMetadataPanel } from "@/components/photo-metadata-panel";
import { createCleanImageBlob } from "@/lib/db";
import { usePhotoMutations } from "@/hooks/use-photo-mutations";
import { usePhotoNavigator } from "@/hooks/use-photo-navigator";
import { useI18n } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export default function PhotoDetailPage() {
  const [, params] = useRoute("/photo/:id");
  const [, navigate] = useLocation();
  const { deletePhotoById } = usePhotoMutations();
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
  } = usePhotoNavigator(photoId);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [verticalSwipeOffset, setVerticalSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    touchStartRef.current = null;
    setSwipeOffset(0);
    setVerticalSwipeOffset(0);
    setIsSwipeActive(false);
  }, [photoId]);
  
  const handleBack = useCallback(() => {
    navigate("/gallery");
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, handleBack]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwipeActive(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Vertical swipe detection: if deltaY is significant and larger than deltaX
    if (absDeltaY > absDeltaX && absDeltaY > 30) {
      setVerticalSwipeOffset(deltaY * 0.3);
      return;
    }
    
    // Horizontal swipe detection
    if (absDeltaX > absDeltaY * 0.5) {
      const canSwipeLeft = hasNext && deltaX < 0;
      const canSwipeRight = hasPrevious && deltaX > 0;
      
      if (canSwipeLeft || canSwipeRight) {
        setSwipeOffset(deltaX * 0.3);
      }
    }
  }, [hasNext, hasPrevious]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;
    
    const deltaTime = Date.now() - touchStartRef.current.time;
    const verticalDelta = verticalSwipeOffset / 0.3;
    const verticalVelocity = Math.abs(verticalDelta) / deltaTime;
    const verticalSwipeShouldTrigger = Math.abs(verticalDelta) > SWIPE_THRESHOLD || verticalVelocity > SWIPE_VELOCITY_THRESHOLD;
    
    // Check vertical swipe first (close photo)
    if (verticalSwipeShouldTrigger && Math.abs(verticalDelta) > Math.abs(swipeOffset / 0.3)) {
      handleBack();
    } else {
      // Then check horizontal swipe (next/previous)
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
  }, [swipeOffset, verticalSwipeOffset, hasPrevious, hasNext, goToPrevious, goToNext, handleBack]);

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
        setTimeout(() => handleBack(), 100);
      }
    } else {
      logger.error("Failed to delete photo", result.error);
    }
  }, [photoId, deletePhotoById, hasNext, hasPrevious, total, goToNext, goToPrevious, handleBack, refreshIds]);

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
        <Button onClick={handleBack} data-testid="button-back-to-gallery">
          {t.common.backToGallery}
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="absolute top-4 left-4 w-11 h-11 bg-black/50 text-white hover:bg-black/70 z-50 rounded-full border border-white/20"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        data-testid="button-close-viewer"
      >
        <X className="w-6 h-6" />
      </Button>

      <img
        src={photo.imageData}
        alt={t.gallery.photo}
        className="w-full h-full object-contain transition-transform duration-150"
        style={{
          transform: isSwipeActive 
            ? `translate(${swipeOffset}px, ${verticalSwipeOffset}px)`
            : 'translate(0, 0)',
          opacity: isSwipeActive && verticalSwipeOffset !== 0 
            ? Math.max(0.3, 1 - Math.abs(verticalSwipeOffset) / 200)
            : 1,
        }}
        data-testid="photo-image"
        draggable={false}
      />

      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60 z-40"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60 z-40"
          onClick={goToNext}
          data-testid="button-next"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      <header className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/60 to-transparent safe-bottom">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-white hover:bg-white/20"
            data-testid="button-back-gallery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-sm text-white/80">
            {currentIndex + 1} / {total}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfoPanel(true)}
              className="text-white hover:bg-white/20"
              data-testid="button-info"
            >
              <Info className="w-5 h-5" />
            </Button>
            {typeof navigator.share === "function" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="text-white hover:bg-white/20"
              data-testid="button-export"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-400 hover:bg-white/20 hover:text-red-400"
              data-testid="button-delete"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

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
