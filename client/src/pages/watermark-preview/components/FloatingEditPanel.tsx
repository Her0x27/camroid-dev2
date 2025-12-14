import { memo, useState, useRef, useCallback } from "react";
import { X, Bold, Italic, Underline, Plus, Trash2, Image, ChevronDown, ChevronRight, ChevronUp, Palette, Type, MapPin, Move, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { WatermarkStyle, WatermarkPosition, SeparatorPosition, CoordinateFormat, LogoPosition, FontFamily } from "./InteractiveWatermark";

export type DockPosition = "top" | "bottom";

interface FloatingEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  style: WatermarkStyle;
  position: WatermarkPosition;
  onStyleChange: (updates: Partial<WatermarkStyle>) => void;
  onPositionChange: (updates: Partial<WatermarkPosition>) => void;
  dockPosition: DockPosition;
  onDockPositionChange: (position: DockPosition) => void;
}

const SEPARATOR_POSITIONS: { value: SeparatorPosition; label: string }[] = [
  { value: "before-coords", label: "Перед координатами" },
  { value: "after-coords", label: "После координат" },
  { value: "before-note", label: "Перед заметкой" },
  { value: "after-note", label: "После заметки" },
];

const COORDINATE_FORMATS: { value: CoordinateFormat; label: string; example: string }[] = [
  { value: "decimal", label: "Десятичные", example: "55.7558°N 37.6173°E" },
  { value: "dms", label: "Градусы, минуты, секунды", example: "55°45'21\"N 37°37'2\"E" },
  { value: "ddm", label: "Градусы, десятичные минуты", example: "55°45.35'N 37°37.04'E" },
  { value: "simple", label: "Простые числа", example: "55.75581 37.61738" },
];

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "system", label: "Системный" },
  { value: "roboto", label: "Roboto" },
  { value: "montserrat", label: "Montserrat" },
  { value: "oswald", label: "Oswald" },
  { value: "playfair", label: "Playfair Display" },
];

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  isOpen: boolean;
}

function SectionHeader({ icon, title, isOpen }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted/50 rounded transition-colors -mx-1 px-1">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-xs font-medium text-muted-foreground uppercase flex-1">{title}</span>
      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
    </div>
  );
}

