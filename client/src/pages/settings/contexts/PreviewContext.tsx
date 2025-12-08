import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type PreviewSource = "reticle" | "watermark" | null;

interface PreviewContextValue {
  isPreviewActive: boolean;
  previewSource: PreviewSource;
  activatePreview: (source: PreviewSource) => void;
  deactivatePreview: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewSource, setPreviewSource] = useState<PreviewSource>(null);

  const activatePreview = useCallback((source: PreviewSource) => {
    setPreviewSource(source);
  }, []);

  const deactivatePreview = useCallback(() => {
    setPreviewSource(null);
  }, []);

  const value: PreviewContextValue = {
    isPreviewActive: previewSource !== null,
    previewSource,
    activatePreview,
    deactivatePreview,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within PreviewProvider");
  }
  return context;
}
