import { formatAltitude, formatAccuracy } from "@/hooks/use-geolocation";
import { formatHeading, getCardinalDirection, formatTilt } from "@/hooks/use-orientation";
import {
  drawMapPinIcon,
  drawMountainIcon,
  drawSmartphoneIcon,
  drawCompassIcon,
  drawTargetIcon,
  drawFileTextIcon,
  drawClockIcon,
  drawRoundedRectPath,
} from "./canvas-icons";
import type { ReticleConfig, ReticlePosition, CoordinateFormat, TextAlign, LogoPosition, FontFamily, NotePlacement, WatermarkSeparator } from "@shared/schema";
import { colorToRgba, getContrastingOutlineColor } from "./color-utils";

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  system: "system-ui, sans-serif",
  roboto: "'Roboto', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  oswald: "'Oswald', sans-serif",
  playfair: "'Playfair Display', serif",
};

function buildFontString(fontSize: number, fontFamily: FontFamily, bold?: boolean, italic?: boolean): string {
  const fontWeight = bold ? "bold" : "normal";
  const fontStyle = italic ? "italic" : "normal";
  const family = FONT_FAMILY_MAP[fontFamily] || FONT_FAMILY_MAP.system;
  return `${fontStyle} ${fontWeight} ${fontSize}px ${family}`;
}

function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface WatermarkMetadata {
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  tilt?: number | null;
  note?: string;
  timestamp?: number;
  reticleConfig?: ReticleConfig;
  reticleColor?: string;
  watermarkScale?: number;
  reticlePosition?: ReticlePosition;
  showCoordinates?: boolean;
  showGyroscope?: boolean;
  showNote?: boolean;
  showTimestamp?: boolean;
  coordinateFormat?: CoordinateFormat;
  fontFamily?: FontFamily;
  textAlign?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fontColor?: string;
  fontOpacity?: number;
  fontSize?: number;
  logoUrl?: string | null;
  logoPosition?: LogoPosition;
  logoSize?: number;
  logoOpacity?: number;
  width?: number;
  height?: number;
  autoSize?: boolean;
  rotation?: number;
  positionX?: number;
  positionY?: number;
  notePlacement?: NotePlacement;
  separators?: WatermarkSeparator[];
}

interface WatermarkLayout {
  padding: number;
  fontSize: number;
  lineHeight: number;
  topOffset: number;
  iconSize: number;
  iconGap: number;
}

