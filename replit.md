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

The application includes a privacy/masking feature that displays a 2048 game instead of the camera interface:
- **Auto-lock on minimize**: When PRIVACY_MODE is enabled, the app automatically locks and shows the 2048 mask when minimized, backgrounded, or when the tab loses visibility.
- **App switcher protection**: A black overlay instantly covers the screen when the app goes to background, hiding content from the app switcher preview on Android/iOS.
- **Event handling**: Uses `visibilitychange`, `pagehide`/`pageshow` (for Safari iOS), and `blur`/`focus` (for mobile devices) events for comprehensive cross-platform support.
- **Unlock gestures**: Configurable unlock methods including quick taps, pattern unlock, and multi-finger gestures.
- **Auto-lock timer**: Configurable inactivity timeout for automatic locking.

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