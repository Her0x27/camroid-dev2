import { useState, useCallback, useMemo } from "react";
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
import { useTheme } from "@/lib/theme-context";
import { PatternLock } from "@/components/pattern-lock";
import { logger } from "@/lib/logger";
import type { ProviderSettings } from "@/cloud-providers";
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
import { QuickSettings, SettingsChips, SettingsSearch, SettingsPreview, CategoryTips, type SettingsCategory } from "./components";
import { AnimatedContainer, AnimatedItem } from "@/components/animated-section";
import { PreviewProvider, usePreview } from "./contexts/PreviewContext";

function SettingsPageContent() {
  const [, navigate] = useLocation();
  const { isPreviewActive } = usePreview();
  const { settings, updateSettings, updateReticle, updateStabilization, updateEnhancement, resetSettings, isSectionOpen, toggleSection } = useSettings();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const { canInstall, isInstalled, isInstalling, install, showIOSInstructions } = usePWA();
  const { settings: privacySettings, updateSettings: updatePrivacySettings } = usePrivacy();
  const { theme, setTheme } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("camera");
  const [searchQuery, setSearchQuery] = useState("");
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

  const createSectionHandler = useCallback((sectionId: string) => {
    return (open: boolean) => {
      if (open !== isSectionOpen(sectionId)) {
        toggleSection(sectionId);
      }
    };
  }, [isSectionOpen, toggleSection]);

  const categorySections = useMemo(() => ({
    camera: (
      <>
        <AnimatedItem>
          <CameraSettingsSection
            settings={settings}
            updateSettings={updateSettings}
            isOpen={isSectionOpen("camera-settings")}
            onOpenChange={createSectionHandler("camera-settings")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ImageQualitySection
            settings={settings}
            updateStabilization={updateStabilization}
            updateEnhancement={updateEnhancement}
            isOpen={isSectionOpen("image-quality")}
            onOpenChange={createSectionHandler("image-quality")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CategoryTips category="camera" />
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
            isOpen={isSectionOpen("general")}
            onOpenChange={createSectionHandler("general")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ReticleSection
            settings={settings}
            updateReticle={updateReticle}
            isOpen={isSectionOpen("reticle")}
            onOpenChange={createSectionHandler("reticle")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <WatermarkSection
            settings={settings}
            updateSettings={updateSettings}
            updateReticle={updateReticle}
            isOpen={isSectionOpen("watermark")}
            onOpenChange={createSectionHandler("watermark")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CategoryTips category="interface" />
        </AnimatedItem>
      </>
    ),
    data: (
      <>
        <AnimatedItem>
          <CaptureLocationSection
            settings={settings}
            updateSettings={updateSettings}
            isOpen={isSectionOpen("capture-location")}
            onOpenChange={createSectionHandler("capture-location")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CloudUploadSection
            settings={settings}
            apiKeyInput={apiKeyValidation.apiKeyInput}
            onApiKeyChange={apiKeyValidation.handleApiKeyChange}
            isValidating={apiKeyValidation.isValidating}
            validationError={apiKeyValidation.validationError}
            onValidateApiKey={apiKeyValidation.handleValidateApiKey}
            onImgbbUpdate={handleImgbbUpdate}
            onCloudUpdate={handleCloudUpdate}
            onProviderSettingsUpdate={handleProviderSettingsUpdate}
            t={t}
            isOpen={isSectionOpen("cloud-upload")}
            onOpenChange={createSectionHandler("cloud-upload")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <StorageSection
            storageInfo={storageInfo}
            onShowClearDialog={handleShowClearDialog}
            isOpen={isSectionOpen("storage")}
            onOpenChange={createSectionHandler("storage")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CategoryTips category="data" />
        </AnimatedItem>
      </>
    ),
    system: (
      <>
        <AnimatedItem>
          <ThemeSection
            isOpen={isSectionOpen("theme")}
            onOpenChange={createSectionHandler("theme")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <PWASection
            canInstall={canInstall}
            isInstalled={isInstalled}
            isInstalling={isInstalling}
            install={install}
            showIOSInstructions={showIOSInstructions}
            t={t}
            isOpen={isSectionOpen("pwa")}
            onOpenChange={createSectionHandler("pwa")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <PrivacySection
            privacySettings={privacySettings}
            updatePrivacySettings={updatePrivacySettings}
            onShowPatternSetup={patternSetup.openPatternSetup}
            t={t}
            isOpen={isSectionOpen("privacy")}
            onOpenChange={createSectionHandler("privacy")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <ResetSection
            onShowResetDialog={handleShowResetDialog}
            t={t}
            isOpen={isSectionOpen("reset")}
            onOpenChange={createSectionHandler("reset")}
          />
        </AnimatedItem>
        <AnimatedItem>
          <CategoryTips category="system" />
        </AnimatedItem>
      </>
    ),
  }), [
    settings, updateSettings, updateReticle, updateStabilization, updateEnhancement,
    language, setLanguage, availableLanguages, t, apiKeyValidation, handleImgbbUpdate,
    handleCloudUpdate, handleProviderSettingsUpdate,
    storageInfo, handleShowClearDialog, canInstall, isInstalled, isInstalling,
    install, showIOSInstructions, privacySettings, updatePrivacySettings,
    patternSetup.openPatternSetup, handleShowResetDialog, isSectionOpen, createSectionHandler
  ]);

  const isSearching = searchQuery.length > 0;
  
  const searchableSections = useMemo(() => [
    {
      id: 'camera',
      keywords: [
        t.settings.camera.title, t.settings.camera.description,
        t.settings.camera.resolution, t.settings.camera.quality,
        'камера', 'разрешение', 'качество', 'фото', '1080p', '4k', '720p',
        'camera', 'resolution', 'quality', 'photo'
      ],
      component: <CameraSettingsSection settings={settings} updateSettings={updateSettings} />
    },
    {
      id: 'imageQuality',
      keywords: [
        t.settings.imageQuality.title, t.settings.imageQuality.description,
        t.settings.imageQuality.stabilization, t.settings.imageQuality.enhancement,
        'стабилизация', 'детализация', 'качество', 'изображение',
        'stabilization', 'enhancement', 'image', 'quality'
      ],
      component: <ImageQualitySection settings={settings} updateStabilization={updateStabilization} updateEnhancement={updateEnhancement} />
    },
    {
      id: 'general',
      keywords: [
        t.settings.general.title, t.settings.general.description,
        t.settings.general.captureSound, t.settings.general.language,
        'звук', 'язык', 'основные', 'затвор',
        'sound', 'language', 'general'
      ],
      component: <GeneralSettingsSection settings={settings} updateSettings={updateSettings} language={language} setLanguage={setLanguage} availableLanguages={availableLanguages} t={t} />
    },
    {
      id: 'reticle',
      keywords: [
        t.settings.crosshair.title, t.settings.crosshair.description,
        t.settings.crosshair.size, t.settings.crosshair.thickness, t.settings.crosshair.opacity,
        'прицел', 'размер', 'толщина', 'прозрачность', 'цвет',
        'crosshair', 'reticle', 'size', 'color'
      ],
      component: <ReticleSection settings={settings} updateReticle={updateReticle} />
    },
    {
      id: 'watermark',
      keywords: [
        t.settings.watermark.title, t.settings.watermark.description,
        t.settings.watermark.showMetadata, t.settings.watermark.watermarkSize,
        'водяной', 'знак', 'метаданные',
        'watermark', 'metadata'
      ],
      component: <WatermarkSection settings={settings} updateSettings={updateSettings} updateReticle={updateReticle} />
    },
    {
      id: 'capture',
      keywords: [
        t.settings.capture.title, t.settings.capture.description,
        t.settings.capture.gpsLocation, t.settings.capture.compassOrientation,
        'gps', 'геолокация', 'координаты', 'компас', 'ориентация', 'съёмка', 'уровень',
        'location', 'compass', 'capture'
      ],
      component: <CaptureLocationSection settings={settings} updateSettings={updateSettings} />
    },
    {
      id: 'cloud',
      keywords: [
        t.settings.cloud.title, t.settings.cloud.description,
        'облако', 'imgbb', 'api', 'загрузка', 'ключ',
        'cloud', 'upload', 'api key'
      ],
      component: <CloudUploadSection settings={settings} apiKeyInput={apiKeyValidation.apiKeyInput} onApiKeyChange={apiKeyValidation.handleApiKeyChange} isValidating={apiKeyValidation.isValidating} validationError={apiKeyValidation.validationError} onValidateApiKey={apiKeyValidation.handleValidateApiKey} onImgbbUpdate={handleImgbbUpdate} onCloudUpdate={handleCloudUpdate} onProviderSettingsUpdate={handleProviderSettingsUpdate} t={t} />
    },
    {
      id: 'storage',
      keywords: [
        t.settings.storage.title, t.settings.storage.description,
        'хранилище', 'память', 'очистить', 'фото',
        'storage', 'memory', 'clear', 'photos'
      ],
      component: <StorageSection storageInfo={storageInfo} onShowClearDialog={handleShowClearDialog} />
    },
    {
      id: 'theme',
      keywords: [
        t.settings.theme.title, t.settings.theme.description,
        'тема', 'темная', 'светлая', 'оформление',
        'theme', 'dark', 'light', 'appearance'
      ],
      component: <ThemeSection />
    },
    {
      id: 'pwa',
      keywords: [
        t.settings.pwa.title, t.settings.pwa.description,
        'установка', 'приложение', 'pwa',
        'install', 'app', 'pwa'
      ],
      component: <PWASection canInstall={canInstall} isInstalled={isInstalled} isInstalling={isInstalling} install={install} showIOSInstructions={showIOSInstructions} t={t} />
    },
    {
      id: 'privacy',
      keywords: [
        t.settings.privacy.title, t.settings.privacy.description,
        'приватность', 'безопасность', 'пароль', 'графический ключ', 'блокировка',
        'privacy', 'security', 'pattern', 'lock'
      ],
      component: <PrivacySection privacySettings={privacySettings} updatePrivacySettings={updatePrivacySettings} onShowPatternSetup={patternSetup.openPatternSetup} t={t} />
    },
    {
      id: 'reset',
      keywords: [
        t.settings.reset.title, t.settings.reset.description,
        'сброс', 'настройки', 'по умолчанию',
        'reset', 'default', 'settings'
      ],
      component: <ResetSection onShowResetDialog={handleShowResetDialog} t={t} />
    },
  ], [
    settings, updateSettings, updateReticle, updateStabilization, updateEnhancement,
    language, setLanguage, availableLanguages, t, apiKeyValidation, handleImgbbUpdate,
    handleCloudUpdate, handleProviderSettingsUpdate,
    storageInfo, handleShowClearDialog, canInstall, isInstalled, isInstalling,
    install, showIOSInstructions, privacySettings, updatePrivacySettings,
    patternSetup.openPatternSetup, handleShowResetDialog
  ]);

  const filteredSections = useMemo(() => {
    if (!isSearching) return null;
    
    const query = searchQuery.toLowerCase().trim();
    
    const matchingSections = searchableSections.filter(section =>
      section.keywords.filter(Boolean).some(keyword => 
        keyword.toLowerCase().includes(query)
      )
    );
    
    if (matchingSections.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {t.settings.search.noResults}
        </div>
      );
    }
    
    return (
      <>
        {matchingSections.map(section => (
          <AnimatedItem key={section.id}>
            {section.component}
          </AnimatedItem>
        ))}
      </>
    );
  }, [isSearching, searchQuery, searchableSections, t.settings.search.noResults]);

  if (isPreviewActive) {
    return null;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border safe-top bg-background/95 backdrop-blur-sm">
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

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
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
            filteredSections
          ) : (
            categorySections[activeCategory]
          )}
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
            <Button
              variant="ghost"
              onClick={patternSetup.cancelPatternSetup}
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

export default function SettingsPage() {
  return (
    <PreviewProvider>
      <SettingsPreview />
      <SettingsPageContent />
    </PreviewProvider>
  );
}
