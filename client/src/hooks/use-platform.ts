import { useState, useEffect } from "react";

export type Platform = "ios" | "android" | "desktop";

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  return platform;
}

export function getPlatformName(platform: Platform): string {
  switch (platform) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    default:
      return "Desktop";
  }
}
