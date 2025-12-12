# Camroid M - Tactical Camera PWA

## Overview

Camroid M is a Progressive Web App (PWA) designed as a tactical camera for capturing geotagged photos with precise metadata. It features tactical HUD overlays, customizable reticles, GPS coordinates, device orientation data, and offline-first functionality. The application operates as a single-page app, storing all data locally in IndexedDB, making it ideal for fieldwork, surveying, and tactical operations where precise location and orientation data are crucial.

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
The application employs a utility-first, tactical UI inspired by military HUDs. It emphasizes high information density, readability in varied lighting, touch optimization for single-handed use, and a minimalist, purpose-driven interface.

**Component Structure:**
- Custom hooks for camera, geolocation, and device orientation.
- Reusable UI components from shadcn/ui.
- Context API for settings management.
- Five main views: Camera, Gallery, Photo Detail, Settings, Watermark Preview.

### Watermark Preview (/watermark-preview)

Fullscreen interactive watermark preview with editing capabilities:
- **Fullscreen Background**: preview-background.jpg displayed full viewport
- **Interactive Watermark**: Tap to edit, long-press (500ms) to drag
- **Floating Edit Panel**: Background, font, position settings; add separators/logo
- **Reticle Selector**: 6 shapes (crosshair, circle, square, arrow, speech-bubble, custom)
- **Mobile-first**: Touch-optimized with gesture support

### Data Storage

All application data is stored client-side in **IndexedDB** using a custom abstraction layer. No server-side database is required. Photos are stored with GPS coordinates, device orientation, timestamp, optional user notes, and active reticle type. Images are stored as base64 without EXIF data, with separate thumbnails for gallery performance.

### PWA Features

- **Service Worker**: Caches static assets for offline access (production only) using a network-first strategy.
- **Mobile Optimization**: Includes viewport meta tags and Apple-specific meta tags for iOS web app mode, alongside a touch-friendly UI.

### Device APIs Integration

- **Camera API**: Manages MediaStream API, camera switching, canvas-based capture, and stream cleanup.
- **Geolocation API**: Provides continuous, high-accuracy GPS position watching.
- **Device Orientation API**: Handles compass heading, tilt, roll, with cross-browser compatibility and permission requests.

### Reticle System

Six customizable reticle types (None, Crosshair, Grid, Rangefinder, Tactical, Mil-Dot) are available with adjustable opacity, color, and metadata overlay visibility. Settings are persisted in IndexedDB. A "Tap-to-Position" feature allows long-pressing on the viewfinder to position the reticle and capture a photo, with configurable delay and visual feedback.

### State Management

- **Settings Context**: Manages global settings, reticle configuration, GPS/orientation preferences, camera facing, and audio feedback.
- **Local-First Approach**: All state changes immediately persist to IndexedDB.

### Privacy Mode

The application includes a privacy/masking feature that displays a cover app (e.g., calculator, notepad) instead of the camera interface when minimized or backgrounded. This feature includes app switcher protection, per-module unlock methods, universal unlock gestures, and an auto-lock timer. It uses an extensible module system for privacy modules and neutral code terminology for discretion.

### Extensible Module Systems

The application utilizes registry patterns for managing:
-   **Privacy Modules**: Allows easy addition of new masking applications.
-   **Themes**: Enables dynamic application of new UI themes.
-   **Cloud Providers**: Facilitates integration of new cloud upload services.

Each system defines interfaces, registration mechanisms, and configuration options for seamless extensibility.

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
- **Express**: Serves static files in development.

### Go Backend (Production)

The application includes an optional Go backend (`server-go/main.go`) for production deployment:

**API Endpoints:**
- `GET /api/health` - Backend availability check
- `GET /api/config` - Get dynamic configuration
- `POST /api/config` - Update privacy settings (saves to config.json)
- `POST /api/imgbb` - CORS proxy for ImgBB uploads
- `POST /api/proxy` - Generic CORS proxy for whitelisted hosts

**Security:**
- Configurable Origin validation via `ORIGIN_VALIDATION` in config.json
- Host whitelist (`ALLOWED_PROXY_HOSTS` in config.json)
- Proxy endpoints are stateless (no data saved)
- Fail-closed security model for unknown validation modes

**Origin Validation Modes:**
- `disabled` - No origin checking (default for development)
- `same-host` - Origin must match request Host
- `host-whitelist` - Origin must be in `allowedHosts` list
- `pattern-whitelist` - Origin must match patterns (supports `*.example.com` wildcards)

**Configuration:**
- `client/public/config.json` - Privacy settings, allowed proxy hosts, and origin validation
- Dynamic config loaded via `/api/config` when backend available
- Fallback to static `/config.json` when backend unavailable

**ORIGIN_VALIDATION Config Example:**
```json
{
  "ORIGIN_VALIDATION": {
    "mode": "host-whitelist",
    "allowedHosts": ["example.com", "myapp.com"],
    "allowedPatterns": ["*.example.com"],
    "allowedSchemes": ["https", "http"]
  }
}
```