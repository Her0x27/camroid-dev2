import { getContrastingColor } from "@/components/reticles";
import { CAMERA, IMAGE } from "./constants";
import type { ColorScheme, ReticlePosition } from "@shared/schema";

export interface CanvasSize {
  width: number;
  height: number;
}

export interface ImageLoadResult {
  image: HTMLImageElement;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<ImageLoadResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        image: img,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = src;
  });
}

export function createCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

export function drawImageToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLVideoElement,
  width: number,
  height: number
): void {
  ctx.drawImage(image, 0, 0, width, height);
}

export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number = IMAGE.JPEG_QUALITY_HIGH,
  type: string = "image/jpeg"
): string {
  return canvas.toDataURL(type, quality);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = IMAGE.JPEG_QUALITY_HIGH,
  type: string = "image/jpeg"
): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob || new Blob());
      },
      type,
      quality
    );
  });
}

export function calculateThumbnailSize(
  originalWidth: number,
  originalHeight: number,
  maxSize: number = IMAGE.THUMBNAIL_SIZE
): CanvasSize {
  const aspectRatio = originalWidth / originalHeight;

  if (aspectRatio > 1) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
}

export async function createThumbnailFromDataUrl(
  imageData: string,
  maxSize: number = IMAGE.THUMBNAIL_SIZE,
  quality: number = IMAGE.JPEG_QUALITY_LOW
): Promise<string> {
  try {
    const { image, width, height } = await loadImage(imageData);
    const thumbSize = calculateThumbnailSize(width, height, maxSize);
    const { canvas, ctx } = createCanvas(thumbSize.width, thumbSize.height);

    if (!ctx) {
      return imageData;
    }

    ctx.drawImage(image, 0, 0, thumbSize.width, thumbSize.height);
    return canvasToDataUrl(canvas, quality);
  } catch {
    return imageData;
  }
}

export async function createCleanBlob(
  base64Data: string,
  quality: number = IMAGE.JPEG_QUALITY_HIGH
): Promise<Blob> {
  try {
    const { image, width, height } = await loadImage(base64Data);
    const { canvas, ctx } = createCanvas(width, height);

    if (!ctx) {
      return new Blob();
    }

    ctx.drawImage(image, 0, 0);
    return canvasToBlob(canvas, quality);
  } catch {
    return new Blob();
  }
}

