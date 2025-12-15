import { useState, useRef, useCallback, useEffect } from "react";
import { drawWatermarkAsync, type WatermarkMetadata } from "@/lib/watermark-renderer";
import { logger } from "@/lib/logger";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import type { CameraResolution } from "@shared/schema";

// Standard 16:9 resolutions
const STANDARD_16x9_RESOLUTIONS: Array<{ label: string; value: CameraResolution; width: number; height: number }> = [
  { label: "4K (3840×2160)", value: "4k", width: 3840, height: 2160 },
  { label: "Full HD (1920×1080)", value: "1080p", width: 1920, height: 1080 },
  { label: "HD (1280×720)", value: "720p", width: 1280, height: 720 },
  { label: "SD (640×360)", value: "480p", width: 640, height: 360 },
];

export async function queryCameraResolutions(facingMode: "user" | "environment" = "environment"): Promise<SupportedResolution[]> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 4096 }, height: { ideal: 2160 } },
      audio: false,
    });
    
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      stream.getTracks().forEach(t => t.stop());
      return getDefaultResolutions();
    }
    
    const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & {
      width?: { min?: number; max?: number };
      height?: { min?: number; max?: number };
    };
    
    const maxWidth = caps.width?.max || 1920;
    const maxHeight = caps.height?.max || 1080;
    
    // Stop the stream immediately after getting capabilities
    stream.getTracks().forEach(t => t.stop());
    
    const supportedResolutions: SupportedResolution[] = STANDARD_16x9_RESOLUTIONS
      .filter(res => res.width <= maxWidth && res.height <= maxHeight)
      .map(res => ({
        ...res,
        aspectRatio: "16:9",
      }));
    
    // Add "auto" option at the beginning
    supportedResolutions.unshift({
      label: `Auto (${maxWidth}×${maxHeight})`,
      value: "auto" as CameraResolution,
      width: maxWidth,
      height: maxHeight,
      aspectRatio: Math.abs(maxWidth / maxHeight - 16/9) < 0.1 ? "16:9" : 
                   Math.abs(maxWidth / maxHeight - 4/3) < 0.1 ? "4:3" : "other",
    });
    
    return supportedResolutions;
  } catch (e) {
    logger.warn("Failed to query camera resolutions", e);
    return getDefaultResolutions();
  }
}

function getDefaultResolutions(): SupportedResolution[] {
  return [
    { label: "Auto", value: "auto", width: 1920, height: 1080, aspectRatio: "16:9" },
    ...STANDARD_16x9_RESOLUTIONS.map(res => ({ ...res, aspectRatio: "16:9" as const })),
  ];
}

