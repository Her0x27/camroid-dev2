import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { useLazyLoaderOptional, INITIAL_MODULES, preloadModule, MODULE_NAMES } from "@/lib/lazy-loader-context";

interface SplashScreenProps {
  onComplete: () => void;
}

function HandWithStone({ onFlip }: { onFlip: () => void }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFlipped(true);
      setTimeout(onFlip, 600);
    }, 800);
    return () => clearTimeout(timer);
  }, [onFlip]);

  return (
    <motion.div
      className="relative w-32 h-32 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={flipped ? { rotateY: 180 } : {}}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <defs>
          <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd5b5" />
            <stop offset="100%" stopColor="#e8c4a0" />
          </linearGradient>
          <filter id="stoneShadow">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        <motion.g
          animate={flipped ? { rotate: 180, x: 10, y: -10 } : {}}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: "50px 50px" }}
        >
          <ellipse
            cx="50"
            cy="55"
            rx="25"
            ry="20"
            fill="url(#stoneGrad)"
            filter="url(#stoneShadow)"
          />
          <ellipse
            cx="45"
            cy="50"
            rx="5"
            ry="3"
            fill="#9ca3af"
            opacity="0.5"
          />
          <ellipse
            cx="55"
            cy="60"
            rx="3"
            ry="2"
            fill="#6b7280"
            opacity="0.6"
          />
        </motion.g>
        
        <motion.g
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <path
            d="M15 65 Q20 60 30 62 L35 55 Q38 50 42 52 L45 48 Q48 45 52 48 L50 55 Q48 60 45 65 L40 70 Q30 75 20 72 Z"
            fill="url(#handGrad)"
            stroke="#d4a574"
            strokeWidth="0.5"
          />
          <path
            d="M30 62 L28 68"
            stroke="#d4a574"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path
            d="M37 58 L35 65"
            stroke="#d4a574"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path
            d="M44 54 L42 62"
            stroke="#d4a574"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

function CameraWithFlash({ onComplete }: { onComplete: () => void }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const flashTimer = setTimeout(() => {
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setTimeout(onComplete, 400);
      }, 200);
    }, 600);
    return () => clearTimeout(flashTimer);
  }, [onComplete]);

  return (
    <motion.div
      className="relative w-40 h-40 flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.4))",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div
        className="absolute inset-2 rounded-full bg-background"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />

      <motion.div
        className="absolute inset-4 rounded-full border border-primary/20"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="relative">
          <Camera 
            className="w-16 h-16 text-primary" 
            strokeWidth={1.5} 
          />
          <motion.div
            className="absolute -right-1 -bottom-1 w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="text-primary-foreground font-bold text-base">M</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedLetter({ 
  letter, 
  index, 
  total,
  isSpecial = false 
}: { 
  letter: string; 
  index: number; 
  total: number;
  isSpecial?: boolean;
}) {
  const randomAngle = (index - total / 2) * 30;
  const randomDistance = 100 + Math.random() * 50;
  const startX = Math.cos((randomAngle * Math.PI) / 180) * randomDistance;
  const startY = Math.sin((randomAngle * Math.PI) / 180) * randomDistance - 50;
  const startRotate = (Math.random() - 0.5) * 360;

  return (
    <motion.span
      className={`inline-block ${isSpecial ? 'text-primary ml-2' : 'text-foreground'}`}
      style={{ 
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: isSpecial ? 700 : 600,
        textShadow: isSpecial ? '0 0 20px hsl(var(--primary) / 0.5)' : 'none'
      }}
      initial={{ 
        opacity: 0,
        x: startX,
        y: startY,
        rotate: startRotate,
        scale: 0.3
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1
      }}
      transition={{ 
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.34, 1.56, 0.64, 1]
      }}
    >
      {letter}
    </motion.span>
  );
}

function BrandTextAnimation() {
  const text = "Camroid";
  const letters = text.split("");

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-4xl tracking-tight flex items-center">
        {letters.map((letter, index) => (
          <AnimatedLetter 
            key={index} 
            letter={letter} 
            index={index} 
            total={letters.length + 1}
          />
        ))}
        <AnimatedLetter 
          letter="M" 
          index={letters.length} 
          total={letters.length + 1}
          isSpecial
        />
      </h1>
      
      <motion.p 
        className="text-xs text-muted-foreground font-medium tracking-[0.2em] uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        Private Camera Zero-Day
      </motion.p>
    </motion.div>
  );
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"hand" | "camera" | "text" | "loading" | "complete">("hand");
  const loaderContext = useLazyLoaderOptional();
  const initializedRef = useRef(false);
  const preloadStartedRef = useRef(false);
  
  const progress = loaderContext?.progress ?? 0;
  const currentModule = loaderContext?.currentModule ?? null;
  const allLoaded = loaderContext?.allLoaded ?? false;

  useEffect(() => {
    if (loaderContext && !initializedRef.current) {
      initializedRef.current = true;
      loaderContext.initializeModules(INITIAL_MODULES);
    }
  }, [loaderContext]);

  useEffect(() => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;
    preloadModule(MODULE_NAMES.gallery);
    preloadModule(MODULE_NAMES.settings);
  }, []);

  useEffect(() => {
    if (allLoaded && phase === "loading") {
      setPhase("complete");
      onComplete();
    }
  }, [allLoaded, phase, onComplete]);

  const handleHandFlip = () => {
    setPhase("camera");
  };

  const handleCameraComplete = () => {
    setPhase("text");
    setTimeout(() => {
      setPhase("loading");
    }, 1200);
  };

  const getLoadingText = () => {
    if (currentModule) {
      return `Загрузка: ${currentModule}...`;
    }
    if (allLoaded) {
      return "Готово!";
    }
    return "Инициализация...";
  };

  return (
    <AnimatePresence>
      {phase !== "complete" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative flex flex-col items-center gap-8">
            <AnimatePresence mode="wait">
              {phase === "hand" && (
                <HandWithStone key="hand" onFlip={handleHandFlip} />
              )}
              
              {phase === "camera" && (
                <CameraWithFlash key="camera" onComplete={handleCameraComplete} />
              )}
              
              {(phase === "text" || phase === "loading") && (
                <motion.div
                  key="content"
                  className="flex flex-col items-center gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="relative w-24 h-24 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.3))",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div className="absolute inset-1 rounded-full bg-background" />
                    <Camera className="relative z-10 w-10 h-10 text-primary" strokeWidth={1.5} />
                  </motion.div>

                  <BrandTextAnimation />

                  {phase === "loading" && (
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="relative w-56 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.max(progress, 5)}%` }}
                          transition={{ 
                            duration: 0.3, 
                            ease: [0.4, 0, 0.2, 1],
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)",
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </div>
                      
                      <motion.p
                        className="text-[11px] text-muted-foreground h-4"
                        key={currentModule || "init"}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {getLoadingText()}
                      </motion.p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="absolute -z-10 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
              }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
