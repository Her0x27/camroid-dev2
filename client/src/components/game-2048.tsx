import { useEffect, useRef, memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, HelpCircle, ChevronDown, Lightbulb, Move, Merge, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GESTURE } from "@/lib/constants";
import { useGame2048 } from "@/hooks/use-game-2048";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PatternOverlay } from "@/components/pattern-overlay";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-muted/50", text: "" },
  2: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-900 dark:text-amber-100" },
  4: { bg: "bg-amber-200 dark:bg-amber-800/50", text: "text-amber-900 dark:text-amber-100" },
  8: { bg: "bg-orange-300 dark:bg-orange-700/60", text: "text-white" },
  16: { bg: "bg-orange-400 dark:bg-orange-600/70", text: "text-white" },
  32: { bg: "bg-orange-500 dark:bg-orange-500/80", text: "text-white" },
  64: { bg: "bg-red-500 dark:bg-red-500/80", text: "text-white" },
  128: { bg: "bg-yellow-400 dark:bg-yellow-500/80", text: "text-white" },
  256: { bg: "bg-yellow-500 dark:bg-yellow-400/80", text: "text-white" },
  512: { bg: "bg-yellow-600 dark:bg-yellow-600/80", text: "text-white" },
  1024: { bg: "bg-yellow-700 dark:bg-yellow-700/80", text: "text-white" },
  2048: { bg: "bg-emerald-500 dark:bg-emerald-500/80", text: "text-white" },
};

interface GameTileProps {
  value: number;
  rowIdx: number;
  colIdx: number;
}

const GameTile = memo(function GameTile({ value, rowIdx, colIdx }: GameTileProps) {
  const style = TILE_COLORS[value] || TILE_COLORS[2048];
  const className = `flex items-center justify-center rounded-md font-bold transition-all duration-100 ${style.bg} ${style.text}`;
  const fontSize = value >= 1000 ? '1rem' : value >= 100 ? '1.25rem' : '1.5rem';
  
  return (
    <div
      className={className}
      style={{ fontSize }}
      data-testid={`tile-${rowIdx}-${colIdx}`}
    >
      {value > 0 ? value : ''}
    </div>
  );
});

interface GameOverlayProps {
  gameOver: boolean;
  won: boolean;
  onNewGame: () => void;
  onKeepPlaying: () => void;
}

const GameOverlay = memo(function GameOverlay({ gameOver, won, onNewGame, onKeepPlaying }: GameOverlayProps) {
  const { t } = useI18n();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
      <p className="text-2xl font-bold mb-4">
        {gameOver ? t.game2048.gameOver : t.game2048.youWin}
      </p>
      <div className="flex gap-2">
        <Button onClick={(e) => { e.stopPropagation(); onNewGame(); }} data-testid="button-try-again">
          {t.game2048.tryAgain}
        </Button>
        {won && (
          <Button variant="outline" onClick={(e) => { e.stopPropagation(); onKeepPlaying(); }} data-testid="button-keep-playing">
            {t.game2048.keepPlaying}
          </Button>
        )}
      </div>
    </div>
  );
});

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

const MobileControls = memo(function MobileControls({ onMove }: MobileControlsProps) {
  return (
    <>
      <div className="flex justify-center gap-1 mt-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => onMove('up')} className="touch-none">
          <ArrowUp className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex justify-center gap-1 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => onMove('left')} className="touch-none">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('down')} className="touch-none">
          <ArrowDown className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('right')} className="touch-none">
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
});

