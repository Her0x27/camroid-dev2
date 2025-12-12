import { memo, useState } from "react";
import { X, Bold, Italic, Underline, Plus, Trash2, Image, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WatermarkStyle, WatermarkPosition, SeparatorPosition } from "./InteractiveWatermark";

interface FloatingEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  style: WatermarkStyle;
  position: WatermarkPosition;
  onStyleChange: (updates: Partial<WatermarkStyle>) => void;
  onPositionChange: (updates: Partial<WatermarkPosition>) => void;
  onAddLogo: () => void;
  anchorPosition: { x: number; y: number };
}

const SEPARATOR_POSITIONS: { value: SeparatorPosition; label: string }[] = [
  { value: "before-coords", label: "Перед координатами" },
  { value: "after-coords", label: "После координат" },
  { value: "before-note", label: "Перед заметкой" },
  { value: "after-note", label: "После заметки" },
];

export const FloatingEditPanel = memo(function FloatingEditPanel({
  isOpen,
  onClose,
  style,
  position,
  onStyleChange,
  onPositionChange,
  onAddLogo,
  anchorPosition,
}: FloatingEditPanelProps) {
  const [showSeparatorMenu, setShowSeparatorMenu] = useState(false);

  if (!isOpen) return null;

  const handleAddSeparator = (position: SeparatorPosition) => {
    const newSeparator = {
      id: `sep-${Date.now()}`,
      position,
    };
    onStyleChange({ separators: [...style.separators, newSeparator] });
    setShowSeparatorMenu(false);
  };

  const handleRemoveSeparator = (id: string) => {
    onStyleChange({ separators: style.separators.filter(s => s.id !== id) });
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorPosition.x, window.innerWidth - 320),
    top: Math.min(anchorPosition.y + 10, window.innerHeight - 500),
    zIndex: 100,
  };

  return (
    <div
      style={panelStyle}
      className="w-80 max-h-[80vh] overflow-y-auto bg-background border rounded-lg shadow-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Редактирование водяного знака</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Фон</h4>
        
        <div className="flex items-center gap-3">
          <Label className="text-xs w-16">Цвет</Label>
          <input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
            className="h-8 w-12 rounded cursor-pointer border"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Прозрачность</Label>
            <span className="text-xs text-muted-foreground">{style.backgroundOpacity}%</span>
          </div>
          <Slider
            value={[style.backgroundOpacity]}
            onValueChange={([v]) => onStyleChange({ backgroundOpacity: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div>
          <Label className="text-xs">Ширина</Label>
          <Input
            type="number"
            value={style.width}
            onChange={(e) => onStyleChange({ width: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Шрифт</h4>
        
        <div className="flex items-center gap-3">
          <Label className="text-xs w-16">Цвет</Label>
          <input
            type="color"
            value={style.fontColor}
            onChange={(e) => onStyleChange({ fontColor: e.target.value })}
            className="h-8 w-12 rounded cursor-pointer border"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Прозрачность</Label>
            <span className="text-xs text-muted-foreground">{style.fontOpacity}%</span>
          </div>
          <Slider
            value={[style.fontOpacity]}
            onValueChange={([v]) => onStyleChange({ fontOpacity: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Размер шрифта</Label>
            <span className="text-xs text-muted-foreground">{style.fontSize}px</span>
          </div>
          <Slider
            value={[style.fontSize]}
            onValueChange={([v]) => onStyleChange({ fontSize: v })}
            min={8}
            max={48}
            step={1}
          />
        </div>

        <div className="flex gap-1">
          <Button
            variant={style.bold ? "default" : "outline"}
            size="icon"
            onClick={() => onStyleChange({ bold: !style.bold })}
            className="h-8 w-8"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={style.italic ? "default" : "outline"}
            size="icon"
            onClick={() => onStyleChange({ italic: !style.italic })}
            className="h-8 w-8"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={style.underline ? "default" : "outline"}
            size="icon"
            onClick={() => onStyleChange({ underline: !style.underline })}
            className="h-8 w-8"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Позиция</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={Math.round(position.x)}
              onChange={(e) => onPositionChange({ x: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={Math.round(position.y)}
              onChange={(e) => onPositionChange({ y: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Поворот</Label>
            <span className="text-xs text-muted-foreground">{style.rotation}°</span>
          </div>
          <Slider
            value={[style.rotation]}
            onValueChange={([v]) => onStyleChange({ rotation: v })}
            min={-180}
            max={180}
            step={1}
          />
        </div>

        <div>
          <Label className="text-xs">Заметка / Комментарий</Label>
          <Input
            value={style.note}
            onChange={(e) => onStyleChange({ note: e.target.value })}
            placeholder="Введите текст..."
            className="h-8 text-xs mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Позиция заметки</Label>
          <div className="flex gap-1 mt-1">
            <Button
              variant={style.notePlacement === "start" ? "default" : "outline"}
              size="sm"
              onClick={() => onStyleChange({ notePlacement: "start" })}
              className="h-8 text-xs flex-1"
            >
              В начале
            </Button>
            <Button
              variant={style.notePlacement === "end" ? "default" : "outline"}
              size="sm"
              onClick={() => onStyleChange({ notePlacement: "end" })}
              className="h-8 text-xs flex-1"
            >
              В конце
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Разделители</h4>
        
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSeparatorMenu(!showSeparatorMenu)}
            className="h-8 text-xs w-full justify-between"
          >
            <span className="flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              Вставить разделитель
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {showSeparatorMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
              {SEPARATOR_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => handleAddSeparator(pos.value)}
                  className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                >
                  {pos.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {style.separators.length > 0 && (
          <div className="space-y-1">
            {style.separators.map((sep) => {
              const label = SEPARATOR_POSITIONS.find(p => p.value === sep.position)?.label || sep.position;
              return (
                <div key={sep.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                  <span className="text-xs">{label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSeparator(sep.id)}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">Другие элементы</h4>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddLogo}
            className="h-8 text-xs"
          >
            <Image className="h-4 w-4 mr-1" />
            Логотип
          </Button>
        </div>
      </div>
    </div>
  );
});

export default FloatingEditPanel;
