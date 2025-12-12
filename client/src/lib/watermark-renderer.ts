import { formatAltitude, formatAccuracy, formatCoordinatesCompact } from "@/hooks/use-geolocation";
import { formatHeading, getCardinalDirection, formatTilt } from "@/hooks/use-orientation";
import {
  drawMapPinIcon,
  drawMountainIcon,
  drawSignalIcon,
  drawCompassIcon,
  drawTargetIcon,
  drawFileTextIcon,
  drawRoundedRectPath,
  type IconDrawFunction,
} from "./canvas-icons";
import type { ReticleConfig, ReticlePosition } from "@shared/schema";
import { colorToRgba, getContrastingOutlineColor } from "./color-utils";

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
}

interface ColumnItem {
  icon: IconDrawFunction;
  text: string;
  hasData: boolean;
  cardinal?: string;
}

interface WatermarkLayout {
  padding: number;
  fontSize: number;
  lineHeight: number;
  topOffset: number;
  iconSize: number;
  iconGap: number;
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
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;

  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;

  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
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
  const radius = reticleSize * 0.8;
  const centerDotRadius = reticleSize * 0.08;

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
  const halfSize = reticleSize * 0.8;
  const innerCrossSize = reticleSize * 0.6;

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
  const arrowHeight = reticleSize * 1.0;
  const arrowWidth = reticleSize * 0.6;

