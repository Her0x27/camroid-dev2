import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useCaptureSound } from "@/hooks/use-capture-sound";
import { useStabilization } from "@/hooks/use-stabilization";
import { useColorSampling } from "@/hooks/use-color-sampling";
import { useSettings } from "@/lib/settings-context";
import { usePrivacy } from "@/lib/privacy-context";
import { getPhotoCounts, getLatestPhoto } from "@/lib/db";
import {
  processCaptureDeferred,
  type PhotoData,
  type SavedPhotoResult,
  type CloudUploadResult,
} from "@/lib/capture-helpers";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CameraControls, PhotoNoteDialog, CameraViewfinder } from "./components";

export default function CameraPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { settings } = useSettings();
  const { settings: privacySettings, hideCamera, resetInactivityTimer } = usePrivacy();
  const { toast } = useToast();
  
  const [photoCount, setPhotoCount] = useState(0);
  const [cloudCount, setCloudCount] = useState(0);
  const [lastPhotoThumb, setLastPhotoThumb] = useState<string | null>(null);
  const [lastPhotoId, setLastPhotoId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const processingAbortRef = useRef<AbortController | null>(null);

  const {
    videoRef,
    canvasRef,
    isReady,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    capturePhoto,
  } = useCamera({ 
    facingMode: settings.cameraFacing, 
    photoQuality: settings.photoQuality,
    cameraResolution: settings.cameraResolution,
  });

  const { data: geoData } = useGeolocation(settings.gpsEnabled);

  const {
    data: orientationData,
    isSupported: orientationSupported,
    requestPermission: requestOrientationPermission,
  } = useOrientation(settings.orientationEnabled);

  const { playCapture } = useCaptureSound();

  const {
    isStable,
    stability,
    waitForStability,
  } = useStabilization({
    enabled: settings.stabilization?.enabled ?? false,
    threshold: settings.stabilization?.threshold ?? 60,
    videoRef,
  });

  const reticleColor = useColorSampling({
    videoRef,
    enabled: isReady && settings.reticle.enabled,
    autoColor: settings.reticle.autoColor,
    reticleSize: settings.reticle.size,
    colorScheme: settings.reticle.colorScheme || "tactical",
  });

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const [counts, latest] = await Promise.all([
          getPhotoCounts(),
          getLatestPhoto(),
        ]);
        
        setPhotoCount(counts.total);
        setCloudCount(counts.cloud);
        
        if (latest) {
          setLastPhotoThumb(latest.thumbnailData);
          setLastPhotoId(latest.id);
        }
      } catch (error) {
        logger.error("Failed to load photos", error);
      }
    };
    loadPhotos();
  }, []);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    return () => {
      processingAbortRef.current?.abort();
    };
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    if (settings.orientationEnabled && orientationSupported) {
      try {
        await requestOrientationPermission();
      } catch (error) {
        logger.error("Failed to request orientation permission", error);
      }
    }
  }, [settings.orientationEnabled, orientationSupported, requestOrientationPermission]);

  const handleMask = useCallback(() => {
    hideCamera();
  }, [hideCamera]);

  useEffect(() => {
    if (privacySettings.enabled) {
      resetInactivityTimer();
    }
  }, [privacySettings.enabled, resetInactivityTimer]);

  const accuracyBlocked = useMemo(() => {
    if (!settings.gpsEnabled) return false;
    if (geoData.accuracy == null) return true;
    return geoData.accuracy > (settings.accuracyLimit || 20);
  }, [settings.gpsEnabled, settings.accuracyLimit, geoData.accuracy]);

  const captureConfig = useMemo(() => ({
    reticle: settings.reticle,
    watermarkScale: settings.watermarkScale || 100,
    soundEnabled: settings.soundEnabled,
    stabilization: {
      enabled: settings.stabilization?.enabled ?? false,
      threshold: settings.stabilization?.threshold ?? 60,
    },
    enhancement: {
      enabled: settings.enhancement?.enabled ?? false,
      sharpness: settings.enhancement?.sharpness ?? 0,
      denoise: settings.enhancement?.denoise ?? 0,
      contrast: settings.enhancement?.contrast ?? 0,
    },
    imgbb: {
      autoUpload: settings.imgbb?.autoUpload ?? false,
      isValidated: settings.imgbb?.isValidated ?? false,
      apiKey: settings.imgbb?.apiKey ?? "",
      expiration: settings.imgbb?.expiration ?? 0,
    },
  }), [
    settings.reticle,
    settings.watermarkScale,
    settings.soundEnabled,
    settings.stabilization,
    settings.enhancement,
    settings.imgbb,
  ]);

  const handlePhotoSaved = useCallback((result: SavedPhotoResult) => {
    setPhotoCount((prev) => prev + 1);
    setLastPhotoThumb(result.thumbnailData);
    setLastPhotoId(result.id);
  }, []);

  const handleCloudUpload = useCallback((result: CloudUploadResult) => {
    if (result.error === "offline") {
      toast({ title: t.camera.offline, description: t.camera.willUploadWhenOnline });
    } else if (result.uploaded) {
      setCloudCount((prev) => prev + 1);
      toast({ title: t.camera.uploaded, description: t.camera.photoUploaded });
    } else if (result.error) {
      toast({
        title: t.camera.uploadFailed,
        description: t.camera.cloudUploadFailed,
        variant: "destructive",
      });
    }
  }, [toast, t]);

  const handleProcessingError = useCallback((error: Error) => {
    logger.error("Photo processing failed", error);
  }, []);

  const handleProcessingComplete = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const handleCapture = useCallback(async () => {
    if (!isReady || isCapturing || accuracyBlocked) return;

    processingAbortRef.current?.abort();
    processingAbortRef.current = new AbortController();
    const signal = processingAbortRef.current.signal;

    setIsCapturing(true);
    const timestamp = Date.now();
    const noteText = currentNote.trim();

    try {
      if (captureConfig.stabilization.enabled) {
        await waitForStability();
      }

      if (captureConfig.soundEnabled) {
        playCapture();
      }

      const result = await capturePhoto({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        altitude: geoData.altitude,
        accuracy: geoData.accuracy,
        heading: orientationData.heading,
        tilt: orientationData.tilt,
        note: noteText || undefined,
        timestamp,
        reticleConfig: captureConfig.reticle,
        reticleColor: reticleColor,
        watermarkScale: captureConfig.watermarkScale,
      });

      if (!result) {
        throw new Error(t.camera.failedToCapture);
      }

      setLastPhotoThumb(result.thumbnailData);
      setIsCapturing(false);
      setIsProcessing(true);

      const photoData: PhotoData = {
        geoData: {
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          altitude: geoData.altitude,
          accuracy: geoData.accuracy,
        },
        orientationData: {
          heading: orientationData.heading,
          tilt: orientationData.tilt,
        },
        note: noteText || undefined,
        timestamp,
      };

      processCaptureDeferred({
        result,
        photoData,
        enhancementSettings: captureConfig.enhancement,
        imgbbSettings: captureConfig.imgbb,
        isOnline: navigator.onLine,
        onPhotoSaved: handlePhotoSaved,
        onCloudUpload: handleCloudUpload,
        onError: handleProcessingError,
        onComplete: handleProcessingComplete,
        signal,
      });
    } catch (error) {
      logger.error("Photo capture failed", error);
      setIsCapturing(false);
    }
  }, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, currentNote, reticleColor, captureConfig, playCapture, waitForStability, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, handleProcessingComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLButtonElement
        ) {
          return;
        }
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCapture]);

  const handleNavigateGallery = useCallback(() => {
    if (lastPhotoId) {
      navigate(`/photo/${lastPhotoId}`);
    } else {
      navigate("/gallery");
    }
  }, [navigate, lastPhotoId]);
  const handleNavigateSettings = useCallback(() => navigate("/settings"), [navigate]);
  const handleOpenNote = useCallback(() => setShowNoteDialog(true), []);

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      onClick={handleRequestPermissions}
    >
      <CameraViewfinder
        videoRef={videoRef}
        canvasRef={canvasRef}
        isReady={isReady}
        isLoading={cameraLoading}
        error={cameraError}
        onRetry={startCamera}
        reticleConfig={settings.reticle}
        reticleColor={reticleColor}
        orientationData={orientationData}
        showMaskButton={privacySettings.enabled}
        onMask={handleMask}
        note={currentNote || undefined}
        showLevelIndicator={settings.showLevelIndicator}
        stabilizationEnabled={settings.stabilization?.enabled}
        stability={stability}
        isStable={isStable}
      />

      <CameraControls
        onCapture={handleCapture}
        onNavigateGallery={handleNavigateGallery}
        onNavigateSettings={handleNavigateSettings}
        onOpenNote={handleOpenNote}
        isReady={isReady}
        isCapturing={isCapturing}
        isProcessing={isProcessing}
        accuracyBlocked={accuracyBlocked}
        accuracy={geoData.accuracy}
        hasNote={currentNote.length > 0}
        lastPhotoThumb={lastPhotoThumb}
        photoCount={photoCount}
        cloudCount={cloudCount}
      />

      <PhotoNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        note={currentNote}
        onNoteChange={setCurrentNote}
      />
    </div>
  );
}
