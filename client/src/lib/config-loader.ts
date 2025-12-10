import { CONFIG as STATIC_CONFIG, type GestureType } from "@/config";
import { logger } from "@/lib/logger";

export interface DynamicConfig {
  PRIVACY_MODE: boolean;
  SELECTED_MODULE: string;
  MODULE_UNLOCK_VALUES: Record<string, string>;
  UNLOCK_GESTURE: GestureType;
  UNLOCK_PATTERN: string;
  UNLOCK_FINGERS: number;
  AUTO_LOCK_MINUTES: number;
  DEBUG_MODE: boolean;
  ALLOWED_PROXY_HOSTS: string[];
}

interface ConfigState {
  config: DynamicConfig | null;
  loading: boolean;
  error: string | null;
  backendAvailable: boolean;
}

const defaultConfig: DynamicConfig = {
  PRIVACY_MODE: STATIC_CONFIG.PRIVACY_MODE,
  SELECTED_MODULE: STATIC_CONFIG.SELECTED_MODULE,
  MODULE_UNLOCK_VALUES: { ...STATIC_CONFIG.MODULE_UNLOCK_VALUES },
  UNLOCK_GESTURE: STATIC_CONFIG.UNLOCK_GESTURE,
  UNLOCK_PATTERN: STATIC_CONFIG.UNLOCK_PATTERN,
  UNLOCK_FINGERS: STATIC_CONFIG.UNLOCK_FINGERS,
  AUTO_LOCK_MINUTES: STATIC_CONFIG.AUTO_LOCK_MINUTES,
  DEBUG_MODE: STATIC_CONFIG.DEBUG_MODE,
  ALLOWED_PROXY_HOSTS: [],
};

let configState: ConfigState = {
  config: null,
  loading: false,
  error: null,
  backendAvailable: false,
};

let configPromise: Promise<DynamicConfig> | null = null;
const listeners: Set<() => void> = new Set();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConfigState(): ConfigState {
  return configState;
}

export function isBackendAvailable(): boolean {
  return configState.backendAvailable;
}

async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      return data.backend === true;
    }
  } catch {
    // Expected: network request may fail silently when backend unavailable
  }
  return false;
}

export async function loadConfig(): Promise<DynamicConfig> {
  if (configPromise) {
    return configPromise;
  }

  configState = { ...configState, loading: true, error: null };
  notifyListeners();

  configPromise = (async () => {
    const hasBackend = await checkBackendHealth();

    if (hasBackend) {
      try {
        const response = await fetch("/api/config", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          configState = {
            config: { ...defaultConfig, ...data },
            loading: false,
            error: null,
            backendAvailable: true,
          };
          notifyListeners();
          return configState.config!;
        }
      } catch {
        // Expected: API config endpoint may not be available
      }
    }

    try {
      const response = await fetch("/config.json", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        configState = {
          config: { ...defaultConfig, ...data },
          loading: false,
          error: null,
          backendAvailable: hasBackend,
        };
        notifyListeners();
        return configState.config!;
      }
    } catch {
      // Expected: config.json file may not exist
    }

    configState = {
      config: defaultConfig,
      loading: false,
      error: "Failed to load config, using defaults",
      backendAvailable: false,
    };
    notifyListeners();
    return defaultConfig;
  })();

  return configPromise;
}

export async function updateConfig(
  updates: Partial<DynamicConfig>
): Promise<boolean> {
  if (!configState.backendAvailable) {
    return false;
  }

  try {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const data = await response.json();
      configState = {
        ...configState,
        config: { ...configState.config!, ...data },
      };
      notifyListeners();
      return true;
    }
  } catch (error) {
    logger.error("Failed to update config", error);
  }

  return false;
}

export function getConfig(): DynamicConfig {
  return configState.config || defaultConfig;
}

export async function initConfig(): Promise<DynamicConfig> {
  if (configState.config) {
    return configState.config;
  }
  return loadConfig();
}