  const tipY = centerY + arrowHeight * 0.35;
  const topLeftX = centerX - arrowWidth;
  const topLeftY = centerY - arrowHeight * 0.65;
  const midX = centerX;
  const midY = centerY - arrowHeight * 0.15;
  const topRightX = centerX + arrowWidth;
  const topRightY = centerY - arrowHeight * 0.65;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(midX, tipY);
  ctx.lineTo(topLeftX, topLeftY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(topRightX, topRightY);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = colorValue;
  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.beginPath();
  ctx.moveTo(midX, tipY);
  ctx.lineTo(topLeftX, topLeftY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(topRightX, topRightY);
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
  const bubbleWidth = reticleSize * 1.4;
  const bubbleHeight = reticleSize;
  const tailHeight = reticleSize * 0.3;
  const cornerRadius = reticleSize * 0.1;

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
    ctx.lineTo(centerX + reticleSize * 0.1, bubbleBottom);
    ctx.lineTo(centerX, bubbleBottom + tailHeight);
    ctx.lineTo(centerX - reticleSize * 0.1, bubbleBottom);
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
  const halfSize = reticleSize * 0.6;
  const cornerRadius = reticleSize * 0.08;

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineStrokeWidth;
  ctx.setLineDash([reticleSize * 0.16, reticleSize * 0.08]);
  ctx.beginPath();
  drawRoundedRectPath(ctx, centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
  ctx.stroke();

  ctx.strokeStyle = colorValue;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.beginPath();
  drawRoundedRectPath(ctx, centerX - halfSize, centerY - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold ${reticleSize * 0.5}px sans-serif`;
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

  const sizePercent = reticleConfig?.size || 20;
  const reticleSize = Math.ceil(minDimension * (sizePercent / 100) / 2);

  const opacity = reticleConfig?.opacity ? reticleConfig.opacity / 100 : 1;

  const defaultColor = "#22c55e";
  const mainColor = (reticleConfig?.autoColor && reticleColor) ? reticleColor : defaultColor;
  const colorValue = colorToRgba(mainColor, opacity);
  const outlineColor = getContrastingOutlineColor(mainColor, opacity);

  const strokeWidthPercent = reticleConfig?.strokeWidth || 3;
  const scaledStrokeWidth = Math.max(1, Math.ceil(reticleSize * 2 * (strokeWidthPercent / 100)));
  const outlineStrokeWidth = Math.max(2, scaledStrokeWidth + Math.ceil(scaledStrokeWidth * 0.2));

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
  layout: WatermarkLayout
): void {
  const { padding, fontSize, lineHeight, topOffset, iconSize, iconGap } = layout;

  const greenColor = "rgba(34, 197, 94, 0.9)";
  const dimColor = "rgba(107, 114, 128, 0.9)";
  const bgColor = "rgba(0, 0, 0, 0.6)";
  const boxPadding = Math.ceil(fontSize * 0.6);
  const boxRadius = Math.ceil(fontSize * 0.35);
  const columnGap = Math.ceil(fontSize * 2);

  const hasLocation = metadata.latitude !== null && metadata.latitude !== undefined &&
    metadata.longitude !== null && metadata.longitude !== undefined;
  const hasAltitude = metadata.altitude !== null && metadata.altitude !== undefined;
  const hasAccuracy = metadata.accuracy !== null && metadata.accuracy !== undefined;
  const hasHeading = metadata.heading !== null && metadata.heading !== undefined;
  const hasTilt = metadata.tilt !== null && metadata.tilt !== undefined;
  const hasNote = metadata.note && metadata.note.trim();

  const coordText = formatCoordinatesCompact(metadata.latitude ?? null, metadata.longitude ?? null);
  const altText = hasAltitude ? formatAltitude(metadata.altitude ?? null) : "--- m";
  const gpsText = hasAccuracy ? formatAccuracy(metadata.accuracy ?? null) : "---";
  const headingText = hasHeading ? formatHeading(metadata.heading ?? null) : "---°";
  const cardinal = hasHeading ? getCardinalDirection(metadata.heading ?? null) : "";
  const tiltText = hasTilt ? formatTilt(metadata.tilt ?? null) : "---°";

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";

  const noteText = hasNote ? metadata.note!.trim() : "";
  const noteFontSize = Math.ceil(fontSize * 0.85);

  const leftCol: ColumnItem[] = [
    { icon: drawMountainIcon, text: altText, hasData: hasAltitude },
    { icon: drawSignalIcon, text: gpsText, hasData: hasAccuracy || hasLocation },
  ];

  const rightCol: ColumnItem[] = [
    { icon: drawCompassIcon, text: headingText, hasData: hasHeading, cardinal },
    { icon: drawTargetIcon, text: tiltText, hasData: hasTilt },
  ];

  let leftColWidth = 0;
  for (const item of leftCol) {
    const w = ctx.measureText(item.text).width;
    leftColWidth = Math.max(leftColWidth, iconSize + iconGap + w);
  }

  let rightColWidth = 0;
  for (const item of rightCol) {
    let w = ctx.measureText(item.text).width;
    if (item.cardinal) {
      w += ctx.measureText(" " + item.cardinal).width;
    }
    rightColWidth = Math.max(rightColWidth, iconSize + iconGap + w);
  }

  const coordWidth = iconSize + iconGap + ctx.measureText(coordText).width;

  ctx.font = `${noteFontSize}px monospace`;
  const noteWidth = hasNote ? iconSize + iconGap + ctx.measureText(noteText).width : 0;

  const columnsWidth = leftColWidth + columnGap + rightColWidth;
  const contentWidth = Math.max(coordWidth, columnsWidth, noteWidth);
  const panelWidth = contentWidth + boxPadding * 2;

  let panelHeight = boxPadding * 2;
  if (hasNote) {
    panelHeight += noteFontSize + fontSize * 0.4;
  }
  panelHeight += lineHeight;
  panelHeight += fontSize * 0.6;
  panelHeight += lineHeight * 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  drawRoundedRectPath(ctx, padding, topOffset, panelWidth, panelHeight, boxRadius);
  ctx.fill();

  let currentY = topOffset + boxPadding;
  const contentX = padding + boxPadding;

  if (hasNote) {
    ctx.font = `${noteFontSize}px monospace`;
    drawFileTextIcon(ctx, contentX, currentY, iconSize, greenColor);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(noteText, contentX + iconSize + iconGap, currentY + (iconSize - noteFontSize) / 2);
    currentY += noteFontSize + fontSize * 0.4;
  }

  ctx.font = `${fontSize}px monospace`;
  const coordColor = hasLocation ? greenColor : dimColor;
  drawMapPinIcon(ctx, contentX, currentY, iconSize, coordColor);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillText(coordText, contentX + iconSize + iconGap, currentY);
  currentY += lineHeight;

  const separatorY = currentY + fontSize * 0.15;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, separatorY);
  ctx.lineTo(contentX + contentWidth, separatorY);
  ctx.stroke();
  currentY += fontSize * 0.6;

  const rightColX = contentX + leftColWidth + columnGap;

  for (let row = 0; row < 2; row++) {
    const leftItem = leftCol[row];
    const rightItem = rightCol[row];

    const leftIconColor = leftItem.hasData ? greenColor : dimColor;
    leftItem.icon(ctx, contentX, currentY, iconSize, leftIconColor);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(leftItem.text, contentX + iconSize + iconGap, currentY);

    const rightIconColor = rightItem.hasData ? greenColor : dimColor;
    rightItem.icon(ctx, rightColX, currentY, iconSize, rightIconColor);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(rightItem.text, rightColX + iconSize + iconGap, currentY);

    if (rightItem.cardinal) {
      const mainWidth = ctx.measureText(rightItem.text + " ").width;
      ctx.fillStyle = greenColor;
      ctx.fillText(rightItem.cardinal, rightColX + iconSize + iconGap + mainWidth, currentY);
    }

    currentY += lineHeight;
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
    drawMetadataPanel(ctx, metadata, layout);
  }
}
