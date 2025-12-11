# Camroid M

> A tactical camera Progressive Web App with privacy mode

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5a0fc4)](https://web.dev/progressive-web-apps)

## Overview

Camroid M is a Progressive Web App designed for precision photography with comprehensive metadata capture. It combines tactical HUD overlays, GPS geolocation, device orientation tracking, cloud upload capabilities, and offline-first functionality into a single-page application that operates entirely within your browser.

### Key Highlights
- **Zero Server Required** — All data stored locally in IndexedDB
- **Privacy Mode** — Extensible module system with 2048 game, Calculator, and Notepad covers
- **Full Offline Support** — Works completely offline, installable as native app
- **Tactical HUD** — Customizable reticle with auto-color adaptation
- **Precise Metadata** — GPS coordinates, compass heading, device orientation, timestamps
- **Cloud Upload** — Extensible provider system (ImgBB included)
- **Theme System** — 4 built-in themes with extensible registry
- **Image Enhancement** — Sharpness, denoise, and contrast adjustments
- **Bilingual** — Full English and Russian localization
- **Virtualized Gallery** — Smooth scrolling with thousands of photos

---

## Features

### Photography Capabilities
- **Multiple Camera Modes** — Switch between front and rear cameras
- **Camera Resolution** — Auto, 4K, 1080p, 720p, 480p presets
- **Photo Quality** — Adjustable JPEG compression (50-100%)
- **Stabilization** — Visual indicator for steady shots
- **Image Enhancement** — Real-time sharpness, denoise, contrast processing
- **Customizable Reticle** — Size, opacity, stroke width, auto-color

### Reticle Auto-Color System
- **Contrast Detection** — Samples background colors for optimal visibility
- **Color Schemes** — Tactical, Neon, Monochrome, Warm palettes
- **Adaptive Opacity** — Adjusts based on background brightness

### Precise Positioning
- **GPS Integration** — Latitude, longitude with accuracy metrics
- **Accuracy Limit** — Configurable GPS precision threshold (5-100m)
- **Compass Heading** — Magnetic orientation tracking
- **Device Tilt** — Pitch and roll monitoring
- **Level Indicator** — Visual bubble level for horizon alignment
- **Timestamp Recording** — Precise capture time for each photo

### Privacy Mode (Extensible Module System)
Three privacy cover modules with individual unlock methods:

| Module | Unlock Method | Description |
|--------|---------------|-------------|
| **2048 Game** | Universal gesture | Fully functional puzzle game |
| **Calculator** | Digit sequence | Enter sequence ending with `=` (e.g., `123456=`) |
| **Notepad** | Secret phrase | Type a configured phrase |

**Universal Unlock Methods** (fallback for all modules):
- **Pattern Unlock** — Draw pattern on 3×3 grid (recommended)
- **Multi-Finger Touch** — 3-9 simultaneous finger touch

**Security Features:**
- Auto-lock timer (configurable inactivity timeout)
- App switcher protection (black overlay when backgrounded)
- Platform-specific favicons (iOS/Android)

### Theme System
Four built-in themes with extensible registry:
- **Tactical Dark** — Military HUD style (default)
- **Tactical Light** — Light tactical variant
- **Classic Dark** — Standard dark theme
- **Classic Light** — Standard light theme

### PWA Features
- **Installable** — Add to home screen on Android and iOS
- **Offline-First** — Full functionality without internet
- **Auto-Update** — Background service worker keeps app current
- **Native Feel** — Immersive fullscreen experience
- **Auto-Install Banner** — Smart detection for installation prompts

### Gallery & Management
- **Virtualized Gallery** — Smooth performance with react-window
- **Grid & List Views** — Toggle between display modes
- **Folder Organization** — Auto-folder based on photo notes
- **Filtering** — By location, notes, date range
- **Batch Selection** — Long-press for multi-select mode
- **Cloud Status** — Visual indicators for uploaded photos

### Cloud Upload (Extensible Provider System)
Current provider: **ImgBB**
- **Batch Upload** — Upload multiple photos simultaneously
- **Concurrent Processing** — 3 parallel uploads for speed
- **Expiration Settings** — Set auto-delete timers
- **Link Sharing** — Copy direct URLs or viewer links
- **Progress Tracking** — Real-time upload progress overlay
- **Provider Registry** — Easily extensible for new cloud services

### Settings Sections
- **General** — Language, sound preferences
- **Theme** — 4 built-in themes, light/dark mode
- **Reticle** — Size, opacity, stroke width, auto-color settings
- **Camera** — Resolution, facing, photo quality
- **Image Quality** — Enhancement sliders, stabilization
- **Capture Location** — GPS, orientation, accuracy settings
- **Watermark** — Scale adjustment for metadata overlay
- **Cloud Upload** — Provider selection, API key, expiration
- **Privacy** — Module selection, unlock methods, auto-lock timer
- **PWA** — Installation, update controls
- **Storage** — Usage stats, clear data options

---

## Getting Started

### System Requirements
- **Browser Support** — Chrome/Edge 90+, Firefox 88+, Safari 15+
- **APIs Required** — Camera, Geolocation, Device Orientation
- **Storage** — Minimum 50MB available in browser storage

### Installation

#### Option 1: Web App (Recommended)
1. Open the app in your browser
2. Tap the install banner at the bottom of the privacy module
3. Or use your browser's "Install app" option
4. Grant permission for camera, location, and device orientation

#### Option 2: Local Development
```bash
# Clone the repository
git clone <repository-url>
cd camroid-m

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev
```

#### Option 3: Production Build
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start production server (Node.js)
npm start

# Or use Go backend (recommended for production)
cd server-go && go run main.go
```

The production server runs at `http://localhost:5000` with compiled frontend and backend.

### First Launch
1. **Permissions** — Grant access to camera, GPS, and device motion
2. **Settings** — Configure reticle and metadata display
3. **Privacy Setup** — Choose privacy module and unlock method (optional)
4. **Installation** — Install as PWA when prompted

---

## Usage Guide

### Taking Photos
1. **Launch Camera** — Open app (unlock from privacy module if enabled)
2. **Wait for Stabilization** — Green indicator shows steady shot
3. **Frame Shot** — Position subject within reticle overlay
4. **Capture** — Tap the capture button
5. **Add Note** — Optional text note (creates folder automatically)

### Privacy Mode Unlock
Depending on configured gesture type:

**Module-Specific Unlock:**
- **Calculator:** Enter digit sequence ending with `=`
- **Notepad:** Type the configured secret phrase
- **2048 Game:** Use universal unlock methods

**Universal Unlock (Pattern):**
- Draw the configured pattern on the 3×3 grid overlay

**Universal Unlock (Multi-Finger):**
- Touch screen with configured number of fingers (3-9)

### Gallery Management
1. **View Photos** — Navigate to Gallery tab
2. **Switch Views** — Toggle between grid and list
3. **Filter** — Use filter buttons for location/notes
4. **Select Multiple** — Long-press to enter selection mode
5. **Upload** — Tap cloud button to upload selected photos

### Cloud Upload
1. **Configure API Key** — Settings → Cloud Upload → Enter ImgBB key
2. **Select Photos** — Gallery → Long-press → Select photos
3. **Upload** — Tap upload button in header
4. **Share Links** — Tap chain icon to copy URLs

---

## Architecture

### Technology Stack
- **Frontend Framework** — React 18 with TypeScript 5.6
- **Build Tool** — Vite 7 with HMR support
- **Routing** — Wouter (lightweight client-side router)
- **State Management** — TanStack Query + React Context
- **Styling** — Tailwind CSS 3 + shadcn/ui components
- **Storage** — IndexedDB (browser-native database)
- **Virtualization** — react-window for gallery performance
- **Validation** — Zod for runtime type checking
- **Icons** — Lucide React + React Icons
- **Animations** — Framer Motion
- **Testing** — Vitest + Testing Library

### Project Structure
```
camroid-m/
├── client/src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (50+)
│   │   │   ├── index.ts             # Barrel exports
│   │   │   ├── styles.ts            # Shared overlay styles
│   │   │   ├── setting-row.tsx      # Reusable settings row
│   │   │   ├── setting-slider.tsx   # Reusable slider component
│   │   │   └── ...
│   │   ├── virtualized-gallery/     # Gallery virtualization
│   │   │   ├── VirtualizedGrid.tsx  # Grid view component
│   │   │   ├── VirtualizedList.tsx  # List view component
│   │   │   ├── AutoSizerContainer.tsx
│   │   │   └── types.ts
│   │   ├── game-2048.tsx            # 2048 game component
│   │   ├── pattern-lock.tsx         # Unlock pattern grid
│   │   ├── reticles.tsx             # Tactical overlays
│   │   ├── level-indicator.tsx      # Bubble level
│   │   └── upload-progress-overlay.tsx
│   ├── pages/
│   │   ├── camera/
│   │   │   ├── components/          # CameraControls, CameraViewfinder, PhotoNoteDialog
│   │   │   └── index.tsx            # Camera page (~489 lines)
│   │   ├── gallery/
│   │   │   ├── components/          # GalleryHeader, GalleryFilters, etc.
│   │   │   ├── hooks/               # useGallerySelection, useGalleryPhotos, etc.
│   │   │   └── index.tsx            # Gallery page
│   │   ├── settings/
│   │   │   ├── sections/            # 13 collapsible sections
│   │   │   ├── components/          # QuickSettings, SettingsSearch, etc.
│   │   │   ├── contexts/            # PreviewContext
│   │   │   └── index.tsx            # Settings page
│   │   ├── photo-detail.tsx         # Photo viewer
│   │   └── game.tsx                 # Game wrapper
│   ├── hooks/
│   │   ├── index.ts                 # Barrel exports
│   │   ├── use-camera.ts            # Camera API integration
│   │   ├── use-geolocation.ts       # GPS positioning
│   │   ├── use-orientation.ts       # Device orientation
│   │   ├── use-stabilization.ts     # Motion stability
│   │   ├── use-color-sampling.ts    # Auto-color detection
│   │   ├── use-touch-tracking.ts    # Base touch handling
│   │   ├── use-long-press.ts        # Long press gesture
│   │   ├── use-gestures.ts          # Swipe detection
│   │   ├── use-adjustment-mode.ts   # Manual adjustment mode
│   │   ├── use-pattern-setup.ts     # Pattern lock setup
│   │   ├── use-api-key-validation.ts# API key validation
│   │   ├── use-pwa.ts               # PWA installation
│   │   ├── use-pwa-banner.ts        # Install banner
│   │   ├── use-upload-progress.ts   # Upload state
│   │   └── ...                      # 20+ hooks total
│   ├── lib/
│   │   ├── db/                      # IndexedDB services
│   │   │   ├── db-core.ts           # Database core, caching
│   │   │   ├── photo-service.ts     # Photo CRUD operations
│   │   │   ├── folder-service.ts    # Folder management
│   │   │   ├── settings-service.ts  # Settings persistence
│   │   │   ├── storage-service.ts   # Storage utilities
│   │   │   └── index.ts             # Re-exports
│   │   ├── i18n/                    # Localization
│   │   │   ├── context.tsx          # I18n context provider
│   │   │   ├── en.ts                # English translations
│   │   │   ├── ru.ts                # Russian translations
│   │   │   └── index.ts
│   │   ├── constants.ts             # Centralized constants (LONG_PRESS, CAMERA, GESTURE, TIMING)
│   │   ├── logger.ts                # Centralized logging
│   │   ├── canvas-utils.ts          # Canvas helpers, color sampling
│   │   ├── color-utils.ts           # Color manipulation
│   │   ├── image-enhancement.ts     # Image processing
│   │   ├── watermark-renderer.ts    # Metadata overlay
│   │   ├── capture-helpers.ts       # Photo capture utilities
│   │   ├── upload-helpers.ts        # Upload utilities
│   │   ├── config-loader.ts         # Dynamic config loading
│   │   ├── privacy-context.tsx      # Privacy mode state
│   │   ├── settings-context.tsx     # Settings state
│   │   └── theme-context.tsx        # Theme management
│   ├── cloud-providers/             # Cloud upload provider system
│   │   ├── registry.ts              # Provider registry
│   │   ├── types.ts                 # CloudProvider interface
│   │   ├── index.ts
│   │   └── providers/
│   │       └── imgbb/               # ImgBB provider implementation
│   │           ├── index.ts
│   │           └── types.ts
│   ├── privacy_modules/             # Privacy cover modules
│   │   ├── registry.ts              # Module registry
│   │   ├── types.ts                 # PrivacyModuleConfig interface
│   │   ├── index.ts
│   │   ├── game-2048/               # 2048 game module
│   │   │   ├── config.ts
│   │   │   └── index.ts
│   │   ├── calculator/              # Calculator module
│   │   │   ├── config.ts
│   │   │   ├── Calculator.tsx
│   │   │   ├── AndroidCalculator.tsx
│   │   │   ├── iOSCalculator.tsx
│   │   │   ├── unlock-logic.ts
│   │   │   └── index.ts
│   │   └── notepad/                 # Notepad module
│   │       ├── config.ts
│   │       ├── Notepad.tsx
│   │       ├── unlock-logic.ts
│   │       └── index.ts
│   ├── themes/                      # Theme system
│   │   ├── registry.ts              # Theme registry
│   │   ├── types.ts                 # ThemeConfig interface
│   │   ├── apply-theme.ts           # Theme application
│   │   ├── tactical-dark.ts
│   │   ├── tactical-light.ts
│   │   ├── classic-dark.ts
│   │   ├── classic-light.ts
│   │   └── index.ts
│   ├── docs/
│   │   └── ARCHITECTURE.md          # Architecture patterns
│   ├── __tests__/                   # Unit tests
│   │   └── privacy_modules/         # Privacy module tests
│   ├── config.ts                    # App configuration
│   └── App.tsx                      # Main app component
├── server/
│   ├── index.ts                     # Express server (development)
│   └── vite.ts                      # Vite middleware
├── server-go/                       # Go backend (production)
│   ├── main.go                      # Go server (733 lines)
│   └── go.mod
├── shared/
│   └── schema.ts                    # Zod schemas & types
├── public/                          # Static assets, module icons
├── script/
│   └── build.ts                     # Build script
├── eslint.config.js                 # ESLint configuration
├── vite.config.ts                   # Vite configuration
├── vitest.config.ts                 # Vitest configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── tsProblems.md                    # Audit report
└── package.json
```

### Data Storage
All data persists in **IndexedDB** with the following stores:
- **photos** — Captured images with metadata, thumbnails, cloud data
- **settings** — User preferences and configuration
- **note_history** — Recent notes for autocomplete

### Database Services
- **photo-service.ts** — CRUD operations, pagination, filtering
- **folder-service.ts** — Folder stats, counts with caching (30s TTL)
- **settings-service.ts** — Settings and note history
- **storage-service.ts** — Storage estimation utilities

### Extensible Registry Systems

The application uses registry patterns for extensibility:

**Cloud Providers** (`cloud-providers/registry.ts`):
```typescript
interface CloudProvider {
  id: string;
  name: string;
  icon: LucideIcon;
  settingsFields: ProviderSettingField[];
  validateSettings(settings): Promise<ValidationResult>;
  upload(imageBase64, settings): Promise<UploadResult>;
  uploadMultiple(images, settings, onProgress): Promise<Map<string, UploadResult>>;
}
```

**Privacy Modules** (`privacy_modules/registry.ts`):
```typescript
interface PrivacyModuleConfig {
  id: string;
  title: string;
  favicon: string | PlatformFavicon;
  icon: ComponentType;
  component: LazyExoticComponent<ComponentType<PrivacyModuleProps>>;
  unlockMethod: UnlockMethod;
  supportsUniversalUnlock: boolean;
}
```

**Themes** (`themes/registry.ts`):
```typescript
interface ThemeConfig {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
}
```

---

## Go Backend (Production)

The application includes an optional Go backend (`server-go/main.go`) for production deployment:

**Version:** 1.1.0

**API Endpoints:**
- `GET /api/health` — Backend availability check
- `GET /api/config` — Get dynamic configuration
- `POST /api/config` — Update privacy settings (saves to config.json)
- `POST /api/imgbb` — CORS proxy for ImgBB uploads
- `POST /api/proxy` — Generic CORS proxy for whitelisted hosts

**Features:**
- Gzip compression with pooled writers
- Static file serving with configurable caching
- Request logging middleware
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options)

