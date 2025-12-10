import { memo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import type { Translations } from "@/lib/i18n";

interface ResetSectionProps {
  onShowResetDialog: () => void;
  t: Translations;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ResetSection = memo(function ResetSection({
  onShowResetDialog,
  t,
  isOpen,
  onOpenChange,
}: ResetSectionProps) {
  return (
    <CollapsibleCard
      icon={<RotateCcw className="w-5 h-5" />}
      title={t.settings.reset.title}
      description={t.settings.reset.description}
      sectionId="reset"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      testId="section-reset"
    >
      <Button
        variant="outline"
        className="w-full"
        onClick={onShowResetDialog}
        data-testid="button-reset-settings"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        {t.settings.reset.resetAllSettings}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {t.settings.reset.photosNotAffected}
      </p>
    </CollapsibleCard>
  );
});
