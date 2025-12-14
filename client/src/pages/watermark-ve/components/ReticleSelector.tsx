import { memo } from "react";
import { X, Palette, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { ReticleShapeRenderer } from "./ReticleShapes";
import type { ReticleShape } from "../types";
import type { ColorScheme } from "@shared/schema";

export type DockPosition = "top" | "bottom";

export interface ReticleSettings {
  shape: ReticleShape;
  color: string;
  size: number;
  strokeWidth: number;
  opacity: number;
  position: { x: number; y: number };
  autoColor: boolean;
  colorScheme: ColorScheme;
}

interface ReticleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReticleSettings;
  onSettingsChange: (updates: Partial<ReticleSettings>) => void;
  dockPosition: DockPosition;
  onDockPositionChange: (position: DockPosition) => void;
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
  dockPosition,
  onDockPositionChange,
}: ReticleSelectorProps) {
  if (!isOpen) return null;

  const toggleDockPosition = () => {
    onDockPositionChange(dockPosition === "top" ? "bottom" : "top");
  };

  return (
    <div
      style={{ fontFamily: 'var(--font-montserrat), system-ui, sans-serif' }}
      className={`fixed left-0 right-0 z-[100] max-h-[45vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-x shadow-xl transition-all duration-300 ease-out ${
        dockPosition === "top" 
          ? "top-0 border-b rounded-b-lg" 
          : "bottom-0 border-t rounded-t-lg"
      }`}
    >
      <div 
        className="flex items-center justify-between select-none px-4 py-2 bg-muted/50 border-b sticky top-0 z-10 backdrop-blur-sm"
      >
        <h3 className="font-medium text-sm">Выбор прицела</h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDockPosition} 
            className="h-7 w-7"
            title={dockPosition === "top" ? "Переместить вниз" : "Переместить вверх"}
          >
            {dockPosition === "top" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-4">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Авто цвет</Label>
          </div>
          <Switch
            checked={settings.autoColor}
            onCheckedChange={(checked) => onSettingsChange({ autoColor: checked })}
          />
        </div>

        {settings.autoColor ? (
          <div className="space-y-1">
            <Label className="text-xs">Цветовая схема</Label>
            <Select
              value={settings.colorScheme}
              onValueChange={(value) => onSettingsChange({ colorScheme: value as ColorScheme })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contrast">Контраст</SelectItem>
                <SelectItem value="tactical">Тактический</SelectItem>
                <SelectItem value="neon">Неон</SelectItem>
                <SelectItem value="monochrome">Монохром</SelectItem>
                <SelectItem value="warm">Тёплый</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Label className="text-xs w-12">Цвет</Label>
            <ColorPicker
              value={settings.color}
              onChange={(color) => onSettingsChange({ color })}
              showHexInput={true}
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Размер</Label>
            <span className="text-xs text-muted-foreground">{settings.size}%</span>
          </div>
          <Slider
            value={[settings.size]}
            onValueChange={([v]) => onSettingsChange({ size: v })}
            min={1}
            max={30}
            step={1}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Толщина линии</Label>
            <span className="text-xs text-muted-foreground">{settings.strokeWidth}%</span>
          </div>
          <Slider
            value={[settings.strokeWidth]}
            onValueChange={([v]) => onSettingsChange({ strokeWidth: v })}
            min={5}
            max={50}
            step={5}
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
    </div>
  );
});

export default ReticleSelector;
