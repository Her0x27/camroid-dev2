import { memo, useMemo } from "react";
import { Cloud, Separator } from "lucide-react";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ProviderSelector } from "@/components/ui/provider-selector";
import { ProviderSettingsForm } from "@/components/ui/provider-settings-form";
import { cloudProviderRegistry, type ProviderSettings } from "@/cloud-providers";
import { Label } from "@/components/ui/label";
import { Separator as UISeparator } from "@/components/ui/separator";
import type { Settings, ImgbbSettings, CloudSettings } from "@shared/schema";
import type { Translations } from "@/lib/i18n";

interface CloudUploadSectionProps {
  settings: Settings;
  apiKeyInput: string;
  onApiKeyChange: (value: string) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidateApiKey: () => void;
  onImgbbUpdate: (updates: Partial<ImgbbSettings>) => void;
  onCloudUpdate?: (updates: Partial<CloudSettings>) => void;
  onProviderSettingsUpdate?: (providerId: string, updates: Partial<ProviderSettings>) => void;
  t: Translations;
}

export const CloudUploadSection = memo(function CloudUploadSection({
  settings,
  apiKeyInput,
  onApiKeyChange,
  isValidating,
  validationError,
  onValidateApiKey,
  onImgbbUpdate,
  onCloudUpdate,
  onProviderSettingsUpdate,
  t,
}: CloudUploadSectionProps) {
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

  const handleApiKeyInputChange = (value: string) => {
    onApiKeyChange(value);
    if (selectedProviderId === "imgbb" && settings.imgbb?.isValidated) {
      onImgbbUpdate({ isValidated: false });
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

  const currentSettings = useMemo((): ProviderSettings => {
    if (selectedProviderId === "imgbb") {
      return {
        ...providerSettings,
        apiKey: apiKeyInput,
      };
    }
    return providerSettings;
  }, [selectedProviderId, providerSettings, apiKeyInput]);

  if (!provider) {
    return null;
  }

  return (
    <CollapsibleCard
      icon={<Cloud className="w-5 h-5" />}
      title={t.settings.cloud.title}
      description={t.settings.cloud.description}
      testId="section-cloud-upload"
      defaultOpen={false}
    >
      <div className="space-y-3">
        <Label>{t.settings.cloud.provider || "Cloud Provider"}</Label>
        <ProviderSelector
          selectedProviderId={selectedProviderId}
          onProviderChange={handleProviderChange}
        />
      </div>

      <UISeparator />

      <ProviderSettingsForm
        provider={provider}
        settings={currentSettings}
        onSettingsChange={handleSettingsChange}
        isValidating={isValidating}
        validationError={validationError}
        onValidate={onValidateApiKey}
        t={formTranslations}
      />
    </CollapsibleCard>
  );
});
