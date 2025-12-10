import { useState, useEffect, useRef, useCallback } from "react";
import { usePageVisibility } from "./use-page-visibility";

interface StabilizationState {
  isStable: boolean;
  stability: number;
  isAnalyzing: boolean;
}

interface UseStabilizationOptions {
  enabled: boolean;
  threshold: number;
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface UseStabilizationReturn extends StabilizationState {
  waitForStability: () => Promise<boolean>;
}

export function useStabilization({
  enabled,
  threshold,
  videoRef,
}: UseStabilizationOptions): UseStabilizationReturn {
  const [state, setState] = useState<StabilizationState>({
    isStable: false,
    stability: 0,
    isAnalyzing: false,
  });

  const { isVisible } = usePageVisibility();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const stabilityHistoryRef = useRef<number[]>([]);

  const calculateFrameDifference = useCallback((current: ImageData, previous: ImageData): number => {
    const data1 = current.data;
    const data2 = previous.data;
    let totalDiff = 0;
    const pixelCount = data1.length / 4;

    for (let i = 0; i < data1.length; i += 16) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      totalDiff += (rDiff + gDiff + bDiff) / 3;
    }

    const avgDiff = totalDiff / (pixelCount / 4);
    const stability = Math.max(0, Math.min(100, 100 - avgDiff * 2));
    return stability;
  }, []);

  const calculateSharpness = useCallback((imageData: ImageData): number => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let laplacianSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const topIdx = ((y - 1) * width + x) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;

        const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
        const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;

        const laplacian = Math.abs(4 * gray - topGray - bottomGray - leftGray - rightGray);
        laplacianSum += laplacian;
        count++;
      }
    }

    return count > 0 ? laplacianSum / count : 0;
  }, []);

  useEffect(() => {
    if (!enabled || !videoRef.current || !isVisible) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (!enabled) {
        setState({ isStable: false, stability: 0, isAnalyzing: false });
      }
      return;
    }

    const video = videoRef.current;
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 64;
      canvasRef.current.height = 64;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setState(prev => ({ ...prev, isAnalyzing: true }));

    let lastUpdate = 0;
    const updateInterval = 100;

    const analyze = (timestamp: number) => {
      if (timestamp - lastUpdate < updateInterval) {
        animationIdRef.current = requestAnimationFrame(analyze);
        return;
      }
      lastUpdate = timestamp;

      if (video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, 64, 64);
          const currentFrame = ctx.getImageData(0, 0, 64, 64);

          let stability = 50;

          if (prevFrameRef.current) {
            const motionStability = calculateFrameDifference(currentFrame, prevFrameRef.current);
            const sharpness = calculateSharpness(currentFrame);
            const normalizedSharpness = Math.min(100, sharpness / 2);
            
            stability = motionStability * 0.7 + normalizedSharpness * 0.3;
          }

          prevFrameRef.current = currentFrame;

          stabilityHistoryRef.current.push(stability);
          if (stabilityHistoryRef.current.length > 5) {
            stabilityHistoryRef.current.shift();
          }

          const avgStability = stabilityHistoryRef.current.reduce((a, b) => a + b, 0) / 
            stabilityHistoryRef.current.length;

          const roundedStability = Math.round(avgStability);
          const isStable = roundedStability >= threshold;

          setState({
            isStable,
            stability: roundedStability,
            isAnalyzing: true,
          });
        } catch {
          // Ignore errors
        }
      }

      animationIdRef.current = requestAnimationFrame(analyze);
    };

    animationIdRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      setState({ isStable: false, stability: 0, isAnalyzing: false });
      prevFrameRef.current = null;
      stabilityHistoryRef.current = [];
    };
  }, [enabled, threshold, videoRef, isVisible, calculateFrameDifference, calculateSharpness]);

  const waitForStability = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!enabled) {
        resolve(true);
        return;
      }

      if (state.isStable) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(state.stability >= threshold * 0.7);
      }, 2000);

      const checkInterval = setInterval(() => {
        if (state.isStable) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
      }, 2000);
    });
  }, [enabled, state.isStable, state.stability, threshold]);

  return {
    ...state,
    waitForStability,
  };
}