const RESOLUTION_CONSTRAINTS: Record<CameraResolution, { width: MediaTrackConstraintSet["width"]; height: MediaTrackConstraintSet["height"] }> = {
  "4k": {
    width: { ideal: 3840, max: 3840 },
    height: { ideal: 2160, max: 2160 },
  },
  "1080p": {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
  },
  "720p": {
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
  },
  "480p": {
    width: { ideal: 640, max: 640 },
    height: { ideal: 480, max: 480 },
  },
  auto: {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
  },
};

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  photoQuality?: number;
  cameraResolution?: CameraResolution;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface SupportedResolution {
  label: string;
  value: CameraResolution;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface CameraCapabilities {
  torch: boolean;
  focusMode: string[];
  supportedResolutions: SupportedResolution[];
}

type PhotoMetadata = WatermarkMetadata;

export interface CaptureResult {
  imageData: string;
  thumbnailData: string;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: (metadata?: PhotoMetadata) => Promise<CaptureResult | null>;
  captureFromImage: (imageSource: string, metadata?: PhotoMetadata, quality?: number) => Promise<CaptureResult | null>;
  switchCamera: () => Promise<void>;
  currentFacing: "user" | "environment";
  availableCameras: CameraDevice[];
  enumerateCameras: () => Promise<CameraDevice[]>;
  selectCamera: (deviceId: string) => Promise<void>;
  capabilities: CameraCapabilities | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode: initialFacing = "environment", photoQuality = 90, cameraResolution = "auto" } = options;
  
  const { isVisible } = usePageVisibility();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const wasActiveBeforeHiddenRef = useRef(false);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacing, setCurrentFacing] = useState<"user" | "environment">(initialFacing);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    videoTrackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
    setCapabilities(null);
  }, []);

  const extractCapabilities = useCallback((track: MediaStreamTrack) => {
    try {
      const caps = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
        focusMode?: string[];
        width?: { min?: number; max?: number };
        height?: { min?: number; max?: number };
      };
      
      // Define standard 16:9 resolutions to check
      const standard16x9Resolutions: Array<{ label: string; value: CameraResolution; width: number; height: number }> = [
        { label: "4K (3840×2160)", value: "4k", width: 3840, height: 2160 },
        { label: "Full HD (1920×1080)", value: "1080p", width: 1920, height: 1080 },
        { label: "HD (1280×720)", value: "720p", width: 1280, height: 720 },
        { label: "SD (640×360)", value: "480p", width: 640, height: 360 },
      ];
      
      // Check which resolutions are supported by the camera
      const maxWidth = caps.width?.max || 1920;
      const maxHeight = caps.height?.max || 1080;
      
      const supportedResolutions: SupportedResolution[] = standard16x9Resolutions
        .filter(res => res.width <= maxWidth && res.height <= maxHeight)
        .map(res => ({
          ...res,
          aspectRatio: "16:9",
        }));
      
      // Always add "auto" option at the beginning
      supportedResolutions.unshift({
        label: `Auto (${maxWidth}×${maxHeight})`,
        value: "auto" as CameraResolution,
        width: maxWidth,
        height: maxHeight,
        aspectRatio: Math.abs(maxWidth / maxHeight - 16/9) < 0.1 ? "16:9" : 
                     Math.abs(maxWidth / maxHeight - 4/3) < 0.1 ? "4:3" : "other",
      });
      
      const fullCaps: CameraCapabilities = {
        torch: !!caps.torch,
        focusMode: caps.focusMode || [],
        supportedResolutions,
      };
      setCapabilities(fullCaps);
    } catch (e) {
      logger.warn("Failed to get camera capabilities", e);
      setCapabilities(null);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      stopCamera();

      const resolutionConstraints = RESOLUTION_CONSTRAINTS[cameraResolution] || RESOLUTION_CONSTRAINTS.auto;
      const videoConstraints: MediaTrackConstraints & { zoom?: boolean } = {
        ...resolutionConstraints,
      };
      
      // Use specific device if selected, otherwise use facingMode
      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else {
        videoConstraints.facingMode = currentFacing;
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Get video track and extract capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrackRef.current = videoTrack;
        extractCapabilities(videoTrack);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setIsReady(true);
        } catch (playErr) {
          if (playErr instanceof Error && playErr.name === "AbortError") {
            return;
          }
          throw playErr;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "";
      const errorName = err instanceof Error ? err.name : "";
      
      if (errorMessage.includes("Permission denied") || errorName === "NotAllowedError") {
        setError("CAMERA_ACCESS_DENIED");
      } else if (errorName === "NotFoundError" || errorMessage.includes("DevicesNotFoundError")) {
        setError("CAMERA_NOT_FOUND");
      } else if (errorMessage.includes("Requested device not found") || errorName === "OverconstrainedError") {
        setError("REQUESTED_DEVICE_NOT_FOUND");
      } else {
        setError("CAMERA_UNKNOWN_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentFacing, selectedDeviceId, stopCamera, extractCapabilities, cameraResolution]);

  const switchCamera = useCallback(async () => {
    const newFacing = currentFacing === "environment" ? "user" : "environment";
    setCurrentFacing(newFacing);
    setSelectedDeviceId(null);
  }, [currentFacing]);

  const enumerateCameras = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId,
        }));
      setAvailableCameras(videoDevices);
      return videoDevices;
    } catch (e) {
      logger.warn("Failed to enumerate cameras", e);
      return [];
    }
  }, []);

  const selectCamera = useCallback(async (deviceId: string): Promise<void> => {
    setSelectedDeviceId(deviceId);
  }, []);

  // Restart camera when facing or device selection changes
  // Note: Using ref to track if camera was ever active to avoid dependency on changing state
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (isReady || isLoading) {
      wasActiveRef.current = true;
    }
  }, [isReady, isLoading]);
  
  useEffect(() => {
    if (wasActiveRef.current) {
      startCamera().catch((err) => {
        logger.error("Failed to restart camera", err);
      });
    }
  }, [currentFacing, selectedDeviceId, startCamera]);
  
  // Enumerate cameras on mount
  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  const capturePhoto = useCallback(async (metadata?: PhotoMetadata): Promise<{ imageData: string; thumbnailData: string } | null> => {
    if (!videoRef.current || !canvasRef.current || !isReady) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    await drawWatermarkAsync(ctx, canvas.width, canvas.height, metadata);

    const imageData = canvas.toDataURL("image/jpeg", photoQuality / 100);

    const thumbCanvas = document.createElement("canvas");
    const thumbCtx = thumbCanvas.getContext("2d");
    const thumbSize = 300;
    const aspectRatio = videoWidth / videoHeight;
    
    if (aspectRatio > 1) {
      thumbCanvas.width = thumbSize;
      thumbCanvas.height = thumbSize / aspectRatio;
    } else {
      thumbCanvas.height = thumbSize;
      thumbCanvas.width = thumbSize * aspectRatio;
    }

    if (thumbCtx) {
      thumbCtx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, thumbCanvas.width, thumbCanvas.height);
      await drawWatermarkAsync(thumbCtx, thumbCanvas.width, thumbCanvas.height, metadata);
    }

    const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.7);

    return { imageData, thumbnailData };
  }, [isReady]);

  const captureFromImage = useCallback(async (
    imageSource: string,
    metadata?: PhotoMetadata,
    quality?: number
  ): Promise<CaptureResult | null> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            resolve(null);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0, img.width, img.height);
          await drawWatermarkAsync(ctx, canvas.width, canvas.height, metadata);

          const finalQuality = quality ?? photoQuality;
          const imageData = canvas.toDataURL("image/jpeg", finalQuality / 100);

          const thumbCanvas = document.createElement("canvas");
          const thumbCtx = thumbCanvas.getContext("2d");
          const thumbSize = 300;
          const aspectRatio = img.width / img.height;
          
          if (aspectRatio > 1) {
            thumbCanvas.width = thumbSize;
            thumbCanvas.height = thumbSize / aspectRatio;
          } else {
            thumbCanvas.height = thumbSize;
            thumbCanvas.width = thumbSize * aspectRatio;
          }

          if (thumbCtx) {
            thumbCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, thumbCanvas.width, thumbCanvas.height);
            await drawWatermarkAsync(thumbCtx, thumbCanvas.width, thumbCanvas.height, metadata);
          }

          const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.7);

          resolve({ imageData, thumbnailData });
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        logger.error("Failed to load image for capture");
        resolve(null);
      };
      
      img.src = imageSource;
    });
  }, [photoQuality]);

  // Handle visibility change - stop camera when tab/window is hidden
  useEffect(() => {
    if (!isVisible) {
      // Page became hidden - save state and stop camera
      if (isReady && streamRef.current) {
        wasActiveBeforeHiddenRef.current = true;
        stopCamera();
        logger.info("Camera stopped due to visibility change");
      }
    } else {
      // Page became visible - restart camera if it was active before
      if (wasActiveBeforeHiddenRef.current && !isLoading) {
        wasActiveBeforeHiddenRef.current = false;
        startCamera().catch((err) => {
          logger.error("Failed to restart camera after visibility change", err);
        });
        logger.info("Camera restarted after visibility change");
      }
    }
  }, [isVisible, isReady, isLoading, stopCamera, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isReady,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    captureFromImage,
    switchCamera,
    currentFacing,
    availableCameras,
    enumerateCameras,
    selectCamera,
    capabilities,
  };
}
