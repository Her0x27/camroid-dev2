import { memo } from "react";
import { privacyModuleRegistry } from "@/privacy_modules";

interface ModulePreviewProps {
  moduleId: string;
  unlockLabels: {
    sequenceLabel: string;
    phraseLabel: string;
    swipePatternLabel: string;
  };
}

export const ModulePreview = memo(function ModulePreview({ moduleId, unlockLabels }: ModulePreviewProps) {
  const module = privacyModuleRegistry.get(moduleId);
  
  if (!module) return null;
  
  const unlockTypeLabels: Record<string, string> = {
    sequence: unlockLabels.sequenceLabel,
    phrase: unlockLabels.phraseLabel,
    swipePattern: unlockLabels.swipePatternLabel,
  };
  
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 p-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <module.icon className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg">{module.title}</h4>
          <p className="text-sm text-muted-foreground">
            {unlockTypeLabels[module.unlockMethod.type] || module.unlockMethod.type}
          </p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Favicon</div>
          <div className="flex items-center gap-2">
            <img 
              src={module.favicon} 
              alt={module.title} 
              className="w-6 h-6"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-sm font-mono truncate">{module.favicon}</span>
          </div>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Title</div>
          <div className="text-sm font-mono truncate">{module.title}</div>
        </div>
      </div>
      
      {module.unlockMethod.defaultValue && (
        <div className="mt-3 bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Default unlock</div>
          <div className="text-sm font-mono">{module.unlockMethod.defaultValue}</div>
        </div>
      )}
    </div>
  );
});
