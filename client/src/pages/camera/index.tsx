import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useCaptureSound } from "@/hooks/use-capture-sound";
import { useStabilization } from "@/hooks/use-stabilization";
import { useColorSampling } from "@/hooks/use-color-sampling";
import { useCaptureController } from "@/hooks/use-capture-controller";
import { useAdjustmentMode } from "@/hooks/use-adjustment-mode";
import { useSettings } from "@/lib/settings-context";
import { usePrivacy } from "@/lib/privacy-context";
import { getPhotoCounts, getLatestPhoto } from "@/lib/db";
import {
  processCaptureDeferred,
  type PhotoData,
  type SavedPhotoResult,
  type CloudUploadResult,
  type CloudProviderUploadSettings,
} from "@/lib/capture-helpers";
import { sampleContrastingColor } from "@/lib/canvas-utils";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CameraControls, PhotoNoteDialog, CameraViewfinder } from "./components";
import { AppCapabilitiesDialog, useAppCapabilitiesDialog } from "@/components/app-capabilities-dialog";
import { CAMERA } from "@/lib/constants";
import { useLazyLoaderOptional, MODULE_NAMES } from "@/lib/lazy-loader-context";
import type { ReticlePosition } from "@shared/schema";

export default function CameraPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { settings, updateWatermarkPreview } = useSettings();
  const { settings: privacySettings, hideCamera, resetInactivityTimer } = usePrivacy();
  const { toast } = useToast();
  const loaderContext = useLazyLoaderOptional();
  
  const loadingStepsRef = useRef({
    init: false,
    gps: false,
    sensors: false,
    ready: false,
  });
  
  const [photoCount, setPhotoCount] = useState(0);
  const [cloudCount, setCloudCount] = useState(0);
  const [lastPhotoThumb, setLastPhotoThumb] = useState<string | null>(null);
  const [lastPhotoId, setLastPhotoId] = useState<string | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const noteInitializedRef = useRef(false);
  const { showDialog: showCapabilitiesDialog, closeDialog: closeCapabilitiesDialog } = useAppCapabilitiesDialog();
  
  useEffect(() => {
    if (!noteInitializedRef.current && settings.watermarkPreview?.note) {
      setCurrentNote(settings.watermarkPreview.note);
      noteInitializedRef.current = true;
    }
  }, [settings.watermarkPreview?.note]);
  
  const {
    isCapturing,
    isProcessing,
    startCapture,
    captureSuccess,
    captureFailed,
    processingComplete,
    getAbortSignal,
  } = useCaptureController();

  const {
    videoRef,
    canvasRef,
    isReady,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    capturePhoto,
    captureFromImage,
  } = useCamera({ 
    facingMode: settings.cameraFacing, 
    photoQuality: settings.photoQuality,
    cameraResolution: settings.cameraResolution,
  });

  const { data: geoData, error: geoError, isLoading: geoLoading } = useGeolocation(settings.gpsEnabled);

  const {
    data: orientationData,
    isSupported: orientationSupported,
    requestPermission: requestOrientationPermission,
    error: orientationError,
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

  const [adjustmentActive, setAdjustmentActive] = useState(false);

  const reticleColor = useColorSampling({
    videoRef,
    enabled: isReady && settings.reticle.enabled && !adjustmentActive,
    autoColor: settings.reticle.autoColor,
    reticleSize: settings.reticle.size,
    colorScheme: settings.reticle.colorScheme || "tactical",
    reticlePosition: undefined,
  });

  const {
    adjustmentMode,
    adjustmentReticleColor,
    activateAdjustment,
    updatePosition,
    confirmAdjustment,
    cancelAdjustment,
  } = useAdjustmentMode({
    videoRef,
    reticleSize: settings.reticle.size,
    colorScheme: settings.reticle.colorScheme || "tactical",
    autoColor: settings.reticle.autoColor,
    currentReticleColor: reticleColor,
  });

  useEffect(() => {
    setAdjustmentActive(adjustmentMode.active);
  }, [adjustmentMode.active]);

  useEffect(() => {
    if (!loaderContext) return;
    
    const gpsReady = !settings.gpsEnabled || geoData.latitude !== null || geoError !== null || !geoLoading;
    const sensorsReady = !settings.orientationEnabled || !orientationSupported || orientationData.heading !== null || orientationError !== null;
    const galleryLoaded = loaderContext.modules.find(m => m.name === MODULE_NAMES.gallery)?.loaded ?? false;
    const settingsLoaded = loaderContext.modules.find(m => m.name === MODULE_NAMES.settings)?.loaded ?? false;
    
    const LOADING_STEPS = [
      { key: "init" as const, moduleName: MODULE_NAMES.init, isReady: true },
      { key: "gps" as const, moduleName: MODULE_NAMES.gps, isReady: gpsReady },
      { key: "sensors" as const, moduleName: MODULE_NAMES.sensors, isReady: sensorsReady },
      { key: "ready" as const, moduleName: MODULE_NAMES.ready, isReady: gpsReady && sensorsReady && galleryLoaded && settingsLoaded },
    ];
    
    for (const step of LOADING_STEPS) {
      if (!loadingStepsRef.current[step.key] && step.isReady) {
        loadingStepsRef.current[step.key] = true;
        loaderContext.markModuleLoaded(step.moduleName);
      }
    }
  }, [
    loaderContext,
    loaderContext?.modules,
    settings.gpsEnabled,
    settings.orientationEnabled,
    geoData.latitude,
    geoError,
    geoLoading,
    orientationData.heading,
    orientationError,
    orientationSupported,
  ]);

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
    if (!showCapabilitiesDialog) {
      startCamera();
    }
  }, [startCamera, showCapabilitiesDialog]);

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

  const cloudUploadSettings = useMemo((): CloudProviderUploadSettings => {
    const providerId = settings.cloud?.selectedProvider || "imgbb";
    if (providerId === "imgbb") {
      return {
        autoUpload: settings.imgbb?.autoUpload ?? false,
        providerId,
        settings: {
          isValidated: settings.imgbb?.isValidated ?? false,
          apiKey: settings.imgbb?.apiKey ?? "",
          expiration: settings.imgbb?.expiration ?? 0,
          autoUpload: settings.imgbb?.autoUpload ?? false,
        },
      };
    }
    // For non-ImgBB providers, use saved settings from cloud.providers
    // Preserve saved validation state - don't override with { isValidated: false }
    const savedProviderSettings = settings.cloud?.providers?.[providerId];
    const providerSettings = savedProviderSettings ?? { isValidated: false };
    const autoUploadValue = typeof providerSettings.autoUpload === 'boolean' 
      ? providerSettings.autoUpload 
      : false;
    return {
      autoUpload: autoUploadValue,
      providerId,
      settings: providerSettings,
    };
  }, [settings.cloud, settings.imgbb]);

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
    watermarkPreview: settings.watermarkPreview,
  }), [
    settings.reticle,
    settings.watermarkScale,
    settings.soundEnabled,
    settings.stabilization,
    settings.enhancement,
    settings.watermarkPreview,
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
    captureFailed();
  }, [captureFailed]);

  const handleProcessingCompleteCallback = useCallback(() => {
    processingComplete();
  }, [processingComplete]);

  const handleCaptureWithPosition = useCallback(async (position?: ReticlePosition, customReticleColor?: string) => {
    if (!isReady || isCapturing || accuracyBlocked) return;

    const signal = getAbortSignal();
    startCapture();
    const timestamp = Date.now();
    const noteText = currentNote.trim();

    try {
      if (!position && captureConfig.stabilization.enabled) {
        await waitForStability();
      }

      if (captureConfig.soundEnabled) {
        playCapture();
      }

      const wp = captureConfig.watermarkPreview;
      const result = await capturePhoto({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        altitude: geoData.altitude,
        accuracy: geoData.accuracy,
        heading: orientationData.heading,
        tilt: orientationData.tilt,
        note: noteText || wp?.note || undefined,
        timestamp,
        reticleConfig: captureConfig.reticle,
        reticleColor: customReticleColor || reticleColor,
        watermarkScale: captureConfig.watermarkScale,
        reticlePosition: position,
        // Watermark preview settings
        showCoordinates: wp?.showCoordinates,
        showGyroscope: wp?.showGyroscope,
        showNote: wp?.showNote,
        showTimestamp: wp?.showTimestamp,
        coordinateFormat: wp?.coordinateFormat,
        fontFamily: wp?.fontFamily,
        textAlign: wp?.textAlign,
        bold: wp?.bold,
        italic: wp?.italic,
        underline: wp?.underline,
        backgroundColor: wp?.backgroundColor,
        backgroundOpacity: wp?.backgroundOpacity,
        fontColor: wp?.fontColor,
        fontOpacity: wp?.fontOpacity,
        fontSize: wp?.fontSize,
        width: wp?.width,
        height: wp?.height,
        autoSize: wp?.autoSize,
        rotation: wp?.rotation,
        positionX: wp?.positionX,
        positionY: wp?.positionY,
        logoUrl: wp?.logoUrl,
        logoPosition: wp?.logoPosition,
        logoSize: wp?.logoSize,
        logoOpacity: wp?.logoOpacity,
        notePlacement: wp?.notePlacement,
        separators: wp?.separators,
      });

      if (!result) {
        throw new Error(t.camera.failedToCapture);
      }

      setLastPhotoThumb(result.thumbnailData);
      captureSuccess();

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
        note: noteText || wp?.note || undefined,
        timestamp,
      };

      processCaptureDeferred({
        result,
        photoData,
        enhancementSettings: captureConfig.enhancement,
        cloudSettings: cloudUploadSettings,
        isOnline: navigator.onLine,
        onPhotoSaved: handlePhotoSaved,
        onCloudUpload: handleCloudUpload,
        onError: handleProcessingError,
        onComplete: handleProcessingCompleteCallback,
        signal,
      });
    } catch (error) {
      logger.error("Photo capture failed", error);
      captureFailed();
    }
  }, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, currentNote, reticleColor, captureConfig, cloudUploadSettings, playCapture, waitForStability, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, handleProcessingCompleteCallback, getAbortSignal, startCapture, captureSuccess, captureFailed]);

  const handleCapture = useCallback(async () => {
    await handleCaptureWithPosition();
  }, [handleCaptureWithPosition]);

  const sampleColorFromVideo = useCallback((position: ReticlePosition): string => {
    const video = videoRef.current;
    if (!video) return CAMERA.DEFAULT_RETICLE_COLOR;
    
    return sampleContrastingColor(
      video,
      position,
      settings.reticle.size || CAMERA.DEFAULT_RETICLE_SIZE,
      settings.reticle.colorScheme || "tactical"
    );
  }, [videoRef, settings.reticle.size, settings.reticle.colorScheme]);

  const handleLongPressCapture = useCallback((position: ReticlePosition) => {
    if (settings.reticle.manualAdjustment) {
      activateAdjustment(position);
    } else {
      const colorAtPosition = settings.reticle.autoColor 
        ? sampleColorFromVideo(position) 
        : reticleColor;
      handleCaptureWithPosition(position, colorAtPosition);
    }
  }, [handleCaptureWithPosition, settings.reticle.manualAdjustment, settings.reticle.autoColor, activateAdjustment, sampleColorFromVideo, reticleColor]);

  const handleCaptureFromFrozenFrame = useCallback(async (
    frozenFrame: string,
    position: ReticlePosition,
    customReticleColor: string
  ) => {
    if (!isReady || isCapturing || accuracyBlocked) return;

    const signal = getAbortSignal();
    startCapture();
    const timestamp = Date.now();
    const noteText = currentNote.trim();

    const wp = captureConfig.watermarkPreview;
    
    try {
      if (captureConfig.soundEnabled) {
        playCapture();
      }

      const result = await captureFromImage(frozenFrame, {
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        altitude: geoData.altitude,
        accuracy: geoData.accuracy,
        heading: orientationData.heading,
        tilt: orientationData.tilt,
        note: noteText || wp?.note || undefined,
        timestamp,
        reticleConfig: captureConfig.reticle,
        reticleColor: customReticleColor,
        watermarkScale: captureConfig.watermarkScale,
        reticlePosition: position,
      });

      if (!result) {
        throw new Error(t.camera.failedToCapture);
      }

      setLastPhotoThumb(result.thumbnailData);
      captureSuccess();

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
        note: noteText || wp?.note || undefined,
        timestamp,
      };

      processCaptureDeferred({
        result,
        photoData,
        enhancementSettings: captureConfig.enhancement,
        cloudSettings: cloudUploadSettings,
        isOnline: navigator.onLine,
        onPhotoSaved: handlePhotoSaved,
        onCloudUpload: handleCloudUpload,
        onError: handleProcessingError,
        onComplete: handleProcessingCompleteCallback,
        signal,
      });
    } catch (error) {
      logger.error("Photo capture from frozen frame failed", error);
      captureFailed();
    }
  }, [isReady, isCapturing, accuracyBlocked, captureFromImage, geoData, orientationData, currentNote, captureConfig, cloudUploadSettings, playCapture, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, handleProcessingCompleteCallback, getAbortSignal, startCapture, captureSuccess, captureFailed]);

  const handleAdjustmentConfirm = useCallback(() => {
    const result = confirmAdjustment();
    if (result) {
      handleCaptureFromFrozenFrame(result.frozenFrame, result.position, result.color);
    }
  }, [confirmAdjustment, handleCaptureFromFrozenFrame]);

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
  
  const handleOpenNote = useCallback(() => {
    const wpNote = settings.watermarkPreview?.note || "";
    if (!currentNote && wpNote) {
      setCurrentNote(wpNote);
    }
    setShowNoteDialog(true);
  }, [currentNote, settings.watermarkPreview?.note]);

  const handleNoteDialogChange = useCallback((open: boolean) => {
    setShowNoteDialog(open);
    if (!open) {
      updateWatermarkPreview({ note: currentNote });
    }
  }, [currentNote, updateWatermarkPreview]);

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
        reticleColor={adjustmentMode.active ? adjustmentReticleColor : reticleColor}
        orientationData={orientationData}
        showMaskButton={privacySettings.enabled && !adjustmentMode.active}
        onMask={handleMask}
        note={currentNote || undefined}
        showLevelIndicator={settings.showLevelIndicator && !adjustmentMode.active}
        stabilizationEnabled={settings.stabilization?.enabled && !adjustmentMode.active}
        stability={stability}
        isStable={isStable}
        onLongPressCapture={handleLongPressCapture}
        adjustmentMode={adjustmentMode.active}
        frozenFrame={adjustmentMode.frozenFrame}
        adjustmentPosition={adjustmentMode.position}
        onAdjustmentPositionChange={updatePosition}
        onAdjustmentConfirm={handleAdjustmentConfirm}
        onAdjustmentCancel={cancelAdjustment}
        showPlaceholder={showCapabilitiesDialog}
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
        onOpenChange={handleNoteDialogChange}
        note={currentNote}
        onNoteChange={setCurrentNote}
      />

      {showCapabilitiesDialog && (
        <AppCapabilitiesDialog onClose={closeCapabilitiesDialog} />
      )}
    </div>
  );
}
