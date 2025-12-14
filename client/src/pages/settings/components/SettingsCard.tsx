import { type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function SettingsCard({
  icon,
  title,
  description,
  children,
  className,
  testId,
}: SettingsCardProps) {
  return (
    <Card data-testid={testId} className={cn("settings-card", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-base">
          {icon && <span className="text-primary shrink-0">{icon}</span>}
          <span className="leading-tight">{title}</span>
        </CardTitle>
        {description && (
          <CardDescription className="leading-tight mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
