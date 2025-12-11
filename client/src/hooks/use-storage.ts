import { useState, useEffect, useCallback, useRef } from "react";
import { getStorageEstimate, getPhotoCount, clearAllPhotos } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface StorageInfo {
  used: number;
  quota: number;
  photos: number;
}

export interface UseStorageResult {
  storageInfo: StorageInfo | null;
  isLoading: boolean;
  isSupported: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clearStorage: () => Promise<boolean>;
}

export function useStorage(): UseStorageResult {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const mountedRef = useRef(true);

  const loadStorageInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [estimate, count] = await Promise.all([
        getStorageEstimate(),
        getPhotoCount(),
      ]);

      if (!mountedRef.current) return;

      if (estimate) {
        setStorageInfo({
          used: estimate.used,
          quota: estimate.quota,
          photos: count,
        });
        setIsSupported(true);
      } else {
        setStorageInfo({
          used: 0,
          quota: 0,
          photos: count,
        });
        setIsSupported(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error("Failed to load storage info");
      setError(error);
      logger.error("Failed to load storage info", err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearStorage = useCallback(async (): Promise<boolean> => {
    try {
      await clearAllPhotos();
      if (!mountedRef.current) return false;
      setStorageInfo((prev) => prev ? { ...prev, photos: 0, used: 0 } : null);
      return true;
    } catch (err) {
      if (!mountedRef.current) return false;
      const error = err instanceof Error ? err : new Error("Failed to clear storage");
      setError(error);
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadStorageInfo();
    
    return () => {
      mountedRef.current = false;
    };
  }, [loadStorageInfo]);

  return {
    storageInfo,
    isLoading,
    isSupported,
    error,
    refresh: loadStorageInfo,
    clearStorage,
  };
}
