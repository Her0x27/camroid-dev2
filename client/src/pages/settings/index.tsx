import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { usePWA } from "@/hooks/use-pwa";
import { usePrivacy } from "@/lib/privacy-context";
import { useStorage } from "@/hooks/use-storage";
import { useTheme } from "@/lib/theme-context";
import { validateApiKey } from "@/lib/imgbb";
import { PatternLock, patternToString } from "@/components/pattern-lock";
import { logger } from "@/lib/logger";
import {
  GeneralSettingsSection,
  WatermarkSection,
  ReticleSection,
  ThemeSection,
  CaptureLocationSection,
  CameraSettingsSection,
  ImageQualitySection,
  CloudUploadSection,
  StorageSection,
  PrivacySection,
  PWASection,
  ResetSection,
} from "./sections";
import { QuickSettings, SettingsChips, SettingsSearch, type SettingsCategory } from "./components";
import { AnimatedContainer, AnimatedItem } from "@/components/animated-section";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, updateReticle, updateStabilization, updateEnhancement, resetSettings } = useSettings();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const { canInstall, isInstalled, isInstalling, install, showIOSInstructions } = usePWA();
  const { settings: privacySettings, updateSettings: updatePrivacySettings } = usePrivacy();
  const { theme, setTheme } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("camera");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showPatternSetup, setShowPatternSetup] = useState(false);
  const [patternStep, setPatternStep] = useState<'draw' | 'confirm'>('draw');
  const [tempPattern, setTempPattern] = useState<string>('');
  const [patternError, setPatternError] = useState(false);
  
  const { storageInfo, clearStorage } = useStorage();
  
  const [apiKeyInput, setApiKeyInput] = useState(settings.imgbb?.apiKey || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const validationAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setApiKeyInput(settings.imgbb?.apiKey || "");
  }, [settings.imgbb?.apiKey]);
  
  useEffect(() => {
    return () => {
      if (validationAbortControllerRef.current) {
        validationAbortControllerRef.current.abort();
        validationAbortControllerRef.current = null;
      }
    };
  }, []);

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

  const handlePatternDraw = useCallback((pattern: number[]) => {
    const patternStr = patternToString(pattern);
    
    if (patternStep === 'draw') {
      setTempPattern(patternStr);
      setPatternStep('confirm');
      setPatternError(false);
    } else {
      if (patternStr === tempPattern) {
        updatePrivacySettings({ secretPattern: patternStr });
        setShowPatternSetup(false);
        setPatternStep('draw');
        setTempPattern('');
        setPatternError(false);
      } else {
        setPatternError(true);
        setTimeout(() => setPatternError(false), 1000);
      }
    }
  }, [patternStep, tempPattern, updatePrivacySettings]);

  const handleCancelPatternSetup = useCallback(() => {
    setShowPatternSetup(false);
    setPatternStep('draw');
    setTempPattern('');
    setPatternError(false);
  }, []);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKeyInput(value);
    if (settings.imgbb?.isValidated) {
      updateSettings({
        imgbb: {
          ...settings.imgbb,
          isValidated: false,
        },
      });
    }
  }, [settings.imgbb, updateSettings]);

  const handleValidateApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setValidationError(t.settings.cloud.pleaseEnterApiKey);
      return;
    }

    if (validationAbortControllerRef.current) {
      validationAbortControllerRef.current.abort();
    }
    validationAbortControllerRef.current = new AbortController();

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateApiKey(
        apiKeyInput.trim(),
        validationAbortControllerRef.current.signal
      );
      
      if (result.valid) {
        await updateSettings({
          imgbb: {
            ...settings.imgbb,
            apiKey: apiKeyInput.trim(),
            isValidated: true,
          },
        });
        setValidationError(null);
      } else {
        setValidationError(result.error || "Invalid API key");
        await updateSettings({
          imgbb: {
            ...settings.imgbb,
            isValidated: false,
          },
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setValidationError(t.settings.cloud.validationError);
    } finally {
      validationAbortControllerRef.current = null;
      setIsValidating(false);
    }
  }, [apiKeyInput, settings.imgbb, updateSettings, t]);

  const handleImgbbUpdate = useCallback((updates: Partial<typeof settings.imgbb>) => {
    updateSettings({
      imgbb: {
        ...settings.imgbb,
        ...updates,
      },
    });
  }, [settings.imgbb, updateSettings]);

  const handleShowClearDialog = useCallback(() => setShowClearDialog(true), []);
  const handleShowResetDialog = useCallback(() => setShowResetDialog(true), []);
  const handleShowPatternSetup = useCallback(() => setShowPatternSetup(true), []);

  const categorySections = useMemo(() => ({
    camera: (
      <>
        <AnimatedItem>
          <CameraSettingsSection
            settings={settings}
            updateSettings={updateSettings}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ImageQualitySection
            settings={settings}
            updateStabilization={updateStabilization}
            updateEnhancement={updateEnhancement}
          />
        </AnimatedItem>
      </>
    ),
    interface: (
      <>
        <AnimatedItem>
          <GeneralSettingsSection
            settings={settings}
            updateSettings={updateSettings}
            language={language}
            setLanguage={setLanguage}
            availableLanguages={availableLanguages}
            t={t}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ReticleSection
            settings={settings}
            updateReticle={updateReticle}
          />
        </AnimatedItem>
        <AnimatedItem>
          <WatermarkSection
            settings={settings}
            updateSettings={updateSettings}
            updateReticle={updateReticle}
          />
        </AnimatedItem>
      </>
    ),
    data: (
      <>
        <AnimatedItem>
          <CaptureLocationSection
            settings={settings}
            updateSettings={updateSettings}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CloudUploadSection
            settings={settings}
            apiKeyInput={apiKeyInput}
            onApiKeyChange={handleApiKeyChange}
            isValidating={isValidating}
            validationError={validationError}
            onValidateApiKey={handleValidateApiKey}
            onImgbbUpdate={handleImgbbUpdate}
            t={t}
          />
        </AnimatedItem>
        <AnimatedItem>
          <StorageSection
            storageInfo={storageInfo}
            onShowClearDialog={handleShowClearDialog}
          />
        </AnimatedItem>
      </>
    ),
    system: (
      <>
        <AnimatedItem>
          <ThemeSection />
        </AnimatedItem>
        <AnimatedItem>
          <PWASection
            canInstall={canInstall}
            isInstalled={isInstalled}
            isInstalling={isInstalling}
            install={install}
            showIOSInstructions={showIOSInstructions}
            t={t}
          />
        </AnimatedItem>
        <AnimatedItem>
          <PrivacySection
            privacySettings={privacySettings}
            updatePrivacySettings={updatePrivacySettings}
            onShowPatternSetup={handleShowPatternSetup}
            t={t}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ResetSection
            onShowResetDialog={handleShowResetDialog}
            t={t}
          />
        </AnimatedItem>
      </>
    ),
  }), [
    settings, updateSettings, updateReticle, updateStabilization, updateEnhancement,
    language, setLanguage, availableLanguages, t, apiKeyInput, handleApiKeyChange,
    isValidating, validationError, handleValidateApiKey, handleImgbbUpdate,
    storageInfo, handleShowClearDialog, canInstall, isInstalled, isInstalling,
    install, showIOSInstructions, privacySettings, updatePrivacySettings,
    handleShowPatternSetup, handleShowResetDialog
  ]);

  const isSearching = searchQuery.length > 0;
  
  const allSections = useMemo(() => {
    if (!isSearching) return null;
    
    return (
      <>
        <AnimatedItem>
          <CameraSettingsSection settings={settings} updateSettings={updateSettings} />
        </AnimatedItem>
        <AnimatedItem>
          <ImageQualitySection settings={settings} updateStabilization={updateStabilization} updateEnhancement={updateEnhancement} />
        </AnimatedItem>
        <AnimatedItem>
          <GeneralSettingsSection settings={settings} updateSettings={updateSettings} language={language} setLanguage={setLanguage} availableLanguages={availableLanguages} t={t} />
        </AnimatedItem>
        <AnimatedItem>
          <ReticleSection settings={settings} updateReticle={updateReticle} />
        </AnimatedItem>
        <AnimatedItem>
          <WatermarkSection settings={settings} updateSettings={updateSettings} updateReticle={updateReticle} />
        </AnimatedItem>
        <AnimatedItem>
          <CaptureLocationSection settings={settings} updateSettings={updateSettings} />
        </AnimatedItem>
        <AnimatedItem>
          <CloudUploadSection settings={settings} apiKeyInput={apiKeyInput} onApiKeyChange={handleApiKeyChange} isValidating={isValidating} validationError={validationError} onValidateApiKey={handleValidateApiKey} onImgbbUpdate={handleImgbbUpdate} t={t} />
        </AnimatedItem>
        <AnimatedItem>
          <StorageSection storageInfo={storageInfo} onShowClearDialog={handleShowClearDialog} />
        </AnimatedItem>
        <AnimatedItem>
          <ThemeSection />
        </AnimatedItem>
        <AnimatedItem>
          <PWASection canInstall={canInstall} isInstalled={isInstalled} isInstalling={isInstalling} install={install} showIOSInstructions={showIOSInstructions} t={t} />
        </AnimatedItem>
        <AnimatedItem>
          <PrivacySection privacySettings={privacySettings} updatePrivacySettings={updatePrivacySettings} onShowPatternSetup={handleShowPatternSetup} t={t} />
        </AnimatedItem>
        <AnimatedItem>
          <ResetSection onShowResetDialog={handleShowResetDialog} t={t} />
        </AnimatedItem>
      </>
    );
  }, [
    isSearching, settings, updateSettings, updateReticle, updateStabilization, updateEnhancement,
    language, setLanguage, availableLanguages, t, apiKeyInput, handleApiKeyChange,
    isValidating, validationError, handleValidateApiKey, handleImgbbUpdate,
    storageInfo, handleShowClearDialog, canInstall, isInstalled, isInstalling,
    install, showIOSInstructions, privacySettings, updatePrivacySettings,
    handleShowPatternSetup, handleShowResetDialog
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back-camera"
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <SettingsSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
          {!isSearching && (
            <div className="px-4 pb-2">
              <SettingsChips
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
          )}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-8 safe-bottom">
        <AnimatedContainer className="space-y-4">
          {!isSearching && (
            <AnimatedItem>
              <QuickSettings
                settings={settings}
                updateSettings={updateSettings}
                updateStabilization={updateStabilization}
                theme={theme}
                setTheme={setTheme}
              />
            </AnimatedItem>
          )}

          {isSearching ? (
            allSections
          ) : (
            categorySections[activeCategory]
          )}

          {!isSearching && (
            <AnimatedItem>
              <div className="text-center text-xs text-muted-foreground space-y-0.5 pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold">{t.settings.appInfo.title}</span>
                </div>
                <p>{t.settings.appInfo.subtitle}</p>
                <p className="opacity-75">{t.settings.appInfo.storageNote}</p>
              </div>
            </AnimatedItem>
          )}
        </AnimatedContainer>
      </main>

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

      <Dialog open={showPatternSetup} onOpenChange={setShowPatternSetup}>
        <DialogContent data-testid="pattern-setup-dialog" className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {patternStep === 'draw' ? t.settings.privacy.drawYourPattern : t.settings.privacy.confirmYourPattern}
            </DialogTitle>
            <DialogDescription>
              {patternStep === 'draw' 
                ? t.settings.privacy.patternDrawHint
                : t.settings.privacy.patternConfirmHint}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            <div className={`p-4 rounded-xl bg-muted/30 ${patternError ? 'animate-shake ring-2 ring-destructive' : ''}`}>
              <PatternLock
                onPatternComplete={handlePatternDraw}
                size={220}
                dotSize={18}
                lineColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                activeDotColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              />
            </div>
            
            {patternError && (
              <p className="text-sm text-destructive">
                {t.settings.privacy.patternsDontMatch}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            {patternStep === 'confirm' && (
              <Button
                variant="outline"
                onClick={() => {
                  setPatternStep('draw');
                  setTempPattern('');
                  setPatternError(false);
                }}
                data-testid="button-pattern-back"
              >
                {t.common.back}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleCancelPatternSetup}
              data-testid="button-pattern-cancel"
            >
              {t.common.cancel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