function formatCoordinatesCanvas(lat: number | null | undefined, lng: number | null | undefined, format: CoordinateFormat = "decimal"): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "---";
  }
  
  switch (format) {
    case "dms": {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      const absLat = Math.abs(lat);
      const absLng = Math.abs(lng);
      const latDeg = Math.floor(absLat);
      const latMin = Math.floor((absLat - latDeg) * 60);
      const latSec = ((absLat - latDeg - latMin / 60) * 3600).toFixed(1);
      const lngDeg = Math.floor(absLng);
      const lngMin = Math.floor((absLng - lngDeg) * 60);
      const lngSec = ((absLng - lngDeg - lngMin / 60) * 3600).toFixed(1);
      return `${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
    }
    case "ddm": {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      const absLat = Math.abs(lat);
      const absLng = Math.abs(lng);
      const latDeg = Math.floor(absLat);
      const latMin = ((absLat - latDeg) * 60).toFixed(4);
      const lngDeg = Math.floor(absLng);
      const lngMin = ((absLng - lngDeg) * 60).toFixed(4);
      return `${latDeg}°${latMin}'${latDir} ${lngDeg}°${lngMin}'${lngDir}`;
    }
    case "simple": {
      return `${lat.toFixed(5)} ${lng.toFixed(5)}`;
    }
    case "decimal":
    default: {
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      return `${Math.abs(lat).toFixed(4)}°${latDir} ${Math.abs(lng).toFixed(4)}°${lngDir}`;
    }
  }
}

function calculateLayout(width: number, height: number, watermarkScale: number): WatermarkLayout {
  const minDimension = Math.min(width, height);
  const scale = watermarkScale;
  
  const fontSize = Math.ceil(minDimension * 0.022 * scale);
  
  return {
    padding: Math.ceil(minDimension * 0.015 * scale),
    fontSize,
    lineHeight: fontSize * 1.5,
    topOffset: Math.ceil(minDimension * 0.025 * scale),
    iconSize: Math.ceil(fontSize * 1.1),
    iconGap: Math.ceil(fontSize * 0.5),
  };
}

function drawCrosshairReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const halfSize = reticleSize / 2;
  
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;

  ctx.beginPath();
  ctx.moveTo(centerX - halfSize, centerY);
  ctx.lineTo(centerX + halfSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfSize);
  ctx.lineTo(centerX, centerY + halfSize);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;

  ctx.beginPath();
  ctx.moveTo(centerX - halfSize, centerY);
  ctx.lineTo(centerX + halfSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - halfSize);
  ctx.lineTo(centerX, centerY + halfSize);
  ctx.stroke();
}

function drawCircleReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const radius = reticleSize * 0.4;
  const centerDotRadius = reticleSize * 0.04;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = outlineColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerDotRadius + scaledStrokeWidth * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colorValue;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerDotRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSquareReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const halfSize = reticleSize * 0.4;
  const innerCrossSize = reticleSize * 0.3;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.strokeRect(centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2);

  ctx.beginPath();
  ctx.moveTo(centerX - innerCrossSize, centerY);
  ctx.lineTo(centerX + innerCrossSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - innerCrossSize);
  ctx.lineTo(centerX, centerY + innerCrossSize);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.strokeRect(centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2);

  ctx.beginPath();
  ctx.moveTo(centerX - innerCrossSize, centerY);
  ctx.lineTo(centerX + innerCrossSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - innerCrossSize);
  ctx.lineTo(centerX, centerY + innerCrossSize);
  ctx.stroke();
}

function drawArrowReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const arrowWidth = reticleSize * 0.30;

  const tipY = centerY + reticleSize * 0.35;
  const topY = centerY - reticleSize * 0.15;
  const midY = centerY;
  const midX = centerX;
  const topLeftX = centerX - arrowWidth;
  const topRightX = centerX + arrowWidth;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(midX, tipY);
  ctx.lineTo(topLeftX, topY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(topRightX, topY);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = colorValue;
  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.beginPath();
  ctx.moveTo(midX, tipY);
  ctx.lineTo(topLeftX, topY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(topRightX, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawSpeechBubbleReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const bubbleWidth = reticleSize * 0.7;
  const bubbleHeight = reticleSize * 0.5;
  const tailHeight = reticleSize * 0.15;
  const cornerRadius = reticleSize * 0.05;

  const bubbleLeft = centerX - bubbleWidth / 2;
  const bubbleTop = centerY - bubbleHeight / 2 - tailHeight / 2;
  const bubbleRight = centerX + bubbleWidth / 2;
  const bubbleBottom = centerY + bubbleHeight / 2 - tailHeight / 2;

  const drawBubblePath = () => {
    ctx.beginPath();
    ctx.moveTo(bubbleLeft + cornerRadius, bubbleTop);
    ctx.lineTo(bubbleRight - cornerRadius, bubbleTop);
    ctx.quadraticCurveTo(bubbleRight, bubbleTop, bubbleRight, bubbleTop + cornerRadius);
    ctx.lineTo(bubbleRight, bubbleBottom - cornerRadius);
    ctx.quadraticCurveTo(bubbleRight, bubbleBottom, bubbleRight - cornerRadius, bubbleBottom);
    ctx.lineTo(centerX + reticleSize * 0.05, bubbleBottom);
    ctx.lineTo(centerX, bubbleBottom + tailHeight);
    ctx.lineTo(centerX - reticleSize * 0.05, bubbleBottom);
    ctx.lineTo(bubbleLeft + cornerRadius, bubbleBottom);
    ctx.quadraticCurveTo(bubbleLeft, bubbleBottom, bubbleLeft, bubbleBottom - cornerRadius);
    ctx.lineTo(bubbleLeft, bubbleTop + cornerRadius);
    ctx.quadraticCurveTo(bubbleLeft, bubbleTop, bubbleLeft + cornerRadius, bubbleTop);
    ctx.closePath();
  };

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.lineJoin = "round";
  drawBubblePath();
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  drawBubblePath();
  ctx.stroke();
}

function drawCustomReticle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  reticleSize: number,
  colorValue: string,
  outlineColor: string,
  scaledStrokeWidth: number,
  outlineStrokeWidth: number
): void {
  const halfSize = reticleSize * 0.3;
  const cornerRadius = reticleSize * 0.04;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.setLineDash([reticleSize * 0.08, reticleSize * 0.04]);
  ctx.beginPath();
  drawRoundedRectPath(ctx, centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.beginPath();
  drawRoundedRectPath(ctx, centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold ${reticleSize * 0.25}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = outlineColor;
  ctx.fillText("?", centerX + 1, centerY + 1);
  ctx.fillStyle = colorValue;
  ctx.fillText("?", centerX, centerY);
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  reticleConfig: ReticleConfig | undefined,
  reticleColor: string | undefined,
  reticlePosition?: ReticlePosition
): void {
  if (reticleConfig?.enabled === false) return;

  const minDimension = Math.min(width, height);

  const centerX = reticlePosition ? (width * reticlePosition.x / 100) : (width / 2);
  const centerY = reticlePosition ? (height * reticlePosition.y / 100) : (height / 2);

  const sizePercent = reticleConfig?.size || 5;
  const reticleSize = minDimension * (sizePercent / 100);

  const opacity = reticleConfig?.opacity ? reticleConfig.opacity / 100 : 1;

  const defaultColor = "#22c55e";
  const mainColor = (reticleConfig?.autoColor && reticleColor) ? reticleColor : defaultColor;
  const colorValue = colorToRgba(mainColor, opacity);
  const outlineColor = getContrastingOutlineColor(mainColor, opacity);

  const strokeWidthPercent = reticleConfig?.strokeWidth || 10;
  const scaledStrokeWidth = Math.max(1, reticleSize * (strokeWidthPercent / 100));
  const outlineStrokeWidth = scaledStrokeWidth + (reticleSize * 0.02);

  ctx.lineCap = "round";

  const shape = reticleConfig?.shape || "crosshair";

  switch (shape) {
    case "circle":
      drawCircleReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
    case "square":
      drawSquareReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
    case "arrow":
      drawArrowReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
    case "speech-bubble":
      drawSpeechBubbleReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
    case "custom":
      drawCustomReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
    case "crosshair":
    default:
      drawCrosshairReticle(ctx, centerX, centerY, reticleSize, colorValue, outlineColor, scaledStrokeWidth, outlineStrokeWidth);
      break;
  }
}

function drawMetadataPanel(
  ctx: CanvasRenderingContext2D,
  metadata: WatermarkMetadata,
  _layout: WatermarkLayout,
  canvasWidth: number,
  canvasHeight: number
): void {
  const showCoordinates = metadata.showCoordinates !== false;
  const showGyroscope = metadata.showGyroscope !== false;
  const showNote = metadata.showNote !== false;
  const showTimestamp = metadata.showTimestamp === true;
  const notePlacement = metadata.notePlacement || "end";
  const textAlign = metadata.textAlign || "left";
  const fontFamily: FontFamily = metadata.fontFamily || "system";
  const bold = metadata.bold || false;
  const italic = metadata.italic || false;
  const separators = metadata.separators || [];

  const minDimension = Math.min(canvasWidth, canvasHeight);
  const vminFontSize = metadata.fontSize || 3;
  const fontSize = Math.ceil(minDimension * (vminFontSize / 100));
  const lineHeight = fontSize * 1.4;
  const iconSize = Math.ceil(fontSize * 0.85);
  const iconGap = Math.ceil(fontSize * 0.3);
  const separatorHeight = Math.ceil(fontSize * 0.3);

  const bgOpacity = metadata.backgroundOpacity !== undefined ? metadata.backgroundOpacity / 100 : 0.6;
  const bgColor = metadata.backgroundColor 
    ? hexToRgba(metadata.backgroundColor, bgOpacity)
    : `rgba(0, 0, 0, ${bgOpacity})`;

  const fontOpacity = metadata.fontOpacity !== undefined ? metadata.fontOpacity / 100 : 0.9;
  const textColor = metadata.fontColor
    ? hexToRgba(metadata.fontColor, fontOpacity)
    : `rgba(255, 255, 255, ${fontOpacity})`;
  
  const dimTextColor = metadata.fontColor
    ? hexToRgba(metadata.fontColor, fontOpacity * 0.5)
    : `rgba(255, 255, 255, ${fontOpacity * 0.5})`;

  const dimColor = "rgba(107, 114, 128, 0.9)";
  const boxPadding = Math.ceil(fontSize * 0.6);
  const boxRadius = Math.ceil(fontSize * 0.35);

  const hasLocation = metadata.latitude !== null && metadata.latitude !== undefined &&
    metadata.longitude !== null && metadata.longitude !== undefined;
  const hasAltitude = metadata.altitude !== null && metadata.altitude !== undefined;
  const hasAccuracy = metadata.accuracy !== null && metadata.accuracy !== undefined;
  const hasHeading = metadata.heading !== null && metadata.heading !== undefined;
  const hasTilt = metadata.tilt !== null && metadata.tilt !== undefined;
  const hasNote = metadata.note && metadata.note.trim();

  const coordFormat = metadata.coordinateFormat || "decimal";
  const coordText = formatCoordinatesCanvas(metadata.latitude, metadata.longitude, coordFormat);
  const accuracyText = hasAccuracy ? formatAccuracy(metadata.accuracy ?? null) : "±5m";
  const altText = hasAltitude ? formatAltitude(metadata.altitude ?? null) : "--- m";
  const headingText = hasHeading ? formatHeading(metadata.heading ?? null) : "---°";
  const cardinal = hasHeading ? getCardinalDirection(metadata.heading ?? null) : "";
  const tiltText = hasTilt ? formatTilt(metadata.tilt ?? null) : "---°";

  ctx.font = buildFontString(fontSize, fontFamily, bold, italic);
  ctx.textBaseline = "top";

  const noteText = (showNote && hasNote) ? metadata.note!.trim() : "";
  const noteFontSize = fontSize;

  const timestampText = showTimestamp && metadata.timestamp 
    ? new Date(metadata.timestamp).toLocaleString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    : "";

  const hasSeparator = (position: string) => separators.some(s => s.position === position);
  const separatorLineHeight = separatorHeight + fontSize * 0.2;

  const pipeText = " | ";
  const pipeWidth = ctx.measureText(pipeText).width;
  
  let gyroRowWidth = 0;
  if (showGyroscope) {
    const altWidth = iconSize + iconGap + ctx.measureText(altText).width;
    const tiltWidth = iconSize + iconGap + ctx.measureText(tiltText).width;
    let headingWidth = iconSize + iconGap + ctx.measureText(headingText).width;
    if (cardinal) {
      headingWidth += ctx.measureText(" " + cardinal).width;
    }
    gyroRowWidth = altWidth + pipeWidth + tiltWidth + pipeWidth + headingWidth;
  }

  const coordWidth = showCoordinates 
    ? iconSize + iconGap + ctx.measureText(coordText).width + iconGap + iconSize + iconGap + ctx.measureText(accuracyText).width
    : 0;

  ctx.font = buildFontString(noteFontSize, fontFamily, bold, italic);
  const noteWidth = noteText ? iconSize + iconGap + ctx.measureText(noteText).width : 0;

  ctx.font = buildFontString(fontSize, fontFamily, bold, italic);
  const timestampWidth = timestampText ? iconSize + iconGap + ctx.measureText(timestampText).width : 0;

  const autoContentWidth = Math.max(coordWidth, gyroRowWidth, noteWidth, timestampWidth);
  
  if (autoContentWidth === 0) return;
  
  const autoSize = metadata.autoSize !== false;
  const fixedPanelWidth = metadata.width !== undefined ? (canvasWidth * metadata.width / 100) : 0;
  
  const panelWidth = autoSize ? (autoContentWidth + boxPadding * 2) : Math.max(fixedPanelWidth, boxPadding * 2);
  const contentWidth = panelWidth - boxPadding * 2;

  let panelHeight = boxPadding * 2;
  
  const separatorBottomPadding = fontSize * 0.3;
  
  if (notePlacement === "start" && noteText) {
    panelHeight += noteFontSize + fontSize * 0.4;
    if (hasSeparator("before-coords")) {
      panelHeight += separatorLineHeight + separatorBottomPadding;
    }
  }
  
  if (notePlacement === "end" && hasSeparator("before-coords")) {
    panelHeight += separatorLineHeight + separatorBottomPadding;
  }
  
  if (showCoordinates) {
    panelHeight += lineHeight;
  }
  
  if (hasSeparator("after-coords")) {
    panelHeight += separatorLineHeight + separatorBottomPadding;
  }
  
  if (showGyroscope) {
    panelHeight += lineHeight;
  }
  
  if (showTimestamp && timestampText) {
    panelHeight += lineHeight;
  }
  
  if (notePlacement === "end" && noteText) {
    if (hasSeparator("before-note")) {
      panelHeight += separatorLineHeight + separatorBottomPadding;
    }
    panelHeight += noteFontSize + fontSize * 0.4;
    if (hasSeparator("after-note")) {
      panelHeight += separatorLineHeight + separatorBottomPadding;
    }
  }
  
  if (notePlacement === "start" && hasSeparator("after-note")) {
    panelHeight += separatorLineHeight + separatorBottomPadding;
  }

  const positionX = metadata.positionX !== undefined ? metadata.positionX : 0;
  const positionY = metadata.positionY !== undefined ? metadata.positionY : 0;
  const panelX = (canvasWidth * positionX / 100);
  const panelY = (canvasHeight * positionY / 100);

  const rotation = metadata.rotation || 0;
  const panelCenterX = panelX + panelWidth / 2;
  const panelCenterY = panelY + panelHeight / 2;

  ctx.save();

  if (rotation !== 0) {
    ctx.translate(panelCenterX, panelCenterY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-panelCenterX, -panelCenterY);
  }

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  drawRoundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, boxRadius);
  ctx.fill();

  let currentY = panelY + boxPadding;
  const contentX = panelX + boxPadding;

  const drawSeparatorLine = () => {
    const separatorY = currentY + separatorHeight / 2;
    ctx.strokeStyle = dimTextColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX, separatorY);
    ctx.lineTo(contentX + contentWidth, separatorY);
    ctx.stroke();
    currentY += separatorLineHeight + fontSize * 0.3;
  };

  const drawNote = () => {
    if (!noteText) return;
    ctx.font = buildFontString(noteFontSize, fontFamily, bold, italic);
    const noteTextWidth = ctx.measureText(noteText).width;
    const noteContentWidth = iconSize + iconGap + noteTextWidth;
    
    if (textAlign === "left") {
      drawFileTextIcon(ctx, contentX, currentY, iconSize, textColor);
      ctx.fillStyle = textColor;
      ctx.fillText(noteText, contentX + iconSize + iconGap, currentY + (iconSize - noteFontSize) / 2);
    } else if (textAlign === "center") {
      const startX = contentX + (contentWidth - noteContentWidth) / 2;
      drawFileTextIcon(ctx, startX, currentY, iconSize, textColor);
      ctx.fillStyle = textColor;
      ctx.fillText(noteText, startX + iconSize + iconGap, currentY + (iconSize - noteFontSize) / 2);
    } else {
      const startX = contentX + contentWidth - noteContentWidth;
      drawFileTextIcon(ctx, startX, currentY, iconSize, textColor);
      ctx.fillStyle = textColor;
      ctx.fillText(noteText, startX + iconSize + iconGap, currentY + (iconSize - noteFontSize) / 2);
    }
    currentY += noteFontSize + fontSize * 0.4;
  };

  const drawCoordinates = () => {
    if (!showCoordinates) return;
    ctx.font = buildFontString(fontSize, fontFamily, bold, italic);
    const coordColor = hasLocation ? textColor : dimColor;
    const coordTextWidth = ctx.measureText(coordText).width;
    const accuracyTextWidth = ctx.measureText(accuracyText).width;
    const totalCoordWidth = iconSize + iconGap + coordTextWidth + iconGap + iconSize + iconGap + accuracyTextWidth;
    
    let startX = contentX;
    if (textAlign === "center") {
      startX = contentX + (contentWidth - totalCoordWidth) / 2;
    } else if (textAlign === "right") {
      startX = contentX + contentWidth - totalCoordWidth;
    }
    
    drawMapPinIcon(ctx, startX, currentY, iconSize, coordColor);
    ctx.fillStyle = textColor;
    ctx.fillText(coordText, startX + iconSize + iconGap, currentY);
    
    const targetX = startX + iconSize + iconGap + coordTextWidth + iconGap;
    const accuracyColor = hasAccuracy ? textColor : dimColor;
    drawTargetIcon(ctx, targetX, currentY, iconSize, accuracyColor);
    ctx.fillStyle = textColor;
    ctx.fillText(accuracyText, targetX + iconSize + iconGap, currentY);
    
    currentY += lineHeight;
  };

  const drawGyroscope = () => {
    if (!showGyroscope) return;
    
    ctx.font = buildFontString(fontSize, fontFamily, bold, italic);
    
    const altWidth = iconSize + iconGap + ctx.measureText(altText).width;
    const tiltWidth = iconSize + iconGap + ctx.measureText(tiltText).width;
    let headingWidth = iconSize + iconGap + ctx.measureText(headingText).width;
    if (cardinal) {
      headingWidth += ctx.measureText(" " + cardinal).width;
    }
    const totalGyroWidth = altWidth + pipeWidth + tiltWidth + pipeWidth + headingWidth;
    
    let startX = contentX;
    if (textAlign === "center") {
      startX = contentX + (contentWidth - totalGyroWidth) / 2;
    } else if (textAlign === "right") {
      startX = contentX + contentWidth - totalGyroWidth;
    }
    
    const altColor = hasAltitude ? textColor : dimColor;
    drawMountainIcon(ctx, startX, currentY, iconSize, altColor);
    ctx.fillStyle = textColor;
    ctx.fillText(altText, startX + iconSize + iconGap, currentY);
    startX += altWidth;
    
    ctx.fillStyle = dimTextColor;
    ctx.fillText(pipeText, startX, currentY);
    startX += pipeWidth;
    
    const tiltColor = hasTilt ? textColor : dimColor;
    drawSmartphoneIcon(ctx, startX, currentY, iconSize, tiltColor);
    ctx.fillStyle = textColor;
    ctx.fillText(tiltText, startX + iconSize + iconGap, currentY);
    startX += tiltWidth;
    
    ctx.fillStyle = dimTextColor;
    ctx.fillText(pipeText, startX, currentY);
    startX += pipeWidth;
    
    const headingColor = hasHeading ? textColor : dimColor;
    drawCompassIcon(ctx, startX, currentY, iconSize, headingColor);
    ctx.fillStyle = textColor;
    ctx.fillText(headingText, startX + iconSize + iconGap, currentY);
    if (cardinal) {
      const headingTextWidth = ctx.measureText(headingText + " ").width;
      ctx.fillStyle = textColor;
      ctx.fillText(cardinal, startX + iconSize + iconGap + headingTextWidth, currentY);
    }
    
    currentY += lineHeight;
  };

  const drawTimestamp = () => {
    if (!timestampText) return;
    ctx.font = buildFontString(fontSize, fontFamily, bold, italic);
    const timestampTextWidth = ctx.measureText(timestampText).width;
    const totalTimestampWidth = iconSize + iconGap + timestampTextWidth;
    
    let startX = contentX;
    if (textAlign === "center") {
      startX = contentX + (contentWidth - totalTimestampWidth) / 2;
    } else if (textAlign === "right") {
      startX = contentX + contentWidth - totalTimestampWidth;
    }
    
    drawClockIcon(ctx, startX, currentY, iconSize, textColor);
    ctx.fillStyle = textColor;
    ctx.fillText(timestampText, startX + iconSize + iconGap, currentY);
    currentY += lineHeight;
  };

  if (notePlacement === "start") {
    drawNote();
    if (hasSeparator("before-coords")) {
      drawSeparatorLine();
    }
    drawCoordinates();
    if (hasSeparator("after-coords")) {
      drawSeparatorLine();
    }
    drawGyroscope();
    drawTimestamp();
    if (hasSeparator("after-note")) {
      drawSeparatorLine();
    }
  } else {
    if (hasSeparator("before-coords")) {
      drawSeparatorLine();
    }
    drawCoordinates();
    if (hasSeparator("after-coords")) {
      drawSeparatorLine();
    }
    drawGyroscope();
    drawTimestamp();
    if (hasSeparator("before-note")) {
      drawSeparatorLine();
    }
    drawNote();
    if (hasSeparator("after-note")) {
      drawSeparatorLine();
    }
  }

  ctx.restore();
}

const FONT_URLS: Record<string, string> = {
  roboto: '/fonts/roboto.woff2',
  montserrat: '/fonts/montserrat.woff2',
  oswald: '/fonts/oswald.woff2',
  playfair: '/fonts/playfair-display.woff2',
};

async function ensureFontLoaded(fontFamily: FontFamily): Promise<void> {
  if (fontFamily === 'system') return;
  
  const fontName = FONT_FAMILY_MAP[fontFamily];
  if (!fontName) return;

  try {
    await document.fonts.ready;
    
    const fontUrl = FONT_URLS[fontFamily];
    if (!fontUrl) return;
    
    const testString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const loaded = document.fonts.check(`16px ${fontName}`, testString);
    
    if (!loaded) {
      const fontFace = new FontFace(
        fontName.split(',')[0].replace(/['"]/g, '').trim(),
        `url(${fontUrl})`
      );
      await fontFace.load();
      document.fonts.add(fontFace);
    }
  } catch (e) {
    console.warn(`Failed to load font ${fontFamily}:`, e);
  }
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  metadata?: WatermarkMetadata
): void {
  if (!metadata) return;

  const watermarkScale = (metadata.watermarkScale || 100) / 100;
  const layout = calculateLayout(width, height, watermarkScale);

  drawReticle(ctx, width, height, metadata.reticleConfig, metadata.reticleColor, metadata.reticlePosition);

  if (metadata.reticleConfig?.showMetadata !== false) {
    drawMetadataPanel(ctx, metadata, layout, width, height);
  }
}

export async function drawWatermarkAsync(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  metadata?: WatermarkMetadata
): Promise<void> {
  if (!metadata) return;

  const fontFamily = metadata.fontFamily || 'system';
  await ensureFontLoaded(fontFamily);

  drawWatermark(ctx, width, height, metadata);
}
