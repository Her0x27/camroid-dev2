import { useEffect, useRef, memo, useMemo } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GESTURE } from "@/lib/constants";
import { useGame2048 } from "@/hooks/use-game-2048";
import { useSecretGesture } from "@/hooks/use-secret-gesture";
import { usePWABanner } from "@/hooks/use-pwa-banner";
import { PatternOverlay } from "@/components/pattern-overlay";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-[#3a3a3c]", text: "" },
  2: { bg: "bg-amber-100", text: "text-amber-900" },
  4: { bg: "bg-amber-200", text: "text-amber-900" },
  8: { bg: "bg-orange-400", text: "text-white" },
  16: { bg: "bg-orange-500", text: "text-white" },
  32: { bg: "bg-orange-600", text: "text-white" },
  64: { bg: "bg-red-500", text: "text-white" },
  128: { bg: "bg-yellow-400", text: "text-white" },
  256: { bg: "bg-yellow-500", text: "text-white" },
  512: { bg: "bg-yellow-600", text: "text-white" },
  1024: { bg: "bg-yellow-700", text: "text-white" },
  2048: { bg: "bg-emerald-500", text: "text-white" },
};

interface GameTileProps {
  value: number;
  rowIdx: number;
  colIdx: number;
}

const GameTile = memo(function GameTile({ value, rowIdx, colIdx }: GameTileProps) {
  const style = TILE_COLORS[value] || TILE_COLORS[2048];
  const fontSize = value >= 1000 ? 'text-xl' : value >= 100 ? 'text-2xl' : 'text-3xl';
  
  return (
    <div
      className={`aspect-square flex items-center justify-center rounded-lg font-bold transition-all duration-100 overflow-hidden ${style.bg} ${style.text} ${fontSize}`}
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
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
      <p className="text-2xl font-bold mb-4 text-white">
        {gameOver ? t.game2048.gameOver : t.game2048.youWin}
      </p>
      <div className="flex gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onNewGame(); }} 
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium active:bg-orange-600"
          data-testid="button-try-again"
        >
          {t.game2048.tryAgain}
        </button>
        {won && (
          <button 
            onClick={(e) => { e.stopPropagation(); onKeepPlaying(); }} 
            className="px-6 py-3 bg-[#333333] text-white rounded-lg font-medium active:bg-[#555555]"
            data-testid="button-keep-playing"
          >
            {t.game2048.keepPlaying}
          </button>
        )}
      </div>
    </div>
  );
});

interface Game2048Props {
  onSecretGesture?: () => void;
  gestureType?: 'patternUnlock' | 'severalFingers';
  secretPattern?: string;
  unlockFingers?: number;
  onActivity?: () => void;
}

export function Game2048({ onSecretGesture, gestureType = 'patternUnlock', secretPattern = '', unlockFingers = 4, onActivity }: Game2048Props) {
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
      className="flex flex-col min-h-screen bg-black safe-top safe-bottom select-none"
      onClick={() => handleSecretTap(false)}
      data-testid="game-2048-container"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-white">{t.game2048.title}</h1>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleNewGame();
          }}
          className="w-10 h-10 flex items-center justify-center bg-[#333333] rounded-lg active:bg-[#555555]"
          data-testid="button-new-game"
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex gap-3 px-4 pb-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#333333] rounded-lg">
          <span className="text-xs text-gray-400 uppercase">{t.game2048.score}</span>
          <span className="text-xl font-bold text-white" data-testid="text-score">{score}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#333333] rounded-lg">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-gray-400 uppercase">{t.game2048.best}</span>
          <span className="text-xl font-bold text-white" data-testid="text-best-score">{bestScore}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div 
          ref={gridRef}
          className="relative w-full max-w-sm aspect-square bg-[#1c1c1e] rounded-xl p-2 touch-none"
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

        <p className="text-center text-gray-500 text-sm mt-4">
          {t.game2048.swipeToMove}
        </p>
      </div>
      
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
