import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Settings, ReticleConfig, StabilizationSettings, EnhancementSettings } from "@shared/schema";
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
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettingsRef = useRef<Settings | null>(null);

  // Debounced save to storage - updates UI immediately, saves after delay
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save any pending settings on unmount
        if (pendingSettingsRef.current) {
          saveSettings(pendingSettingsRef.current).catch((e) => logger.error("Failed to save pending settings on unmount", e));
        }
      }
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getSettings();
        // Merge with defaults to ensure all properties exist (especially cloud.providers)
        const merged: Settings = {
          ...defaultSettings,
          ...stored,
          reticle: { ...defaultSettings.reticle, ...stored.reticle },
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
    setSettings(newSettings);  // Update UI immediately
    debouncedSave(newSettings); // Debounce storage save
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

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    try {
      await saveSettings(defaultSettings);
    } catch (error) {
      logger.error("Failed to reset settings", error);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        updateReticle,
        updateStabilization,
        updateEnhancement,
        resetSettings,
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
