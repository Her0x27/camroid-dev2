export interface DeviceInfo {
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Samsung' | 'Unknown';
  isMobile: boolean;
}

export type PlatformTipKey = 
  | 'iosSafari' 
  | 'iosChrome' 
  | 'androidChrome' 
  | 'androidFirefox' 
  | 'desktopChrome' 
  | 'desktopFirefox' 
  | 'desktopSafari';

export interface AppCapability {
  id: string;
  supported: boolean;
  note?: string;
}

export interface AppCapabilities {
  device: DeviceInfo;
  capabilities: AppCapability[];
  platformTip?: PlatformTipKey;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  let os: DeviceInfo['os'] = 'Unknown';
  if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS';
  } else if (/Android/.test(ua)) {
    os = 'Android';
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }
  
  let browser: DeviceInfo['browser'] = 'Unknown';
  if (/SamsungBrowser/.test(ua)) {
    browser = 'Samsung';
  } else if (/OPR|Opera/.test(ua)) {
    browser = 'Opera';
  } else if (/Edg/.test(ua)) {
    browser = 'Edge';
  } else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
  } else if (/CriOS/.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Safari';
  } else if (/Chrome/.test(ua)) {
    browser = 'Chrome';
  }
  
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua) || 
    ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  
  return { os, browser, isMobile };
}

export async function checkAppCapabilities(): Promise<AppCapabilities> {
  const device = getDeviceInfo();
  const capabilities: AppCapability[] = [];
  
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  capabilities.push({
    id: 'camera',
    supported: hasCamera,
  });
  
  const hasGeolocation = 'geolocation' in navigator;
  capabilities.push({
    id: 'geolocation',
    supported: hasGeolocation,
  });
  
  const hasOrientation = 'DeviceOrientationEvent' in window;
  const needsPermission = device.os === 'iOS' && 
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function';
  let orientationNote: string | undefined;
  if (needsPermission) {
    orientationNote = 'iosOrientationPermission';
  } else if (!device.isMobile) {
    orientationNote = 'desktopNoOrientation';
  }
  capabilities.push({
    id: 'orientation',
    supported: hasOrientation && device.isMobile,
    note: orientationNote,
  });
  
  let hasStabilization = false;
  if (hasCamera && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(d => d.kind === 'videoinput');
      hasStabilization = hasVideoInput && 'ImageCapture' in window;
    } catch {
      hasStabilization = false;
    }
  }
  let stabNote: string | undefined;
  if (device.os === 'iOS') {
    stabNote = 'limitedOnIOS';
  } else if (device.os === 'Android' && device.browser === 'Firefox') {
    stabNote = 'androidFirefoxStab';
  }
  capabilities.push({
    id: 'stabilization',
    supported: hasStabilization,
    note: stabNote,
  });
  
  const hasIndexedDB = 'indexedDB' in window;
  capabilities.push({
    id: 'localStorage',
    supported: hasIndexedDB,
  });
  
  let canInstallPWA = false;
  let pwaNote: string | undefined;
  if ('serviceWorker' in navigator) {
    if (device.os === 'iOS') {
      canInstallPWA = device.browser === 'Safari';
      pwaNote = canInstallPWA ? 'addToHomeScreen' : 'usesSafari';
    } else if (device.browser === 'Chrome' || device.browser === 'Edge' || device.browser === 'Samsung') {
      canInstallPWA = true;
      pwaNote = 'installFromMenu';
    } else if (device.browser === 'Firefox' && device.os === 'Android') {
      canInstallPWA = true;
      pwaNote = 'installFromMenu';
    } else if (device.browser === 'Firefox') {
      canInstallPWA = false;
      pwaNote = 'firefoxDesktop';
    }
  }
  capabilities.push({
    id: 'pwa',
    supported: canInstallPWA,
    note: pwaNote,
  });
  
  const hasCloudUpload = true;
  capabilities.push({
    id: 'cloudUpload',
    supported: hasCloudUpload,
  });
  
  const platformTip = getPlatformTip(device);
  
  return { device, capabilities, platformTip };
}

function getPlatformTip(device: DeviceInfo): PlatformTipKey | undefined {
  const { os, browser, isMobile } = device;
  
  if (os === 'iOS') {
    if (browser === 'Safari') return 'iosSafari';
    if (browser === 'Chrome') return 'iosChrome';
    return 'iosSafari';
  }
  
  if (os === 'Android') {
    if (browser === 'Chrome' || browser === 'Samsung' || browser === 'Edge') return 'androidChrome';
    if (browser === 'Firefox') return 'androidFirefox';
    return 'androidChrome';
  }
  
  if (!isMobile) {
    if (browser === 'Safari') return 'desktopSafari';
    if (browser === 'Firefox') return 'desktopFirefox';
    return 'desktopChrome';
  }
  
  return undefined;
}

const STORAGE_KEY = 'app-capabilities-dialog-dismissed';

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // Expected: localStorage may be unavailable in incognito mode
    return false;
  }
}

export function setDismissed(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Expected: localStorage may be unavailable in incognito mode
  }
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || 
    ('ontouchstart' in window && navigator.maxTouchPoints > 0);
}
