# Camroid M - Tactical Camera PWA

## Overview

Camroid M is a Progressive Web App (PWA) designed as a tactical camera for capturing geotagged photos with precision metadata. It features tactical HUD overlays, customizable reticles, GPS coordinates, device orientation data, and offline-first functionality. The application operates as a single-page app, storing all data locally in IndexedDB, requiring no backend beyond static file serving. It is ideal for fieldwork, surveying, and tactical operations where precise location and orientation data are crucial.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript
- **Vite** for build and development
- **Wouter** for client-side routing
- **TanStack Query** for state management
- **Tailwind CSS** with a custom tactical dark theme
- **shadcn/ui** component library (Radix UI primitives)

**Design Philosophy:**
The application employs a utility-first, tactical UI inspired by military HUDs, emphasizing high information density, readability in varied lighting, touch optimization for single-handed use, and a minimalist, purpose-driven interface.

**Component Structure:**
- Custom hooks for camera, geolocation, and device orientation.
- Reusable UI components from shadcn/ui.
- Context API for settings management.
- Four main views: Camera, Gallery, Photo Detail, Settings.

### Data Storage

All application data is stored client-side in **IndexedDB** using a custom abstraction layer. No server-side database is required.

**Data Models:**
- **Photos Store**: Stores captured photos (base64, thumbnails, metadata).
- **Settings Store**: Persists user preferences.

**Photo Metadata Schema:**
Each photo includes GPS coordinates, device orientation, timestamp, optional user notes, and active reticle type. Images are stored as base64 without EXIF data for privacy; separate thumbnails are generated for gallery performance.

### PWA Features

- **Service Worker**: Caches static assets for offline access (production only), uses a network-first strategy with fallback to cached resources.
- **Mobile Optimization**: Viewport meta tags, Apple-specific meta tags for iOS web app mode, and touch-friendly UI.

### Device APIs Integration

- **Camera API**: Manages MediaStream API, camera switching, canvas-based capture, and stream cleanup.
- **Geolocation API**: Provides continuous GPS position watching, high-accuracy requests, and error handling.
- **Device Orientation API**: Handles compass heading, tilt, roll, with cross-browser compatibility and permission requests for iOS 13+.

### Reticle System

Six customizable reticle types (None, Crosshair, Grid, Rangefinder, Tactical, Mil-Dot) with adjustable opacity, color, and metadata overlay visibility. Settings are persisted in IndexedDB.

**Tap-to-Position Feature:**
- When enabled, long-press on the camera viewfinder positions the reticle at that location AND simultaneously captures a photo
- Long press delay is configurable (300-1500ms) in Settings → Crosshair → "Long press delay"
- Visual progress indicator (animated ring) shows hold duration at touch position
- Movement threshold of 10px cancels the long press and hides the indicator
- The reticle position is tracked as percentage coordinates (0-100) for consistent positioning across different screen sizes
- The captured photo includes the reticle drawn at the selected position
- When autoColor is enabled, reticle color is sampled from pixels at the touch position
- When autoColor is disabled, the user-selected reticle color is used
- Optional manual adjustment mode allows repositioning the reticle on a frozen frame before capture
- Can be toggled on/off in Settings → Crosshair → "Long press to position"

### State Management

- **Settings Context**: Manages global settings, reticle configuration, GPS/orientation preferences, camera facing, and audio feedback.
- **Local-First Approach**: All state changes immediately persist to IndexedDB.

### Privacy Mode

The application includes a privacy/masking feature that displays a cover app (calculator, notepad, game) instead of the camera interface:
- **Auto-lock on minimize**: When PRIVACY_MODE is enabled, the app automatically locks and shows the privacy module when minimized, backgrounded, or when the tab loses visibility.
- **App switcher protection**: A black overlay instantly covers the screen when the app goes to background, hiding content from the app switcher preview on Android/iOS.
- **Event handling**: Uses `visibilitychange`, `pagehide`/`pageshow` (for Safari iOS), and `blur`/`focus` (for mobile devices) events for comprehensive cross-platform support.
- **Per-module unlock methods**: Each privacy module has its own unlock method (calculator uses digit sequence, notepad uses secret phrase).
- **Universal unlock gestures**: Configurable fallback unlock methods including pattern unlock and multi-finger gestures.
- **Auto-lock timer**: Configurable inactivity timeout for automatic locking.
- **Extensible module system**: Privacy modules are registered via `privacyModuleRegistry` and can be selected in settings.
- **Neutral code terminology**: All code uses neutral names like `privacy_modules`, `PrivacyModuleConfig`, `selectedModule` for code discretion.

## External Dependencies

### UI Component Library
- **Radix UI**: Unstyled, accessible component primitives.
- **shadcn/ui**: Pre-styled components built on Radix UI with Tailwind CSS.
- **lucide-react**: Icon library.

