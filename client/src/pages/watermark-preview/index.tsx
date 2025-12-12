import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import previewBackground from "@/assets/preview-background.jpg";
import { ReticleShapeRenderer } from "./components/ReticleShapes";
import type { ReticleShape } from "./types";
import {
  InteractiveWatermark,
  FloatingEditPanel,
  ReticleSelector,
  type WatermarkPosition,
  type WatermarkStyle,
  type ReticleSettings,
} from "./components";

type ActivePanel = null | "watermark" | "reticle";

const DEFAULT_WATERMARK_STYLE: WatermarkStyle = {
  backgroundColor: "#000000",
  backgroundOpacity: 70,
  fontColor: "#22c55e",
  fontOpacity: 100,
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  width: 200,
  height: 60,
  rotation: 0,
  note: "",
  notePlacement: "end",
  separators: [],
  coordinateFormat: "decimal",
  logoUrl: null,
  logoPosition: "left",
  logoSize: 40,
};

const DEFAULT_RETICLE_SETTINGS: ReticleSettings = {
  shape: "crosshair" as ReticleShape,
  color: "#22c55e",
  size: 80,
  strokeWidth: 2,
  opacity: 80,
  position: { x: 0, y: 0 },
};

export default function WatermarkPreviewPage() {
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>({
    x: 20,
    y: 20,
  });
  const [watermarkStyle, setWatermarkStyle] =
    useState<WatermarkStyle>(DEFAULT_WATERMARK_STYLE);
  const [reticleSettings, setReticleSettings] =
    useState<ReticleSettings>(DEFAULT_RETICLE_SETTINGS);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [panelAnchor, setPanelAnchor] = useState({ x: 0, y: 0 });

  const handleWatermarkTap = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPanelAnchor({
        x: watermarkPosition.x + rect.left + watermarkStyle.width + 10,
        y: watermarkPosition.y + rect.top,
      });
    }
    setActivePanel(activePanel === "watermark" ? null : "watermark");
  }, [activePanel, watermarkPosition, watermarkStyle.width]);

  const handleReticleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      setPanelAnchor({ x: clientX + 10, y: clientY + 10 });
      setActivePanel(activePanel === "reticle" ? null : "reticle");
    },
    [activePanel]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setActivePanel(null);
  }, []);

  const handleDrag = useCallback((position: WatermarkPosition) => {
    setWatermarkPosition(position);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleStyleChange = useCallback((updates: Partial<WatermarkStyle>) => {
    setWatermarkStyle((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlePositionChange = useCallback(
    (updates: Partial<WatermarkPosition>) => {
      setWatermarkPosition((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleReticleSettingsChange = useCallback(
    (updates: Partial<ReticleSettings>) => {
      setReticleSettings((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleBackgroundClick = useCallback(() => {
    if (activePanel) {
      setActivePanel(null);
    }
  }, [activePanel]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <img
        src={previewBackground}
        alt="Preview background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        ref={containerRef}
        className="absolute inset-0"
        onClick={handleBackgroundClick}
      >
        <InteractiveWatermark
          position={watermarkPosition}
          style={watermarkStyle}
          isDragging={isDragging}
          isSelected={activePanel === "watermark"}
          onTap={handleWatermarkTap}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />

        <div
          className="absolute left-1/2 top-1/2 cursor-pointer"
          style={{
            transform: `translate(calc(-50% + ${reticleSettings.position.x}px), calc(-50% + ${reticleSettings.position.y}px))`,
          }}
          onClick={handleReticleTap}
          onTouchStart={handleReticleTap}
        >
          <div
            className={`transition-all ${
              activePanel === "reticle" ? "ring-2 ring-primary ring-offset-2 rounded-full" : ""
            }`}
          >
            <ReticleShapeRenderer
              shape={reticleSettings.shape}
              size={reticleSettings.size}
              color={reticleSettings.color}
              strokeWidth={reticleSettings.strokeWidth}
              opacity={reticleSettings.opacity}
            />
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => navigate("/settings")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <FloatingEditPanel
        isOpen={activePanel === "watermark"}
        onClose={() => setActivePanel(null)}
        style={watermarkStyle}
        position={watermarkPosition}
        onStyleChange={handleStyleChange}
        onPositionChange={handlePositionChange}
        anchorPosition={panelAnchor}
      />

      <ReticleSelector
        isOpen={activePanel === "reticle"}
        onClose={() => setActivePanel(null)}
        settings={reticleSettings}
        onSettingsChange={handleReticleSettingsChange}
        anchorPosition={panelAnchor}
      />

      {isDragging && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50">
          Перетаскивание...
        </div>
      )}
    </div>
  );
}