**Origin Validation Modes:**
- `disabled` — No origin checking (default for development)
- `same-host` — Origin must match request Host
- `host-whitelist` — Origin must be in `allowedHosts` list
- `pattern-whitelist` — Origin must match patterns (supports `*.example.com` wildcards)

**Configuration Example:**
```json
{
  "PRIVACY_MODE": true,
  "SELECTED_MODULE": "game-2048",
  "ALLOWED_PROXY_HOSTS": ["api.imgbb.com"],
  "ORIGIN_VALIDATION": {
    "mode": "host-whitelist",
    "allowedHosts": ["example.com"],
    "allowedPatterns": ["*.example.com"],
    "allowedSchemes": ["https", "http"]
  }
}
```

---

## Security & Privacy

### Data Protection
- **Local-Only Storage** — All photos stored in browser's IndexedDB
- **No Server Upload** — Cloud upload only when user initiates
- **EXIF Removal** — Base64 encoding prevents sensitive metadata exposure
- **No Tracking** — Zero analytics or telemetry
- **Transient Metadata** — Sensitive data (altitude, heading) only in watermarks

### Privacy Mode Security
- **Module-Specific Unlock** — Each privacy module has unique unlock method
- **Pattern-Based Security** — User-defined unlock pattern (universal)
- **Multi-Finger Gestures** — Configurable 3-9 finger requirement (universal)
- **Auto-Lock Timer** — Automatic camera hiding after inactivity
- **App Switcher Protection** — Black overlay in task switcher

