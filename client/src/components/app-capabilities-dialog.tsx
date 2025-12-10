import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
      <Icon className="h-4 w-4" />
      <span>{device.os}</span>
      <span className="text-muted-foreground/50">•</span>
      <Globe className="h-4 w-4" />
      <span>{device.browser}</span>
    </div>
  );
}

function PrivacySection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        {t.capabilities.privacy.title}
      </h4>
      <p className="text-xs text-muted-foreground">
        {t.capabilities.privacy.description}
      </p>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <HardDrive className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-sm font-medium">{t.capabilities.privacy.localStorageOnly}</span>
            <p className="text-xs text-muted-foreground">
              {t.capabilities.privacy.localStorageOnlyDesc}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <EyeOff className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-sm font-medium">{t.capabilities.privacy.hiddenFromGallery}</span>
            <p className="text-xs text-muted-foreground">
              {t.capabilities.privacy.hiddenFromGalleryDesc}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div>
            <span className="text-sm font-medium">{t.capabilities.privacy.fullControl}</span>
            <p className="text-xs text-muted-foreground">
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
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t.capabilities.platformTips.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
}

const appFeaturesList = [
  { id: 'watermark', icon: Type, color: 'from-blue-500 to-cyan-500' },
  { id: 'gpsProtection', icon: ShieldAlert, color: 'from-amber-500 to-orange-500' },
  { id: 'reticle', icon: Crosshair, color: 'from-emerald-500 to-green-500' },
  { id: 'reticleAdjustment', icon: Move, color: 'from-violet-500 to-purple-500' },
  { id: 'autoColor', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { id: 'privacyMode', icon: EyeClosed, color: 'from-slate-500 to-zinc-500' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
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
    <div className="group relative flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 cursor-default overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${feature.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
      
      <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate">
          {t.capabilities.appFeatures[titleKey]}
        </span>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {t.capabilities.appFeatures[descKey]}
        </p>
      </div>
      
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}

function AppFeaturesSection({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        {t.capabilities.appFeaturesTitle}
      </h4>
      
      {shouldReduceMotion ? (
        <div className="space-y-2">
          {appFeaturesList.map((feature) => (
            <FeatureItem key={feature.id} feature={feature} t={t} />
          ))}
        </div>
      ) : (
        <motion.div 
          className="space-y-2"
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

export function AppCapabilitiesDialog({ onClose }: AppCapabilitiesDialogProps) {
  const { t } = useI18n();
  const [capabilities, setCapabilities] = useState<AppCapabilities | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    checkAppCapabilities().then(setCapabilities);
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      setDismissed(true);
    }
    setOpen(false);
    onClose();
  };

  const handleCloseAlways = () => {
    setDismissed(true);
    setOpen(false);
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleCloseAlways();
    }
  };

  if (!capabilities) {
    return null;
  }

  const supportedCapabilities = capabilities.capabilities.filter(c => c.supported);
  const unsupportedCapabilities = capabilities.capabilities.filter(c => !c.supported);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" hideCloseButton>
        <button
          onClick={handleCloseAlways}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle>{t.capabilities.title}</DialogTitle>
          <DialogDescription>
            {t.capabilities.description}
          </DialogDescription>
        </DialogHeader>

        <DeviceInfoDisplay device={capabilities.device} />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t.capabilities.permissionsTitle}
          </h3>
          
          {supportedCapabilities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                {t.capabilities.supported}
              </h4>
              <ul className="space-y-3">
                {supportedCapabilities.map((cap) => {
                  const Icon = capabilityIcons[cap.id] || Check;
                  const noteKey = cap.note as keyof typeof t.capabilities.notes | undefined;
                  const descKey = cap.id as keyof typeof t.capabilities.descriptions;
                  return (
                    <li key={cap.id} className="flex items-start gap-2 text-sm">
                      <Icon className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <span className="font-medium">{t.capabilities.features[cap.id as keyof typeof t.capabilities.features]}</span>
                        {t.capabilities.descriptions[descKey] && (
                          <span className="text-muted-foreground text-xs block">
                            {t.capabilities.descriptions[descKey]}
                          </span>
                        )}
                        {noteKey && t.capabilities.notes[noteKey] && (
                          <span className="text-amber-600 dark:text-amber-400 text-xs block mt-0.5">
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
              <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1.5">
                <X className="h-4 w-4" />
                {t.capabilities.notSupported}
              </h4>
              <ul className="space-y-3">
                {unsupportedCapabilities.map((cap) => {
                  const Icon = capabilityIcons[cap.id] || X;
                  const noteKey = cap.note as keyof typeof t.capabilities.notes | undefined;
                  const descKey = cap.id as keyof typeof t.capabilities.descriptions;
                  return (
                    <li key={cap.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <span>{t.capabilities.features[cap.id as keyof typeof t.capabilities.features]}</span>
                        {t.capabilities.descriptions[descKey] && (
                          <span className="text-xs block">
                            {t.capabilities.descriptions[descKey]}
                          </span>
                        )}
                        {noteKey && t.capabilities.notes[noteKey] && (
                          <span className="text-xs block mt-0.5">
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
          
          <AppFeaturesSection t={t} />
          
          <PrivacySection t={t} />
          
          {capabilities.platformTip && (
            <PlatformTip tipKey={capabilities.platformTip} t={t} />
          )}
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label
            htmlFor="dont-show-again"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            {t.capabilities.dontShowAgain}
          </Label>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            {t.capabilities.continue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
