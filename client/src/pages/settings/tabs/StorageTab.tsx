import { memo, useMemo } from "react";
import { Database, Cloud, Trash2, HardDrive, Image, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "../components/SettingsCard";
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
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <Image className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{storageInfo.photos}</div>
                <div className="text-xs text-muted-foreground">{t.settings.storage.photosStored}</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <HardDrive className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{formatBytes(storageInfo.used)}</div>
                <div className="text-xs text-muted-foreground">{t.settings.storage.storageUsed}</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <Server className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{formatBytes(storageInfo.quota - storageInfo.used)}</div>
                <div className="text-xs text-muted-foreground">{t.settings.storage.available}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.settings.storage.storageUsed}</span>
                <span className="font-mono">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <div className="space-y-3">
            <Label>{t.settings.cloud.provider || "Cloud Provider"}</Label>
            <ProviderSelector
              selectedProviderId={selectedProviderId}
              onProviderChange={handleProviderChange}
            />
          </div>

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
