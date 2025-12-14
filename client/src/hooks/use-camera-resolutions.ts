import { useState, useEffect, useCallback } from "react";
import { queryCameraResolutions, type SupportedResolution } from "./use-camera";
import { logger } from "@/lib/logger";

interface UseCameraResolutionsReturn {
  resolutions: SupportedResolution[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCameraResolutions(facingMode: "user" | "environment" = "environment"): UseCameraResolutionsReturn {
  const [resolutions, setResolutions] = useState<SupportedResolution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryCameraResolutions(facingMode);
      setResolutions(result);
    } catch (e) {
      logger.error("Failed to get camera resolutions", e);
      setError("Не удалось получить разрешения камеры");
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    resolutions,
    isLoading,
    error,
    refresh,
  };
}
