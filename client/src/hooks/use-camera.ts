import { useState, useRef, useCallback, useEffect } from "react";
import { drawWatermark, type WatermarkMetadata } from "@/lib/watermark-renderer";
import { logger } from "@/lib/logger";
import type { CameraResolution } from "@shared/schema";

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

export interface CameraCapabilities {
  torch: boolean;
  focusMode: string[];
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  
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
      };
      
      const fullCaps: CameraCapabilities = {
        torch: !!caps.torch,
        focusMode: caps.focusMode || [],
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

      // Determine resolution constraints based on cameraResolution setting
      const getResolutionConstraints = (): { width: MediaTrackConstraintSet["width"]; height: MediaTrackConstraintSet["height"] } => {
        switch (cameraResolution) {
          case "4k":
            return {
              width: { ideal: 3840, max: 3840 },
              height: { ideal: 2160, max: 2160 },
            };
          case "1080p":
            return {
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
            };
          case "720p":
            return {
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
            };
          case "480p":
            return {
              width: { ideal: 640, max: 640 },
              height: { ideal: 480, max: 480 },
            };
          case "auto":
          default:
            // Use device maximum capabilities
            return {
              width: { ideal: 4096 },
              height: { ideal: 2160 },
            };
        }
      };

      const resolutionConstraints = getResolutionConstraints();
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
    drawWatermark(ctx, canvas.width, canvas.height, metadata);

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
      drawWatermark(thumbCtx, thumbCanvas.width, thumbCanvas.height, metadata);
    }

    const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.7);

    return { imageData, thumbnailData };
  }, [isReady]);

  const captureFromImage = useCallback(async (
    imageSource: string,
    metadata?: PhotoMetadata,
    quality?: number
  ): Promise<CaptureResult | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0, img.width, img.height);
        drawWatermark(ctx, canvas.width, canvas.height, metadata);

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
          drawWatermark(thumbCtx, thumbCanvas.width, thumbCanvas.height, metadata);
        }

        const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.7);

        resolve({ imageData, thumbnailData });
      };
      
      img.onerror = () => {
        logger.error("Failed to load image for capture");
        resolve(null);
      };
      
      img.src = imageSource;
    });
  }, [photoQuality]);

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
