import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { CONFIG } from "@/config";
import { disguiseRegistry } from "@/disguises";

export type GestureType = 'patternUnlock' | 'severalFingers';

interface PrivacySettings {
  enabled: boolean;
  gestureType: GestureType;
  autoLockMinutes: number;
  secretPattern: string;
  unlockFingers: number;
  selectedDisguise: string;
  disguiseUnlockValues: Record<string, string>;
}

interface PrivacyContextType {
  settings: PrivacySettings;
  isLocked: boolean;
  isBackgrounded: boolean;
  showCamera: () => void;
  hideCamera: () => void;
  toggleLock: () => void;
  updateSettings: (updates: Partial<PrivacySettings>) => void;
  resetInactivityTimer: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

const STORAGE_KEY = "disguise-settings";
const UNLOCKED_KEY = "disguise-unlocked";
const FAVICON_CAMERA = "/favicon.svg";
const TITLE_CAMERA = "Camroid M";

const defaultSettings: PrivacySettings = {
  enabled: CONFIG.PRIVACY_MODE,
  gestureType: CONFIG.UNLOCK_GESTURE,
  autoLockMinutes: CONFIG.AUTO_LOCK_MINUTES,
  secretPattern: CONFIG.UNLOCK_PATTERN,
  unlockFingers: CONFIG.UNLOCK_FINGERS,
  selectedDisguise: CONFIG.SELECTED_DISGUISE,
  disguiseUnlockValues: { ...CONFIG.DISGUISE_UNLOCK_VALUES },
};

const isPrivacyModeForced = CONFIG.PRIVACY_MODE;

export function loadPrivacySettings(): PrivacySettings {
  if (isPrivacyModeForced) {
    return { ...defaultSettings, enabled: true };
  }
  
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return defaultSettings;
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        disguiseUnlockValues: {
          ...CONFIG.DISGUISE_UNLOCK_VALUES,
          ...parsed.disguiseUnlockValues,
        },
      };
    }
  } catch {
  }
  return defaultSettings;
}

function saveSettings(settings: PrivacySettings): void {
  if (isPrivacyModeForced) {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}

function loadUnlockedState(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    return localStorage.getItem(UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveUnlockedState(unlocked: boolean): void {
  try {
    if (unlocked) {
      localStorage.setItem(UNLOCKED_KEY, 'true');
    } else {
      localStorage.removeItem(UNLOCKED_KEY);
    }
  } catch {
  }
}

function updateFavicon(isLocked: boolean, selectedDisguise?: string): void {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    if (isLocked && selectedDisguise) {
      const disguiseConfig = disguiseRegistry.get(selectedDisguise);
      link.href = disguiseConfig?.favicon || '/game-icon.svg';
    } else {
      link.href = FAVICON_CAMERA;
    }
  }
}

function updateTitle(isLocked: boolean, selectedDisguise?: string): void {
  if (isLocked && selectedDisguise) {
    const disguiseConfig = disguiseRegistry.get(selectedDisguise);
    document.title = disguiseConfig?.title || '2048';
  } else {
    document.title = TITLE_CAMERA;
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PrivacySettings>(loadPrivacySettings);
  const [isLocked, setIsLocked] = useState(() => {
    const saved = loadPrivacySettings();
    if (saved.enabled) {
      const wasUnlocked = loadUnlockedState();
      return !wasUnlocked;
    }
    return false;
  });
  
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const showCamera = useCallback(() => {
    setIsLocked(false);
    saveUnlockedState(true);
    updateFavicon(false);
    updateTitle(false);
  }, []);
  
  const hideCamera = useCallback(() => {
    if (!settings.enabled) return;
    setIsLocked(true);
    saveUnlockedState(false);
    updateFavicon(true, settings.selectedDisguise);
    updateTitle(true, settings.selectedDisguise);
  }, [settings.enabled, settings.selectedDisguise]);
  
  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      const newValue = !prev;
      saveUnlockedState(!newValue);
      updateFavicon(newValue, settings.selectedDisguise);
      updateTitle(newValue, settings.selectedDisguise);
      return newValue;
    });
  }, [settings.selectedDisguise]);
  
  const updateSettings = useCallback((updates: Partial<PrivacySettings>) => {
    if (isPrivacyModeForced && 'enabled' in updates && !updates.enabled) {
      return;
    }
    
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      
      if ('enabled' in updates) {
        if (updates.enabled) {
          setIsLocked(true);
          saveUnlockedState(false);
          updateFavicon(true, newSettings.selectedDisguise);
          updateTitle(true, newSettings.selectedDisguise);
        } else {
          setIsLocked(false);
          saveUnlockedState(false);
          updateFavicon(false);
          updateTitle(false);
        }
      }
      
      return newSettings;
    });
  }, []);
  
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (!isLocked && settings.enabled && settings.autoLockMinutes > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        hideCamera();
      }, settings.autoLockMinutes * 60 * 1000);
    }
  }, [isLocked, settings.enabled, settings.autoLockMinutes, hideCamera]);
  
  useEffect(() => {
    if (settings.enabled) {
      updateFavicon(isLocked, settings.selectedDisguise);
      updateTitle(isLocked, settings.selectedDisguise);
    } else {
      updateFavicon(false);
      updateTitle(false);
    }
  }, [settings.enabled, settings.selectedDisguise, isLocked]);
  
  useEffect(() => {
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);
  
  const ACTIVITY_THROTTLE_MS = 1000;
  useEffect(() => {
    const handleActivity = () => {
      if (isLocked) return;
      
      if (activityThrottleRef.current) return;
      
      resetInactivityTimer();
      
      activityThrottleRef.current = setTimeout(() => {
        activityThrottleRef.current = null;
      }, ACTIVITY_THROTTLE_MS);
    };
    
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
      }
    };
  }, [isLocked, resetInactivityTimer]);
  
  useEffect(() => {
    if (!settings.enabled) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsBackgrounded(true);
        hideCamera();
      } else {
        setIsBackgrounded(false);
      }
    };
    
    const handlePageHide = () => {
      setIsBackgrounded(true);
      hideCamera();
    };
    
    const handlePageShow = () => {
      setIsBackgrounded(false);
    };
    
    const handleBlur = () => {
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setIsBackgrounded(true);
        hideCamera();
      }
    };
    
    const handleFocus = () => {
      setIsBackgrounded(false);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [settings.enabled, hideCamera]);
  
  return (
    <PrivacyContext.Provider
      value={{
        settings,
        isLocked,
        isBackgrounded,
        showCamera,
        hideCamera,
        toggleLock,
        updateSettings,
        resetInactivityTimer,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}