const HowToPlaySection = memo(function HowToPlaySection() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  const steps = [
    { icon: Move, text: t.game2048.howToPlay.step1 },
    { icon: Merge, text: t.game2048.howToPlay.step2 },
    { icon: Target, text: t.game2048.howToPlay.step3 },
    { icon: Target, text: t.game2048.howToPlay.step4 },
    { icon: Target, text: t.game2048.howToPlay.step5 },
  ];
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between gap-2 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
          data-testid="button-how-to-play"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {t.game2048.howToPlayTitle}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div 
          className="mt-3 p-4 bg-muted/30 rounded-lg space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.game2048.description}
          </p>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex items-start gap-2 pt-2 border-t border-border/50">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground italic">
              {t.game2048.tips}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

interface Game2048Props {
  onSecretGesture?: () => void;
  gestureType?: 'quickTaps' | 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
  onActivity?: () => void;
}

export function Game2048({ onSecretGesture, gestureType = 'quickTaps', secretPattern = '', unlockFingers = 4, onActivity }: Game2048Props) {
  const { t } = useI18n();
  const {
    grid,
    score,
    bestScore,
    gameOver,
    won,
    handleMove,
    handleNewGame,
    handleKeepPlaying,
  } = useGame2048({ onActivity });

  const {
    showPatternOverlay,
    patternError,
    handleSecretTap,
    handlePatternComplete,
    handleClosePatternOverlay,
  } = useSecretGesture({ onSecretGesture, gestureType, secretPattern, unlockFingers });
  
  const pwa = usePWABanner();
  
  const gridRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      
      if (directions[e.key]) {
        e.preventDefault();
        handleMove(directions[e.key]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);
  
  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (Math.max(absDx, absDy) < GESTURE.MIN_SWIPE_DISTANCE_PX) {
        handleSecretTap(true);
        return;
      }
      
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
      
      touchStartRef.current = null;
    };
    
    gridElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gridElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      gridElement.removeEventListener('touchstart', handleTouchStart);
      gridElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, handleSecretTap]);
  
  const gridTiles = useMemo(() => {
    return grid.flatMap((row, rowIdx) =>
      row.map((cell, colIdx) => (
        <GameTile key={`${rowIdx}-${colIdx}`} value={cell} rowIdx={rowIdx} colIdx={colIdx} />
      ))
    );
  }, [grid]);
  
  return (
    <div 
      className="flex flex-col items-center min-h-screen bg-background p-4 py-8 safe-top safe-bottom overflow-auto"
      onClick={() => handleSecretTap(false)}
      data-testid="game-2048-container"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl font-bold">{t.game2048.title}</CardTitle>
            <Button 
              variant="outline" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleNewGame();
              }}
              data-testid="button-new-game"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
              <span className="text-xs text-muted-foreground">{t.game2048.score}</span>
              <span className="font-bold" data-testid="text-score">{score}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t.game2048.best}</span>
              <span className="font-bold" data-testid="text-best-score">{bestScore}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={gridRef}
            className="relative bg-muted/30 rounded-lg p-2 aspect-square select-none touch-none"
            data-testid="game-grid"
          >
            <div className="grid grid-cols-4 gap-2 h-full">
              {gridTiles}
            </div>
            
            {(gameOver || won) && (
              <GameOverlay
                gameOver={gameOver}
                won={won}
                onNewGame={handleNewGame}
                onKeepPlaying={handleKeepPlaying}
              />
            )}
          </div>
          
          <div className="text-center mt-4 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t.game2048.instructions}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.game2048.swipeToMove}
            </p>
          </div>
          
          <MobileControls onMove={handleMove} />
          
          <div className="mt-4 pt-2 border-t border-border/30">
            <HowToPlaySection />
          </div>
        </CardContent>
      </Card>
      
      {showPatternOverlay && (
        <PatternOverlay
          onPatternComplete={handlePatternComplete}
          onClose={handleClosePatternOverlay}
          patternError={patternError}
        />
      )}
      
      {pwa.shouldShow && (
        <PWAInstallBanner
          onInstall={pwa.handleInstall}
          onDismiss={pwa.handleDismiss}
          showIOSInstructions={pwa.showIOSInstructions}
          isInstalling={pwa.isInstalling}
        />
      )}
    </div>
  );
}

export default Game2048;
