import {
  Type,
  Image,
  MapPin,
  Signal,
  Compass,
  RotateCcw,
  Clock,
  Minus,
  SeparatorVertical,
  Target,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  WatermarkObject,
  WatermarkObjectType,
  RETICLE_SHAPES,
  ReticleShape,
  ReticlePositionType,
} from "../types";

interface PropertyPanelProps {
  selectedObject: WatermarkObject | null;
  onUpdateObject: (updates: Partial<WatermarkObject>) => void;
  onDuplicateObject: () => void;
  onDeleteObject: () => void;
}

const OBJECT_TYPE_ICONS: Record<WatermarkObjectType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  logo: Image,
  coordinates: MapPin,
  accuracy: Signal,
  heading: Compass,
  tilt: RotateCcw,
  timestamp: Clock,
  "separator-h": Minus,
  "separator-v": SeparatorVertical,
  reticle: Target,
};

const FONT_OPTIONS = [
  { value: "monospace", label: "Monospace" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
];

const TEXT_OBJECT_TYPES: WatermarkObjectType[] = [
  "text",
  "coordinates",
  "accuracy",
  "heading",
  "tilt",
  "timestamp",
];

const STROKE_OBJECT_TYPES: WatermarkObjectType[] = [
  "reticle",
  "separator-h",
  "separator-v",
];

export function PropertyPanel({
  selectedObject,
  onUpdateObject,
  onDuplicateObject,
  onDeleteObject,
}: PropertyPanelProps) {
  if (!selectedObject) {
    return (
      <div className="flex flex-col bg-transparent overflow-hidden min-w-0 w-full">
        <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
          <span className="text-xs">Выберите объект</span>
        </div>
      </div>
    );
  }

  const IconComponent = OBJECT_TYPE_ICONS[selectedObject.type];
  const isTextObject = TEXT_OBJECT_TYPES.includes(selectedObject.type);
  const hasStroke = STROKE_OBJECT_TYPES.includes(selectedObject.type);
  const isReticle = selectedObject.type === "reticle";

  const handlePositionChange = (key: "x" | "y", value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdateObject({
      position: { ...selectedObject.position, [key]: numValue },
    });
  };

  const handleSizeChange = (key: "width" | "height", value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdateObject({
      size: { ...selectedObject.size, [key]: numValue },
    });
  };

  const handleStyleChange = <K extends keyof WatermarkObject["style"]>(
    key: K,
    value: WatermarkObject["style"][K]
  ) => {
    onUpdateObject({
      style: { ...selectedObject.style, [key]: value },
    });
  };

  return (
    <div className="flex flex-col bg-transparent overflow-hidden min-w-0 w-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
        <span className="text-sm font-medium truncate">{selectedObject.name}</span>
      </div>

      <ScrollArea className="flex-1 max-h-[500px]">
        <div className="p-3 space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Позиция</Label>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">X</Label>
                <Input
                  type="number"
                  value={selectedObject.position.x}
                  onChange={(e) => handlePositionChange("x", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Y</Label>
                <Input
                  type="number"
                  value={selectedObject.position.y}
                  onChange={(e) => handlePositionChange("y", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ширина</Label>
                <Input
                  type="number"
                  value={selectedObject.size.width}
                  onChange={(e) => handleSizeChange("width", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Высота</Label>
                <Input
                  type="number"
                  value={selectedObject.size.height}
                  onChange={(e) => handleSizeChange("height", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Поворот</Label>
                <span className="text-xs text-muted-foreground">{selectedObject.rotation}°</span>
              </div>
              <Slider
                value={[selectedObject.rotation]}
                onValueChange={([value]) => onUpdateObject({ rotation: value })}
                min={0}
                max={360}
                step={1}
                className="py-1"
              />
            </div>
          </div>

          <Separator className="bg-border/60" />

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Стиль</Label>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Цвет</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={selectedObject.style.color}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="h-8 w-12 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedObject.style.color}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Прозрачность</Label>
                <span className="text-xs text-muted-foreground">{selectedObject.style.opacity}%</span>
              </div>
              <Slider
                value={[selectedObject.style.opacity]}
                onValueChange={([value]) => handleStyleChange("opacity", value)}
                min={0}
                max={100}
                step={1}
                className="py-1"
              />
            </div>

            {hasStroke && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Толщина линии</Label>
                  <span className="text-xs text-muted-foreground">{selectedObject.style.strokeWidth || 2}px</span>
                </div>
                <Slider
                  value={[selectedObject.style.strokeWidth || 2]}
                  onValueChange={([value]) => handleStyleChange("strokeWidth", value)}
                  min={1}
                  max={10}
                  step={1}
                  className="py-1"
                />
              </div>
            )}
          </div>

          {isTextObject && (
            <>
              <Separator className="bg-border/60" />

              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Текст</Label>
                
                {selectedObject.type === "text" && (
                  <Textarea
                    value={selectedObject.content || ""}
                    onChange={(e) => onUpdateObject({ content: e.target.value })}
                    placeholder="Введите текст..."
                    className="min-h-[60px] text-xs resize-none"
                  />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Размер шрифта</Label>
                    <span className="text-xs text-muted-foreground">{selectedObject.style.fontSize || 14}px</span>
                  </div>
                  <Slider
                    value={[selectedObject.style.fontSize || 14]}
                    onValueChange={([value]) => handleStyleChange("fontSize", value)}
                    min={8}
                    max={72}
                    step={1}
                    className="py-1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Шрифт</Label>
                  <Select
                    value={selectedObject.style.fontFamily || "monospace"}
                    onValueChange={(value) => handleStyleChange("fontFamily", value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value} className="text-xs">
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedObject.style.fontWeight === "bold" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      handleStyleChange(
                        "fontWeight",
                        selectedObject.style.fontWeight === "bold" ? "normal" : "bold"
                      )
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6 bg-border/60" />
                  
                  <div className="flex gap-1">
                    <Button
                      variant={selectedObject.style.textAlign === "left" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStyleChange("textAlign", "left")}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedObject.style.textAlign === "center" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStyleChange("textAlign", "center")}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedObject.style.textAlign === "right" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStyleChange("textAlign", "right")}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {isReticle && (
            <>
              <Separator className="bg-border/60" />

              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Прицел</Label>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Форма</Label>
                  <Select
                    value={selectedObject.reticleShape || "crosshair"}
                    onValueChange={(value) => onUpdateObject({ reticleShape: value as ReticleShape })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETICLE_SHAPES.map((shape) => (
                        <SelectItem key={shape.value} value={shape.value} className="text-xs">
                          {shape.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Тип позиции</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={selectedObject.reticlePositionType === "center" ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex-1 h-8 text-xs",
                        selectedObject.reticlePositionType === "center" && "border-primary"
                      )}
                      onClick={() => onUpdateObject({ reticlePositionType: "center" as ReticlePositionType })}
                    >
                      Центр
                    </Button>
                    <Button
                      variant={selectedObject.reticlePositionType === "free" ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex-1 h-8 text-xs",
                        selectedObject.reticlePositionType === "free" && "border-primary"
                      )}
                      onClick={() => onUpdateObject({ reticlePositionType: "free" as ReticlePositionType })}
                    >
                      Свободно
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator className="bg-border/60" />

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Действия</Label>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={onDuplicateObject}
              >
                <Copy className="h-3.5 w-3.5" />
                Дублировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                onClick={onDeleteObject}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
