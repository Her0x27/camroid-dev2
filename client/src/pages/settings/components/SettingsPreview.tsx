import { memo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/lib/settings-context";
import { usePreview } from "../contexts/PreviewContext";
import { drawWatermark, type WatermarkMetadata } from "@/lib/watermark-renderer";
import { useI18n } from "@/lib/i18n";
import { getDefaultColorForScheme } from "@/components/reticles";
import previewImage from "@/assets/preview-background.jpg";

const DEMO_METADATA = {
  latitude: 55.751244,
  longitude: 37.618423,
  altitude: 156,
  accuracy: 3.5,
  heading: 45,
  tilt: 2,
};

export const SettingsPreview = memo(function SettingsPreview() {
  const { settings } = useSettings();
  const { isPreviewActive } = usePreview();
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (imageRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = previewImage;
  }, []);

  useEffect(() => {
    if (!isPreviewActive || !imageLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawPreview = () => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      const imgRatio = img.width / img.height;
      const containerRatio = containerWidth / containerHeight;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imgRatio > containerRatio) {
        drawHeight = containerHeight;
        drawWidth = containerHeight * imgRatio;
        offsetX = (containerWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = containerWidth;
        drawHeight = containerWidth / imgRatio;
        offsetX = 0;
        offsetY = (containerHeight - drawHeight) / 2;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, containerWidth, containerHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const reticleColor = settings.reticle.autoColor 
        ? "#22c55e" 
        : getDefaultColorForScheme(settings.reticle.colorScheme);

      const metadata: WatermarkMetadata = {
        latitude: settings.gpsEnabled ? DEMO_METADATA.latitude : null,
        longitude: settings.gpsEnabled ? DEMO_METADATA.longitude : null,
        altitude: DEMO_METADATA.altitude,
        accuracy: settings.gpsEnabled ? DEMO_METADATA.accuracy : null,
        heading: DEMO_METADATA.heading,
        tilt: DEMO_METADATA.tilt,
        note: settings.reticle.showMetadata ? t.settings.preview.demoNote : undefined,
        timestamp: Date.now(),
        reticleConfig: settings.reticle,
        reticleColor,
        watermarkScale: settings.watermarkScale,
        reticlePosition: { x: 50, y: 50 },
      };

      drawWatermark(ctx, containerWidth, containerHeight, metadata);
    };

    drawPreview();
  }, [isPreviewActive, imageLoaded, settings, t]);

  return (
    <AnimatePresence>
      {isPreviewActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-0 pointer-events-none"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});
