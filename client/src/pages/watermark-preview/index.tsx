import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, Compass, Crosshair, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import previewBackground from "@/assets/preview-background.jpg";
import { ReticleShapeRenderer } from "./components/ReticleShapes";
import type { ReticleShape } from "./types";
import type { ColorScheme } from "@shared/schema";
import { useSettings } from "@/lib/settings-context";
import {
  InteractiveWatermark,
  FloatingEditPanel,
  ReticleSelector,
  ConfigExportImport,
  VisibilityDropdown,
  type WatermarkPosition,
  type WatermarkStyle,
  type ReticleSettings,
  type WatermarkBounds,
  type DockPosition,
} from "./components";

type ActivePanel = null | "watermark" | "reticle";

export default function WatermarkPreviewPage() {
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings, isLoading, updateWatermarkPreview, updateReticlePreview } = useSettings();

  const watermarkConfig = useMemo(() => settings.watermarkPreview, [settings.watermarkPreview]);
  const reticleConfig = useMemo(() => settings.reticlePreview, [settings.reticlePreview]);

  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>({
    x: watermarkConfig.positionX,
    y: watermarkConfig.positionY,
  });

  const [watermarkStyle, setWatermarkStyle] = useState<WatermarkStyle>({
    backgroundColor: watermarkConfig.backgroundColor,
    backgroundOpacity: watermarkConfig.backgroundOpacity,
    fontColor: watermarkConfig.fontColor,
    fontOpacity: watermarkConfig.fontOpacity,
    fontSize: watermarkConfig.fontSize,
    bold: watermarkConfig.bold,
    italic: watermarkConfig.italic,
    underline: watermarkConfig.underline,
    width: watermarkConfig.width,
    height: watermarkConfig.height,
    autoSize: watermarkConfig.autoSize ?? false,
    rotation: watermarkConfig.rotation,
    note: watermarkConfig.note,
    notePlacement: watermarkConfig.notePlacement,
    separators: watermarkConfig.separators,
    coordinateFormat: watermarkConfig.coordinateFormat,
    logoUrl: watermarkConfig.logoUrl,
    logoPosition: watermarkConfig.logoPosition,
    logoSize: watermarkConfig.logoSize,
    logoOpacity: watermarkConfig.logoOpacity ?? 100,
    fontFamily: watermarkConfig.fontFamily ?? "system",
    textAlign: watermarkConfig.textAlign ?? "left",
    showCoordinates: watermarkConfig.showCoordinates ?? true,
    showGyroscope: watermarkConfig.showGyroscope ?? true,
    showReticle: watermarkConfig.showReticle ?? true,
    showNote: watermarkConfig.showNote ?? true,
    showTimestamp: watermarkConfig.showTimestamp ?? true,
  });

  const [reticleSettings, setReticleSettings] = useState<ReticleSettings>({
    shape: reticleConfig.shape as ReticleShape,
    color: reticleConfig.color,
    size: reticleConfig.size,
    strokeWidth: reticleConfig.strokeWidth,
    opacity: reticleConfig.opacity,
    position: { x: reticleConfig.positionX, y: reticleConfig.positionY },
    autoColor: reticleConfig.autoColor ?? false,
    colorScheme: (reticleConfig.colorScheme as ColorScheme) ?? "tactical",
  });

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [watermarkBounds, setWatermarkBounds] = useState<WatermarkBounds | null>(null);
  const [watermarkDockPosition, setWatermarkDockPosition] = useState<DockPosition>("bottom");
  const [reticleDockPosition, setReticleDockPosition] = useState<DockPosition>("bottom");

  const handleWatermarkBoundsChange = useCallback((bounds: WatermarkBounds) => {
    setWatermarkBounds(bounds);
  }, []);

  const controlsOnLeft = useMemo(() => {
    if (!watermarkBounds) return false;
    return (watermarkBounds.top <= 20 && watermarkBounds.right >= 70) || watermarkBounds.centerX >= 60;
  }, [watermarkBounds]);

  useEffect(() => {
    if (!isLoading) {
      setWatermarkPosition({
        x: watermarkConfig.positionX,
        y: watermarkConfig.positionY,
      });
      setWatermarkStyle({
        backgroundColor: watermarkConfig.backgroundColor,
        backgroundOpacity: watermarkConfig.backgroundOpacity,
        fontColor: watermarkConfig.fontColor,
        fontOpacity: watermarkConfig.fontOpacity,
        fontSize: watermarkConfig.fontSize,
        bold: watermarkConfig.bold,
        italic: watermarkConfig.italic,
        underline: watermarkConfig.underline,
        width: watermarkConfig.width,
        height: watermarkConfig.height,
        autoSize: watermarkConfig.autoSize ?? false,
        rotation: watermarkConfig.rotation,
        note: watermarkConfig.note,
        notePlacement: watermarkConfig.notePlacement,
        separators: watermarkConfig.separators,
        coordinateFormat: watermarkConfig.coordinateFormat,
        logoUrl: watermarkConfig.logoUrl,
        logoPosition: watermarkConfig.logoPosition,
        logoSize: watermarkConfig.logoSize,
        logoOpacity: watermarkConfig.logoOpacity ?? 100,
        fontFamily: watermarkConfig.fontFamily ?? "system",
        textAlign: watermarkConfig.textAlign ?? "left",
        showCoordinates: watermarkConfig.showCoordinates ?? true,
        showGyroscope: watermarkConfig.showGyroscope ?? true,
        showReticle: watermarkConfig.showReticle ?? true,
        showNote: watermarkConfig.showNote ?? true,
        showTimestamp: watermarkConfig.showTimestamp ?? true,
      });
      setReticleSettings({
        shape: reticleConfig.shape as ReticleShape,
        color: reticleConfig.color,
        size: reticleConfig.size,
        strokeWidth: reticleConfig.strokeWidth,
        opacity: reticleConfig.opacity,
        position: { x: reticleConfig.positionX, y: reticleConfig.positionY },
        autoColor: reticleConfig.autoColor ?? false,
        colorScheme: (reticleConfig.colorScheme as ColorScheme) ?? "tactical",
      });
    }
  }, [isLoading, watermarkConfig, reticleConfig]);

  const handleWatermarkTap = useCallback(() => {
    setActivePanel(activePanel === "watermark" ? null : "watermark");
  }, [activePanel]);

  const handleReticleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
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
    updateWatermarkPreview({
      positionX: watermarkPosition.x,
      positionY: watermarkPosition.y,
    });
  }, [watermarkPosition, updateWatermarkPreview]);

  const handleStyleChange = useCallback((updates: Partial<WatermarkStyle>) => {
    setWatermarkStyle((prev) => ({ ...prev, ...updates }));
    updateWatermarkPreview(updates);
  }, [updateWatermarkPreview]);

  const handlePositionChange = useCallback(
    (updates: Partial<WatermarkPosition>) => {
      setWatermarkPosition((prev) => ({ ...prev, ...updates }));
      updateWatermarkPreview({
        positionX: updates.x,
        positionY: updates.y,
      });
    },
    [updateWatermarkPreview]
  );

  const handleReticleSettingsChange = useCallback(
    (updates: Partial<ReticleSettings>) => {
      setReticleSettings((prev) => ({ ...prev, ...updates }));
      updateReticlePreview({
        shape: updates.shape,
        color: updates.color,
        size: updates.size,
        strokeWidth: updates.strokeWidth,
        opacity: updates.opacity,
        positionX: updates.position?.x,
        positionY: updates.position?.y,
        autoColor: updates.autoColor,
        colorScheme: updates.colorScheme,
      });
    },
    [updateReticlePreview]
  );

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && activePanel) {
      setActivePanel(null);
    }
  }, [activePanel]);

  const handleImportConfig = useCallback((watermark: typeof watermarkConfig, reticle: typeof reticleConfig) => {
    setWatermarkPosition({ x: watermark.positionX, y: watermark.positionY });
    setWatermarkStyle({
      backgroundColor: watermark.backgroundColor,
      backgroundOpacity: watermark.backgroundOpacity,
      fontColor: watermark.fontColor,
      fontOpacity: watermark.fontOpacity,
      fontSize: watermark.fontSize,
      bold: watermark.bold,
      italic: watermark.italic,
      underline: watermark.underline,
      width: watermark.width,
      height: watermark.height,
      autoSize: watermark.autoSize ?? false,
      rotation: watermark.rotation,
      note: watermark.note,
      notePlacement: watermark.notePlacement,
      separators: watermark.separators,
      coordinateFormat: watermark.coordinateFormat,
      logoUrl: watermark.logoUrl,
      logoPosition: watermark.logoPosition,
      logoSize: watermark.logoSize,
      logoOpacity: watermark.logoOpacity ?? 100,
      fontFamily: watermark.fontFamily ?? "system",
      textAlign: watermark.textAlign ?? "left",
      showCoordinates: watermark.showCoordinates ?? true,
      showGyroscope: watermark.showGyroscope ?? true,
      showReticle: watermark.showReticle ?? true,
      showNote: watermark.showNote ?? true,
      showTimestamp: watermark.showTimestamp ?? true,
    });
    setReticleSettings({
      shape: reticle.shape as ReticleShape,
      color: reticle.color,
      size: reticle.size,
      strokeWidth: reticle.strokeWidth,
      opacity: reticle.opacity,
      position: { x: reticle.positionX, y: reticle.positionY },
      autoColor: reticle.autoColor ?? false,
      colorScheme: (reticle.colorScheme as ColorScheme) ?? "tactical",
    });
    updateWatermarkPreview(watermark);
    updateReticlePreview(reticle);
  }, [updateWatermarkPreview, updateReticlePreview]);

  const toggleButtons = useMemo(() => [
    { key: "showCoordinates", icon: MapPin, title: "Координаты (±погрешность)", active: watermarkStyle.showCoordinates },
    { key: "showGyroscope", icon: Compass, title: "Гироскоп", active: watermarkStyle.showGyroscope },
    { key: "showReticle", icon: Crosshair, title: "Прицел", active: watermarkStyle.showReticle },
    { key: "showNote", icon: MessageSquare, title: "Заметка", active: watermarkStyle.showNote },
    { key: "showTimestamp", icon: Clock, title: "Таймштамп", active: watermarkStyle.showTimestamp },
  ], [watermarkStyle.showCoordinates, watermarkStyle.showGyroscope, watermarkStyle.showReticle, watermarkStyle.showNote, watermarkStyle.showTimestamp]);

  const handleToggle = useCallback((key: string) => {
    handleStyleChange({ [key]: !watermarkStyle[key as keyof WatermarkStyle] } as Partial<WatermarkStyle>);
  }, [handleStyleChange, watermarkStyle]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

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
          onBoundsChange={handleWatermarkBoundsChange}
        />

        {watermarkStyle.showReticle && (
          <div
            className="absolute left-1/2 top-1/2 cursor-pointer"
            style={{
              transform: `translate(calc(-50% + ${reticleSettings.position.x}px), calc(-50% + ${reticleSettings.position.y}px))`,
              width: `${reticleSettings.size}vmin`,
              height: `${reticleSettings.size}vmin`,
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              handleReticleTap(e);
            }}
          >
            <div
              className={`w-full h-full transition-all ${
                activePanel === "reticle" ? "ring-2 ring-primary ring-offset-2 rounded-full" : ""
              }`}
            >
              <ReticleShapeRenderer
                shape={reticleSettings.shape}
                size="100%"
                color={reticleSettings.color}
                strokeWidth={reticleSettings.strokeWidth}
                opacity={reticleSettings.opacity}
              />
            </div>
          </div>
        )}
      </div>

      <div 
        className="absolute top-4 left-4 z-50 flex items-center gap-2 transition-transform duration-300 ease-out"
        style={{
          transform: controlsOnLeft ? 'translateX(0)' : `translateX(calc(100vw - 100% - 2rem))`,
        }}
      >
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => navigate("/settings")}
          title="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ConfigExportImport
          watermarkConfig={watermarkConfig}
          reticleConfig={reticleConfig}
          onImport={handleImportConfig}
        />
        <VisibilityDropdown
          items={toggleButtons}
          onToggle={handleToggle}
        />
      </div>

      <FloatingEditPanel
        isOpen={activePanel === "watermark"}
        onClose={() => setActivePanel(null)}
        style={watermarkStyle}
        position={watermarkPosition}
        onStyleChange={handleStyleChange}
        onPositionChange={handlePositionChange}
        dockPosition={watermarkDockPosition}
        onDockPositionChange={setWatermarkDockPosition}
      />

      <ReticleSelector
        isOpen={activePanel === "reticle"}
        onClose={() => setActivePanel(null)}
        settings={reticleSettings}
        onSettingsChange={handleReticleSettingsChange}
        dockPosition={reticleDockPosition}
        onDockPositionChange={setReticleDockPosition}
      />

      
      {isDragging && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50">
          Перетаскивание...
        </div>
      )}
    </div>
  );
}
