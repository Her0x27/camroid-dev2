import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Camera,
  MapPin,
  Compass,
  Focus,
  HardDrive,
  Download,
  Cloud,
  Check,
  X,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  EyeOff,
  Lock,
  Lightbulb,
  Crosshair,
  Type,
  ShieldAlert,
  Move,
  Palette,
  EyeClosed,
  Sparkles,
  Bell,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  checkAppCapabilities,
  isDismissed,
  setDismissed,
  type AppCapabilities,
  type DeviceInfo,
  type PlatformTipKey,
} from "@/lib/app-capabilities";

interface AppCapabilitiesDialogProps {
  onClose: () => void;
}

const capabilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  geolocation: MapPin,
  orientation: Compass,
  stabilization: Focus,
  localStorage: HardDrive,
  pwa: Download,
  cloudUpload: Cloud,
};

function DeviceInfoDisplay({ device }: { device: DeviceInfo }) {
  const Icon = device.isMobile ? Smartphone : Monitor;
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
      <Icon className="h-3.5 w-3.5" />
      <span>{device.os}</span>
      <span className="text-muted-foreground/50">•</span>
      <Globe className="h-3.5 w-3.5" />
      <span>{device.browser}</span>
    </div>
  );
}

function PrivacySection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
      <h4 className="text-xs font-medium flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-primary" />
        {t.capabilities.privacy.title}
      </h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {t.capabilities.privacy.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <HardDrive className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-xs font-medium">{t.capabilities.privacy.localStorageOnly}</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.capabilities.privacy.localStorageOnlyDesc}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <EyeOff className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-xs font-medium">{t.capabilities.privacy.hiddenFromGallery}</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.capabilities.privacy.hiddenFromGalleryDesc}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-xs font-medium">{t.capabilities.privacy.fullControl}</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.capabilities.privacy.fullControlDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformTip({ tipKey, t }: { tipKey: PlatformTipKey; t: ReturnType<typeof useI18n>['t'] }) {
  const tip = t.capabilities.platformTips[tipKey];
  if (!tip) return null;
  
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {t.capabilities.platformTips.title}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
}

const appFeaturesList = [
  { id: 'watermark', icon: Type },
  { id: 'gpsProtection', icon: ShieldAlert },
  { id: 'reticle', icon: Crosshair },
  { id: 'reticleAdjustment', icon: Move },
  { id: 'autoColor', icon: Palette },
  { id: 'privacyMode', icon: EyeClosed },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 28,
    },
  },
};

function FeatureItem({ feature, t }: { 
  feature: typeof appFeaturesList[number]; 
  t: ReturnType<typeof useI18n>['t'];
}) {
  const Icon = feature.icon;
  const titleKey = feature.id as keyof typeof t.capabilities.appFeatures;
  const descKey = `${feature.id}Desc` as keyof typeof t.capabilities.appFeatures;
  
  return (
    <div className="group relative flex items-center gap-2.5 p-2.5 rounded-md bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 cursor-default overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40 group-hover:bg-primary/70 transition-colors" />
      
      <div className="shrink-0 w-7 h-7 rounded-md bg-muted/80 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-foreground/70" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium block truncate">
          {t.capabilities.appFeatures[titleKey]}
        </span>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {t.capabilities.appFeatures[descKey]}
        </p>
      </div>
    </div>
  );
}

