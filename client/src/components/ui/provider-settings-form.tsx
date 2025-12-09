import { memo, useCallback } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LockedSlider } from "@/components/ui/locked-slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CloudProvider, ProviderSettings, ProviderSettingField } from "@/cloud-providers";

interface FieldTranslations {
  [key: string]: string | undefined;
}

interface ProviderSettingsFormProps {
  provider: CloudProvider;
  settings: ProviderSettings;
  onSettingsChange: (updates: Partial<ProviderSettings>) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidate: () => void;
  fieldTranslations: FieldTranslations;
  t: {
    validate: string;
    apiKeyValidated: string;
    configureFirst: string;
    getApiKey: string;
    neverExpires: string;
    hours24: string;
    never: string;
    seconds: string;
  };
}

function renderFieldValue(
  field: ProviderSettingField,
  value: unknown,
  onChange: (newValue: unknown) => void,
  isValidated: boolean,
  placeholder?: string
) {
  switch (field.type) {
    case "password":
    case "text":
      return (
        <Input
          type={field.type}
          placeholder={placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-${field.key}`}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          placeholder={placeholder}
          value={(value as number) || 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          data-testid={`input-${field.key}`}
        />
      );

    case "slider":
      return (
        <div className="space-y-2">
          <LockedSlider
            value={[(value as number) || 0]}
            onValueChange={([v]) => onChange(v)}
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            data-testid={`slider-${field.key}`}
          />
        </div>
      );

    case "switch":
      return (
        <Switch
          checked={(value as boolean) || false}
          onCheckedChange={onChange}
          disabled={!isValidated && field.key !== "isValidated"}
          data-testid={`switch-${field.key}`}
        />
      );

    default:
      return null;
  }
}

export const ProviderSettingsForm = memo(function ProviderSettingsForm({
  provider,
  settings,
  onSettingsChange,
  isValidating,
  validationError,
  onValidate,
  fieldTranslations,
  t,
}: ProviderSettingsFormProps) {
  const getLabel = (labelKey: string) => fieldTranslations[labelKey] || labelKey;
  const getDescription = (descriptionKey?: string) => descriptionKey ? fieldTranslations[descriptionKey] : undefined;
  const getPlaceholder = (placeholderKey?: string) => placeholderKey ? fieldTranslations[placeholderKey] : undefined;
  const apiKeyField = provider.settingsFields.find(f => f.required && f.type === "password");
  
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (apiKeyField && key === apiKeyField.key) {
        onSettingsChange({ [key]: value, isValidated: false });
      } else {
        onSettingsChange({ [key]: value });
      }
    },
    [onSettingsChange, apiKeyField]
  );
  const otherFields = provider.settingsFields.filter(f => f !== apiKeyField);

  return (
    <div className="space-y-4">
      {apiKeyField && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            {getLabel(apiKeyField.labelKey)}
          </Label>
          <div className="flex gap-2">
            {renderFieldValue(
              apiKeyField,
              settings[apiKeyField.key],
              (value) => handleFieldChange(apiKeyField.key, value),
              settings.isValidated,
              getPlaceholder(apiKeyField.placeholderKey)
            )}
            <Button
              variant="outline"
              onClick={onValidate}
              disabled={isValidating || !settings[apiKeyField.key]}
              data-testid="button-validate-api-key"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settings.isValidated ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                t.validate
              )}
            </Button>
          </div>
          {validationError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {validationError}
            </p>
          )}
          {settings.isValidated && !validationError && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t.apiKeyValidated}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t.getApiKey}{" "}
            <a
              href={provider.apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {new URL(provider.apiUrl).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}

      {otherFields.map((field) => {
        const value = settings[field.key];
        const isSlider = field.type === "slider";
        const isSwitch = field.type === "switch";

        const label = getLabel(field.labelKey);
        const description = getDescription(field.descriptionKey);
        const placeholder = getPlaceholder(field.placeholderKey);

        if (isSlider) {
          return (
            <div key={field.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  {label}
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(value as number) === 0
                    ? t.never
                    : `${value} ${t.seconds}`}
                </span>
              </div>
              {renderFieldValue(field, value, (v) => handleFieldChange(field.key, v), settings.isValidated, placeholder)}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t.neverExpires}</span>
                <span>{t.hours24}</span>
              </div>
            </div>
          );
        }

        if (isSwitch) {
          return (
            <div key={field.key} className="flex items-center justify-between">
              <Label htmlFor={field.key} className="flex items-center gap-2 cursor-pointer">
                <div>
                  <span>{label}</span>
                  {description && (
                    <p className="text-xs text-muted-foreground font-normal">
                      {description}
                    </p>
                  )}
                </div>
              </Label>
              {renderFieldValue(field, value, (v) => handleFieldChange(field.key, v), settings.isValidated, placeholder)}
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-2">
            <Label>{label}</Label>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {renderFieldValue(field, value, (v) => handleFieldChange(field.key, v), settings.isValidated, placeholder)}
          </div>
        );
      })}

      {!settings.isValidated && (
        <p className="text-xs text-amber-500">
          {t.configureFirst}
        </p>
      )}
    </div>
  );
});
