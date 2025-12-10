export interface DeviceInfo {
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Samsung' | 'Unknown';
  isMobile: boolean;
}

export interface AppCapability {
  id: string;
  supported: boolean;
  note?: string;
}

export interface AppCapabilities {
  device: DeviceInfo;
  capabilities: AppCapability[];
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
  } else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
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
  capabilities.push({
    id: 'orientation',
    supported: hasOrientation,
    note: needsPermission ? 'requiresPermission' : undefined,
  });
  
  let hasStabilization = false;
  if (hasCamera) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(d => d.kind === 'videoinput');
      hasStabilization = hasVideoInput && 'ImageCapture' in window;
    } catch {
      hasStabilization = false;
    }
  }
  capabilities.push({
    id: 'stabilization',
    supported: hasStabilization,
    note: device.os === 'iOS' ? 'limitedOnIOS' : undefined,
  });
  
  const hasIndexedDB = 'indexedDB' in window;
  capabilities.push({
    id: 'localStorage',
    supported: hasIndexedDB,
  });
  
  let canInstallPWA = false;
  if ('serviceWorker' in navigator) {
    if (device.os === 'iOS' && device.browser === 'Safari') {
      canInstallPWA = true;
    } else if (device.browser === 'Chrome' || device.browser === 'Edge' || device.browser === 'Samsung') {
      canInstallPWA = true;
    } else if (device.browser === 'Firefox' && device.os === 'Android') {
      canInstallPWA = true;
    }
  }
  capabilities.push({
    id: 'pwa',
    supported: canInstallPWA,
    note: device.os === 'iOS' ? 'addToHomeScreen' : undefined,
  });
  
  const hasCloudUpload = true;
  capabilities.push({
    id: 'cloudUpload',
    supported: hasCloudUpload,
  });
  
  return { device, capabilities };
}

const STORAGE_KEY = 'app-capabilities-dialog-dismissed';

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
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
  }
}
