import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import { logger } from "@/lib/logger";
import "./index.css";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: "camera-zeroday@1.0.0",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.exception?.values) {
        event.exception.values.forEach((exception) => {
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames = exception.stacktrace.frames.filter(
              (frame) => !frame.filename?.includes("node_modules")
            );
          }
        });
      }
      return event;
    },
  });
  logger.info("Sentry initialized");
}

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
  if (SENTRY_DSN && import.meta.env.PROD) {
    Sentry.captureException(event.reason);
  }
  event.preventDefault();
  
  if (import.meta.env.DEV && event.reason?.stack) {
    logger.debug('Stack trace', event.reason.stack);
  }
});

window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error);
  if (SENTRY_DSN && import.meta.env.PROD) {
    Sentry.captureException(event.error);
  }
  
  if (import.meta.env.DEV && event.error?.stack) {
    logger.debug('Stack trace', event.error.stack);
  }
});

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('SW registered', registration.scope);
        })
        .catch((error) => {
          logger.warn('SW registration failed', error);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        logger.debug('SW unregistered for development');
      });
    });
  }
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('pwaInstalled'));
});

export function canInstallPWA(): boolean {
  return deferredInstallPrompt !== null;
}

export async function installPWA(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  
  await deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredInstallPrompt = null;
    return true;
  }
  return false;
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const container = document.getElementById("root");
if (container) {
  if (!window.__REACT_ROOT__) {
    window.__REACT_ROOT__ = createRoot(container);
  }
  window.__REACT_ROOT__.render(<App />);
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
