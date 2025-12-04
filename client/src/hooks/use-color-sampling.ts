import { useEffect, useRef, useState, RefObject } from "react";
import { getContrastingColor } from "@/components/reticles";
import { CAMERA } from "@/lib/constants";
import type { ColorScheme } from "@shared/schema";

interface UseColorSamplingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  autoColor: boolean;
  reticleSize: number;
  colorScheme: ColorScheme;
}

export function useColorSampling({
  videoRef,
  enabled,
  autoColor,
  reticleSize,
  colorScheme,
}: UseColorSamplingOptions): string {
  const [reticleColor, setReticleColor] = useState<string>(CAMERA.DEFAULT_RETICLE_COLOR);
  const colorSamplingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousColorRef = useRef<string>(CAMERA.DEFAULT_RETICLE_COLOR);

  useEffect(() => {
    if (!enabled || !autoColor) {
      if (previousColorRef.current !== CAMERA.DEFAULT_RETICLE_COLOR) {
        previousColorRef.current = CAMERA.DEFAULT_RETICLE_COLOR;
        setReticleColor(CAMERA.DEFAULT_RETICLE_COLOR);
      }
      return;
    }
    
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
        
        const sizePercent = reticleSize || CAMERA.DEFAULT_RETICLE_SIZE;
        const reticleSizePx = Math.ceil(minDimension * (sizePercent / 100));
        
        const sampleSize = Math.min(reticleSizePx, CAMERA.COLOR_SAMPLE_MAX_SIZE);
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        const sourceX = (videoWidth - reticleSizePx) / 2;
        const sourceY = (videoHeight - reticleSizePx) / 2;
        
        try {
          ctx.drawImage(
            video,
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
          
          const scheme = colorScheme || "tactical";
          const newColor = getContrastingColor(r, g, b, scheme);
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
  }, [videoRef, enabled, autoColor, reticleSize, colorScheme]);

  return reticleColor;
}
