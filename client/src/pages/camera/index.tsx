import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useCaptureSound } from "@/hooks/use-capture-sound";
import { useStabilization } from "@/hooks/use-stabilization";
import { useColorSampling } from "@/hooks/use-color-sampling";
import { useCaptureController } from "@/hooks/use-capture-controller";
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
import { getContrastingColor } from "@/components/reticles";
import { CAMERA } from "@/lib/constants";
import type { ReticlePosition } from "@shared/schema";

interface AdjustmentMode {
  active: boolean;
  frozenFrame: string | null;
  position: ReticlePosition;
}

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
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>({
    active: false,
    frozenFrame: null,
    position: { x: 50, y: 50 },
  });
  const [adjustmentReticleColor, setAdjustmentReticleColor] = useState<string>(CAMERA.DEFAULT_RETICLE_COLOR);
  const frozenCanvasRef = useRef<HTMLCanvasElement>(null);
  const frozenImageRef = useRef<HTMLImageElement | null>(null);
  const latestAdjustmentPositionRef = useRef<ReticlePosition>({ x: 50, y: 50 });
  const latestReticleSizeRef = useRef<number>(CAMERA.DEFAULT_RETICLE_SIZE);
  const pendingSampleRef = useRef<boolean>(false);
  
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
    enabled: isReady && settings.reticle.enabled && !adjustmentMode.active,
    autoColor: settings.reticle.autoColor,
    reticleSize: settings.reticle.size,
    colorScheme: settings.reticle.colorScheme || "tactical",
    reticlePosition: adjustmentMode.active ? adjustmentMode.position : undefined,
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
        reticleColor: customReticleColor || reticleColor,
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
        onComplete: handleProcessingCompleteCallback,
        signal,
      });
    } catch (error) {
      logger.error("Photo capture failed", error);
      captureFailed();
    }
  }, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, currentNote, reticleColor, captureConfig, playCapture, waitForStability, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, handleProcessingCompleteCallback, getAbortSignal, startCapture, captureSuccess, captureFailed]);

  const handleCapture = useCallback(async () => {
    await handleCaptureWithPosition();
  }, [handleCaptureWithPosition]);

  const captureFrameForAdjustment = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [videoRef]);

  const sampleColorFromImage = useCallback((img: HTMLImageElement) => {
    const position = latestAdjustmentPositionRef.current;
    const reticleSize = latestReticleSizeRef.current;
    
    const canvas = document.createElement('canvas');
    const minDimension = Math.min(img.width, img.height);
    const sizePercent = reticleSize || CAMERA.DEFAULT_RETICLE_SIZE;
    const reticleSizePx = Math.ceil(minDimension * (sizePercent / 100));
    const sampleSize = Math.min(reticleSizePx, CAMERA.COLOR_SAMPLE_MAX_SIZE);
    
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const sourceX = (img.width * position.x / 100) - (reticleSizePx / 2);
    const sourceY = (img.height * position.y / 100) - (reticleSizePx / 2);
    
    try {
      ctx.drawImage(
        img,
        sourceX, sourceY, reticleSizePx, reticleSizePx,
        0, 0, sampleSize, sampleSize
      );
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0;
      const pixelCount = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);
      
      const scheme = settings.reticle.colorScheme || "tactical";
      const newColor = getContrastingColor(r, g, b, scheme);
      setAdjustmentReticleColor(newColor);
    } catch {
      // Ignore canvas security errors
    }
  }, [settings.reticle.colorScheme]);

  const sampleColorFromFrozenFrame = useCallback((
    imageSrc: string,
    position: ReticlePosition,
    reticleSize: number
  ) => {
    latestAdjustmentPositionRef.current = position;
    latestReticleSizeRef.current = reticleSize;
    
    const img = frozenImageRef.current || new Image();
    frozenImageRef.current = img;
    
    if (img.src !== imageSrc) {
      pendingSampleRef.current = true;
      img.onload = () => {
        if (pendingSampleRef.current) {
          pendingSampleRef.current = false;
          sampleColorFromImage(img);
        }
      };
      img.src = imageSrc;
    } else if (img.complete) {
      sampleColorFromImage(img);
    } else {
      pendingSampleRef.current = true;
    }
  }, [sampleColorFromImage]);

  useEffect(() => {
    if (adjustmentMode.active && adjustmentMode.frozenFrame && settings.reticle.autoColor) {
      sampleColorFromFrozenFrame(
        adjustmentMode.frozenFrame,
        adjustmentMode.position,
        settings.reticle.size
      );
    }
  }, [adjustmentMode.active, adjustmentMode.frozenFrame, adjustmentMode.position, settings.reticle.autoColor, settings.reticle.size, sampleColorFromFrozenFrame]);

  const handleLongPressCapture = useCallback((position: ReticlePosition) => {
    if (settings.reticle.manualAdjustment) {
      const frozenFrame = captureFrameForAdjustment();
      if (frozenFrame) {
        setAdjustmentMode({
          active: true,
          frozenFrame,
          position,
        });
      }
    } else {
      handleCaptureWithPosition(position);
    }
  }, [handleCaptureWithPosition, settings.reticle.manualAdjustment, captureFrameForAdjustment]);

  const handleAdjustmentPositionChange = useCallback((position: ReticlePosition) => {
    setAdjustmentMode(prev => ({ ...prev, position }));
  }, []);

  const handleAdjustmentConfirm = useCallback(() => {
    handleCaptureWithPosition(adjustmentMode.position, adjustmentReticleColor);
    setAdjustmentMode({ active: false, frozenFrame: null, position: { x: 50, y: 50 } });
  }, [handleCaptureWithPosition, adjustmentMode.position, adjustmentReticleColor]);

  const handleAdjustmentCancel = useCallback(() => {
    setAdjustmentMode({ active: false, frozenFrame: null, position: { x: 50, y: 50 } });
  }, []);

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
        onAdjustmentPositionChange={handleAdjustmentPositionChange}
        onAdjustmentConfirm={handleAdjustmentConfirm}
        onAdjustmentCancel={handleAdjustmentCancel}
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
