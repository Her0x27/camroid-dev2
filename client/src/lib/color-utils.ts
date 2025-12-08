export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseColor(color: string): RGB | null {
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }
  
  const rgbaMatch = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10)
    };
  }
  
  return null;
}

export function getLuminance(rgb: RGB): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

export function colorToRgba(color: string, alpha: number): string {
  const rgb = parseColor(color);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  return `rgba(34, 197, 94, ${alpha})`;
}

export function getOutlineColorForReticle(mainColor: string, opacity: number = 0.6): string {
  const rgb = parseColor(mainColor);
  if (!rgb) return `rgba(0,0,0,${opacity})`;
  
  const luminance = getLuminance(rgb);
  return luminance > 0.5 ? `rgba(0,0,0,${opacity})` : `rgba(255,255,255,${opacity})`;
}

export function getContrastingOutlineColor(mainColor: string, opacity: number): string {
  const rgb = parseColor(mainColor);
  if (rgb) {
    const luminance = getLuminance(rgb);
    return luminance > 0.5 ? `rgba(0,0,0,${opacity * 0.6})` : `rgba(255,255,255,${opacity * 0.6})`;
  }
  return `rgba(0,0,0,${opacity * 0.6})`;
}
