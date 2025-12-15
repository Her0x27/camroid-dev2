export function drawMapPinIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = x + size / 2;
  const cy = y + size * 0.4;
  const r = size * 0.25;

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.lineTo(cx, y + size * 0.85);
  ctx.arc(cx, cy, r, 0, Math.PI, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.stroke();

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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x + size * 0.08, y + size * 0.85);
  ctx.lineTo(x + size * 0.5, y + size * 0.15);
  ctx.lineTo(x + size * 0.92, y + size * 0.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.33, y + size * 0.85);
  ctx.lineTo(x + size * 0.5, y + size * 0.6);
  ctx.lineTo(x + size * 0.67, y + size * 0.85);
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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.42;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.65);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.25);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - r * 0.2, cy + r * 0.25);
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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.4;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const left = x + size * 0.2;
  const right = x + size * 0.8;
  const top = y + size * 0.08;
  const bottom = y + size * 0.92;
  const foldSize = size * 0.2;

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right - foldSize, top);
  ctx.lineTo(right, top + foldSize);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(right - foldSize, top);
  ctx.lineTo(right - foldSize, top + foldSize);
  ctx.lineTo(right, top + foldSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.3, y + size * 0.5);
  ctx.lineTo(x + size * 0.7, y + size * 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.3, y + size * 0.65);
  ctx.lineTo(x + size * 0.7, y + size * 0.65);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.3, y + size * 0.8);
  ctx.lineTo(x + size * 0.55, y + size * 0.8);
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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const w = size * 0.5;
  const h = size * 0.8;
  const rx = x + (size - w) / 2;
  const ry = y + (size - h) / 2;
  const r = size * 0.06;

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
  ctx.moveTo(rx + w * 0.35, ry + h * 0.88);
  ctx.lineTo(rx + w * 0.65, ry + h * 0.88);
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
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";

  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.42;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r * 0.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.4, cy + r * 0.15);
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