export const FloatingEditPanel = memo(function FloatingEditPanel({
  isOpen,
  onClose,
  style,
  position,
  onStyleChange,
  onPositionChange,
  dockPosition,
  onDockPositionChange,
}: FloatingEditPanelProps) {
  const [showSeparatorMenu, setShowSeparatorMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState({
    background: false,
    font: false,
    logo: false,
    coordinates: false,
    position: false,
    separators: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      onStyleChange({ logoUrl: imageUrl });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onStyleChange]);

  const handleRemoveLogo = useCallback(() => {
    onStyleChange({ logoUrl: null });
  }, [onStyleChange]);

  if (!isOpen) return null;

  const handleAddSeparator = (sepPosition: SeparatorPosition) => {
    const newSeparator = {
      id: `sep-${Date.now()}`,
      position: sepPosition,
    };
    onStyleChange({ separators: [...style.separators, newSeparator] });
    setShowSeparatorMenu(false);
  };

  const handleRemoveSeparator = (id: string) => {
    onStyleChange({ separators: style.separators.filter(s => s.id !== id) });
  };

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
        className={`flex items-center justify-between select-none px-4 py-2 bg-muted/50 border-b sticky z-10 backdrop-blur-sm ${
          dockPosition === "top" ? "top-0" : "top-0"
        }`}
      >
        <h3 className="font-medium text-sm">Редактирование водяного знака</h3>
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
      <div className="px-4 pt-1 pb-4 space-y-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Collapsible open={openSections.background} onOpenChange={() => toggleSection('background')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<Palette className="h-4 w-4" />} 
              title="Фон" 
              isOpen={openSections.background}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pl-6 pb-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs w-16">Цвет</Label>
              <ColorPicker
                value={style.backgroundColor}
                onChange={(color) => onStyleChange({ backgroundColor: color })}
                showHexInput={true}
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

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Ширина</Label>
                <span className="text-xs text-muted-foreground">{style.width}%</span>
              </div>
              <Slider
                value={[style.width]}
                onValueChange={([v]) => onStyleChange({ width: v })}
                min={10}
                max={100}
                step={5}
                disabled={style.autoSize}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Высота</Label>
                <span className="text-xs text-muted-foreground">{style.height}%</span>
              </div>
              <Slider
                value={[style.height]}
                onValueChange={([v]) => onStyleChange({ height: v })}
                min={5}
                max={50}
                step={5}
                disabled={style.autoSize}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs">Авто-размер</Label>
              <Switch
                checked={style.autoSize}
                onCheckedChange={(checked) => onStyleChange({ autoSize: checked })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.font} onOpenChange={() => toggleSection('font')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<Type className="h-4 w-4" />} 
              title="Шрифт" 
              isOpen={openSections.font}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pl-6 pb-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs w-16">Цвет</Label>
              <ColorPicker
                value={style.fontColor}
                onChange={(color) => onStyleChange({ fontColor: color })}
                showHexInput={true}
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
                <span className="text-xs text-muted-foreground">{style.fontSize}%</span>
              </div>
              <Slider
                value={[style.fontSize]}
                onValueChange={([v]) => onStyleChange({ fontSize: v })}
                min={1}
                max={10}
                step={0.5}
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

            <div>
              <Label className="text-xs">Шрифт</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => onStyleChange({ fontFamily: font.value })}
                    className={`px-2 py-1.5 rounded text-xs transition-all ${
                      style.fontFamily === font.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.logo} onOpenChange={() => toggleSection('logo')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<Image className="h-4 w-4" />} 
              title="Логотип" 
              isOpen={openSections.logo}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pl-6 pb-3">
            {style.logoUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <img 
                    src={style.logoUrl} 
                    alt="Logo preview" 
                    className="w-12 h-12 object-contain rounded border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Позиция</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={style.logoPosition === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStyleChange({ logoPosition: "left" as LogoPosition })}
                      className="h-8 text-xs flex-1"
                    >
                      Слева
                    </Button>
                    <Button
                      variant={style.logoPosition === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStyleChange({ logoPosition: "right" as LogoPosition })}
                      className="h-8 text-xs flex-1"
                    >
                      Справа
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Размер</Label>
                    <span className="text-xs text-muted-foreground">{style.logoSize}px</span>
                  </div>
                  <Slider
                    value={[style.logoSize]}
                    onValueChange={([v]) => onStyleChange({ logoSize: v })}
                    min={16}
                    max={96}
                    step={4}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Прозрачность</Label>
                    <span className="text-xs text-muted-foreground">{style.logoOpacity}%</span>
                  </div>
                  <Slider
                    value={[style.logoOpacity]}
                    onValueChange={([v]) => onStyleChange({ logoOpacity: v })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs w-full"
              >
                <Image className="h-4 w-4 mr-1" />
                Загрузить логотип
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.coordinates} onOpenChange={() => toggleSection('coordinates')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<MapPin className="h-4 w-4" />} 
              title="Формат координат" 
              isOpen={openSections.coordinates}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pl-6 pb-3">
            {COORDINATE_FORMATS.map((format) => (
              <button
                key={format.value}
                onClick={() => onStyleChange({ coordinateFormat: format.value })}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  style.coordinateFormat === format.value
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <div className="text-xs font-medium">{format.label}</div>
                <div className="text-[10px] text-muted-foreground">{format.example}</div>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.position} onOpenChange={() => toggleSection('position')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<Move className="h-4 w-4" />} 
              title="Позиция" 
              isOpen={openSections.position}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pl-6 pb-3">
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
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openSections.separators} onOpenChange={() => toggleSection('separators')}>
        <CollapsibleTrigger asChild>
          <div>
            <SectionHeader 
              icon={<Minus className="h-4 w-4" />} 
              title="Разделители" 
              isOpen={openSections.separators}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 pl-6 pb-3">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSeparatorMenu(!showSeparatorMenu)}
                className="h-8 text-xs w-full justify-between"
              >
                <span className="flex items-center">
                  <Plus className="h-3 w-3 mr-1" />
                  Добавить разделитель
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showSeparatorMenu ? "rotate-180" : ""}`} />
              </Button>
              {showSeparatorMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
                  {SEPARATOR_POSITIONS.map((sep) => (
                    <button
                      key={sep.value}
                      onClick={() => handleAddSeparator(sep.value)}
                      className="w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {sep.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {style.separators.length > 0 && (
              <div className="space-y-1">
                {style.separators.map((sep) => (
                  <div
                    key={sep.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-muted rounded text-xs"
                  >
                    <span>{SEPARATOR_POSITIONS.find(p => p.value === sep.position)?.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSeparator(sep.id)}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      </div>
    </div>
  );
});

export default FloatingEditPanel;