### Build Tools & Development
- **Vite**: Fast build tool.
- **TypeScript**: Type safety.
- **PostCSS & Autoprefixer**: CSS processing.

### Utilities
- **clsx & tailwind-merge**: Conditional className utilities.
- **class-variance-authority**: Component variant management.
- **date-fns**: Date formatting and manipulation.
- **zod**: Runtime type validation.
- **nanoid**: Unique ID generation.

### Fonts
- **Google Fonts**: Roboto Mono (monospaced) and Inter (UI).

### Server (Minimal)
- **Express**: Serves static files.

## Recent Refactoring (December 2025)

### Code Architecture Improvements
- **useAdjustmentMode hook** (`client/src/hooks/use-adjustment-mode.ts`): Manages manual reticle adjustment mode state, frozen frame capture, and color sampling. Reduces CameraPage complexity.
- **sampleColorFromSource utility** (`client/src/lib/canvas-utils.ts`): Unified color sampling from video/image sources with canvas reuse optimization to prevent per-frame allocation.
- **getDefaultColorForScheme** (`client/src/components/reticles.tsx`): Returns the default reticle color for a given colorScheme (palette.dark[0]).
- **UI barrel export** (`client/src/components/ui/index.ts`): Simplifies imports for shadcn/ui components.

### Color Handling
- `useColorSampling` returns a synchronously computed color: `autoColor ? sampledColor : defaultColor`
- This eliminates flash when toggling autoColor setting
- Color is derived from colorScheme palette when autoColor is disabled

### Object-Cover Coordinate Transformation (December 2025)
The camera preview uses CSS `object-cover` which crops the video to fill the container. This created a mismatch where reticle positions on screen didn't match positions in saved photos.

**Solution:**
- **convertScreenToVideoCoordinates** (`client/src/lib/canvas-utils.ts`): Converts screen percentage coordinates (relative to visible container area) to video percentage coordinates (relative to full video frame). Used when capturing reticle position from long-press or adjustment drag.
- **convertVideoToScreenCoordinates** (`client/src/lib/canvas-utils.ts`): Inverse transformation for displaying stored video-space positions correctly on screen.

**Implementation:**
- Long-press capture converts screen position → video position before saving
- Adjustment drag converts screen position → video position for storage
- Display position converts video position → screen position for rendering
- `tempPosition` (during long-press indicator) stays in screen-space since it's purely visual

### Settings Page Optimization (December 2025)
Reorganized settings page for better mobile ergonomics and compactness:

**Navigation Changes:**
- Removed bottom tab bar navigation (`SettingsTabs` component)
- Replaced with compact horizontal chip navigation (`SettingsChips`) in sticky header
- Category chips scroll horizontally with auto-centering on active category
- Freed up ~60px of screen space previously occupied by bottom tabs

**QuickSettings Optimization:**
- Changed from horizontal scroll to compact 2x2 grid layout
- Reduced padding (p-4 → p-3) for tighter mobile layout
- Icons and labels inline for better touch targets

**Layout Improvements:**
- Reduced bottom padding (pb-32 → pb-8) since no bottom tabs
- Single unified header with search + category chips
- Works identically on mobile and desktop (no separate desktop floating panel)

**Slider Descriptions:**
- Added descriptive text for image quality sliders (sharpness, denoise, contrast)
- Added descriptive text for reticle sliders (size, thickness, opacity)
- Reduced slider component spacing (space-y-3 → space-y-2) for compact layout

**Footer:**
- App info block now displays on all category tabs, not just "System"
- Smaller icon (w-3.5) and tighter spacing (space-y-0.5) for minimal footprint

### Extensible Privacy Module System (December 2025)
Privacy modules for masking the camera are managed through a registry pattern:

**Architecture:**
```
client/src/privacy_modules/
├── types.ts              # PrivacyModuleConfig, PrivacyModuleProps, UnlockMethod
├── registry.ts           # PrivacyModuleRegistry: register/get modules
├── index.ts              # Export all modules + register them
├── game-2048/
│   └── config.ts         # Game 2048 (uses universal unlock methods)
├── calculator/
│   ├── Calculator.tsx    # Calculator component
│   └── config.ts         # unlockMethod: sequence (e.g., '123456=')
└── notepad/
    ├── Notepad.tsx       # Notepad component
    └── config.ts         # unlockMethod: phrase (e.g., 'secret')
```

