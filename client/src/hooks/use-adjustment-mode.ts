import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { sampleContrastingColor } from "@/lib/canvas-utils";
import { CAMERA } from "@/lib/constants";
import type { ColorScheme, ReticlePosition } from "@shared/schema";

export interface AdjustmentModeState {
  active: boolean;
  frozenFrame: string | null;
  position: ReticlePosition;
}

interface UseAdjustmentModeOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  reticleSize: number;
  colorScheme: ColorScheme;
  autoColor: boolean;
  currentReticleColor: string;
}

interface UseAdjustmentModeResult {
  adjustmentMode: AdjustmentModeState;
  adjustmentReticleColor: string;
  activateAdjustment: (position: ReticlePosition) => string | null;
  updatePosition: (position: ReticlePosition) => void;
  confirmAdjustment: () => { frozenFrame: string; position: ReticlePosition; color: string } | null;
  cancelAdjustment: () => void;
}

const defaultPosition: ReticlePosition = { x: 50, y: 50 };

const defaultState: AdjustmentModeState = {
  active: false,
  frozenFrame: null,
  position: defaultPosition,
};

export function useAdjustmentMode({
  videoRef,
  reticleSize,
  colorScheme,
  autoColor,
  currentReticleColor,
}: UseAdjustmentModeOptions): UseAdjustmentModeResult {
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentModeState>(defaultState);
  const [sampledColor, setSampledColor] = useState<string | null>(null);
  
  const adjustmentReticleColor = autoColor && sampledColor ? sampledColor : currentReticleColor;
  
  const frozenImageRef = useRef<HTMLImageElement | null>(null);
  const latestPositionRef = useRef<ReticlePosition>(defaultPosition);
  const pendingSampleRef = useRef<boolean>(false);

  const captureFrameForAdjustment = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, [videoRef]);

  const sampleColorFromImage = useCallback((img: HTMLImageElement) => {
    const position = latestPositionRef.current;
    
    const newColor = sampleContrastingColor(
      img,
      position,
      reticleSize || CAMERA.DEFAULT_RETICLE_SIZE,
      colorScheme || "tactical"
    );
    setSampledColor(newColor);
  }, [reticleSize, colorScheme]);

  const activateAdjustment = useCallback((position: ReticlePosition): string | null => {
    const frozenFrame = captureFrameForAdjustment();
    if (frozenFrame) {
      latestPositionRef.current = position;
      setAdjustmentMode({
        active: true,
        frozenFrame,
        position,
      });
    }
    return frozenFrame;
  }, [captureFrameForAdjustment]);

  const updatePosition = useCallback((position: ReticlePosition) => {
    latestPositionRef.current = position;
    setAdjustmentMode(prev => ({ ...prev, position }));
  }, []);

  const confirmAdjustment = useCallback(() => {
    if (!adjustmentMode.frozenFrame) return null;
    
    const result = {
      frozenFrame: adjustmentMode.frozenFrame,
      position: adjustmentMode.position,
      color: adjustmentReticleColor,
    };
    
    setAdjustmentMode(defaultState);
    setSampledColor(null);
    return result;
  }, [adjustmentMode.frozenFrame, adjustmentMode.position, adjustmentReticleColor]);

  const cancelAdjustment = useCallback(() => {
    setAdjustmentMode(defaultState);
    setSampledColor(null);
    frozenImageRef.current = null;
    pendingSampleRef.current = false;
  }, []);

  useEffect(() => {
    if (!adjustmentMode.active || !adjustmentMode.frozenFrame || !autoColor) {
      return;
    }

    const imageSrc = adjustmentMode.frozenFrame;
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
  }, [adjustmentMode.active, adjustmentMode.frozenFrame, adjustmentMode.position, autoColor, sampleColorFromImage]);

  return {
    adjustmentMode,
    adjustmentReticleColor,
    activateAdjustment,
    updatePosition,
    confirmAdjustment,
    cancelAdjustment,
  };
}
