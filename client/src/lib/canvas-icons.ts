export function drawMapPinIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.35;

  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.1, r, Math.PI * 0.2, Math.PI * 0.8, true);
  ctx.lineTo(cx, cy + size * 0.4);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.1, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMountainIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x + size * 0.1, y + size * 0.8);
  ctx.lineTo(x + size * 0.4, y + size * 0.2);
  ctx.lineTo(x + size * 0.55, y + size * 0.45);
  ctx.lineTo(x + size * 0.7, y + size * 0.25);
  ctx.lineTo(x + size * 0.9, y + size * 0.8);
  ctx.stroke();
  ctx.restore();
}

export function drawSignalIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;

  const barWidth = size * 0.18;
  const gap = size * 0.08;
  const heights = [0.3, 0.5, 0.7, 0.9];

  heights.forEach((h, i) => {
    const barX = x + i * (barWidth + gap) + size * 0.1;
    const barHeight = size * h;
    const barY = y + size - barHeight - size * 0.05;
    ctx.fillRect(barX, barY, barWidth, barHeight);
  });
  ctx.restore();
}

export function drawCompassIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.1;

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.7);
  ctx.lineTo(cx - r * 0.25, cy + r * 0.3);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + r * 0.25, cy + r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawTargetIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.35;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - r * 1.3, cy);
  ctx.lineTo(cx + r * 1.3, cy);
  ctx.moveTo(cx, cy - r * 1.3);
  ctx.lineTo(cx, cy + r * 1.3);
  ctx.stroke();
  ctx.restore();
}

export function drawFileTextIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.1);
  ctx.lineTo(x + size * 0.6, y + size * 0.1);
  ctx.lineTo(x + size * 0.8, y + size * 0.3);
  ctx.lineTo(x + size * 0.8, y + size * 0.9);
  ctx.lineTo(x + size * 0.2, y + size * 0.9);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.6, y + size * 0.1);
  ctx.lineTo(x + size * 0.6, y + size * 0.3);
  ctx.lineTo(x + size * 0.8, y + size * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.3, y + size * 0.5);
  ctx.lineTo(x + size * 0.7, y + size * 0.5);
  ctx.moveTo(x + size * 0.3, y + size * 0.7);
  ctx.lineTo(x + size * 0.7, y + size * 0.7);
  ctx.stroke();
  ctx.restore();
}

export function drawSmartphoneIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const w = size * 0.5;
  const h = size * 0.8;
  const rx = x + (size - w) / 2;
  const ry = y + (size - h) / 2;
  const r = size * 0.08;

  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + w - r, ry);
  ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
  ctx.lineTo(rx + w, ry + h - r);
  ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
  ctx.lineTo(rx + r, ry + h);
  ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rx + w * 0.35, ry + h * 0.9);
  ctx.lineTo(rx + w * 0.65, ry + h * 0.9);
  ctx.stroke();
  ctx.restore();
}

export function drawClockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r * 0.6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.45, cy + r * 0.2);
  ctx.stroke();
  ctx.restore();
}

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export type IconDrawFunction = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => void;
