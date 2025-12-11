import { createContext, useContext, useState, useCallback, useMemo, lazy, ComponentType } from "react";

interface LoadingModule {
  name: string;
  loaded: boolean;
}

interface LazyLoaderState {
  modules: LoadingModule[];
  currentModule: string | null;
  progress: number;
  allLoaded: boolean;
}

interface LazyLoaderContextValue extends LazyLoaderState {
  registerModule: (name: string) => void;
  markModuleLoaded: (name: string) => void;
}

const LazyLoaderContext = createContext<LazyLoaderContextValue | null>(null);

export function LazyLoaderProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<LoadingModule[]>([]);

  const registerModule = useCallback((name: string) => {
    setModules((prev) => {
      if (prev.some((m) => m.name === name)) return prev;
      return [...prev, { name, loaded: false }];
    });
  }, []);

  const markModuleLoaded = useCallback((name: string) => {
    setModules((prev) =>
      prev.map((m) => (m.name === name ? { ...m, loaded: true } : m))
    );
  }, []);

  const state = useMemo((): LazyLoaderState => {
    const loadedCount = modules.filter((m) => m.loaded).length;
    const totalCount = modules.length;
    const currentLoading = modules.find((m) => !m.loaded);
    
    return {
      modules,
      currentModule: currentLoading?.name ?? null,
      progress: totalCount > 0 ? (loadedCount / totalCount) * 100 : 0,
      allLoaded: totalCount > 0 && loadedCount === totalCount,
    };
  }, [modules]);

  const value = useMemo(
    () => ({ ...state, registerModule, markModuleLoaded }),
    [state, registerModule, markModuleLoaded]
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

type LazyComponentFactory = () => Promise<{ default: ComponentType<Record<string, unknown>> }>;

interface TrackedLazyOptions {
  preload?: boolean;
}

export function createTrackedLazy(
  name: string,
  factory: LazyComponentFactory,
  _options?: TrackedLazyOptions
) {
  let moduleRegistered = false;
  let moduleLoaded = false;
  let registerFn: ((name: string) => void) | null = null;
  let markLoadedFn: ((name: string) => void) | null = null;

  const LazyComponent = lazy(() => {
    if (registerFn && !moduleRegistered) {
      registerFn(name);
      moduleRegistered = true;
    }

    return factory().then((module) => {
      if (markLoadedFn && !moduleLoaded) {
        markLoadedFn(name);
        moduleLoaded = true;
      }
      return module;
    });
  });

  function TrackedComponent(props: Record<string, unknown>) {
    const context = useLazyLoaderOptional();
    
    if (context && !moduleRegistered) {
      registerFn = context.registerModule;
      markLoadedFn = context.markModuleLoaded;
      context.registerModule(name);
      moduleRegistered = true;
    }

    return <LazyComponent {...props} />;
  }

  TrackedComponent.displayName = `TrackedLazy(${name})`;
  TrackedComponent.preload = () => {
    factory().then((module) => {
      moduleLoaded = true;
      if (markLoadedFn) {
        markLoadedFn(name);
      }
      return module;
    });
  };

  return TrackedComponent;
}

export const MODULE_NAMES = {
  camera: "Камера",
  gallery: "Галерея", 
  photoDetail: "Просмотр фото",
  settings: "Настройки",
  game: "Игра",
  notFound: "404",
} as const;
