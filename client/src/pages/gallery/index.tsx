import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { createCleanImageBlob, getPhotoImageData, getPhotosWithThumbnails, getFolderStats, invalidateFolderCountsCache, type FolderStats } from "@/lib/db";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { usePhotoMutations } from "@/hooks/use-photo-mutations";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useI18n } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import {
  validateUploadSettings,
  executePhotoUpload,
  getUploadToastMessage,
  type UploadSettings,
} from "@/lib/upload-helpers";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UploadProgressOverlay } from "@/components/upload-progress-overlay";
import { VirtualizedPhotoList, VirtualizedPhotoGrid, AutoSizerContainer } from "@/components/virtualized-gallery";
import { GalleryLoadingSkeleton, FolderLoadingSkeleton } from "@/components/gallery-loading-skeleton";
import {
  GalleryHeader,
  GalleryEmptyState,
  GalleryFolderList,
  GalleryLinksDialog,
  GallerySelectionFooter,
  type FolderInfo,
} from "./components";
import { useGallerySelection, useGalleryView, useGalleryFilters, useGalleryPhotos } from "./hooks";
import type { PhotoWithThumbnail } from "@shared/schema";

interface LinkItem {
  id: string;
  url: string;
  deleteUrl: string;
}

export default function GalleryPage() {
  const [, navigate] = useLocation();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t } = useI18n();
  const { deletePhotoById, clearAll, deleteMultiple } = usePhotoMutations();
  const { isUploading, progress: uploadProgress, startUpload, updateProgress, finishUpload } = useUploadProgress();
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [linksToShow, setLinksToShow] = useState<LinkItem[]>([]);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  
  const [folderStats, setFolderStats] = useState<FolderStats[]>([]);
  const [allPhotosForFolders, setAllPhotosForFolders] = useState<PhotoWithThumbnail[] | null>(null);
  
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const handleCancelUpload = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
      finishUpload();
      toast({
        title: t.gallery.uploadCancelled,
        description: t.gallery.uploadCancelledDescription,
      });
    }
  }, [finishUpload, toast, t]);

  const {
    viewMode,
    selectedFolder,
    displayType,
    handleFolderSelect,
    handleBackToFolders: baseHandleBackToFolders,
    cycleViewMode: baseCycleViewMode,
    cycleDisplayType,
    setSelectedFolder,
    setViewMode,
  } = useGalleryView();

  const {
    filter,
    toggleSortOrder,
  } = useGalleryFilters();

  const {
    photos: paginatedPhotos,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    updatePhoto,
    removePhoto,
    removePhotos,
    clearPhotos,
  } = useGalleryPhotos({
    sortOrder: filter.sortBy,
    folder: (viewMode === "photos" || viewMode === "mixed") ? selectedFolder : undefined,
    hasLocation: filter.hasLocation,
    hasNote: filter.hasNote,
    viewMode: viewMode === "mixed" ? "photos" : viewMode,
  });

  const filteredPhotos = paginatedPhotos;

  const {
    selectionMode,
    selectedIds,
    handleCancelSelection,
    handleSelectAll,
    handleToggleSelection,
    handleLongPress,
    resetSelection,
    removeFromSelection,
  } = useGallerySelection({ filteredPhotos });

  const handleBackToFolders = useCallback(() => {
    baseHandleBackToFolders();
    resetSelection();
  }, [baseHandleBackToFolders, resetSelection]);

  const handleCycleViewMode = useCallback(() => {
    baseCycleViewMode();
    resetSelection();
  }, [baseCycleViewMode, resetSelection]);

  useEffect(() => {
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    const gallery = galleryRef.current;
    if (gallery) {
      gallery.addEventListener("contextmenu", preventContextMenu);
      return () => {
        gallery.removeEventListener("contextmenu", preventContextMenu);
      };
    }
  }, []);

  useEffect(() => {
    if (viewMode === "folders") {
      getFolderStats().then(setFolderStats).catch(err => {
        logger.error("Failed to load folder stats", err);
      });
    }
  }, [viewMode]);

  const folders = useMemo((): FolderInfo[] => {
    return folderStats.map(stat => ({
      name: stat.folder,
      count: stat.count,
      latestThumb: stat.latestThumb,
      uploadedCount: stat.uploadedCount,
    }));
  }, [folderStats]);

  const uploadSettings = useMemo((): UploadSettings | undefined => {
    const providerId = settings.cloud?.selectedProvider || "imgbb";
    if (providerId === "imgbb" && settings.imgbb?.apiKey && settings.imgbb?.isValidated) {
      return {
        providerId,
        settings: {
          isValidated: settings.imgbb.isValidated,
          apiKey: settings.imgbb.apiKey,
          expiration: settings.imgbb.expiration ?? 0,
        },
      };
    }
    const providerSettings = settings.cloud?.providers?.[providerId];
    if (providerSettings?.isValidated) {
      return {
        providerId,
        settings: providerSettings,
      };
    }
    return undefined;
  }, [settings.cloud, settings.imgbb]);

  const refreshFolderStatsAfterMutation = useCallback(async () => {
    invalidateFolderCountsCache();
    try {
      const stats = await getFolderStats();
      setFolderStats(stats);
    } catch (err) {
      logger.error("Failed to refresh folder stats", err);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const result = await deletePhotoById(deleteTarget);
    if (result.success) {
      removePhoto(deleteTarget);
      removeFromSelection(deleteTarget);
      setAllPhotosForFolders(null);
      await refreshFolderStatsAfterMutation();
    } else {
      logger.error("Failed to delete photo", result.error);
    }
    setDeleteTarget(null);
  }, [deleteTarget, deletePhotoById, removeFromSelection, removePhoto, refreshFolderStatsAfterMutation]);

  const handleClearAll = useCallback(async () => {
    const result = await clearAll();
    if (result.success) {
      clearPhotos();
      setFolderStats([]);
      setAllPhotosForFolders(null);
      setSelectedFolder(undefined);
      setViewMode("photos");
      resetSelection();
    } else {
      logger.error("Failed to clear all photos", result.error);
    }
    setShowClearDialog(false);
  }, [clearAll, setSelectedFolder, setViewMode, resetSelection, clearPhotos]);

  const handleDeleteSelected = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);
    const result = await deleteMultiple(idsToDelete);
    
    if (result.success) {
      removePhotos(idsToDelete);
      setAllPhotosForFolders(null);
      await refreshFolderStatsAfterMutation();
      resetSelection();
      toast({
        title: t.common.success,
        description: `${idsToDelete.length} ${t.gallery.photos} ${t.common.delete.toLowerCase()}`,
      });
    } else {
      toast({
        title: t.common.error,
        description: result.error instanceof Error ? result.error.message : (result.error || t.common.unknownError),
        variant: "destructive",
      });
    }
    setShowDeleteSelectedDialog(false);
  }, [selectedIds, deleteMultiple, toast, t, resetSelection, removePhotos, refreshFolderStatsAfterMutation]);

  const handleDownloadSelected = useCallback(async () => {
    const selectedPhotos = filteredPhotos.filter(p => selectedIds.has(p.id));
    
    const imageDataResults = await Promise.all(
      selectedPhotos.map(async (photo) => {
        try {
          const imageData = await getPhotoImageData(photo.id);
          if (!imageData) {
            logger.warn(`Could not load imageData for photo ${photo.id}`);
            return null;
          }
          const blob = await createCleanImageBlob(imageData);
          return { photo, blob };
        } catch (error) {
          logger.error(`Failed to prepare photo ${photo.id}`, error);
          return null;
        }
      })
    );
    
    const validResults = imageDataResults.filter((r): r is { photo: typeof selectedPhotos[0]; blob: Blob } => r !== null);
    
    for (const { photo, blob } of validResults) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zeroday-${new Date(photo.metadata.timestamp).toISOString().slice(0, 10)}-${photo.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: t.common.success,
      description: `${validResults.length} ${t.gallery.photos}`,
    });
  }, [filteredPhotos, selectedIds, toast, t]);

  const handleUploadPhotos = useCallback(async (photos: PhotoWithThumbnail[]) => {
    const validation = validateUploadSettings(uploadSettings, photos);

    if (!validation.isValid) {
      if (validation.error === "no_api_key") {
        toast({ title: t.common.error, description: t.gallery.configureApiFirst, variant: "destructive" });
      } else if (validation.error === "all_uploaded") {
        toast({ title: t.common.info, description: t.gallery.allUploaded });
      }
      return;
    }

    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
    uploadAbortControllerRef.current = new AbortController();

    startUpload(validation.photosToUpload.length);

    try {
      const result = await executePhotoUpload(
        validation.photosToUpload,
        uploadSettings!,
        updateProgress,
        uploadAbortControllerRef.current.signal
      );

      Array.from(result.updatedPhotos.entries()).forEach(([photoId, cloudData]) => {
        updatePhoto(photoId, { cloud: cloudData });
        if (allPhotosForFolders) {
          setAllPhotosForFolders((prev) =>
            prev ? prev.map((p) => (p.id === photoId ? { ...p, cloud: cloudData } : p)) : null
          );
        }
      });

      if (result.updatedPhotos.size > 0) {
        await refreshFolderStatsAfterMutation();
      }

      const message = getUploadToastMessage(result);
      if (message.type === "cancelled") {
        toast({
          title: t.common.info,
          description: t.gallery.uploadCancelledPartial.replace("{count}", String(message.successCount)),
        });
      } else {
        toast({
          title: t.gallery.uploadComplete,
          description: t.gallery.uploadedCount
            .replace("{success}", String(message.successCount))
            .replace("{errors}", String(message.errorCount)),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast({ title: t.common.info, description: t.gallery.uploadCancelled });
      } else {
        toast({
          title: t.common.error,
          description: error instanceof Error ? error.message : t.common.unknownError,
          variant: "destructive",
        });
      }
    } finally {
      uploadAbortControllerRef.current = null;
      finishUpload();
    }
  }, [uploadSettings, toast, t, startUpload, updateProgress, finishUpload]);

  const handleUploadSelected = useCallback(async () => {
    const selectedPhotos = filteredPhotos.filter(p => selectedIds.has(p.id));
    await handleUploadPhotos(selectedPhotos);
  }, [filteredPhotos, selectedIds, handleUploadPhotos]);

  const handleGetSelectedLinks = useCallback(() => {
    const selectedPhotos = filteredPhotos.filter(p => selectedIds.has(p.id) && p.cloud?.url);
    
    if (selectedPhotos.length === 0) {
      toast({
        title: t.gallery.noLinks,
        description: t.gallery.uploadFirst,
      });
      return;
    }

    setLinksToShow(
      selectedPhotos.map(p => ({
        id: p.id,
        url: p.cloud!.url,
        deleteUrl: p.cloud!.deleteUrl,
      }))
    );
    setShowLinksDialog(true);
  }, [filteredPhotos, selectedIds, toast, t]);

  useEffect(() => {
    return () => {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
        uploadAbortControllerRef.current = null;
      }
    };
  }, []);

  const ensureAllPhotosLoaded = useCallback(async (): Promise<PhotoWithThumbnail[]> => {
    if (allPhotosForFolders !== null) {
      return allPhotosForFolders;
    }
    const photos = await getPhotosWithThumbnails("newest");
    setAllPhotosForFolders(photos);
    return photos;
  }, [allPhotosForFolders]);

  const handleUploadCurrentView = useCallback(async () => {
    if (viewMode === "photos") {
      await handleUploadPhotos(filteredPhotos);
    } else {
      const photos = await ensureAllPhotosLoaded();
      await handleUploadPhotos(photos);
    }
  }, [viewMode, filteredPhotos, ensureAllPhotosLoaded, handleUploadPhotos]);

  const handleGetLinks = useCallback(async () => {
    let photos: PhotoWithThumbnail[];
    if (viewMode === "photos") {
      photos = filteredPhotos;
    } else {
      photos = await ensureAllPhotosLoaded();
    }
    
    const photosWithLinks = photos.filter(p => p.cloud?.url);
    
    if (photosWithLinks.length === 0) {
      toast({
        title: t.gallery.noLinks,
        description: t.gallery.uploadFirst,
      });
      return;
    }

    setLinksToShow(
      photosWithLinks.map(p => ({
        id: p.id,
        url: p.cloud!.url,
        deleteUrl: p.cloud!.deleteUrl,
      }))
    );
    setShowLinksDialog(true);
  }, [viewMode, filteredPhotos, ensureAllPhotosLoaded, toast, t]);

  const handleCopyAllLinks = useCallback(async () => {
    const allLinks = linksToShow.map(l => l.url).join("\n");
    try {
      await navigator.clipboard.writeText(allLinks);
      toast({
        title: t.gallery.copied,
        description: t.gallery.linksCopied.replace("{count}", String(linksToShow.length)),
      });
    } catch {
      toast({
        title: t.common.error,
        description: t.gallery.copyFailed,
        variant: "destructive",
      });
    }
  }, [linksToShow, toast, t]);

  const handleFolderUpload = useCallback(async (folderName: string | null) => {
    const allPhotos = await ensureAllPhotosLoaded();
    const folderPhotos = allPhotos.filter(p => (p.note || null) === folderName);
    await handleUploadPhotos(folderPhotos);
  }, [ensureAllPhotosLoaded, handleUploadPhotos]);

  const handleFolderGetLinks = useCallback(async (folderName: string | null) => {
    const allPhotos = await ensureAllPhotosLoaded();
    const folderPhotos = allPhotos.filter(p => (p.note || null) === folderName && p.cloud?.url);
    
    if (folderPhotos.length === 0) {
      toast({
        title: t.gallery.noLinks,
        description: t.gallery.uploadFirst,
      });
      return;
    }

    setLinksToShow(
      folderPhotos.map(p => ({
        id: p.id,
        url: p.cloud!.url,
        deleteUrl: p.cloud!.deleteUrl,
      }))
    );
    setShowLinksDialog(true);
  }, [ensureAllPhotosLoaded, toast, t]);

  const totalPhotoCountFromFolderStats = useMemo(() => {
    return folderStats.reduce((acc, stat) => acc + stat.count, 0);
  }, [folderStats]);

  const uploadedCount = useMemo(() => {
    if (viewMode === "photos") {
      return filteredPhotos.filter(p => p.cloud?.url).length;
    }
    return folderStats.reduce((acc, stat) => acc + stat.uploadedCount, 0);
  }, [viewMode, filteredPhotos, folderStats]);

  const handlePhotoClick = useCallback((photoId: string) => {
    if (selectionMode) {
      handleToggleSelection(photoId);
    } else {
      navigate(`/photo/${photoId}`);
    }
  }, [selectionMode, handleToggleSelection, navigate]);

  const handleDeleteClick = useCallback((photoId: string) => {
    if (!selectionMode) {
      setDeleteTarget(photoId);
    }
  }, [selectionMode]);

  const navigateToCamera = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const allPhotosCount = viewMode === "folders" ? totalPhotoCountFromFolderStats : totalCount;
  
  const headerTitle = viewMode === "folders" 
    ? t.gallery.title 
    : viewMode === "mixed"
      ? t.gallery.title
      : selectedFolder === undefined
        ? t.gallery.allPhotos
        : selectedFolder === null 
          ? t.gallery.uncategorized 
          : selectedFolder;

  const headerSubtitle = viewMode === "folders"
    ? `${folders.length} ${folders.length === 1 ? t.gallery.folder : t.gallery.folders}, ${totalPhotoCountFromFolderStats} ${totalPhotoCountFromFolderStats === 1 ? t.gallery.photo : t.gallery.photos}`
    : viewMode === "mixed"
      ? `${folders.length} ${t.gallery.folders}, ${totalPhotoCountFromFolderStats} ${t.gallery.photos}`
      : `${filteredPhotos.length}${hasMore ? "+" : ""} ${filteredPhotos.length === 1 ? t.gallery.photo : t.gallery.photos}`;

  return (
    <div 
      ref={galleryRef}
      className="min-h-screen bg-background select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <GalleryHeader
        viewMode={viewMode}
        displayType={displayType}
        headerTitle={headerTitle}
        headerSubtitle={headerSubtitle}
        selectedFolder={selectedFolder}
        filter={filter}
        isUploading={isUploading}
        hasPhotos={allPhotosCount > 0}
        uploadedCount={uploadedCount}
        isImgbbValidated={settings.imgbb?.isValidated ?? false}
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        totalPhotos={filteredPhotos.length}
        onBack={handleBackToFolders}
        onCloseGallery={navigateToCamera}
        onCycleViewMode={handleCycleViewMode}
        onCycleDisplayType={cycleDisplayType}
        onToggleSortOrder={toggleSortOrder}
        onUploadCurrentView={handleUploadCurrentView}
        onGetLinks={handleGetLinks}
        onClearAll={() => setShowClearDialog(true)}
        onCancelSelection={handleCancelSelection}
        onSelectAll={handleSelectAll}
        t={t}
      />


      <main className="p-4 safe-bottom">
        {isLoading ? (
          viewMode === "folders" ? (
            <FolderLoadingSkeleton count={6} />
          ) : (
            <GalleryLoadingSkeleton count={8} />
          )
        ) : allPhotosCount === 0 ? (
          <GalleryEmptyState
            type="no-photos"
            hasFilters={false}
            onNavigateToCamera={navigateToCamera}
            onBackToFolders={handleBackToFolders}
            t={t}
          />
        ) : viewMode === "folders" ? (
          <GalleryFolderList
            folders={folders}
            displayType={displayType}
            onFolderSelect={handleFolderSelect}
            onFolderUpload={handleFolderUpload}
            onFolderGetLinks={handleFolderGetLinks}
            isImgbbValidated={settings.imgbb?.isValidated ?? false}
            isUploading={isUploading}
            t={t}
          />
        ) : viewMode === "mixed" ? (
          <div className="space-y-6">
            {folders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">{t.gallery.folders}</h2>
                <GalleryFolderList
                  folders={folders}
                  displayType={displayType === "large" ? "grid" : displayType}
                  onFolderSelect={handleFolderSelect}
                  onFolderUpload={handleFolderUpload}
                  onFolderGetLinks={handleFolderGetLinks}
                  isImgbbValidated={settings.imgbb?.isValidated ?? false}
                  isUploading={isUploading}
                  t={t}
                />
              </div>
            )}
            {filteredPhotos.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">{t.gallery.photos}</h2>
                <AutoSizerContainer className="flex-1" style={{ height: "calc(100vh - 280px)" }}>
                  {({ width, height }) =>
                    displayType === "list" ? (
                      <VirtualizedPhotoList
                        photos={filteredPhotos}
                        onPhotoClick={handlePhotoClick}
                        onDeleteClick={handleDeleteClick}
                        onLongPress={handleLongPress}
                        containerHeight={height}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                      />
                    ) : (
                      <VirtualizedPhotoGrid
                        photos={filteredPhotos}
                        onPhotoClick={handlePhotoClick}
                        onDeleteClick={handleDeleteClick}
                        onLongPress={handleLongPress}
                        containerHeight={height}
                        containerWidth={width}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        cellSizeMultiplier={displayType === "large" ? 1.5 : 1}
                      />
                    )
                  }
                </AutoSizerContainer>
              </div>
            )}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <GalleryEmptyState
            type="empty-folder"
            hasFilters={false}
            onNavigateToCamera={navigateToCamera}
            onBackToFolders={handleBackToFolders}
            t={t}
          />
        ) : (
          <AutoSizerContainer className="flex-1" style={{ height: "calc(100vh - 180px)" }}>
            {({ width, height }) =>
              displayType === "list" ? (
                <VirtualizedPhotoList
                  photos={filteredPhotos}
                  onPhotoClick={handlePhotoClick}
                  onDeleteClick={handleDeleteClick}
                  onLongPress={handleLongPress}
                  containerHeight={height}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                />
              ) : (
                <VirtualizedPhotoGrid
                  photos={filteredPhotos}
                  onPhotoClick={handlePhotoClick}
                  onDeleteClick={handleDeleteClick}
                  onLongPress={handleLongPress}
                  containerHeight={height}
                  containerWidth={width}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  cellSizeMultiplier={displayType === "large" ? 1.5 : 1}
                />
              )
            }
          </AutoSizerContainer>
        )}
      </main>

      {selectionMode && (
        <GallerySelectionFooter
          selectedCount={selectedIds.size}
          isUploading={isUploading}
          isImgbbValidated={settings.imgbb?.isValidated ?? false}
          hasUploadedPhotos={filteredPhotos.filter(p => selectedIds.has(p.id) && p.cloud?.url).length > 0}
          onDownload={handleDownloadSelected}
          onDelete={() => setShowDeleteSelectedDialog(true)}
          onUpload={handleUploadSelected}
          onGetLinks={handleGetSelectedLinks}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t.gallery.deletePhoto}
        description={t.photoDetail.deleteConfirmDescription}
        confirmText={t.common.delete}
        onConfirm={handleDelete}
        variant="destructive"
        confirmTestId="button-confirm-delete"
        cancelTestId="button-cancel-delete"
      />

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title={t.gallery.clearAll}
        description={t.gallery.clearAllConfirmDescription.replace("{count}", String(allPhotosCount))}
        confirmText={t.gallery.clearAll}
        onConfirm={handleClearAll}
        variant="destructive"
        confirmTestId="button-confirm-clear"
        cancelTestId="button-cancel-clear"
      />

      <ConfirmDialog
        open={showDeleteSelectedDialog}
        onOpenChange={setShowDeleteSelectedDialog}
        title={t.gallery.deleteSelectedConfirm.replace("{count}", String(selectedIds.size))}
        description={t.gallery.deleteSelectedDescription}
        confirmText={t.common.delete}
        onConfirm={handleDeleteSelected}
        variant="destructive"
        confirmTestId="button-confirm-delete-selected"
        cancelTestId="button-cancel-delete-selected"
      />

      <UploadProgressOverlay 
        isVisible={isUploading}
        completed={uploadProgress.completed}
        total={uploadProgress.total}
        onCancel={handleCancelUpload}
      />

      <GalleryLinksDialog
        open={showLinksDialog}
        links={linksToShow}
        onOpenChange={setShowLinksDialog}
        onCopyAllLinks={handleCopyAllLinks}
        t={t}
        toast={toast}
      />
    </div>
  );
}
