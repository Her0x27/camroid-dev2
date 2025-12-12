import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  AlertTriangle,
  Calendar,
  Ban,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  checkAppCapabilities,
  isDismissed,
  setDismissed,
  type AppCapabilities,
  type AppCapability,
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

function AboutSection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-foreground">{t.capabilities.subtitle}</h4>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {t.capabilities.description}
          </p>
        </div>
      </div>
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

function CapabilitiesSection({ capabilities, t }: { 
  capabilities: AppCapability[];
  t: ReturnType<typeof useI18n>['t'] 
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
        <Settings className="h-3.5 w-3.5 text-primary" />
        {t.capabilities.capabilitiesTitle}
      </h4>
      
      <div className="grid grid-cols-2 gap-1.5">
        {capabilities.map((cap) => {
          const Icon = capabilityIcons[cap.id] || Check;
          return (
            <div 
              key={cap.id}
              className="flex items-center gap-2 p-2 rounded-md bg-card/30 border border-border/30"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${cap.supported ? 'text-primary' : 'text-muted-foreground/50'}`} />
              <span className={`text-[11px] truncate ${cap.supported ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                {t.capabilities.features[cap.id as keyof typeof t.capabilities.features]}
              </span>
              {cap.supported ? (
                <Check className="h-3 w-3 text-primary ml-auto shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/50 ml-auto shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationsSection({ device, platformTip, t }: { 
  device: DeviceInfo; 
  platformTip?: PlatformTipKey;
  t: ReturnType<typeof useI18n>['t'] 
}) {
  const hasRecommendations = device.os === 'iOS' || platformTip;
  if (!hasRecommendations) return null;
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        {t.capabilities.recommendationsTitle}
      </h4>
      
      {platformTip && (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t.capabilities.platformTips[platformTip]}
          </p>
        </div>
      )}
      
      {device.os === 'iOS' && (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-xs font-medium">{t.capabilities.iosStorageWarning.title}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t.capabilities.iosStorageWarning.description}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Download className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{t.capabilities.iosStorageWarning.installPwa}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{t.capabilities.iosStorageWarning.useRegularly}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{t.capabilities.iosStorageWarning.cloudBackup}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ban className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{t.capabilities.iosStorageWarning.avoidPrivate}</span>
            </div>
          </div>
        </div>
      )}
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
    <div className="group flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-default">
      <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground/90">
          {t.capabilities.appFeatures[titleKey]}
        </div>
        <div className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
          {t.capabilities.appFeatures[descKey]}
        </div>
      </div>
    </div>
  );
}

function AppFeaturesSection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  const shouldReduceMotion = useReducedMotion();
  
  const renderFeatures = () => (
    <div className="space-y-2">
      {appFeaturesList.map((feature) => (
        shouldReduceMotion ? (
          <FeatureItem key={feature.id} feature={feature} t={t} />
        ) : (
          <motion.div key={feature.id} variants={itemVariants}>
            <FeatureItem feature={feature} t={t} />
          </motion.div>
        )
      ))}
    </div>
  );
  
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {t.capabilities.appFeaturesTitle}
      </h4>
      
      {shouldReduceMotion ? (
        renderFeatures()
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {renderFeatures()}
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
            <div className="relative bg-background/98 backdrop-blur-xl border-2 border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
              
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
                  
                  <Separator className="my-3" />
                  
                  <AboutSection t={t} />
                  
                  <Separator className="my-3" />
                  
                  <AppFeaturesSection t={t} />
                  
                  <Separator className="my-3" />
                  
                  <CapabilitiesSection capabilities={capabilities.capabilities} t={t} />
                  
                  <Separator className="my-3" />
                  
                  <PrivacySection t={t} />
                  
                  <Separator className="my-3" />
                  
                  <RecommendationsSection 
                    device={capabilities.device} 
                    platformTip={capabilities.platformTip}
                    t={t} 
                  />
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
  const [showDialog, setShowDialog] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = isDismissed();
    return !dismissed;
  });

  const closeDialog = () => setShowDialog(false);

  return { showDialog, closeDialog };
}
