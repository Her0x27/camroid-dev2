import { memo } from "react";
import type { ReticleShape } from "../types";

export interface ReticleShapeProps {
  size: number;
  color: string;
  strokeWidth: number;
  opacity: number;
  className?: string;
}

export interface ReticleShapeComponentProps extends ReticleShapeProps {
  shape: ReticleShape;
}

const DEFAULT_COLOR = "#22c55e";
const OUTLINE_COLOR = "#000000";

export const CrosshairReticle = memo(function CrosshairReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <line
        x1="0" y1="50" x2="100" y2="50"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinecap="round"
      />
      <line
        x1="50" y1="0" x2="50" y2="100"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinecap="round"
      />
      <line
        x1="0" y1="50" x2="100" y2="50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1="50" y1="0" x2="50" y2="100"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
});

export const CircleReticle = memo(function CircleReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  const radius = 40;
  const centerDotRadius = 4;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
      />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <circle
        cx="50" cy="50" r={centerDotRadius + 1}
        fill={OUTLINE_COLOR}
      />
      <circle
        cx="50" cy="50" r={centerDotRadius}
        fill={color}
      />
    </svg>
  );
});

export const SquareReticle = memo(function SquareReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  const padding = 10;
  const squareSize = 80;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <rect
        x={padding} y={padding}
        width={squareSize} height={squareSize}
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
      />
      <line
        x1="20" y1="50" x2="80" y2="50"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinecap="round"
      />
      <line
        x1="50" y1="20" x2="50" y2="80"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinecap="round"
      />
      <rect
        x={padding} y={padding}
        width={squareSize} height={squareSize}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <line
        x1="20" y1="50" x2="80" y2="50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1="50" y1="20" x2="50" y2="80"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
});

export const ArrowReticle = memo(function ArrowReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <polygon
        points="50,85 20,35 50,50 80,35"
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinejoin="round"
      />
      <polygon
        points="50,85 20,35 50,50 80,35"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const SpeechBubbleReticle = memo(function SpeechBubbleReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <path
        d="M 15 15 
           Q 15 10, 20 10 
           L 80 10 
           Q 85 10, 85 15 
           L 85 55 
           Q 85 60, 80 60 
           L 55 60 
           L 50 75 
           L 45 60 
           L 20 60 
           Q 15 60, 15 55 
           Z"
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeLinejoin="round"
      />
      <path
        d="M 15 15 
           Q 15 10, 20 10 
           L 80 10 
           Q 85 10, 85 15 
           L 85 55 
           Q 85 60, 80 60 
           L 55 60 
           L 50 75 
           L 45 60 
           L 20 60 
           Q 15 60, 15 55 
           Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
});

export const CustomReticle = memo(function CustomReticle({
  size,
  color = DEFAULT_COLOR,
  strokeWidth,
  opacity,
  className = "",
}: ReticleShapeProps) {
  const outlineWidth = strokeWidth + 2;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: opacity / 100 }}
    >
      <rect
        x="20" y="20"
        width="60" height="60"
        rx="8" ry="8"
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={outlineWidth}
        strokeDasharray="8 4"
      />
      <rect
        x="20" y="20"
        width="60" height="60"
        rx="8" ry="8"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="8 4"
      />
      <text
        x="50" y="55"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill={OUTLINE_COLOR}
        stroke={OUTLINE_COLOR}
        strokeWidth="2"
      >
        ?
      </text>
      <text
        x="50" y="55"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill={color}
      >
        ?
      </text>
    </svg>
  );
});

export const ReticleShapeRenderer = memo(function ReticleShapeRenderer({
  shape,
  ...props
}: ReticleShapeComponentProps) {
  switch (shape) {
    case "crosshair":
      return <CrosshairReticle {...props} />;
    case "circle":
      return <CircleReticle {...props} />;
    case "square":
      return <SquareReticle {...props} />;
    case "arrow":
      return <ArrowReticle {...props} />;
    case "speech-bubble":
      return <SpeechBubbleReticle {...props} />;
    case "custom":
      return <CustomReticle {...props} />;
    default:
      return <CrosshairReticle {...props} />;
  }
});

export default ReticleShapeRenderer;
