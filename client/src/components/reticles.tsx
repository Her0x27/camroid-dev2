import { memo, useMemo } from "react";
import type { ReticleConfig, ColorScheme, ReticlePosition } from "@shared/schema";
import { getOutlineColorForReticle } from "@/lib/color-utils";

interface ReticleProps {
  config: ReticleConfig;
  dynamicColor?: string;
  className?: string;
  position?: ReticlePosition | null;
}

export const Reticle = memo(function Reticle({ config, dynamicColor, className = "", position }: ReticleProps) {
  if (!config.enabled) return null;

  const sizePercent = config.size || 20;
  const strokeWidthPercent = config.strokeWidth || 3;

  const defaultColor = "#22c55e";
  const color = (config.autoColor && dynamicColor) ? dynamicColor : defaultColor;
  
  const outlineColor = getOutlineColorForReticle(color);

  const svgStyle = useMemo((): React.CSSProperties => ({
    opacity: config.opacity / 100,
    width: `${sizePercent}vmin`,
    height: `${sizePercent}vmin`,
  }), [config.opacity, sizePercent]);

  const svgStrokeWidth = strokeWidthPercent;
  const outlineStrokeWidth = strokeWidthPercent + 2;

  const hasCustomPosition = position && (position.x !== 50 || position.y !== 50);

  const containerStyle = useMemo((): React.CSSProperties => hasCustomPosition
    ? {
        position: "absolute" as const,
        left: `${position!.x}%`,
        top: `${position!.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 1,
        pointerEvents: "none" as const,
      }
    : {
        position: "absolute" as const,
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        pointerEvents: "none" as const,
      }, [hasCustomPosition, position?.x, position?.y]);

  const glowFilter = `drop-shadow(0 0 6px ${color}99) drop-shadow(0 0 12px ${color}66)`;

  return (
    <div 
      className={className}
      style={containerStyle}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          ...svgStyle,
          filter: glowFilter,
        }}
      >
        <line 
          x1="0" y1="50" x2="100" y2="50" 
          stroke={outlineColor} 
          strokeWidth={outlineStrokeWidth}
        />
        <line 
          x1="50" y1="0" x2="50" y2="100" 
          stroke={outlineColor} 
          strokeWidth={outlineStrokeWidth}
        />
        
        <line 
          x1="0" y1="50" x2="100" y2="50" 
          stroke={color} 
          strokeWidth={svgStrokeWidth}
        />
        <line 
          x1="50" y1="0" x2="50" y2="100" 
          stroke={color} 
          strokeWidth={svgStrokeWidth}
        />
      </svg>
    </div>
  );
});

const COLOR_SCHEMES: Record<ColorScheme, {
  light: string[];
  dark: string[];
  mid: string[];
}> = {
  contrast: {
    light: ["#ff00ff", "#ff0066", "#cc00ff"],
    dark: ["#00ffff", "#00ff99", "#66ffff"],
    mid: ["#ff6600", "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0066"],
  },
  tactical: {
    light: ["#ff3300", "#ff6600", "#cc0000"],
    dark: ["#00ff00", "#33ff33", "#00cc00"],
    mid: ["#00ff00", "#ffff00", "#ff6600"],
  },
  neon: {
    light: ["#ff00ff", "#ff0099", "#9900ff"],
    dark: ["#00ffff", "#00ff66", "#66ff00"],
    mid: ["#ff00ff", "#00ffff", "#ffff00", "#ff0066", "#00ff99"],
  },
  monochrome: {
    light: ["#000000", "#333333", "#1a1a1a"],
    dark: ["#ffffff", "#cccccc", "#e6e6e6"],
    mid: ["#ffffff", "#000000", "#888888"],
  },
  warm: {
    light: ["#ff3300", "#cc0000", "#ff6600"],
    dark: ["#ffcc00", "#ffff00", "#ff9900"],
    mid: ["#ff6600", "#ff9900", "#ffcc00", "#ff3300"],
  },
};

export function getDefaultColorForScheme(scheme: ColorScheme = "tactical"): string {
  const palette = COLOR_SCHEMES[scheme] || COLOR_SCHEMES.tactical;
  return palette.dark[0];
}

export function getContrastingColor(r: number, g: number, b: number, scheme: ColorScheme = "tactical"): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const palette = COLOR_SCHEMES[scheme] || COLOR_SCHEMES.tactical;
  
  const colorSum = r + g + b;
  
  if (luminance > 0.7) {
    const index = colorSum % palette.light.length;
    return palette.light[index] || palette.light[0];
  } else if (luminance < 0.3) {
    const index = colorSum % palette.dark.length;
    return palette.dark[index] || palette.dark[0];
  } else {
    const hue = rgbToHue(r, g, b);
    const index = Math.floor((hue / 360) * palette.mid.length);
    return palette.mid[index] || palette.mid[0];
  }
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let hue = 0;
  
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  
  return hue;
}