**Adding a new privacy module:**
1. Create folder `client/src/privacy_modules/your-module/`
2. Create `config.ts` with PrivacyModuleConfig:
```typescript
import { lazy } from "react";
import { YourIcon } from "lucide-react";
import type { PrivacyModuleConfig } from "../types";

export const yourModuleConfig: PrivacyModuleConfig = {
  id: 'your-module',
  title: 'Your Module',
  favicon: '/your-module-icon.svg',
  icon: YourIcon,
  component: lazy(() => import("./YourModuleComponent")),
  unlockMethod: {
    type: 'sequence', // or 'phrase', 'swipePattern', 'tapSequence'
    defaultValue: '1234',
    labelKey: 'sequenceLabel',
    placeholderKey: 'sequencePlaceholder',
    descriptionKey: 'sequenceDesc',
  },
  supportsUniversalUnlock: true,
};
```
3. Create component implementing `PrivacyModuleProps`:
```typescript
import type { PrivacyModuleProps } from "../types";

export function YourModule({ unlockValue, onUnlock, onSecretGesture, ... }: PrivacyModuleProps) {
  // Implement your module with unlock logic
}
```
4. Register in `client/src/privacy_modules/index.ts`:
```typescript
import { yourModuleConfig } from "./your-module";
privacyModuleRegistry.register(yourModuleConfig);
```
5. Add translations in `lib/i18n/en.ts` and `lib/i18n/ru.ts` for labelKey, placeholderKey, descriptionKey

### Extensible Theme System (December 2025)
Themes are managed through a registry pattern with dynamic CSS variable application:

**Architecture:**
```
client/src/themes/
├── types.ts              # ThemeConfig, ThemeColors interfaces
├── registry.ts           # ThemeRegistry: register/get themes
├── apply-theme.ts        # Apply theme CSS variables to DOM
├── index.ts              # Export all themes + register them
├── tactical-dark.ts      # Default dark theme
└── tactical-light.ts     # Default light theme
```

**Adding a new theme:**
1. Create `client/src/themes/your-theme.ts`:
```typescript
import type { ThemeConfig } from "./types";

export const yourTheme: ThemeConfig = {
  id: 'your-theme',
  name: 'Your Theme',
  mode: 'dark', // or 'light'
  colors: {
    background: '0 0% 4%',
    foreground: '0 0% 95%',
    // ... all color values in HSL format
  },
};
```
2. Register in `client/src/themes/index.ts`:
```typescript
import { yourTheme } from "./your-theme";
themeRegistry.register(yourTheme);
```

### Extensible Cloud Provider System (December 2025)
Cloud upload providers are managed through a registry pattern similar to games and themes:

**Architecture:**
```
client/src/cloud-providers/
├── types.ts                        # CloudProvider, UploadResult, ProviderSettings interfaces
├── registry.ts                     # CloudProviderRegistry: register/get providers
├── index.ts                        # Export all providers + register them
└── providers/
    └── imgbb/
        ├── index.ts                # ImgBB provider implementation
        ├── config.ts               # Metadata: id, name, icon, getApiKeyUrl
        └── types.ts                # ImgBB-specific settings
```

**CloudProvider Interface:**
```typescript
interface CloudProvider {
  id: string;
  name: string;
  icon: React.ComponentType;
  getApiKeyUrl?: string;
  getDefaultSettings(): ProviderSettings;
  getSettingsSchema(): SettingsField[];
  validateSettings(settings: ProviderSettings): Promise<ValidationResult>;
  upload(imageBase64: string, settings: ProviderSettings): Promise<UploadResult>;
}
```

**Adding a new cloud provider:**
1. Create folder `client/src/cloud-providers/providers/your-provider/`
2. Create `config.ts` with provider metadata:
```typescript
import { Cloud } from "lucide-react";
import type { CloudProviderMetadata } from "../../types";

export const yourProviderConfig: CloudProviderMetadata = {
  id: 'your-provider',
  name: 'Your Provider Name',
  icon: Cloud,
  getApiKeyUrl: 'https://your-provider.com/api-keys',
};
```
3. Create `index.ts` implementing CloudProvider interface:
```typescript
import type { CloudProvider, UploadResult, ProviderSettings } from "../../types";
import { yourProviderConfig } from "./config";

export const yourProvider: CloudProvider = {
  ...yourProviderConfig,
  getDefaultSettings: () => ({ isValidated: false, apiKey: '' }),
  getSettingsSchema: () => [{ type: 'apiKey', key: 'apiKey', label: 'API Key' }],
  validateSettings: async (settings) => { /* validation logic */ },
  upload: async (imageBase64, settings) => { /* upload logic */ },
};
```
4. Register in `client/src/cloud-providers/index.ts`:
```typescript
import { yourProvider } from "./providers/your-provider";
cloudProviderRegistry.register(yourProvider);
```

**Settings Storage:**
- Provider-specific settings are stored in `settings.cloud.providers[providerId]`
- Selected provider is stored in `settings.cloud.selectedProvider`
- ImgBB settings remain in `settings.imgbb` for backward compatibility