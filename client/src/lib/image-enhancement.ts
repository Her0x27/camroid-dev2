import {
  loadImage,
  createCanvas,
  canvasToDataUrl,
  clampColorValue,
  calculateThumbnailSize,
} from "./canvas-utils";
import { IMAGE } from "./constants";
import { logger } from "./logger";
import {
  isWorkerAvailable,
  enhanceImageWithWorker,
} from "./image-worker-client";

export interface EnhancementOptions {
  sharpness: number; // 0-100
  denoise: number; // 0-100
  contrast: number; // 0-100
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface WeightedRGB extends RGB {
  weightSum: number;
}

function getBlurredPixel(
  original: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  radius: number
): RGB {
  let blurR = 0, blurG = 0, blurB = 0;
  let count = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nIdx = ((y + dy) * width + (x + dx)) * 4;
      blurR += original[nIdx];
      blurG += original[nIdx + 1];
      blurB += original[nIdx + 2];
      count++;
    }
  }
  
  return {
    r: blurR / count,
    g: blurG / count,
    b: blurB / count,
  };
}

function getWeightedPixel(
  original: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  radius: number,
  centerR: number,
  centerG: number,
  centerB: number,
  threshold: number
): WeightedRGB {
  let sumR = 0, sumG = 0, sumB = 0;
  let weightSum = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nIdx = ((y + dy) * width + (x + dx)) * 4;
      const nR = original[nIdx];
      const nG = original[nIdx + 1];
      const nB = original[nIdx + 2];
      
      const colorDist = Math.sqrt(
        (nR - centerR) ** 2 + 
        (nG - centerG) ** 2 + 
        (nB - centerB) ** 2
      );
      
      const weight = colorDist < threshold ? 1 : Math.exp(-colorDist / threshold);
      
      sumR += nR * weight;
      sumG += nG * weight;
      sumB += nB * weight;
      weightSum += weight;
    }
  }
  
  return { r: sumR, g: sumG, b: sumB, weightSum };
}

async function enhanceWithWorker(
  imgDataObj: ImageData,
  options: EnhancementOptions
): Promise<ImageData> {
  try {
    const enhanced = await enhanceImageWithWorker(imgDataObj, options);
    logger.debug("Image enhanced with Web Worker");
    return enhanced;
  } catch (error) {
    logger.warn("Worker enhancement failed, falling back to main thread", error);
    return enhanceOnMainThread(imgDataObj, options);
  }
}

function enhanceOnMainThread(imgDataObj: ImageData, options: EnhancementOptions): ImageData {
  if (options.denoise > 0) {
    applyDenoise(imgDataObj, options.denoise);
  }

  if (options.sharpness > 0) {
    applyUnsharpMask(imgDataObj, options.sharpness);
  }

  if (options.contrast > 0) {
    applyContrast(imgDataObj, options.contrast);
  }
  
  return imgDataObj;
}

export async function enhanceImage(
  imageData: string,
  options: EnhancementOptions
): Promise<string> {
  try {
    const { image, width, height } = await loadImage(imageData);
    const { canvas, ctx } = createCanvas(width, height);

    if (!ctx) {
      return imageData;
    }

    ctx.drawImage(image, 0, 0);

    const imgDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let processedData: ImageData;
    
    if (isWorkerAvailable()) {
      processedData = await enhanceWithWorker(imgDataObj, options);
    } else {
      processedData = enhanceOnMainThread(imgDataObj, options);
    }

    ctx.putImageData(processedData, 0, 0);

    return canvasToDataUrl(canvas, 0.95);
  } catch {
    return imageData;
  }
}

function applyUnsharpMask(imageData: ImageData, strength: number): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const amount = (strength / 100) * 1.5;
  const radius = 1;
  
  const original = new Uint8ClampedArray(data);
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      const blur = getBlurredPixel(original, width, x, y, radius);
      
      data[idx] = clampColorValue(original[idx] + (original[idx] - blur.r) * amount);
      data[idx + 1] = clampColorValue(original[idx + 1] + (original[idx + 1] - blur.g) * amount);
      data[idx + 2] = clampColorValue(original[idx + 2] + (original[idx + 2] - blur.b) * amount);
    }
  }
}

function applyDenoise(imageData: ImageData, strength: number): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const radius = strength > 50 ? 2 : 1;
  const threshold = (strength / 100) * 30;
  
  const original = new Uint8ClampedArray(data);
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      const centerR = original[idx];
      const centerG = original[idx + 1];
      const centerB = original[idx + 2];
      
      const weighted = getWeightedPixel(original, width, x, y, radius, centerR, centerG, centerB, threshold);
      
      if (weighted.weightSum > 0) {
        data[idx] = clampColorValue(weighted.r / weighted.weightSum);
        data[idx + 1] = clampColorValue(weighted.g / weighted.weightSum);
        data[idx + 2] = clampColorValue(weighted.b / weighted.weightSum);
      }
    }
  }
}

function applyContrast(imageData: ImageData, strength: number): void {
  const data = imageData.data;
  const factor = 1 + (strength / 100) * 0.5;
  const center = IMAGE.CONTRAST_CENTER;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampColorValue((data[i] - center) * factor + center);
    data[i + 1] = clampColorValue((data[i + 1] - center) * factor + center);
    data[i + 2] = clampColorValue((data[i + 2] - center) * factor + center);
  }
}

export async function createThumbnail(
  imageData: string,
  maxSize: number = 200
): Promise<string> {
  try {
    const { image, width, height } = await loadImage(imageData);
    const thumbSize = calculateThumbnailSize(width, height, maxSize);
    const { canvas, ctx } = createCanvas(thumbSize.width, thumbSize.height);

    if (!ctx) {
      return imageData;
    }

    ctx.drawImage(image, 0, 0, thumbSize.width, thumbSize.height);
    return canvasToDataUrl(canvas, IMAGE.JPEG_QUALITY_MEDIUM);
  } catch {
    return imageData;
  }
}
