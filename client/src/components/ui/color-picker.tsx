import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Slider } from "./slider";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  className?: string;
  showHexInput?: boolean;
}

const PRESET_COLORS = [
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ffffff",
  "#000000",
  "#6b7280",
];

interface HSV {
  h: number;
  s: number;
  v: number;
}

function hexToHsv(hex: string): HSV {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 100, v: 100 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToHex(h: number, s: number, v: number): string {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hueToHex(h: number): string {
  return hsvToHex(h, 100, 100);
}

export function ColorPicker({
  value,
  onChange,
  opacity,
  onOpacityChange,
  className,
  showHexInput = false,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hexInput, setHexInput] = React.useState(value);
  const [externalHexInput, setExternalHexInput] = React.useState(value);
  const hsv = React.useMemo(() => hexToHsv(value), [value]);
  const gradientRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    setHexInput(value);
    setExternalHexInput(value);
  }, [value]);

  const handleExternalHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setExternalHexInput(val);

    if (!val.startsWith("#")) {
      val = "#" + val;
    }

    if (/^#[a-fA-F0-9]{6}$/.test(val)) {
      onChange(val.toLowerCase());
    }
  };

  const handleExternalHexBlur = () => {
    setExternalHexInput(value);
  };

  const handleGradientInteraction = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!gradientRef.current) return;

      const rect = gradientRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

      const s = (x / rect.width) * 100;
      const v = 100 - (y / rect.height) * 100;

      onChange(hsvToHex(hsv.h, s, v));
    },
    [hsv.h, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleGradientInteraction(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleGradientInteraction(e);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      handleGradientInteraction(e);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, handleGradientInteraction]);

  const handleHueChange = (values: number[]) => {
    onChange(hsvToHex(values[0], hsv.s, hsv.v));
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setHexInput(val);

    if (!val.startsWith("#")) {
      val = "#" + val;
    }

    if (/^#[a-fA-F0-9]{6}$/.test(val)) {
      onChange(val.toLowerCase());
    }
  };

  const handleHexBlur = () => {
    setHexInput(value);
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setHexInput(color);
  };

  const cursorX = (hsv.s / 100) * 100;
  const cursorY = 100 - (hsv.v / 100) * 100;

  return (
    <div className={cn("flex items-center gap-2", showHexInput && "flex-1")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-10 h-10 p-1 rounded-lg shrink-0", className)}
          >
            <div
              className="w-full h-full rounded-md border border-border"
              style={{
                backgroundColor: value,
                opacity: opacity !== undefined ? opacity : 1,
              }}
            />
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div
            ref={gradientRef}
            className="relative w-full h-32 rounded-md cursor-crosshair touch-none select-none"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueToHex(hsv.h)})`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full shadow-md pointer-events-none"
              style={{
                left: `${cursorX}%`,
                top: `${cursorY}%`,
                backgroundColor: value,
              }}
            />
          </div>

          <div className="space-y-1">
            <div
              className="w-full h-3 rounded-md"
              style={{
                background:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
            />
            <Slider
              value={[hsv.h]}
              min={0}
              max={360}
              step={1}
              onValueChange={handleHueChange}
              className="[&>span:first-child]:h-2 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
            />
          </div>

          {onOpacityChange && opacity !== undefined && (
            <div className="space-y-1">
              <div
                className="w-full h-3 rounded-md"
                style={{
                  background: `linear-gradient(to right, transparent, ${value}), repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px`,
                }}
              />
              <Slider
                value={[opacity * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => onOpacityChange(v[0] / 100)}
                className="[&>span:first-child]:h-2 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">HEX</span>
            <Input
              value={hexInput}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              className="h-8 text-xs font-mono"
              maxLength={7}
            />
          </div>

          <div className="grid grid-cols-8 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-6 h-6 rounded-md border border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  value?.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
      </Popover>
      {showHexInput && (
        <Input
          value={externalHexInput}
          onChange={handleExternalHexChange}
          onBlur={handleExternalHexBlur}
          className="h-8 text-xs font-mono flex-1 min-w-0"
          maxLength={7}
          placeholder="#000000"
        />
      )}
    </div>
  );
}
