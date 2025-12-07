import { useEffect, useRef, useState, RefObject } from "react";
import { sampleColorFromSource } from "@/lib/canvas-utils";
import { getDefaultColorForScheme } from "@/components/reticles";
import { CAMERA } from "@/lib/constants";
import type { ColorScheme, ReticlePosition } from "@shared/schema";

interface UseColorSamplingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  autoColor: boolean;
  reticleSize: number;
  colorScheme: ColorScheme;
  reticlePosition?: ReticlePosition;
}

export function useColorSampling({
  videoRef,
  enabled,
  autoColor,
  reticleSize,
  colorScheme,
  reticlePosition,
}: UseColorSamplingOptions): string {
  const defaultColor = getDefaultColorForScheme(colorScheme);
  const [sampledColor, setSampledColor] = useState<string>(defaultColor);
  const previousColorRef = useRef<string>(defaultColor);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (!enabled || !autoColor) {
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      ctxRef.current = canvasRef.current.getContext("2d", { willReadFrequently: true });
    }
    
    let animationId: number;
    let lastUpdate = 0;
    
    const sampleColor = (timestamp: number) => {
      if (timestamp - lastUpdate < CAMERA.COLOR_SAMPLE_INTERVAL_MS) {
        animationId = requestAnimationFrame(sampleColor);
        return;
      }
      lastUpdate = timestamp;
      
      const position = reticlePosition ?? { x: 50, y: 50 };
      const result = sampleColorFromSource({
        source: video,
        position,
        reticleSize,
        colorScheme: colorScheme || "tactical",
        canvas: canvasRef.current ?? undefined,
        ctx: ctxRef.current ?? undefined,
      });
      
      if (result && result.color !== previousColorRef.current) {
        previousColorRef.current = result.color;
        setSampledColor(result.color);
      }
      
      animationId = requestAnimationFrame(sampleColor);
    };
    
    animationId = requestAnimationFrame(sampleColor);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [videoRef, enabled, autoColor, reticleSize, colorScheme, reticlePosition]);

  return autoColor ? sampledColor : defaultColor;
}
