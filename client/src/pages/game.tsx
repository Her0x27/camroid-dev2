import { Suspense } from "react";
import { usePrivacy } from "@/lib/privacy-context";
import { disguiseRegistry } from "@/disguises";

export default function DisguisePage() {
  const { settings, showCamera } = usePrivacy();

  const disguiseConfig = disguiseRegistry.get(settings.selectedDisguise) || disguiseRegistry.getDefault();
  
  if (!disguiseConfig) {
    return <div>No disguise configured</div>;
  }

  const DisguiseComponent = disguiseConfig.component;
  const disguiseUnlockValue = settings.disguiseUnlockValues[settings.selectedDisguise] || '';

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DisguiseComponent
        onSecretGesture={showCamera}
        gestureType={settings.gestureType}
        secretPattern={settings.secretPattern}
        unlockFingers={settings.unlockFingers}
        disguiseUnlockValue={disguiseUnlockValue}
        onDisguiseUnlock={showCamera}
      />
    </Suspense>
  );
}
