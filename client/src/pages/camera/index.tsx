import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useCaptureSound } from "@/hooks/use-capture-sound";
import { useStabilization } from "@/hooks/use-stabilization";
import { useSettings } from "@/lib/settings-context";
import { usePrivacy } from "@/lib/privacy-context";
import { getContrastingColor } from "@/components/reticles";
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
import { CAMERA } from "@/lib/constants";
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
  const [reticleColor, setReticleColor] = useState<string>(CAMERA.DEFAULT_RETICLE_COLOR);
  const colorSamplingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousColorRef = useRef<string>(CAMERA.DEFAULT_RETICLE_COLOR);
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

  useEffect(() => {
    if (!isReady || !settings.reticle.autoColor || !settings.reticle.enabled) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    const canvas = colorSamplingCanvasRef.current || document.createElement("canvas");
    colorSamplingCanvasRef.current = canvas;
    
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    let animationId: number;
    let lastUpdate = 0;
    
    const sampleColor = (timestamp: number) => {
      if (timestamp - lastUpdate < CAMERA.COLOR_SAMPLE_INTERVAL_MS) {
        animationId = requestAnimationFrame(sampleColor);
        return;
      }
      lastUpdate = timestamp;
      
      if (video.readyState >= 2) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const minDimension = Math.min(videoWidth, videoHeight);
        
        const sizePercent = settings.reticle.size || CAMERA.DEFAULT_RETICLE_SIZE;
        const reticleSize = Math.ceil(minDimension * (sizePercent / 100));
        
        const sampleSize = Math.min(reticleSize, CAMERA.COLOR_SAMPLE_MAX_SIZE);
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        const sourceX = (videoWidth - reticleSize) / 2;
        const sourceY = (videoHeight - reticleSize) / 2;
        
        try {
          ctx.drawImage(
            video,
            sourceX, sourceY, reticleSize, reticleSize,
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
          
          const colorScheme = settings.reticle.colorScheme || "tactical";
          const newColor = getContrastingColor(r, g, b, colorScheme);
          if (newColor !== previousColorRef.current) {
            previousColorRef.current = newColor;
            setReticleColor(newColor);
          }
        } catch {
          // Ignore canvas security errors
        }
      }
      
      animationId = requestAnimationFrame(sampleColor);
    };
    
    animationId = requestAnimationFrame(sampleColor);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isReady, settings.reticle.autoColor, settings.reticle.enabled, settings.reticle.size, settings.reticle.colorScheme, videoRef]);

  const accuracyBlocked = useMemo(() => {
    if (!settings.gpsEnabled) return false;
    if (geoData.accuracy == null) return true;
    return geoData.accuracy > (settings.accuracyLimit || 20);
  }, [settings.gpsEnabled, settings.accuracyLimit, geoData.accuracy]);

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
      if (settings.stabilization?.enabled) {
        await waitForStability();
      }

      if (settings.soundEnabled) {
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
        reticleConfig: settings.reticle,
        reticleColor: reticleColor,
        watermarkScale: settings.watermarkScale || 100,
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
        enhancementSettings: {
          enabled: settings.enhancement?.enabled ?? false,
          sharpness: settings.enhancement?.sharpness ?? 0,
          denoise: settings.enhancement?.denoise ?? 0,
          contrast: settings.enhancement?.contrast ?? 0,
        },
        imgbbSettings: {
          autoUpload: settings.imgbb?.autoUpload ?? false,
          isValidated: settings.imgbb?.isValidated ?? false,
          apiKey: settings.imgbb?.apiKey ?? "",
          expiration: settings.imgbb?.expiration ?? 0,
        },
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
  }, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, currentNote, reticleColor, settings.reticle, settings.imgbb, settings.soundEnabled, settings.watermarkScale, settings.stabilization, settings.enhancement, playCapture, waitForStability, t, handlePhotoSaved, handleCloudUpload, handleProcessingError, handleProcessingComplete]);

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