function AppFeaturesSection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {t.capabilities.appFeaturesTitle}
      </h4>
      
      {shouldReduceMotion ? (
        <div className="space-y-1.5">
          {appFeaturesList.map((feature) => (
            <FeatureItem key={feature.id} feature={feature} t={t} />
          ))}
        </div>
      ) : (
        <motion.div 
          className="space-y-1.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {appFeaturesList.map((feature) => (
            <motion.div key={feature.id} variants={itemVariants}>
              <FeatureItem feature={feature} t={t} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

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

export function AppCapabilitiesDialog({ onClose }: AppCapabilitiesDialogProps) {
  const { t } = useI18n();
  const [capabilities, setCapabilities] = useState<AppCapabilities | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    checkAppCapabilities().then(setCapabilities);
  }, []);

  useEffect(() => {
    if (isVisible && continueButtonRef.current) {
      continueButtonRef.current.focus();
    }
  }, [isVisible, capabilities]);

  const handleExitComplete = useCallback(() => {
    onClose();
  }, [onClose]);

  const initiateClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    if (dontShowAgain) {
      setDismissed(true);
    }
    setIsVisible(false);
  }, [isExiting, dontShowAgain]);

  const handleClose = useCallback(() => {
    initiateClose();
  }, [initiateClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && isVisible && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, isExiting]);

  if (!capabilities) {
    return null;
  }

  const supportedCapabilities = capabilities.capabilities.filter(c => c.supported);
  const unsupportedCapabilities = capabilities.capabilities.filter(c => !c.supported);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="capabilities-title"
            aria-describedby="capabilities-description"
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
                  <Bell className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 id="capabilities-title" className="text-sm font-semibold">{t.capabilities.title}</h2>
                  <p id="capabilities-description" className="text-[11px] text-muted-foreground">{t.capabilities.description}</p>
                </div>
              </div>

              <ScrollArea className="h-[50vh] md:h-[60vh]">
                <div className="p-4 space-y-4">
                  <DeviceInfoDisplay device={capabilities.device} />

                  <div className="space-y-3">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {t.capabilities.permissionsTitle}
                    </h3>
                    
                    {supportedCapabilities.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          {t.capabilities.supported}
                        </h4>
                        <ul className="space-y-2">
                          {supportedCapabilities.map((cap) => {
                            const Icon = capabilityIcons[cap.id] || Check;
                            const noteKey = cap.note as keyof typeof t.capabilities.notes | undefined;
                            const descKey = cap.id as keyof typeof t.capabilities.descriptions;
                            return (
                              <li key={cap.id} className="flex items-start gap-2 text-xs">
                                <Icon className="h-3.5 w-3.5 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                                <div>
                                  <span className="font-medium">{t.capabilities.features[cap.id as keyof typeof t.capabilities.features]}</span>
                                  {t.capabilities.descriptions[descKey] && (
                                    <span className="text-muted-foreground text-[11px] block leading-relaxed">
                                      {t.capabilities.descriptions[descKey]}
                                    </span>
                                  )}
                                  {noteKey && t.capabilities.notes[noteKey] && (
                                    <span className="text-amber-600 dark:text-amber-400 text-[11px] block mt-0.5">
                                      {t.capabilities.notes[noteKey]}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {unsupportedCapabilities.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-destructive mb-1.5 flex items-center gap-1.5">
                          <X className="h-3.5 w-3.5" />
                          {t.capabilities.notSupported}
                        </h4>
                        <ul className="space-y-2">
                          {unsupportedCapabilities.map((cap) => {
                            const Icon = capabilityIcons[cap.id] || X;
                            const noteKey = cap.note as keyof typeof t.capabilities.notes | undefined;
                            const descKey = cap.id as keyof typeof t.capabilities.descriptions;
                            return (
                              <li key={cap.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <div>
                                  <span>{t.capabilities.features[cap.id as keyof typeof t.capabilities.features]}</span>
                                  {t.capabilities.descriptions[descKey] && (
                                    <span className="text-[11px] block leading-relaxed">
                                      {t.capabilities.descriptions[descKey]}
                                    </span>
                                  )}
                                  {noteKey && t.capabilities.notes[noteKey] && (
                                    <span className="text-[11px] block mt-0.5">
                                      {t.capabilities.notes[noteKey]}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <AppFeaturesSection t={t} />
                  
                  <PrivacySection t={t} />
                  
                  {capabilities.platformTip && (
                    <PlatformTip tipKey={capabilities.platformTip} t={t} />
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/40 bg-muted/20">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="dont-show-again"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  />
                  <Label
                    htmlFor="dont-show-again"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    {t.capabilities.dontShowAgain}
                  </Label>
                </div>
                <Button ref={continueButtonRef} onClick={handleClose} className="w-full h-9 text-sm">
                  {t.capabilities.continue}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useAppCapabilitiesDialog() {
  const [showDialog, setShowDialog] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      const dismissed = isDismissed();
      setShowDialog(!dismissed);
      setChecked(true);
    }
  }, [checked]);

  const closeDialog = () => setShowDialog(false);

  return { showDialog, closeDialog };
}
