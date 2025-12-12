import {
  MousePointer2,
  Hand,
  Target,
  Type,
  Image,
  MapPin,
  Signal,
  Compass,
  RotateCcw,
  Clock,
  Minus,
  SeparatorVertical,
  Layers,
  Group,
  Ungroup,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { WatermarkObjectType } from "../types";

interface ToolbarPanelProps {
  activeTool: string | null;
  onToolSelect: (toolId: string) => void;
  onAddObject: (type: WatermarkObjectType) => void;
  onAddLayer: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  hasSelection: boolean;
}

interface ToolButton {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
}

interface ObjectButton {
  type: WatermarkObjectType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const selectionTools: ToolButton[] = [
  { id: "select", icon: MousePointer2, label: "Выбор", shortcut: "V" },
  { id: "pan", icon: Hand, label: "Перемещение", shortcut: "H" },
];

const objectButtons: ObjectButton[] = [
  { type: "reticle", icon: Target, label: "Прицел" },
  { type: "text", icon: Type, label: "Текст" },
  { type: "logo", icon: Image, label: "Логотип" },
  { type: "coordinates", icon: MapPin, label: "Координаты" },
  { type: "accuracy", icon: Signal, label: "Погрешность GPS" },
  { type: "heading", icon: Compass, label: "Азимут" },
  { type: "tilt", icon: RotateCcw, label: "Наклон" },
  { type: "timestamp", icon: Clock, label: "Таймштамп" },
  { type: "separator-h", icon: Minus, label: "Разделитель Г" },
  { type: "separator-v", icon: SeparatorVertical, label: "Разделитель В" },
];

export function ToolbarPanel({
  activeTool,
  onToolSelect,
  onAddObject,
  onAddLayer,
  onGroupSelected,
  onUngroupSelected,
  hasSelection,
}: ToolbarPanelProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-1 p-2 bg-background/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg">
        <div className="flex flex-col gap-1">
          {selectionTools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 transition-colors",
                    activeTool === tool.id &&
                      "bg-primary/20 text-primary border border-primary/40"
                  )}
                  onClick={() => onToolSelect(tool.id)}
                >
                  <tool.icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{tool.label}</span>
                {tool.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">
                    {tool.shortcut}
                  </kbd>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator className="my-1 bg-border/60" />

        <div className="flex flex-col gap-1">
          {objectButtons.map((obj) => (
            <Tooltip key={obj.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => onAddObject(obj.type)}
                >
                  <obj.icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>{obj.label}</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator className="my-1 bg-border/60" />

        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={onAddLayer}
              >
                <Layers className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>Добавить слой</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 transition-colors",
                  hasSelection
                    ? "hover:bg-primary/10 hover:text-primary"
                    : "opacity-50 cursor-not-allowed"
                )}
                onClick={onGroupSelected}
                disabled={!hasSelection}
              >
                <Group className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>Группировать</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 transition-colors",
                  hasSelection
                    ? "hover:bg-primary/10 hover:text-primary"
                    : "opacity-50 cursor-not-allowed"
                )}
                onClick={onUngroupSelected}
                disabled={!hasSelection}
              >
                <Ungroup className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>Разгруппировать</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
