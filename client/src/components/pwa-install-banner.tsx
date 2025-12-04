import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
  showIOSInstructions: boolean;
  isInstalling: boolean;
}

export const PWAInstallBanner = memo(function PWAInstallBanner({ 
  onInstall, 
  onDismiss, 
  showIOSInstructions,
  isInstalling 
}: PWAInstallBannerProps) {
  const { t } = useI18n();
  
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto"
      onClick={(e) => e.stopPropagation()}
      data-testid="pwa-install-banner"
    >
      <div className="bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-amber-400/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">
              {t.game2048.pwaInstallTitle}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              {showIOSInstructions ? t.game2048.pwaIosHint : t.game2048.pwaInstallDesc}
            </p>
            {showIOSInstructions ? (
              <div className="flex items-center gap-1 mt-2 text-white/90">
                <Share2 className="w-4 h-4" />
                <span className="text-xs font-medium">{t.game2048.pwaShare}</span>
                <span className="text-white/60 mx-1">→</span>
                <span className="text-xs font-medium">{t.game2048.pwaAddToHomeScreen}</span>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-amber-700 hover:bg-white/90 h-8 text-xs font-medium"
                  onClick={onInstall}
                  disabled={isInstalling}
                  data-testid="button-pwa-install"
                >
                  {isInstalling ? (
                    <span className="animate-pulse">{t.common.loading}</span>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      {t.game2048.pwaInstall}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 text-xs"
                  onClick={onDismiss}
                  data-testid="button-pwa-dismiss"
                >
                  {t.game2048.pwaNotNow}
                </Button>
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10 h-6 w-6 flex-shrink-0"
            onClick={onDismiss}
            data-testid="button-pwa-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
