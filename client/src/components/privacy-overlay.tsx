import { usePrivacy } from "@/lib/privacy-context";

export function PrivacyOverlay() {
  const { settings, isBackgrounded } = usePrivacy();
  
  if (!settings.enabled || !isBackgrounded) {
    return null;
  }
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  );
}
