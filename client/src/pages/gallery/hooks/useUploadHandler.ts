import { useCallback, useRef, useMemo } from "react";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useI18n } from "@/lib/i18n";
import {
  validateUploadSettings,
  executePhotoUpload,
  getUploadToastMessage,
  type UploadSettings,
} from "@/lib/upload-helpers";
import type { PhotoWithThumbnail } from "@shared/schema";

interface UpdatePhotoFn {
  (photoId: string, updates: Partial<PhotoWithThumbnail>): void;
}

interface UseUploadHandlerOptions {
  onPhotoUpdated: UpdatePhotoFn;
  onUploadComplete?: () => Promise<void>;
}

export function useUploadHandler(options: UseUploadHandlerOptions) {
  const { onPhotoUpdated, onUploadComplete } = options;
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t } = useI18n();
  const { isUploading, progress: uploadProgress, startUpload, updateProgress, finishUpload } = useUploadProgress();
  
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

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
        onPhotoUpdated(photoId, { cloud: cloudData });
      });

      if (result.updatedPhotos.size > 0 && onUploadComplete) {
        await onUploadComplete();
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
  }, [uploadSettings, toast, t, startUpload, updateProgress, finishUpload, onPhotoUpdated, onUploadComplete]);

  const cleanup = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    handleUploadPhotos,
    handleCancelUpload,
    cleanup,
  };
}