### Security Headers (Go Backend)
- Content-Security-Policy (CSP)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict host whitelist for proxy

---

## Localization

Camroid M supports full bilingual interface:
- **English** — Default language
- **Русский** — Complete Russian translation
- **Auto-Detection** — Respects browser language preference
- **Manual Override** — Switch languages in settings

---

## Configuration

### App Config (`client/src/config.ts`)
```typescript
CONFIG = {
  // Privacy Mode
  PRIVACY_MODE: false,
  SELECTED_MODULE: 'game-2048',  // 'game-2048' | 'calculator' | 'notepad'
  
  // Module-specific unlock values
  MODULE_UNLOCK_VALUES: {
    'calculator': '123456=',     // Digit sequence ending with =
    'notepad': 'secret',         // Secret phrase
    'game-2048': '',             // Uses universal unlock
  },
  
  // Universal unlock methods
  UNLOCK_GESTURE: 'severalFingers',  // 'patternUnlock' | 'severalFingers'
  UNLOCK_PATTERN: '0-4-8-5',         // Grid pattern positions
  UNLOCK_FINGERS: 4,                 // 3-9 fingers
  
  AUTO_LOCK_MINUTES: 5,
  DEBUG_MODE: false,
}
```

### Browser Compatibility
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera  | 90+ | 88+  | 15+ | 90+ |
| GPS     | 90+ | 88+  | 15+ | 90+ |
| PWA     | 90+ | 88+  | 15+ (limited) | 90+ |
| Orientation | 90+ | 88+ | 15+ (limited) | 90+ |

