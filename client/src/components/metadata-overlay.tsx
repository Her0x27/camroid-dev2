import { memo, useState, useEffect } from "react";
import { MapPin, Compass, Mountain, Target, Signal, FileText } from "lucide-react";
import { formatCoordinate, formatAltitude, formatAccuracy, getAccuracyLevel } from "@/hooks/use-geolocation";
import { formatHeading, getCardinalDirection } from "@/hooks/use-orientation";
import { useI18n, type Translations } from "@/lib/i18n";

interface MetadataOverlayProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  tilt: number | null;
  showMetadata: boolean;
  lastUpdate?: number;
  accuracyLimit?: number;
  note?: string;
}

function formatLastUpdate(lastUpdate: number | undefined, t: Translations): string {
  if (!lastUpdate) return "---";
  const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
  if (seconds < 1) return t.components.metadata.live;
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}${t.components.metadata.minutes}`;
}

export const MetadataOverlay = memo(function MetadataOverlay({
  latitude,
  longitude,
  altitude,
  accuracy,
  heading,
  tilt,
  showMetadata,
  lastUpdate,
  accuracyLimit = 20,
  note,
}: MetadataOverlayProps) {
  const { t } = useI18n();
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!showMetadata) return null;

  const hasLocation = latitude !== null && longitude !== null;
  const hasOrientation = heading !== null;
  const updateAge = lastUpdate ? (Date.now() - lastUpdate) / 1000 : Infinity;
  const isLive = updateAge < 2;
  const isAccuracyBlocked = accuracy !== null && accuracy > accuracyLimit;

  const accuracyColor = isAccuracyBlocked ? "text-red-500" :
    getAccuracyLevel(accuracy) === "high" ? "text-emerald-400" :
    getAccuracyLevel(accuracy) === "medium" ? "text-amber-400" :
    getAccuracyLevel(accuracy) === "low" ? "text-red-400" :
    "text-white/60";

  return (
    <div className="absolute top-4 left-4 z-20 safe-top">
      <div className="bg-gradient-to-br from-black/70 via-black/60 to-black/50 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-transparent px-3 py-1.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className={`font-mono text-[10px] font-medium ${isLive ? "text-emerald-400" : "text-amber-400"}`}>
                {formatLastUpdate(lastUpdate, t)}
              </span>
            </div>
            <div className="flex-1" />
            <Signal className={`w-3 h-3 ${isAccuracyBlocked ? "animate-pulse" : ""} ${accuracyColor}`} />
            <span className={`font-mono text-[10px] font-medium ${accuracyColor}`}>
              {formatAccuracy(accuracy)}
            </span>
          </div>
        </div>
        
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${hasLocation ? "text-primary" : "text-white/40"}`} />
            <span className="font-mono text-xs text-white/90 tracking-wide">
              {formatCoordinate(latitude)} {formatCoordinate(longitude)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <Mountain className={`w-3 h-3 flex-shrink-0 ${altitude !== null ? "text-primary" : "text-white/40"}`} />
              <span className="font-mono text-[11px] text-white/90">{formatAltitude(altitude)}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Compass className={`w-3 h-3 flex-shrink-0 ${hasOrientation ? "text-primary" : "text-white/40"}`} />
              <span className="font-mono text-[11px] text-white/90">
                {formatHeading(heading)} <span className="text-primary">{getCardinalDirection(heading)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Target className={`w-3 h-3 flex-shrink-0 ${tilt !== null ? "text-primary" : "text-white/40"}`} />
              <span className="font-mono text-[11px] text-white/90">
                {tilt !== null ? `${tilt}°` : "---°"}
              </span>
            </div>
          </div>
          
          {note && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
                <p className="font-sans text-xs text-amber-200/90 leading-tight line-clamp-2 italic">
                  {note}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      </div>
    </div>
  );
});

interface MetadataCompactProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  heading: number | null;
  className?: string;
}

export function MetadataCompact({
  latitude,
  longitude,
  altitude,
  heading,
  className = "",
}: MetadataCompactProps) {
  const { t } = useI18n();
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <MapPin className={`w-4 h-4 mt-0.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <div className="font-mono text-sm">
            {hasLocation ? (
              <>
                <div>{formatCoordinate(latitude)}</div>
                <div>{formatCoordinate(longitude)}</div>
              </>
            ) : (
              <span className="text-muted-foreground">{t.components.metadata.locationNotAvailable}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Mountain className={`w-4 h-4 ${altitude !== null ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-mono text-sm">{formatAltitude(altitude)}</span>
      </div>

      <div className="flex items-center gap-3">
        <Compass className={`w-4 h-4 ${heading !== null ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-mono text-sm">
          {heading !== null ? (
            <>
              {formatHeading(heading)} ({getCardinalDirection(heading)})
            </>
          ) : (
            <span className="text-muted-foreground">{t.components.metadata.headingNotAvailable}</span>
          )}
        </span>
      </div>
    </div>
  );
}
