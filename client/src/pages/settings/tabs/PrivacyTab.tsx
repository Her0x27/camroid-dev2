import { memo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shield, Eye, Hand, Clock3, Settings2, Fingerprint, Layers, ChevronDown, ChevronUp, KeyRound, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LockedSlider } from "@/components/ui/locked-slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsCard } from "../components/SettingsCard";
import { SettingItem, SettingItemCompact, SettingSliderItem, SettingSelectItem } from "../components/SettingItem";
import { ModulePreview } from "../components";
import { privacyModuleRegistry } from "@/privacy_modules";
import { validateSequence } from "@/privacy_modules/calculator/config";
import type { Translations } from "@/lib/i18n";

const panelVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

interface PrivacySettings {
  enabled: boolean;
  gestureType: 'patternUnlock' | 'severalFingers';
  secretPattern: string;
  autoLockMinutes: number;
  unlockFingers: number;
  selectedModule: string;
  moduleUnlockValues: Record<string, string>;
}

interface PrivacyTabProps {
  privacySettings: PrivacySettings;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  onShowPatternSetup: () => void;
  t: Translations;
}

export const PrivacyTab = memo(function PrivacyTab({
  privacySettings,
  updatePrivacySettings,
  onShowPatternSetup,
  t,
}: PrivacyTabProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [sequenceValidationError, setSequenceValidationError] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const currentModule = privacyModuleRegistry.get(privacySettings.selectedModule);
  const currentUnlockValue = privacySettings.moduleUnlockValues[privacySettings.selectedModule] || '';

  const handleModuleUnlockValueChange = (value: string) => {
    const isSequenceType = currentModule?.unlockMethod.type === 'sequence';
    
    if (isSequenceType) {
      const { isValid, filtered } = validateSequence(value);
      setSequenceValidationError(!isValid && value.length > 0);
      updatePrivacySettings({
        moduleUnlockValues: {
          ...privacySettings.moduleUnlockValues,
          [privacySettings.selectedModule]: filtered,
        },
      });
    } else {
      updatePrivacySettings({
        moduleUnlockValues: {
          ...privacySettings.moduleUnlockValues,
          [privacySettings.selectedModule]: value,
        },
      });
    }
  };

  const handleEnablePrivacy = (checked: boolean) => {
    if (checked) {
      setShowActivationDialog(true);
    } else {
      updatePrivacySettings({ enabled: false });
    }
  };

  const confirmActivation = () => {
    updatePrivacySettings({ enabled: true });
    setShowActivationDialog(false);
  };

  const getUnlockInstructions = () => {
    const module = privacyModuleRegistry.get(privacySettings.selectedModule);
    if (!module) return null;

    const moduleUnlockValue = privacySettings.moduleUnlockValues[privacySettings.selectedModule] || module.unlockMethod.defaultValue;
    
    const instructions = [];
    
    if (module.unlockMethod.type === 'sequence') {
      instructions.push({
        icon: KeyRound,
        title: (t.settings.privacy.moduleUnlock as Record<string, string>).sequenceLabel || 'Secret sequence',
        description: `${(t.settings.privacy.moduleUnlock as Record<string, string>).sequenceDesc || 'Enter this sequence in calculator'}: ${moduleUnlockValue}`,
      });
    } else if (module.unlockMethod.type === 'phrase') {
      instructions.push({
        icon: KeyRound,
        title: (t.settings.privacy.moduleUnlock as Record<string, string>).phraseLabel || 'Secret phrase',
        description: `${(t.settings.privacy.moduleUnlock as Record<string, string>).phraseDesc || 'Type this phrase in notepad'}: ${moduleUnlockValue}`,
      });
    }

    if (privacySettings.gestureType === 'patternUnlock') {
      instructions.push({
        icon: Hand,
        title: t.settings.privacy.patternUnlock,
        description: t.settings.privacy.patternUnlockHint,
      });
    } else {
      instructions.push({
        icon: Fingerprint,
        title: t.settings.privacy.severalFingers,
        description: `${t.settings.privacy.severalFingersHint} (${privacySettings.unlockFingers} ${t.settings.privacy.fingerCount.toLowerCase()})`,
      });
    }

    return instructions;
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={<Shield className="w-5 h-5" />}
        title={t.settings.privacy.title}
        description={t.settings.privacy.description}
        testId="section-privacy"
      >
        <SettingItemCompact
          icon={<Eye className="w-4 h-4" />}
          title={t.settings.privacy.enabled}
          description={t.settings.privacy.enabledDesc}
          testId="setting-privacy-enabled"
        >
          <Switch
            id="privacy-enabled"
            checked={privacySettings.enabled}
            onCheckedChange={handleEnablePrivacy}
            data-testid="switch-privacy-enabled"
          />
        </SettingItemCompact>

        {privacySettings.enabled && (
          <>
            <Separator />

            <SettingSelectItem
              icon={<Layers className="w-4 h-4" />}
              title={t.settings.privacy.module}
              description={t.settings.privacy.moduleDesc}
              testId="setting-module"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={privacySettings.selectedModule}
                  onValueChange={(value) => {
                    setSequenceValidationError(false);
                    updatePrivacySettings({ selectedModule: value });
                  }}
                >
                  <SelectTrigger data-testid="select-module" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyModuleRegistry.getAll().map((module) => (
                      <SelectItem key={module.id} value={module.id} className="min-h-[44px]">
                        <span className="flex items-center gap-2">
                          <module.icon className="w-4 h-4" />
                          {module.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <span className="flex items-center gap-2">
                    {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {t.settings.privacy.modulePreview}
                  </span>
                </Button>
              </div>
            </SettingSelectItem>

            {showPreview && (
              <ModulePreview 
                moduleId={privacySettings.selectedModule}
                unlockLabels={{
                  sequenceLabel: (t.settings.privacy.moduleUnlock as Record<string, string>).sequenceLabel || 'Sequence',
                  phraseLabel: (t.settings.privacy.moduleUnlock as Record<string, string>).phraseLabel || 'Phrase',
                  swipePatternLabel: (t.settings.privacy.moduleUnlock as Record<string, string>).swipePatternLabel || 'Swipe Pattern',
                }}
              />
            )}

            {currentModule && currentModule.unlockMethod.type !== 'swipePattern' && (
              <>
                <Separator />
                <SettingItem
                  icon={<Settings2 className="w-4 h-4" />}
                  title={(t.settings.privacy.moduleUnlock as Record<string, string>)[currentModule.unlockMethod.labelKey] || currentModule.unlockMethod.labelKey}
                  description={
                    currentModule.unlockMethod.type === 'sequence'
                      ? (t.settings.privacy.moduleUnlock as Record<string, string>).sequenceDesc || 'Enter a secret sequence to unlock'
                      : (t.settings.privacy.moduleUnlock as Record<string, string>).phraseDesc || 'Enter a secret phrase to unlock'
                  }
                  testId="setting-module-unlock"
                  vertical
                >
                  <Input
                    type="text"
                    value={currentUnlockValue}
                    onChange={(e) => handleModuleUnlockValueChange(e.target.value)}
                    placeholder={(t.settings.privacy.moduleUnlock as Record<string, string>)[currentModule.unlockMethod.placeholderKey || ''] || currentModule.unlockMethod.defaultValue}
                    className={`min-h-[44px] ${sequenceValidationError && currentModule.unlockMethod.type === 'sequence' ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                    data-testid="input-module-unlock"
                  />
                  {sequenceValidationError && currentModule.unlockMethod.type === 'sequence' && (
                    <p className="text-xs text-amber-500 mt-2">
                      {(t.settings.privacy.moduleUnlock as Record<string, string>).sequenceValidationError || 'Only digits and calculator symbols allowed'}
                    </p>
                  )}
                </SettingItem>
              </>
            )}

            <Separator />

            <SettingSelectItem
              icon={<Hand className="w-4 h-4" />}
              title={t.settings.privacy.secretGesture}
              description={
                privacySettings.gestureType === 'patternUnlock'
                  ? t.settings.privacy.patternUnlockHint
                  : t.settings.privacy.severalFingersHint
              }
              platformTip={
                privacySettings.gestureType === 'patternUnlock'
                  ? { 
                      ios: "На iOS может работать медленнее из-за ограничений браузера",
                      desktop: "Используйте мышь для рисования паттерна",
                    }
                  : { 
                      android: "Android поддерживает больше пальцев одновременно",
                      desktop: "На desktop используйте паттерн вместо жестов",
                    }
              }
              testId="setting-gesture-type"
            >
              <Select
                value={privacySettings.gestureType}
                onValueChange={(value) => updatePrivacySettings({ gestureType: value as 'patternUnlock' | 'severalFingers' })}
              >
                <SelectTrigger data-testid="select-gesture-type" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patternUnlock" className="min-h-[44px]">{t.settings.privacy.patternUnlock}</SelectItem>
                  <SelectItem value="severalFingers" className="min-h-[44px]">{t.settings.privacy.severalFingers}</SelectItem>
                </SelectContent>
              </Select>
            </SettingSelectItem>

            {privacySettings.gestureType === 'patternUnlock' && (
              <SettingItem
                icon={<Settings2 className="w-4 h-4" />}
                title={privacySettings.secretPattern ? t.settings.privacy.changePattern : t.settings.privacy.setPattern}
                description={t.settings.privacy.patternUnlockHint}
                badge={!privacySettings.secretPattern ? "!" : undefined}
                platformTip={{ 
                  ios: "На iOS может работать медленнее из-за ограничений браузера",
                  desktop: "Используйте мышь для рисования паттерна",
                }}
                testId="setting-pattern"
              >
                <Button
                  variant="outline"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={onShowPatternSetup}
                  data-testid="button-set-pattern"
                >
                  {privacySettings.secretPattern ? t.settings.privacy.changeSecretPattern : t.settings.privacy.setSecretPattern}
                </Button>
              </SettingItem>
            )}

            {privacySettings.gestureType === 'severalFingers' && (
              <SettingSliderItem
                icon={<Fingerprint className="w-4 h-4" />}
                title={t.settings.privacy.fingerCount}
                description={t.settings.privacy.fingerCountDesc}
                value={privacySettings.unlockFingers}
                platformTip={{ 
                  android: "Android поддерживает больше пальцев одновременно",
                  desktop: "На desktop слайдер управляется мышью",
                }}
                testId="setting-finger-count"
              >
                <LockedSlider
                  value={[privacySettings.unlockFingers]}
                  onValueChange={([value]) => updatePrivacySettings({ unlockFingers: value })}
                  min={3}
                  max={9}
                  step={1}
                  className="min-h-[44px]"
                  data-testid="slider-unlock-fingers"
                />
              </SettingSliderItem>
            )}

            <Separator />

            <SettingSliderItem
              icon={<Clock3 className="w-4 h-4" />}
              title={t.settings.privacy.autoLock}
              description={t.settings.privacy.autoLockDesc}
              value={privacySettings.autoLockMinutes}
              unit={` ${t.settings.privacy.min}`}
              testId="setting-auto-lock"
            >
              <LockedSlider
                value={[privacySettings.autoLockMinutes]}
                onValueChange={([value]) => updatePrivacySettings({ autoLockMinutes: value })}
                min={1}
                max={30}
                step={1}
                className="min-h-[44px]"
                data-testid="slider-auto-lock"
              />
            </SettingSliderItem>
          </>
        )}
      </SettingsCard>

      <AnimatePresence>
        {showActivationDialog && (
          <>
            {shouldReduceMotion ? (
              <div
                className="fixed inset-0 bg-black/40 z-50"
                aria-hidden="true"
              />
            ) : (
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                aria-hidden="true"
              />
            )}
            
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-4 bottom-4 md:inset-auto md:right-4 md:bottom-4 md:w-[420px] z-50"
              variants={shouldReduceMotion ? {} : panelVariants}
              initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
              animate={shouldReduceMotion ? { opacity: 1 } : "visible"}
              exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
            >
              <div className="relative bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                
                <div className="flex items-center gap-3 p-4 border-b border-border/40">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Unlock className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t.settings.privacy.activationTitle || 'Активация приватности'}</h2>
                    <p className="text-[11px] text-muted-foreground">{t.settings.privacy.activationDesc || 'Запомните как разблокировать камеру'}</p>
                  </div>
                </div>

                <ScrollArea className="max-h-[50vh]">
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {t.settings.privacy.unlockMethods || 'Способы разблокировки'}
                      </h3>
                      
                      {getUnlockInstructions()?.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <instruction.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium">{instruction.title}</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                              {instruction.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        {t.settings.privacy.activationWarning || 'После сворачивания приложения камера будет скрыта. Используйте указанные методы для разблокировки.'}
                      </p>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border/40 bg-muted/20 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 min-h-[44px] text-sm"
                    onClick={() => setShowActivationDialog(false)}
                  >
                    {t.common?.cancel || 'Отмена'}
                  </Button>
                  <Button 
                    className="flex-1 min-h-[44px] text-sm"
                    onClick={confirmActivation}
                  >
                    {t.settings.privacy.activationConfirm || 'Понятно, включить'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
