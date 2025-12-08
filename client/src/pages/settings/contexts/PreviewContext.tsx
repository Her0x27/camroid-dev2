import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type PreviewSlider = {
  type: "reticle-size" | "reticle-thickness" | "reticle-opacity" | "watermark-scale";
  label: string;
} | null;

interface PreviewContextValue {
  isPreviewActive: boolean;
  activeSlider: PreviewSlider;
  activatePreview: (slider: NonNullable<PreviewSlider>) => void;
  deactivatePreview: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [activeSlider, setActiveSlider] = useState<PreviewSlider>(null);

  const activatePreview = useCallback((slider: NonNullable<PreviewSlider>) => {
    setActiveSlider(slider);
  }, []);

  const deactivatePreview = useCallback(() => {
    setActiveSlider(null);
  }, []);

  const value: PreviewContextValue = {
    isPreviewActive: activeSlider !== null,
    activeSlider,
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
