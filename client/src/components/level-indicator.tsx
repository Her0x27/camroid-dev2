import { memo } from "react";

interface LevelIndicatorProps {
  tilt: number | null;
  roll: number | null;
  size?: number;
}

export const LevelIndicator = memo(function LevelIndicator({
  tilt,
  roll,
  size = 120,
}: LevelIndicatorProps) {
  const safeRoll = roll ?? 0;
  const safeTilt = tilt ?? 90;
  
  const normalizedTilt = Math.max(-45, Math.min(45, safeTilt - 90));
  const tiltOffset = (normalizedTilt / 45) * (size / 3);
  
  const isLevel = Math.abs(safeRoll) < 2 && Math.abs(normalizedTilt) < 2;
  const isNearLevel = Math.abs(safeRoll) < 5 && Math.abs(normalizedTilt) < 5;
  
  const lineColor = isLevel 
    ? "stroke-emerald-400" 
    : isNearLevel 
      ? "stroke-amber-400" 
      : "stroke-white/70";
  
  const glowColor = isLevel 
    ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" 
    : isNearLevel 
      ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" 
      : "";

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className={`${glowColor} transition-all duration-150`}
        >
          <defs>
            <linearGradient id="horizonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="20%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="80%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke="white"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
          
          <line
            x1={size * 0.15}
            y1={size / 2}
            x2={size * 0.35}
            y2={size / 2}
            stroke="white"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          <line
            x1={size * 0.65}
            y1={size / 2}
            x2={size * 0.85}
            y2={size / 2}
            stroke="white"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
          
          <g 
            transform={`
              rotate(${safeRoll}, ${size / 2}, ${size / 2})
              translate(0, ${tiltOffset})
            `}
          >
            <line
              x1={size * 0.1}
              y1={size / 2}
              x2={size * 0.9}
              y2={size / 2}
              className={lineColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ filter: isLevel ? "url(#glow)" : undefined }}
            />
            
            <circle
              cx={size / 2}
              cy={size / 2}
              r={4}
              className={isLevel ? "fill-emerald-400" : isNearLevel ? "fill-amber-400" : "fill-white/70"}
            />
            
            <line
              x1={size * 0.1}
              y1={size / 2}
              x2={size * 0.1 + 8}
              y2={size / 2 - 8}
              className={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={size * 0.1}
              y1={size / 2}
              x2={size * 0.1 + 8}
              y2={size / 2 + 8}
              className={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
            
            <line
              x1={size * 0.9}
              y1={size / 2}
              x2={size * 0.9 - 8}
              y2={size / 2 - 8}
              className={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={size * 0.9}
              y1={size / 2}
              x2={size * 0.9 - 8}
              y2={size / 2 + 8}
              className={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
          
          <polygon
            points={`${size/2},${size * 0.08} ${size/2 - 5},${size * 0.15} ${size/2 + 5},${size * 0.15}`}
            fill="white"
            fillOpacity={0.4}
          />
        </svg>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
          <div className={`
            font-mono text-[10px] px-1.5 py-0.5 rounded
            ${isLevel 
              ? "bg-emerald-500/30 text-emerald-400" 
              : isNearLevel 
                ? "bg-amber-500/30 text-amber-400" 
                : "bg-black/50 text-white/70"
            }
          `}>
            {safeRoll}° / {normalizedTilt > 0 ? "+" : ""}{normalizedTilt.toFixed(0)}°
          </div>
        </div>
      </div>
    </div>
  );
});
