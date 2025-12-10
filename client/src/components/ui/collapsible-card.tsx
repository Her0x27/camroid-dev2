import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  sectionId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  testId?: string;
}

export function CollapsibleCard({
  icon,
  title,
  description,
  children,
  sectionId,
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultOpen = false,
  testId,
}: CollapsibleCardProps) {
  const isControlled = controlledIsOpen !== undefined && onOpenChange !== undefined;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const hasBeenOpenedRef = useRef(isOpen);
  
  useEffect(() => {
    if (isOpen && !hasBeenOpenedRef.current) {
      hasBeenOpenedRef.current = true;
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      onOpenChange(open);
    } else {
      setUncontrolledIsOpen(open);
    }
    if (open) {
      hasBeenOpenedRef.current = true;
    }
  };

  return (
    <Card data-testid={testId} data-section-id={sectionId} className="settings-card transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="pb-3 cursor-pointer select-none hover-elevate rounded-t-lg bg-[hsl(var(--card-header))] min-h-[64px] touch-manipulation active:bg-muted/30"
            data-testid={testId ? `${testId}-trigger` : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <span className="text-primary shrink-0">{icon}</span>
                <span className="leading-tight">{title}</span>
              </CardTitle>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </div>
            <CardDescription className="pr-8 mt-1 leading-tight">
              {description}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {hasBeenOpenedRef.current ? children : null}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