export function clampColorValue(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function getImageDataFromCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ImageData {
  return ctx.getImageData(0, 0, width, height);
}

export function putImageDataToCanvas(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData
): void {
  ctx.putImageData(imageData, 0, 0);
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export interface ColorSampleConfig {
  source: HTMLVideoElement | HTMLImageElement;
  position: ReticlePosition;
  reticleSize: number;
  colorScheme: ColorScheme;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
}

export interface ColorSampleResult {
  color: string;
  r: number;
  g: number;
  b: number;
}

function getSourceDimensions(source: HTMLVideoElement | HTMLImageElement): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  return { width: source.width, height: source.height };
}

function isSourceReady(source: HTMLVideoElement | HTMLImageElement): boolean {
  if (source instanceof HTMLVideoElement) {
    return source.readyState >= 2;
  }
  return source.complete && source.naturalWidth > 0;
}

export function sampleColorFromSource(config: ColorSampleConfig): ColorSampleResult | null {
  const { source, position, reticleSize, colorScheme, canvas: providedCanvas, ctx: providedCtx } = config;

  if (!isSourceReady(source)) {
    return null;
  }

  const { width, height } = getSourceDimensions(source);
  if (width === 0 || height === 0) {
    return null;
  }

  const minDimension = Math.min(width, height);
  const sizePercent = reticleSize || CAMERA.DEFAULT_RETICLE_SIZE;
  const reticleSizePx = Math.ceil(minDimension * (sizePercent / 100));
  const sampleSize = Math.min(reticleSizePx, CAMERA.COLOR_SAMPLE_MAX_SIZE);

  const canvas = providedCanvas || document.createElement("canvas");
  if (canvas.width !== sampleSize || canvas.height !== sampleSize) {
    canvas.width = sampleSize;
    canvas.height = sampleSize;
  }

  const ctx = providedCtx || canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  const sourceX = (width * position.x / 100) - (reticleSizePx / 2);
  const sourceY = (height * position.y / 100) - (reticleSizePx / 2);

  try {
    ctx.drawImage(
      source,
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
    const color = getContrastingColor(r, g, b, scheme);

    return { color, r, g, b };
  } catch {
    return null;
  }
}

export function sampleContrastingColor(
  source: HTMLVideoElement | HTMLImageElement,
  position: ReticlePosition,
  reticleSize: number,
  colorScheme: ColorScheme
): string {
  const result = sampleColorFromSource({
    source,
    position,
    reticleSize,
    colorScheme,
  });
  return result?.color ?? CAMERA.DEFAULT_RETICLE_COLOR;
}

export interface ObjectCoverTransformParams {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
}

export function convertScreenToVideoCoordinates(
  screenPosition: ReticlePosition,
  params: ObjectCoverTransformParams
): ReticlePosition {
  const { containerWidth, containerHeight, videoWidth, videoHeight } = params;
  
  if (containerWidth === 0 || containerHeight === 0 || videoWidth === 0 || videoHeight === 0) {
    return screenPosition;
  }
  
  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;
  
  let visibleVideoWidth: number;
  let visibleVideoHeight: number;
  let offsetX: number;
  let offsetY: number;
  
  if (videoAspect > containerAspect) {
    visibleVideoHeight = videoHeight;
    visibleVideoWidth = videoHeight * containerAspect;
    offsetX = (videoWidth - visibleVideoWidth) / 2;
    offsetY = 0;
  } else {
    visibleVideoWidth = videoWidth;
    visibleVideoHeight = videoWidth / containerAspect;
    offsetX = 0;
    offsetY = (videoHeight - visibleVideoHeight) / 2;
  }
  
  const videoX = offsetX + (screenPosition.x / 100) * visibleVideoWidth;
  const videoY = offsetY + (screenPosition.y / 100) * visibleVideoHeight;
  
  const videoPercentX = (videoX / videoWidth) * 100;
  const videoPercentY = (videoY / videoHeight) * 100;
  
  return {
    x: Math.max(0, Math.min(100, videoPercentX)),
    y: Math.max(0, Math.min(100, videoPercentY)),
  };
}

export function convertVideoToScreenCoordinates(
  videoPosition: ReticlePosition,
  params: ObjectCoverTransformParams
): ReticlePosition {
  const { containerWidth, containerHeight, videoWidth, videoHeight } = params;
  
  if (containerWidth === 0 || containerHeight === 0 || videoWidth === 0 || videoHeight === 0) {
    return videoPosition;
  }
  
  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;
  
  let visibleVideoWidth: number;
  let visibleVideoHeight: number;
  let offsetX: number;
  let offsetY: number;
  
  if (videoAspect > containerAspect) {
    visibleVideoHeight = videoHeight;
    visibleVideoWidth = videoHeight * containerAspect;
    offsetX = (videoWidth - visibleVideoWidth) / 2;
    offsetY = 0;
  } else {
    visibleVideoWidth = videoWidth;
    visibleVideoHeight = videoWidth / containerAspect;
    offsetX = 0;
    offsetY = (videoHeight - visibleVideoHeight) / 2;
  }
  
  const videoX = (videoPosition.x / 100) * videoWidth;
  const videoY = (videoPosition.y / 100) * videoHeight;
  
  const screenX = videoX - offsetX;
  const screenY = videoY - offsetY;
  
  const screenPercentX = (screenX / visibleVideoWidth) * 100;
  const screenPercentY = (screenY / visibleVideoHeight) * 100;
  
  return {
    x: Math.max(0, Math.min(100, screenPercentX)),
    y: Math.max(0, Math.min(100, screenPercentY)),
  };
}
