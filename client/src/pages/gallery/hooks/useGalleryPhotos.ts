import { useState, useCallback, useRef, useEffect } from "react";
import {
  getPhotosWithThumbnailsPaginated,
  getPhotosWithThumbnails,
  type PaginatedPhotosOptions,
} from "@/lib/db";
import { logger } from "@/lib/logger";
import type { PhotoWithThumbnail } from "@shared/schema";

const PAGE_SIZE = 50;

interface UseGalleryPhotosParams {
  sortOrder: "newest" | "oldest";
  folder?: string | null;
  hasLocation?: boolean;
  hasNote?: boolean;
  viewMode: "photos" | "folders";
  usePagination?: boolean;
}

interface UseGalleryPhotosReturn {
  photos: PhotoWithThumbnail[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updatePhoto: (photoId: string, updates: Partial<PhotoWithThumbnail>) => void;
  removePhoto: (photoId: string) => void;
  removePhotos: (photoIds: string[]) => void;
  clearPhotos: () => void;
}

export function useGalleryPhotos({
  sortOrder,
  folder,
  hasLocation,
  hasNote,
  viewMode,
  usePagination = true,
}: UseGalleryPhotosParams): UseGalleryPhotosReturn {
  const [photos, setPhotos] = useState<PhotoWithThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const cursorRef = useRef<number | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadInitial = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    cursorRef.current = undefined;
    
    try {
      if (usePagination && viewMode === "photos") {
        const options: PaginatedPhotosOptions = {
          sortOrder,
          limit: PAGE_SIZE,
          folder,
          hasLocation,
          hasNote,
        };
        
        const result = await getPhotosWithThumbnailsPaginated(options);
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        setPhotos(result.photos);
        setHasMore(result.hasMore);
        setTotalCount(result.totalMatchingCount);
        cursorRef.current = result.nextCursor ?? undefined;
      } else {
        const allPhotos = await getPhotosWithThumbnails(sortOrder);
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        setPhotos(allPhotos);
        setHasMore(false);
        setTotalCount(allPhotos.length);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      logger.error("Failed to load photos", error);
    } finally {
      setIsLoading(false);
    }
  }, [sortOrder, folder, hasLocation, hasNote, viewMode, usePagination]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || cursorRef.current === undefined) return;
    
    setIsLoadingMore(true);
    
    try {
      const options: PaginatedPhotosOptions = {
        sortOrder,
        limit: PAGE_SIZE,
        cursor: cursorRef.current,
        folder,
        hasLocation,
        hasNote,
      };
      
      const result = await getPhotosWithThumbnailsPaginated(options);
      
      setPhotos(prev => [...prev, ...result.photos]);
      setHasMore(result.hasMore);
      cursorRef.current = result.nextCursor ?? undefined;
    } catch (error) {
      logger.error("Failed to load more photos", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, sortOrder, folder, hasLocation, hasNote]);

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  const updatePhoto = useCallback((photoId: string, updates: Partial<PhotoWithThumbnail>) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p));
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  const removePhotos = useCallback((photoIds: string[]) => {
    const idsSet = new Set(photoIds);
    setPhotos(prev => prev.filter(p => !idsSet.has(p.id)));
    setTotalCount(prev => Math.max(0, prev - photoIds.length));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
    setHasMore(false);
    setTotalCount(0);
    cursorRef.current = undefined;
  }, []);

  useEffect(() => {
    loadInitial();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadInitial]);

  return {
    photos,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    updatePhoto,
    removePhoto,
    removePhotos,
    clearPhotos,
  };
}
