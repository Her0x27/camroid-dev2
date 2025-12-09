import { memo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cloudProviderRegistry } from "@/cloud-providers";

interface ProviderSelectorProps {
  selectedProviderId: string;
  onProviderChange: (providerId: string) => void;
  disabled?: boolean;
}

export const ProviderSelector = memo(function ProviderSelector({
  selectedProviderId,
  onProviderChange,
  disabled = false,
}: ProviderSelectorProps) {
  const providers = cloudProviderRegistry.getAll();
  const selectedProvider = cloudProviderRegistry.get(selectedProviderId);
  const SelectedIcon = selectedProvider?.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
            <span>{selectedProvider?.name || selectedProviderId}</span>
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-full min-w-[200px]">
        {providers.map((provider) => {
          const ProviderIcon = provider.icon;
          const isSelected = provider.id === selectedProviderId;
          
          return (
            <DropdownMenuItem
              key={provider.id}
              onClick={() => onProviderChange(provider.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isSelected && "bg-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <ProviderIcon className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {provider.description}
                  </span>
                </div>
              </span>
              {isSelected && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
