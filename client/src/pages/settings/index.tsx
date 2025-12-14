import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings-context";
import { useI18n } from "@/lib/i18n";
import { usePWA, useStorage, usePatternSetup, useApiKeyValidation } from "@/hooks";
import { usePrivacy } from "@/lib/privacy-context";
import { PatternLock } from "@/components/pattern-lock";
import { logger } from "@/lib/logger";
import type { ProviderSettings } from "@/cloud-providers";
import { SettingsTabs, SettingsPreview, type SettingsTab } from "./components";
import { MainSettingsTab, PrivacyTab, StorageTab } from "./tabs";
import { AnimatedContainer, AnimatedItem } from "@/components/animated-section";
import { PreviewProvider, usePreview } from "./contexts/PreviewContext";

function SettingsPageContent() {
  const [, navigate] = useLocation();
  const { isPreviewActive } = usePreview();
  const { settings, updateSettings, updateStabilization, updateEnhancement, resetSettings } = useSettings();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const { settings: privacySettings, updateSettings: updatePrivacySettings } = usePrivacy();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("main");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  const { storageInfo, clearStorage } = useStorage();

  const patternSetup = usePatternSetup({
    onPatternConfirmed: (pattern) => updatePrivacySettings({ secretPattern: pattern }),
  });

  const handleApiKeyValidated = useCallback((apiKey: string) => {
    updateSettings({
      imgbb: {
        ...settings.imgbb,
        apiKey,
        isValidated: true,
      },
    });
  }, [settings.imgbb, updateSettings]);

  const handleApiKeyInvalidated = useCallback(() => {
    if (settings.imgbb?.isValidated) {
      updateSettings({
        imgbb: {
          ...settings.imgbb,
          isValidated: false,
        },
      });
    }
  }, [settings.imgbb, updateSettings]);

  const apiKeyValidation = useApiKeyValidation({
    initialApiKey: settings.imgbb?.apiKey || "",
    onValidated: handleApiKeyValidated,
    onInvalidated: handleApiKeyInvalidated,
    translations: {
      pleaseEnterApiKey: t.settings.cloud.pleaseEnterApiKey,
      validationError: t.settings.cloud.validationError,
    },
  });

  const handleReset = useCallback(async () => {
    await resetSettings();
    setShowResetDialog(false);
  }, [resetSettings]);

  const handleClearPhotos = useCallback(async () => {
    try {
      await clearStorage();
    } catch (error) {
      logger.error("Failed to clear photos", error);
    }
    setShowClearDialog(false);
  }, [clearStorage]);

  const handleImgbbUpdate = useCallback((updates: Partial<typeof settings.imgbb>) => {
    updateSettings({
      imgbb: {
        ...settings.imgbb,
        ...updates,
      },
    });
  }, [settings.imgbb, updateSettings]);

  const handleCloudUpdate = useCallback((updates: Partial<typeof settings.cloud>) => {
    updateSettings({
      cloud: {
        selectedProvider: settings.cloud?.selectedProvider || 'imgbb',
        providers: settings.cloud?.providers || {},
        ...updates,
      },
    });
  }, [settings.cloud, updateSettings]);

  const handleProviderSettingsUpdate = useCallback((providerId: string, updates: Partial<ProviderSettings>) => {
    updateSettings({
      cloud: {
        selectedProvider: settings.cloud?.selectedProvider || 'imgbb',
        providers: {
          ...settings.cloud?.providers,
          [providerId]: {
            ...settings.cloud?.providers?.[providerId],
            ...updates,
          },
        },
      },
    });
  }, [settings.cloud, updateSettings]);

  const handleShowClearDialog = useCallback(() => setShowClearDialog(true), []);
  const handleShowResetDialog = useCallback(() => setShowResetDialog(true), []);

  if (isPreviewActive) {
    return null;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "main":
        return (
          <MainSettingsTab
            settings={settings}
            updateSettings={updateSettings}
            updateStabilization={updateStabilization}
            updateEnhancement={updateEnhancement}
            language={language}
            setLanguage={setLanguage}
            availableLanguages={availableLanguages}
            onShowResetDialog={handleShowResetDialog}
          />
        );
      case "privacy":
        return (
          <PrivacyTab
            privacySettings={privacySettings}
            updatePrivacySettings={updatePrivacySettings}
            onShowPatternSetup={patternSetup.openPatternSetup}
            t={t}
          />
        );
      case "storage":
        return (
          <StorageTab
            storageInfo={storageInfo}
            onShowClearDialog={handleShowClearDialog}
            settings={settings}
            apiKeyInput={apiKeyValidation.apiKeyInput}
            onApiKeyChange={apiKeyValidation.handleApiKeyChange}
            isValidating={apiKeyValidation.isValidating}
            validationError={apiKeyValidation.validationError}
            onValidateApiKey={apiKeyValidation.handleValidateApiKey}
            onImgbbUpdate={handleImgbbUpdate}
            onCloudUpdate={handleCloudUpdate}
            onProviderSettingsUpdate={handleProviderSettingsUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border safe-top bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back-camera"
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">{t.settings.title}</h1>
            <SettingsTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <AnimatedContainer className="space-y-4">
          <AnimatedItem>
            {renderActiveTab()}
          </AnimatedItem>
        </AnimatedContainer>
      </main>

      <footer className="border-t border-border py-4 safe-bottom bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{t.settings.appInfo.title}</span>
            </div>
            <p>{t.settings.appInfo.subtitle}</p>
            <p className="opacity-75">{t.settings.appInfo.storageNote}</p>
          </div>
        </div>
      </footer>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.settings.dialogs.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.settings.dialogs.resetDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} data-testid="button-confirm-reset">
              {t.common.reset}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.settings.dialogs.clearTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.settings.dialogs.clearDescription.replace('{count}', String(storageInfo?.photos || 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear-storage">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearPhotos}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-clear-storage"
            >
              {t.settings.dialogs.clearAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={patternSetup.isOpen} onOpenChange={patternSetup.setIsOpen}>
        <DialogContent data-testid="pattern-setup-dialog" className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {patternSetup.patternStep === 'draw' ? t.settings.privacy.drawYourPattern : t.settings.privacy.confirmYourPattern}
            </DialogTitle>
            <DialogDescription>
              {patternSetup.patternStep === 'draw' 
                ? t.settings.privacy.patternDrawHint
                : t.settings.privacy.patternConfirmHint}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            <div className={`p-4 rounded-xl bg-muted/30 ${patternSetup.patternError ? 'animate-shake ring-2 ring-destructive' : ''}`}>
              <PatternLock
                onPatternComplete={patternSetup.handlePatternDraw}
                size={220}
                dotSize={18}
                lineColor={patternSetup.patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                activeDotColor={patternSetup.patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              />
            </div>
            
            {patternSetup.patternError && (
              <p className="text-sm text-destructive">
                {t.settings.privacy.patternsDontMatch}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            {patternSetup.patternStep === 'confirm' && (
              <Button
                variant="outline"
                onClick={patternSetup.goBackToDrawStep}
                data-testid="button-pattern-back"
              >
                {t.common.back}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PreviewProvider>
      <SettingsPreview />
      <SettingsPageContent />
    </PreviewProvider>
  );
}
