import { useState, useCallback } from "react";
import { usePWA } from "@/hooks/use-pwa";

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';

export interface UsePWABannerReturn {
  shouldShow: boolean;
  handleInstall: () => Promise<void>;
  handleDismiss: () => void;
  showIOSInstructions: boolean;
  isInstalling: boolean;
}

export function usePWABanner(): UsePWABannerReturn {
  const { canInstall, isInstalled, isInstalling, install, showIOSInstructions } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
    } catch {
      // Expected: localStorage may be unavailable in incognito mode
      return false;
    }
  });
  
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    } catch {
      // Expected: localStorage may be unavailable in incognito mode
    }
  }, []);
  
  const handleInstall = useCallback(async () => {
    const result = await install();
    if (result) {
      handleDismiss();
    }
  }, [install, handleDismiss]);
  
  const shouldShow = !isInstalled && !dismissed && (canInstall || showIOSInstructions);
  
  return {
    shouldShow,
    handleInstall,
    handleDismiss,
    showIOSInstructions,
    isInstalling,
  };
}
