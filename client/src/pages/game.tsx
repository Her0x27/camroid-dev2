import { usePrivacy } from "@/lib/privacy-context";
import { Game2048 } from "@/components/game-2048";

export default function GamePage() {
  const { settings, showCamera } = usePrivacy();

  return (
    <Game2048
      onSecretGesture={showCamera}
      gestureType={settings.gestureType}
      secretPattern={settings.secretPattern}
      unlockFingers={settings.unlockFingers}
    />
  );
}
