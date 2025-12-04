const IMAGE_CONSTANTS = {
  CONTRAST_CENTER: 128,
};

function clampColorValue(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getBlurredPixel(original, width, x, y, radius) {
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

function getWeightedPixel(original, width, x, y, radius, centerR, centerG, centerB, threshold) {
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

function applyUnsharpMask(data, width, height, strength) {
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

function applyDenoise(data, width, height, strength) {
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

function applyContrast(data, strength) {
  const factor = 1 + (strength / 100) * 0.5;
  const center = IMAGE_CONSTANTS.CONTRAST_CENTER;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampColorValue((data[i] - center) * factor + center);
    data[i + 1] = clampColorValue((data[i + 1] - center) * factor + center);
    data[i + 2] = clampColorValue((data[i + 2] - center) * factor + center);
  }
}

function processImage(imageData, options) {
  const { data, width, height } = imageData;
  
  if (options.denoise > 0) {
    applyDenoise(data, width, height, options.denoise);
  }

  if (options.sharpness > 0) {
    applyUnsharpMask(data, width, height, options.sharpness);
  }

  if (options.contrast > 0) {
    applyContrast(data, options.contrast);
  }
  
  return imageData;
}

self.onmessage = function(e) {
  const { type, payload, id } = e.data;
  
  if (type === 'ENHANCE_IMAGE') {
    try {
      const { imageData, options } = payload;
      const result = processImage(imageData, options);
      self.postMessage({ type: 'ENHANCE_RESULT', id, payload: result });
    } catch (error) {
      self.postMessage({ type: 'ENHANCE_ERROR', id, error: error.message });
    }
  }
};