---

## Development

### Scripts
```bash
npm run dev           # Start development server
npm run build         # Production build
npm run check         # TypeScript validation
npm start             # Start production server (Node.js)
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Code Quality
- **TypeScript 5.6** — Strict type checking, no `any` or `@ts-ignore`
- **ESLint** — Code quality with unused-imports plugin
- **Centralized Logging** — All logs through `logger.ts`
- **Clean Code** — No dead code, unused variables, or console.log leaks
- **183 Memoization Usages** — Comprehensive performance optimization

### Architecture Patterns
Documented in `client/src/docs/ARCHITECTURE.md`:
- UI Component Patterns (Radix/shadcn, overlayStyles)
- Custom Hooks Architecture (useTouchTracking, useColorSampling)
- Database Layer (Service architecture, cache invalidation)
- Performance Patterns (Memoization, Virtualization)
- Constants Management (LONG_PRESS, CAMERA, GESTURE, TIMING)

### Testing
- **Framework:** Vitest + Testing Library
- **Location:** `client/src/__tests__/`
- **Coverage:** Privacy modules, hooks, utilities

---

## Documentation

- **Architecture** — `client/src/docs/ARCHITECTURE.md`
- **Configuration** — `client/src/config.ts`
- **Localization** — `client/src/lib/i18n/`
- **Type Definitions** — `shared/schema.ts`
- **Audit Report** — `tsProblems.md`
- **Design Guidelines** — `design_guidelines.md`

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes following existing patterns
4. Run `npm run check` and `npm test`
5. Submit a pull request

---

## License

This project is licensed under the MIT License — see LICENSE file for details.

---

## Acknowledgments

- **shadcn/ui** — Beautiful component library
- **Tailwind CSS** — Modern utility-first styling
- **Vite** — Next generation build tool
- **React** — UI library foundation
- **react-window** — Virtualization for performance
- **Lucide Icons** — Beautiful icon set
- **ImgBB** — Free image hosting API
- **Framer Motion** — Smooth animations

---

## Roadmap

- [x] Cloud upload to ImgBB
- [x] Image enhancement processing
- [x] Virtualized gallery
- [x] Folder organization
- [x] Multi-finger unlock gesture
- [x] Level indicator
- [x] Auto-color reticle
- [x] Privacy module system (Calculator, Notepad, 2048)
- [x] Theme system (4 themes)
- [x] Cloud provider registry
- [x] Go backend for production
- [ ] Video recording mode
- [ ] Custom theme creator
- [ ] Geofencing capabilities
- [ ] Additional cloud providers

---

**Camroid M** — *Precision photography meets tactical intelligence*

*Built with care for photographers, surveyors, and tactical professionals*
