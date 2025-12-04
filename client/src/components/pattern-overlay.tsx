import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PatternLock } from "@/components/pattern-lock";

export interface PatternOverlayProps {
  onPatternComplete: (pattern: number[]) => void;
  onClose: () => void;
  patternError: boolean;
}

export const PatternOverlay = memo(function PatternOverlay({ 
  onPatternComplete, 
  onClose, 
  patternError 
}: PatternOverlayProps) {
  const { t } = useI18n();
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
      data-testid="pattern-overlay"
    >
      <div 
        className="flex flex-col items-center gap-6 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-medium">{t.game2048.drawPattern}</span>
        </div>
        
        <div className={`p-4 rounded-xl bg-muted/30 ${patternError ? 'animate-shake ring-2 ring-destructive' : ''}`}>
          <PatternLock
            onPatternComplete={onPatternComplete}
            size={220}
            dotSize={18}
            lineColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
            activeDotColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          {t.game2048.patternHint}
        </p>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground"
          data-testid="button-cancel-pattern"
        >
          {t.game2048.cancel}
        </Button>
      </div>
    </div>
  );
});
