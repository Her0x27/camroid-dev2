import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SENSORS } from "@/lib/constants";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
  lastUpdate: number;
  isAcquiring: boolean;
}

interface UseGeolocationReturn {
  data: GeolocationData;
  isLoading: boolean;
  error: string | null;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<GeolocationData>;
}

const defaultData: GeolocationData = {
  latitude: null,
  longitude: null,
  altitude: null,
  accuracy: null,
  timestamp: Date.now(),
  lastUpdate: Date.now(),
  isAcquiring: true,
};

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return SENSORS.EARTH_RADIUS_METERS * c;
}

function hasSignificantPositionChange(
  prev: GeolocationData,
  next: GeolocationPosition
): boolean {
  if (prev.latitude === null || prev.longitude === null) return true;

  const distance = haversineDistance(
    prev.latitude,
    prev.longitude,
    next.coords.latitude,
    next.coords.longitude
  );
  if (distance >= SENSORS.POSITION_THRESHOLD_METERS) return true;

  const prevAlt = prev.altitude;
  const nextAlt = next.coords.altitude;
  if (prevAlt === null && nextAlt !== null) return true;
  if (prevAlt !== null && nextAlt === null) return true;
  if (
    prevAlt !== null &&
    nextAlt !== null &&
    Math.abs(prevAlt - nextAlt) >= SENSORS.ALTITUDE_THRESHOLD_METERS
  ) {
    return true;
  }

  if (next.coords.accuracy < (prev.accuracy ?? Infinity)) return true;

  return false;
}

export function useGeolocation(enabled: boolean = true): UseGeolocationReturn {
  const [data, setData] = useState<GeolocationData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const bestAccuracyRef = useRef<number>(Infinity);
  const lastDataRef = useRef<GeolocationData>(defaultData);

  const positionOptions: PositionOptions = useMemo(() => ({
    enableHighAccuracy: true,
    timeout: SENSORS.GPS_TIMEOUT_MS,
    maximumAge: SENSORS.GPS_MAXIMUM_AGE_MS,
  }), []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const newAccuracy = position.coords.accuracy;
    
    const hasNoData = lastDataRef.current.latitude === null;
    const isSignificant = hasSignificantPositionChange(lastDataRef.current, position);
    const isGoodEnough = newAccuracy <= SENSORS.GPS_ACCURACY_THRESHOLD_METERS;
    
    if (!isSignificant && !hasNoData) {
      setError(null);
      setIsLoading(false);
      return;
    }
    
    bestAccuracyRef.current = Math.min(bestAccuracyRef.current, newAccuracy);
    
    const newData: GeolocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: newAccuracy,
      timestamp: position.timestamp,
      lastUpdate: now,
      isAcquiring: !isGoodEnough,
    };
    
    lastDataRef.current = newData;
    setData(newData);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage: string;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = "Location access denied";
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case err.TIMEOUT:
        errorMessage = "Location request timeout";
        break;
      default:
        errorMessage = "Unknown location error";
    }
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !enabled) {
      setError("Geolocation not supported");
      return;
    }

    if (watchIdRef.current !== null) return;

    setIsLoading(true);
    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      positionOptions
    );
    
    bestAccuracyRef.current = Infinity;
  }, [enabled, handleSuccess, handleError, positionOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const now = Date.now();
          const geoData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            lastUpdate: now,
            isAcquiring: position.coords.accuracy > SENSORS.GPS_ACCURACY_THRESHOLD_METERS,
          };
          setData(geoData);
          resolve(geoData);
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        positionOptions
      );
    });
  }, [handleError, positionOptions]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  return {
    data,
    isLoading,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}

export function formatCoordinate(value: number | null): string {
  if (value === null) return "---.-----";
  return value.toFixed(5);
}

export function formatCoordinatesCompact(latitude: number | null, longitude: number | null): string {
  if (latitude === null || longitude === null) {
    return "---.------- ---.-------";
  }
  
  const latFormatted = Math.abs(latitude).toFixed(7);
  const lonFormatted = Math.abs(longitude).toFixed(7);
  
  return `${latFormatted} ${lonFormatted}`;
}


// Format altitude for display with precision
export function formatAltitude(altitude: number | null): string {
  if (altitude === null) return "--- m";
  return `${altitude.toFixed(1)} m`;
}

// Format accuracy for display with meters
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return "--- m";
  return `±${Math.round(accuracy)} m`;
}

// Get accuracy quality level
export function getAccuracyLevel(accuracy: number | null): "high" | "medium" | "low" | "none" {
  if (accuracy === null) return "none";
  if (accuracy < 10) return "high";
  if (accuracy < 50) return "medium";
  return "low";
}
