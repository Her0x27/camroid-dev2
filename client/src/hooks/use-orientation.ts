import { useState, useEffect, useCallback, useRef } from "react";
import { SENSORS } from "@/lib/constants";
import { usePageVisibility } from "./use-page-visibility";

interface OrientationData {
  heading: number | null;
  tilt: number | null;
  roll: number | null;
}

interface UseOrientationReturn {
  data: OrientationData;
  isSupported: boolean;
  isPermissionGranted: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
}

const defaultData: OrientationData = {
  heading: null,
  tilt: null,
  roll: null,
};

function hasSignificantChange(
  prev: OrientationData,
  next: OrientationData
): boolean {
  if (prev.heading === null || next.heading === null) return true;
  if (prev.tilt === null || next.tilt === null) return true;
  if (prev.roll === null || next.roll === null) return true;

  const headingDiff = Math.abs(prev.heading - next.heading);
  const headingChange = Math.min(headingDiff, 360 - headingDiff);
  if (headingChange >= SENSORS.HEADING_THRESHOLD_DEG) return true;

  if (Math.abs((prev.tilt ?? 0) - (next.tilt ?? 0)) >= SENSORS.TILT_THRESHOLD_DEG) return true;
  if (Math.abs((prev.roll ?? 0) - (next.roll ?? 0)) >= SENSORS.ROLL_THRESHOLD_DEG) return true;

  return false;
}

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export function useOrientation(enabled: boolean = true, paused: boolean = false): UseOrientationReturn {
  const [data, setData] = useState<OrientationData>(defaultData);
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastDataRef = useRef<OrientationData>(defaultData);
  const pendingDataRef = useRef<OrientationData | null>(null);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isVisible } = usePageVisibility();
  const shouldListen = enabled && !paused && isVisible;

  useEffect(() => {
    const supported = "DeviceOrientationEvent" in window;
    setIsSupported(supported);
    
    if (!supported) {
      setError("Device orientation not supported");
    }
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading = event.alpha;
    
    const webkitEvent = event as DeviceOrientationEventWithWebkit;
    if (webkitEvent.webkitCompassHeading !== undefined) {
      heading = webkitEvent.webkitCompassHeading;
    } else if (heading !== null) {
      heading = (360 - heading) % 360;
    }

    const newData: OrientationData = {
      heading: heading !== null ? Math.round(heading) : null,
      tilt: event.beta !== null ? Math.round(event.beta) : null,
      roll: event.gamma !== null ? Math.round(event.gamma) : null,
    };

    if (!hasSignificantChange(lastDataRef.current, newData)) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= SENSORS.ORIENTATION_THROTTLE_MS) {
      lastUpdateRef.current = now;
      lastDataRef.current = newData;
      setData(newData);
    } else {
      pendingDataRef.current = newData;
      if (!throttleTimeoutRef.current) {
        throttleTimeoutRef.current = setTimeout(() => {
          if (pendingDataRef.current && hasSignificantChange(lastDataRef.current, pendingDataRef.current)) {
            lastUpdateRef.current = Date.now();
            lastDataRef.current = pendingDataRef.current;
            setData(pendingDataRef.current);
          }
          pendingDataRef.current = null;
          throttleTimeoutRef.current = null;
        }, SENSORS.ORIENTATION_THROTTLE_MS - timeSinceLastUpdate);
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Device orientation not supported");
      return false;
    }

    try {
      const DeviceOrientationEventWithPermission = DeviceOrientationEvent as unknown as DeviceOrientationEventStatic;
      if (typeof DeviceOrientationEventWithPermission.requestPermission === "function") {
        const permission = await DeviceOrientationEventWithPermission.requestPermission();
        if (permission === "granted") {
          setIsPermissionGranted(true);
          setError(null);
          return true;
        } else {
          setError("Orientation permission denied");
          return false;
        }
      } else {
        setIsPermissionGranted(true);
        setError(null);
        return true;
      }
    } catch {
      setError("Failed to request orientation permission");
      return false;
    }
  }, [isSupported]);

  useEffect(() => {
    if (!shouldListen || !isSupported) {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientation", listenerRef.current, true);
        listenerRef.current = null;
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      pendingDataRef.current = null;
      return;
    }

    const listener = (event: DeviceOrientationEvent) => {
      if (!isPermissionGranted) {
        setIsPermissionGranted(true);
      }
      handleOrientation(event);
    };

    listenerRef.current = listener;
    window.addEventListener("deviceorientation", listener, true);

    return () => {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientation", listenerRef.current, true);
        listenerRef.current = null;
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      pendingDataRef.current = null;
    };
  }, [shouldListen, isSupported, isPermissionGranted, handleOrientation]);

  return {
    data,
    isSupported,
    isPermissionGranted,
    error,
    requestPermission,
  };
}

export function formatHeading(heading: number | null): string {
  if (heading === null) return "---°";
  return `${heading.toString().padStart(3, "0")}°`;
}

export function getCardinalDirection(heading: number | null): string {
  if (heading === null) return "--";
  
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

export function formatTilt(tilt: number | null): string {
  if (tilt === null) return "---°";
  const sign = tilt >= 0 ? "+" : "";
  return `${sign}${tilt}°`;
}
