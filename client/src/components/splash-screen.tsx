import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"init" | "loading" | "complete">("init");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("loading"), 100);
    const timer2 = setTimeout(() => setPhase("complete"), duration - 400);
    const timer3 = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {phase !== "complete" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative flex flex-col items-center gap-10">
            <motion.div
              className="relative w-40 h-40 flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            >
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
                transition={{ duration: 0.5, delay: 0.2 }}
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
                className="absolute inset-6 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                className="relative z-10 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="relative">
                  <Camera 
                    className="w-14 h-14 text-primary" 
                    strokeWidth={1.5} 
                  />
                  <motion.div
                    className="absolute -right-1 -bottom-1 w-7 h-7 rounded-md bg-primary flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <span className="text-primary-foreground font-bold text-sm">M</span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Camroid
                <span className="text-primary ml-1">M</span>
              </h1>
              <motion.p 
                className="text-xs text-muted-foreground font-medium tracking-[0.2em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Private Camera Zero-Day
              </motion.p>
            </motion.div>

            <motion.div
              className="relative w-56 h-1.5 bg-muted/30 rounded-full overflow-hidden"
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: (duration - 1200) / 1000, 
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.8
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
                  delay: 0.8
                }}
              />
            </motion.div>

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
