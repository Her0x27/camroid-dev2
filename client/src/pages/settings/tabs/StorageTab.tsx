import { memo, useMemo } from "react";
import { Database, Cloud, Trash2, HardDrive, Image, Server, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SettingsCard } from "../components/SettingsCard";
import { SettingSelectItem } from "../components/SettingItem";
import { ProviderSelector } from "@/components/ui/provider-selector";
import { ProviderSettingsForm } from "@/components/ui/provider-settings-form";
import { cloudProviderRegistry, type ProviderSettings } from "@/cloud-providers";
import { formatBytes } from "@/lib/date-utils";
import { useI18n } from "@/lib/i18n";
import type { Settings, ImgbbSettings, CloudSettings } from "@shared/schema";

interface StorageInfo {
  photos: number;
  used: number;
  quota: number;
}

interface StorageTabProps {
  storageInfo: StorageInfo | null;
  onShowClearDialog: () => void;
  settings: Settings;
  apiKeyInput: string;
  onApiKeyChange: (value: string) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidateApiKey: () => void;
  onImgbbUpdate: (updates: Partial<ImgbbSettings>) => void;
  onCloudUpdate?: (updates: Partial<CloudSettings>) => void;
  onProviderSettingsUpdate?: (providerId: string, updates: Partial<ProviderSettings>) => void;
}

export const StorageTab = memo(function StorageTab({
  storageInfo,
  onShowClearDialog,
  settings,
  apiKeyInput,
  onApiKeyChange,
  isValidating,
  validationError,
  onValidateApiKey,
  onImgbbUpdate,
  onCloudUpdate,
  onProviderSettingsUpdate,
}: StorageTabProps) {
  const { t } = useI18n();

  const selectedProviderId = settings.cloud?.selectedProvider || "imgbb";
  const provider = cloudProviderRegistry.get(selectedProviderId);

  const providerSettings = useMemo((): ProviderSettings => {
    if (selectedProviderId === "imgbb") {
      return {
        isValidated: settings.imgbb?.isValidated ?? false,
        apiKey: settings.imgbb?.apiKey ?? "",
        expiration: settings.imgbb?.expiration ?? 0,
        autoUpload: settings.imgbb?.autoUpload ?? false,
      };
    }
    const stored = settings.cloud?.providers?.[selectedProviderId];
    if (stored) {
      return stored;
    }
    return provider?.getDefaultSettings() || { isValidated: false };
  }, [selectedProviderId, settings.imgbb, settings.cloud?.providers, provider]);

  const handleProviderChange = (providerId: string) => {
    onCloudUpdate?.({ selectedProvider: providerId });
  };

  const handleSettingsChange = (updates: Partial<ProviderSettings>) => {
    if (selectedProviderId === "imgbb") {
      onImgbbUpdate(updates as Partial<ImgbbSettings>);
      if ('apiKey' in updates && updates.apiKey !== settings.imgbb?.apiKey) {
        onApiKeyChange(updates.apiKey as string);
      }
    } else {
      onProviderSettingsUpdate?.(selectedProviderId, updates);
    }
  };

  const formTranslations = useMemo(() => ({
    validate: t.settings.cloud.validate,
    apiKeyValidated: t.settings.cloud.apiKeyValidated,
    configureFirst: t.settings.cloud.configureFirst,
    getApiKey: t.settings.cloud.getApiKey,
    neverExpires: t.settings.cloud.neverExpires,
    hours24: t.settings.cloud.hours24,
    never: t.common.never,
    seconds: t.common.seconds,
  }), [t]);

  const fieldTranslations = useMemo(() => ({
    apiKey: t.settings.cloud.apiKey,
    enterApiKey: t.settings.cloud.enterApiKey,
    photoExpiration: t.settings.cloud.photoExpiration,
    photoExpirationDesc: t.settings.cloud.photoExpirationDesc,
    autoUpload: t.settings.cloud.autoUpload,
    autoUploadDesc: t.settings.cloud.autoUploadDesc,
  }), [t]);

  const currentSettings = useMemo((): ProviderSettings => {
    if (selectedProviderId === "imgbb") {
      return {
        ...providerSettings,
        apiKey: apiKeyInput,
      };
    }
    return providerSettings;
  }, [selectedProviderId, providerSettings, apiKeyInput]);

  const usagePercent = storageInfo ? Math.min((storageInfo.used / storageInfo.quota) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={<Database className="w-5 h-5" />}
        title={t.settings.storage.title}
        description={t.settings.storage.description}
        testId="section-storage"
      >
        {storageInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 hover:border-primary/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                <div className="relative">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{storageInfo.photos}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{t.settings.storage.photosStored}</div>
                </div>
              </div>
              <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
                <div className="relative">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{formatBytes(storageInfo.used)}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{t.settings.storage.storageUsed}</div>
                </div>
              </div>
              <div className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                <div className="relative">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{formatBytes(storageInfo.quota - storageInfo.used)}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{t.settings.storage.available}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.settings.storage.storageUsed}</span>
                <span className="font-mono font-medium">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-500 rounded-full"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50"
          onClick={onShowClearDialog}
          disabled={!storageInfo || storageInfo.photos === 0}
          data-testid="button-clear-storage"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t.settings.storage.clearAllPhotos}
        </Button>
      </SettingsCard>

      {provider && (
        <SettingsCard
          icon={<Cloud className="w-5 h-5" />}
          title={t.settings.cloud.title}
          description={t.settings.cloud.description}
          testId="section-cloud-upload"
        >
          <SettingSelectItem
            icon={<Upload className="w-4 h-4" />}
            title={t.settings.cloud.provider || "Облачный провайдер"}
            description={t.settings.cloud.providerDesc || "Выберите сервис для загрузки фотографий в облако"}
            platformTip={{
              ios: "Фото автоматически сохраняются в галерею",
              android: "Разрешите доступ к хранилищу для загрузки",
            }}
            testId="setting-cloud-provider"
          >
            <ProviderSelector
              selectedProviderId={selectedProviderId}
              onProviderChange={handleProviderChange}
            />
          </SettingSelectItem>

          <Separator />

          <ProviderSettingsForm
            provider={provider}
            settings={currentSettings}
            onSettingsChange={handleSettingsChange}
            isValidating={isValidating}
            validationError={validationError}
            onValidate={onValidateApiKey}
            fieldTranslations={fieldTranslations}
            t={formTranslations}
          />
        </SettingsCard>
      )}
    </div>
  );
});
