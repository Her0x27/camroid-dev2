import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Settings, ReticleConfig, StabilizationSettings, EnhancementSettings, WatermarkPreviewConfig, ReticlePreviewConfig } from "@shared/schema";
import { defaultSettings } from "@shared/schema";
import { getSettings, saveSettings } from "./db";
import { TIMING } from "./constants";
import { logger } from "@/lib/logger";

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
  updateStabilization: (updates: Partial<StabilizationSettings>) => void;
  updateEnhancement: (updates: Partial<EnhancementSettings>) => void;
  updateWatermarkPreview: (updates: Partial<WatermarkPreviewConfig>) => void;
  updateReticlePreview: (updates: Partial<ReticlePreviewConfig>) => void;
  resetSettings: () => Promise<void>;
  isSectionOpen: (sectionId: string) => boolean;
  toggleSection: (sectionId: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsRef = useRef<Settings | null>(null);

  const debouncedSave = useCallback((newSettings: Settings) => {
    pendingSettingsRef.current = newSettings;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingSettingsRef.current) {
        try {
          await saveSettings(pendingSettingsRef.current);
        } catch (error) {
          logger.error("Failed to save settings", error);
        }
        pendingSettingsRef.current = null;
      }
    }, TIMING.DEBOUNCE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (pendingSettingsRef.current) {
          saveSettings(pendingSettingsRef.current).catch((e) => logger.error("Failed to save pending settings on unmount", e));
        }
      }
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getSettings();
        const merged: Settings = {
          ...defaultSettings,
          ...stored,
          reticle: { ...defaultSettings.reticle, ...stored.reticle },
          expandedSections: { ...defaultSettings.expandedSections, ...stored.expandedSections },
          cloud: {
            ...defaultSettings.cloud,
            ...stored.cloud,
            providers: {
              ...defaultSettings.cloud.providers,
              ...stored.cloud?.providers,
            },
          },
          imgbb: { ...defaultSettings.imgbb, ...stored.imgbb },
          stabilization: { ...defaultSettings.stabilization, ...stored.stabilization },
          enhancement: { ...defaultSettings.enhancement, ...stored.enhancement },
          watermarkPreview: { ...defaultSettings.watermarkPreview, ...stored.watermarkPreview },
          reticlePreview: { ...defaultSettings.reticlePreview, ...stored.reticlePreview },
        };
        setSettings(merged);
      } catch (error) {
        logger.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    debouncedSave(newSettings);
  }, [settings, debouncedSave]);

  const updateReticle = useCallback((updates: Partial<ReticleConfig>) => {
    const newReticle = { ...settings.reticle, ...updates };
    updateSettings({ reticle: newReticle });
  }, [settings.reticle, updateSettings]);

  const updateStabilization = useCallback((updates: Partial<StabilizationSettings>) => {
    const newStabilization = { ...settings.stabilization, ...updates };
    updateSettings({ stabilization: newStabilization });
  }, [settings.stabilization, updateSettings]);

  const updateEnhancement = useCallback((updates: Partial<EnhancementSettings>) => {
    const newEnhancement = { ...settings.enhancement, ...updates };
    updateSettings({ enhancement: newEnhancement });
  }, [settings.enhancement, updateSettings]);

  const updateWatermarkPreview = useCallback((updates: Partial<WatermarkPreviewConfig>) => {
    const clampedUpdates = { ...updates };
    if (clampedUpdates.backgroundOpacity !== undefined) {
      clampedUpdates.backgroundOpacity = Math.max(0, Math.min(100, clampedUpdates.backgroundOpacity));
    }
    if (clampedUpdates.width !== undefined) {
      clampedUpdates.width = Math.max(10, Math.min(100, clampedUpdates.width));
    }
    if (clampedUpdates.height !== undefined) {
      clampedUpdates.height = Math.max(5, Math.min(50, clampedUpdates.height));
    }
    if (clampedUpdates.fontOpacity !== undefined) {
      clampedUpdates.fontOpacity = Math.max(0, Math.min(100, clampedUpdates.fontOpacity));
    }
    if (clampedUpdates.fontSize !== undefined) {
      clampedUpdates.fontSize = Math.max(8, Math.min(48, clampedUpdates.fontSize));
    }
    if (clampedUpdates.rotation !== undefined) {
      clampedUpdates.rotation = Math.max(-180, Math.min(180, clampedUpdates.rotation));
    }
    if (clampedUpdates.logoSize !== undefined) {
      clampedUpdates.logoSize = Math.max(16, Math.min(96, clampedUpdates.logoSize));
    }
    if (clampedUpdates.logoOpacity !== undefined) {
      clampedUpdates.logoOpacity = Math.max(0, Math.min(100, clampedUpdates.logoOpacity));
    }
    const newWatermarkPreview = { ...settings.watermarkPreview, ...clampedUpdates };
    updateSettings({ watermarkPreview: newWatermarkPreview });
  }, [settings.watermarkPreview, updateSettings]);

  const updateReticlePreview = useCallback((updates: Partial<ReticlePreviewConfig>) => {
    const clampedUpdates = { ...updates };
    if (clampedUpdates.size !== undefined) {
      clampedUpdates.size = Math.max(20, Math.min(200, clampedUpdates.size));
    }
    if (clampedUpdates.strokeWidth !== undefined) {
      clampedUpdates.strokeWidth = Math.max(1, Math.min(10, clampedUpdates.strokeWidth));
    }
    if (clampedUpdates.opacity !== undefined) {
      clampedUpdates.opacity = Math.max(10, Math.min(100, clampedUpdates.opacity));
    }
    const newReticlePreview = { ...settings.reticlePreview, ...clampedUpdates };
    updateSettings({ reticlePreview: newReticlePreview });
  }, [settings.reticlePreview, updateSettings]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    try {
      await saveSettings(defaultSettings);
    } catch (error) {
      logger.error("Failed to reset settings", error);
    }
  }, []);

  const isSectionOpen = useCallback((sectionId: string): boolean => {
    return settings.expandedSections?.[sectionId] ?? false;
  }, [settings.expandedSections]);

  const toggleSection = useCallback((sectionId: string) => {
    const currentState = settings.expandedSections?.[sectionId] ?? false;
    const newExpandedSections = {
      ...settings.expandedSections,
      [sectionId]: !currentState,
    };
    updateSettings({ expandedSections: newExpandedSections });
  }, [settings.expandedSections, updateSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        updateReticle,
        updateStabilization,
        updateEnhancement,
        updateWatermarkPreview,
        updateReticlePreview,
        resetSettings,
        isSectionOpen,
        toggleSection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
