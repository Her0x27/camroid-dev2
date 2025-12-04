import { IMAGE } from "./constants";

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
