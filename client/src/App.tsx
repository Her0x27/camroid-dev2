import { useState, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/lib/settings-context";
import { I18nProvider } from "@/lib/i18n";
import { PrivacyProvider, usePrivacy, loadPrivacySettings } from "@/lib/privacy-context";
import { ThemeProvider } from "@/lib/theme-context";
import { SplashScreen } from "@/components/splash-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { Loader2 } from "lucide-react";

const CameraPage = lazy(() => import("@/pages/camera"));
const GalleryPage = lazy(() => import("@/pages/gallery"));
const PhotoDetailPage = lazy(() => import("@/pages/photo-detail"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const GamePage = lazy(() => import("@/pages/game"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="page-loader" />
    </div>
  );
}

function Router() {
  const { settings, isLocked } = usePrivacy();
  
  if (settings.enabled && isLocked) {
    return (
      <Suspense fallback={<PageLoader />}>
        <GamePage />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={CameraPage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/photo/:id" component={PhotoDetailPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // If privacy mode is enabled, skip camera splash screen
    const privacySettings = loadPrivacySettings();
    if (privacySettings.enabled) {
      return false;
    }
    
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <TooltipProvider>
            <SettingsProvider>
              <PrivacyProvider>
                <ErrorBoundary>
                  {showSplash && <SplashScreen onComplete={handleSplashComplete} duration={2800} />}
                  <Router />
                  <Toaster />
                </ErrorBoundary>
              </PrivacyProvider>
            </SettingsProvider>
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
