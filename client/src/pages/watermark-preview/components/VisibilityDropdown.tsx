import { memo, useCallback } from "react";
import { Eye, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisibilityItem {
  key: string;
  icon: LucideIcon;
  title: string;
  active: boolean;
}

interface VisibilityDropdownProps {
  items: VisibilityItem[];
  onToggle: (key: string) => void;
}

export const VisibilityDropdown = memo(function VisibilityDropdown({
  items,
  onToggle,
}: VisibilityDropdownProps) {
  const handleItemClick = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(key);
  }, [onToggle]);

  const activeCount = items.filter(item => item.active).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm relative"
          title="Видимость элементов"
        >
          <Eye className="h-5 w-5" />
          {activeCount < items.length && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={(e) => handleItemClick(e, item.key)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {item.active && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default VisibilityDropdown;
