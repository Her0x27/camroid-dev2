import { memo, useMemo } from "react";
import { Crosshair } from "lucide-react";

const BRAND_TEXT = "Camroid M";

const letterTransforms = [
  { start: "translate(-80px, -60px) rotate(-25deg) scale(0.5)", end: "translate(-100px, -80px) rotate(30deg) scale(0.3)" },
  { start: "translate(60px, -80px) rotate(20deg) scale(0.6)", end: "translate(80px, -100px) rotate(-35deg) scale(0.4)" },
  { start: "translate(-70px, 50px) rotate(-15deg) scale(0.7)", end: "translate(-90px, 70px) rotate(25deg) scale(0.2)" },
  { start: "translate(50px, 70px) rotate(30deg) scale(0.4)", end: "translate(70px, 90px) rotate(-20deg) scale(0.5)" },
  { start: "translate(-60px, -40px) rotate(25deg) scale(0.5)", end: "translate(-85px, -60px) rotate(-30deg) scale(0.3)" },
  { start: "translate(70px, -50px) rotate(-20deg) scale(0.6)", end: "translate(95px, -70px) rotate(15deg) scale(0.4)" },
  { start: "translate(-50px, 60px) rotate(15deg) scale(0.4)", end: "translate(-75px, 85px) rotate(-25deg) scale(0.3)" },
  { start: "translate(80px, 40px) rotate(-30deg) scale(0.5)", end: "translate(105px, 60px) rotate(20deg) scale(0.2)" },
  { start: "translate(0px, -90px) rotate(0deg) scale(0.3)", end: "translate(0px, -120px) rotate(180deg) scale(0.4)" },
];

interface AnimatedLetterProps {
  letter: string;
  index: number;
}

function AnimatedLetter({ letter, index }: AnimatedLetterProps) {
  const transform = letterTransforms[index % letterTransforms.length];
  const delay = index * 0.08;
  
  if (letter === " ") {
    return <span className="inline-block w-2" />;
  }
  
  return (
    <span
      className="animate-letter-assemble text-primary font-bold"
      style={{
        "--letter-start-transform": transform.start,
        "--letter-end-transform": transform.end,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    >
      {letter}
    </span>
  );
}

function BrandTextAnimation({ size }: { size: "sm" | "md" | "lg" }) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  const letters = useMemo(() => BRAND_TEXT.split(""), []);
  
  return (
    <div className={`${textSizes[size]} tracking-wider flex items-center justify-center`}>
      {letters.map((letter, i) => (
        <AnimatedLetter key={i} letter={letter} index={i} />
      ))}
    </div>
  );
}

const sizeClasses = {
  sm: "w-5 h-5 border",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-2",
} as const;

const iconSizes = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-14 h-14",
} as const;

const ringSizes = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
} as const;

const outerRingSizes = {
  sm: "w-14 h-14",
  md: "w-24 h-24",
  lg: "w-32 h-32",
} as const;

const brandedIconSizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
} as const;

const brandedRingSizes = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
} as const;

const brandedOuterRingSizes = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-28 h-28",
} as const;

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
  const spinnerClasses = `${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`;

  if (variant === "branded") {
    const thirdRingSizes = {
      sm: "w-18 h-18",
      md: "w-32 h-32", 
      lg: "w-40 h-40",
    } as const;
    
    return (
      <div 
        className={`min-h-screen bg-background flex flex-col items-center justify-center gap-8 ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Loading application"
        data-testid="loader-branded"
      >
        <span className="sr-only">Loading...</span>
        
        <BrandTextAnimation size={size} />
        
        <div className="relative flex items-center justify-center">
          <div 
            className={`absolute ${thirdRingSizes[size]} rounded-full border border-primary/10 animate-pulse-ring-third`}
          />
          <div 
            className={`absolute ${outerRingSizes[size]} rounded-full border border-primary/20 animate-pulse-ring-outer`}
          />
          <div 
            className={`absolute ${ringSizes[size]} rounded-full border-2 border-primary/50 animate-pulse-ring`}
          />
          <Crosshair 
            className={`${iconSizes[size]} text-primary animate-crosshair-rotate`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
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
          className={`absolute ${brandedOuterRingSizes[size]} rounded-full border border-primary/20 animate-pulse-ring-outer`}
          aria-hidden="true"
        />
        <div 
          className={`absolute ${brandedRingSizes[size]} rounded-full border-2 border-primary/40 animate-pulse-ring`}
          aria-hidden="true"
        />
        <Crosshair 
          className={`${brandedIconSizes[size]} text-primary animate-crosshair-rotate`}
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
