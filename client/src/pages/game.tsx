import { Suspense } from "react";
import { usePrivacy } from "@/lib/privacy-context";
import { gameRegistry } from "@/games";

export default function GamePage() {
  const { settings, showCamera } = usePrivacy();

  const gameConfig = gameRegistry.get(settings.selectedGame) || gameRegistry.getDefault();
  
  if (!gameConfig) {
    return <div>No game configured</div>;
  }

  const GameComponent = gameConfig.component;

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GameComponent
        onSecretGesture={showCamera}
        gestureType={settings.gestureType}
        secretPattern={settings.secretPattern}
        unlockFingers={settings.unlockFingers}
      />
    </Suspense>
  );
}
