import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getPhotoIds, getPhoto } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Photo } from "@shared/schema";

interface UsePhotoNavigatorOptions {
  sortOrder?: "newest" | "oldest";
}

interface UsePhotoNavigatorReturn {
  photo: Photo | null;
  isLoading: boolean;
  error: string | null;
  currentIndex: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  refreshIds: () => Promise<void>;
}

export function usePhotoNavigator(
  photoId: string | undefined,
  options: UsePhotoNavigatorOptions = {}
): UsePhotoNavigatorReturn {
  const { sortOrder = "newest" } = options;
  const [, navigate] = useLocation();
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedPhotoIdRef = useRef<string | null>(null);

  const refreshIds = useCallback(async () => {
    try {
      const ids = await getPhotoIds(sortOrder);
      setPhotoIds(ids);
    } catch (err) {
      logger.error("Failed to refresh photo IDs", err);
    }
  }, [sortOrder]);

  const photoIdsRef = useRef<string[]>([]);
  photoIdsRef.current = photoIds;

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const loadData = async () => {
      if (!photoId) {
        setIsLoading(false);
        return;
      }

      if (loadedPhotoIdRef.current === photoId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentIds = photoIdsRef.current;
        const [loadedPhoto, ids] = await Promise.all([
          getPhoto(photoId),
          currentIds.length === 0 ? getPhotoIds(sortOrder) : Promise.resolve(currentIds),
        ]);

        if (signal.aborted) return;

        if (loadedPhoto) {
          setPhoto(loadedPhoto);
          loadedPhotoIdRef.current = photoId;
        } else {
          setPhoto(null);
          loadedPhotoIdRef.current = null;
          setError("Photo not found");
        }

        if (currentIds.length === 0) {
          setPhotoIds(ids);
        }
      } catch (err) {
        if (signal.aborted) return;
        
        const errorMessage = err instanceof Error ? err.message : "Failed to load photo";
        setError(errorMessage);
        logger.error("Failed to load photo", err);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [photoId, sortOrder]);

  const currentIndex = photoId ? photoIds.indexOf(photoId) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photoIds.length - 1;

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      navigate(`/photo/${photoIds[currentIndex - 1]}`);
    }
  }, [hasPrevious, photoIds, currentIndex, navigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      navigate(`/photo/${photoIds[currentIndex + 1]}`);
    }
  }, [hasNext, photoIds, currentIndex, navigate]);

  return {
    photo,
    isLoading,
    error,
    currentIndex,
    total: photoIds.length,
    hasPrevious,
    hasNext,
    goToPrevious,
    goToNext,
    refreshIds,
  };
}
