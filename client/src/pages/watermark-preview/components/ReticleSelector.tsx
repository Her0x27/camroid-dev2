import { memo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ReticleShapeRenderer } from "./ReticleShapes";
import type { ReticleShape } from "../types";

export interface ReticleSettings {
  shape: ReticleShape;
  color: string;
  size: number;
  strokeWidth: number;
  opacity: number;
  position: { x: number; y: number };
}

interface ReticleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReticleSettings;
  onSettingsChange: (updates: Partial<ReticleSettings>) => void;
  anchorPosition: { x: number; y: number };
}

const RETICLE_OPTIONS: { value: ReticleShape; label: string }[] = [
  { value: "crosshair", label: "Перекрестие" },
  { value: "circle", label: "Кружок" },
  { value: "square", label: "Квадрат" },
  { value: "arrow", label: "Стрелка-указатель" },
  { value: "speech-bubble", label: "Облако диалога" },
  { value: "custom", label: "Свой указатель" },
];

export const ReticleSelector = memo(function ReticleSelector({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  anchorPosition,
}: ReticleSelectorProps) {
  if (!isOpen) return null;

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorPosition.x, window.innerWidth - 280),
    top: Math.min(anchorPosition.y + 10, window.innerHeight - 400),
    zIndex: 100,
  };

  return (
    <div
      style={panelStyle}
      className="w-72 max-h-[70vh] overflow-y-auto bg-background border rounded-lg shadow-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Выбор прицела</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {RETICLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSettingsChange({ shape: option.value })}
            className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
              settings.shape === option.value
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-muted-foreground/50"
            }`}
          >
            <ReticleShapeRenderer
              shape={option.value}
              size={32}
              color={settings.color}
              strokeWidth={2}
              opacity={100}
            />
            <span className="text-[10px] text-center leading-tight">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs w-12">Цвет</Label>
          <input
            type="color"
            value={settings.color}
            onChange={(e) => onSettingsChange({ color: e.target.value })}
            className="h-8 w-12 rounded cursor-pointer border"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Размер</Label>
            <span className="text-xs text-muted-foreground">{settings.size}px</span>
          </div>
          <Slider
            value={[settings.size]}
            onValueChange={([v]) => onSettingsChange({ size: v })}
            min={20}
            max={150}
            step={5}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Толщина линии</Label>
            <span className="text-xs text-muted-foreground">{settings.strokeWidth}px</span>
          </div>
          <Slider
            value={[settings.strokeWidth]}
            onValueChange={([v]) => onSettingsChange({ strokeWidth: v })}
            min={1}
            max={8}
            step={1}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Прозрачность</Label>
            <span className="text-xs text-muted-foreground">{settings.opacity}%</span>
          </div>
          <Slider
            value={[settings.opacity]}
            onValueChange={([v]) => onSettingsChange({ opacity: v })}
            min={10}
            max={100}
            step={5}
          />
        </div>
      </div>
    </div>
  );
});

export default ReticleSelector;
