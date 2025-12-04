import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { CONFIG } from "@/config";

export type GestureType = 'quickTaps' | 'patternUnlock' | 'severalFingers';

interface PrivacySettings {
  enabled: boolean;
  gestureType: GestureType;
  autoLockMinutes: number;
  secretPattern: string;
  unlockFingers: number;
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

const STORAGE_KEY = "camera-zeroday-privacy";
const UNLOCKED_KEY = "camera-zeroday-unlocked";
const FAVICON_CAMERA = "/favicon.svg";
const FAVICON_GAME = "/game-icon.svg";

const defaultSettings: PrivacySettings = {
  enabled: CONFIG.PRIVACY_MODE,
  gestureType: CONFIG.UNLOCK_GESTURE,
  autoLockMinutes: CONFIG.AUTO_LOCK_MINUTES,
  secretPattern: CONFIG.UNLOCK_PATTERN,
  unlockFingers: CONFIG.UNLOCK_FINGERS,
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
      return { ...defaultSettings, ...JSON.parse(saved) };
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

function updateFavicon(isLocked: boolean): void {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = isLocked ? FAVICON_GAME : FAVICON_CAMERA;
  }
}

function updateTitle(isLocked: boolean): void {
  document.title = isLocked ? "2048" : "Camera ZeroDay";
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
    updateFavicon(true);
    updateTitle(true);
  }, [settings.enabled]);
  
  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      const newValue = !prev;
      saveUnlockedState(!newValue);
      updateFavicon(newValue);
      updateTitle(newValue);
      return newValue;
    });
  }, []);
  
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
          updateFavicon(true);
          updateTitle(true);
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
      updateFavicon(isLocked);
      updateTitle(isLocked);
    } else {
      updateFavicon(false);
      updateTitle(false);
    }
  }, [settings.enabled, isLocked]);
  
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
