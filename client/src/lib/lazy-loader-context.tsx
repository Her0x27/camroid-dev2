import { createContext, useContext, useState, useCallback, useMemo, lazy, ComponentType, useEffect, useRef } from "react";

interface LoadingModule {
  name: string;
  loaded: boolean;
}

interface LazyLoaderState {
  modules: LoadingModule[];
  currentModule: string | null;
  progress: number;
  allLoaded: boolean;
  initialized: boolean;
}

interface LazyLoaderContextValue extends LazyLoaderState {
  registerModule: (name: string) => void;
  markModuleLoaded: (name: string) => void;
  initializeModules: (names: string[]) => void;
}

const LazyLoaderContext = createContext<LazyLoaderContextValue | null>(null);

const loadedModulesSet = new Set<string>();
const registeredModulesSet = new Set<string>();

interface ContextRef {
  registerModule: (name: string) => void;
  markModuleLoaded: (name: string) => void;
}

let contextRef: ContextRef | null = null;

export function LazyLoaderProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<LoadingModule[]>([]);
  const [initialized, setInitialized] = useState(false);
  const mountedRef = useRef(false);
  
  const registerModule = useCallback((name: string) => {
    registeredModulesSet.add(name);
    setModules((prev) => {
      if (prev.some((m) => m.name === name)) {
        return prev;
      }
      return [...prev, { name, loaded: loadedModulesSet.has(name) }];
    });
  }, []);

  const markModuleLoaded = useCallback((name: string) => {
    loadedModulesSet.add(name);
    setModules((prev) => {
      const existing = prev.find((m) => m.name === name);
      if (!existing) {
        return [...prev, { name, loaded: true }];
      }
      if (existing.loaded) return prev;
      return prev.map((m) => (m.name === name ? { ...m, loaded: true } : m));
    });
  }, []);

  const initializeModules = useCallback((names: string[]) => {
    setModules(names.map(name => ({
      name,
      loaded: loadedModulesSet.has(name)
    })));
    setInitialized(true);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    contextRef = { registerModule, markModuleLoaded };
    
    return () => {
      mountedRef.current = false;
      contextRef = null;
    };
  }, [registerModule, markModuleLoaded]);

  const state = useMemo((): LazyLoaderState => {
    const loadedCount = modules.filter((m) => m.loaded).length;
    const totalCount = modules.length;
    const currentLoading = modules.find((m) => !m.loaded);
    
    const progress = totalCount > 0 
      ? (loadedCount / totalCount) * 100 
      : (initialized ? 100 : 0);
    
    return {
      modules,
      currentModule: currentLoading?.name ?? null,
      progress,
      allLoaded: initialized && (totalCount === 0 || loadedCount === totalCount),
      initialized,
    };
  }, [modules, initialized]);

  const value = useMemo(
    () => ({ ...state, registerModule, markModuleLoaded, initializeModules }),
    [state, registerModule, markModuleLoaded, initializeModules]
  );

  return (
    <LazyLoaderContext.Provider value={value}>
      {children}
    </LazyLoaderContext.Provider>
  );
}

export function useLazyLoader() {
  const context = useContext(LazyLoaderContext);
  if (!context) {
    throw new Error("useLazyLoader must be used within LazyLoaderProvider");
  }
  return context;
}

export function useLazyLoaderOptional() {
  return useContext(LazyLoaderContext);
}

type LazyComponentFactory<T extends ComponentType<any>> = () => Promise<{ default: T }>;

export function createTrackedLazy<P extends object>(
  name: string,
  factory: LazyComponentFactory<ComponentType<P>>
): ComponentType<P> {

  const LazyComponent = lazy(() => {
    if (!registeredModulesSet.has(name)) {
      registeredModulesSet.add(name);
      if (contextRef) {
        contextRef.registerModule(name);
      }
    }
    
    return factory().then((module) => {
      setTimeout(() => {
        loadedModulesSet.add(name);
        if (contextRef) {
          contextRef.markModuleLoaded(name);
        }
      }, 100);
      return module;
    });
  });

  function TrackedComponent(props: P) {
    return <LazyComponent {...(props as any)} />;
  }

  TrackedComponent.displayName = `TrackedLazy(${name})`;

  return TrackedComponent as ComponentType<P>;
}

export const MODULE_NAMES = {
  cameraChunk: "Камера",
  init: "Инициализация",
  gps: "GPS",
  sensors: "Датчики",
  ready: "Готово",
  gallery: "Галерея", 
  photoDetail: "Просмотр фото",
  settings: "Настройки",
  game: "Игра",
  notFound: "404",
} as const;

export const INITIAL_MODULES = [
  MODULE_NAMES.cameraChunk,
  MODULE_NAMES.init,
  MODULE_NAMES.gps,
  MODULE_NAMES.sensors,
  MODULE_NAMES.ready,
];
