import { memo } from "react";
import { Crosshair } from "lucide-react";

interface PageLoaderProps {
  variant?: "fullscreen" | "inline" | "overlay" | "branded";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PageLoader = memo(function PageLoader({
  variant = "fullscreen",
  size = "md",
  className = "",
}: PageLoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-2",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const ringSizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const outerRingSizes = {
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const spinnerClasses = `${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`;

  if (variant === "branded") {
    return (
      <div 
        className={`min-h-screen bg-background flex flex-col items-center justify-center ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Loading application"
        data-testid="loader-branded"
      >
        <span className="sr-only">Loading...</span>
        <div className="relative flex items-center justify-center">
          <div 
            className={`absolute ${outerRingSizes[size]} rounded-full border border-primary/20 animate-pulse-ring-outer`}
          />
          <div 
            className={`absolute ${ringSizes[size]} rounded-full border-2 border-primary/40 animate-pulse-ring`}
          />
          <Crosshair 
            className={`${iconSizes[size]} text-primary animate-crosshair-rotate`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <div className="mt-6 flex items-center gap-1" aria-hidden="true">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div 
        className={`flex items-center justify-center p-4 ${className}`} 
        role="status"
        aria-busy="true"
        data-testid="loader-inline"
      >
        <span className="sr-only">Loading...</span>
        <div className={spinnerClasses} aria-hidden="true" />
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div 
        className={`absolute inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
        role="status"
        aria-busy="true"
        data-testid="loader-overlay"
      >
        <span className="sr-only">Loading...</span>
        <div className={spinnerClasses} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-background flex items-center justify-center ${className}`}
      role="status"
      aria-busy="true"
      data-testid="loader-fullscreen"
    >
      <span className="sr-only">Loading...</span>
      <div className={spinnerClasses} aria-hidden="true" />
    </div>
  );
});

interface BrandedLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const BrandedLoader = memo(function BrandedLoader({
  size = "md",
  className = "",
  text,
}: BrandedLoaderProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const ringSizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const outerRingSizes = {
    sm: "w-14 h-14",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-busy="true"
      aria-label={text || "Loading"}
      data-testid="branded-loader"
    >
      <span className="sr-only">{text || "Loading..."}</span>
      <div className="relative flex items-center justify-center">
        <div 
          className={`absolute ${outerRingSizes[size]} rounded-full border border-primary/20 animate-pulse-ring-outer`}
          aria-hidden="true"
        />
        <div 
          className={`absolute ${ringSizes[size]} rounded-full border-2 border-primary/40 animate-pulse-ring`}
          aria-hidden="true"
        />
        <Crosshair 
          className={`${iconSizes[size]} text-primary animate-crosshair-rotate`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      {text && (
        <span className="text-sm text-muted-foreground" aria-hidden="true">{text}</span>
      )}
    </div>
  );
});
