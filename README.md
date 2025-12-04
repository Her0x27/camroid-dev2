# Camroid M

> A tactical camera Progressive Web App with privacy mode

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5a0fc4)](https://web.dev/progressive-web-apps)

## Overview

Camroid M is a Progressive Web App designed for precision photography with comprehensive metadata capture. It combines tactical HUD overlays, GPS geolocation, device orientation tracking, cloud upload capabilities, and offline-first functionality into a single-page application that operates entirely within your browser.

### Key Highlights
- **Zero Server Required** — All data stored locally in IndexedDB
- **Privacy Mode** — Hides camera behind a 2048 game with multiple unlock methods
- **Full Offline Support** — Works completely offline, installable as native app
- **Tactical HUD** — Customizable reticle with auto-color adaptation
- **Precise Metadata** — GPS coordinates, compass heading, device orientation, timestamps
- **Cloud Upload** — ImgBB integration with batch upload support
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

### Privacy Mode
- **2048 Game** — Fully functional puzzle game as cover
- **Multiple Unlock Methods**:
  - **Pattern Unlock** — Draw pattern on 3×3 grid (recommended)
  - **Multi-Finger Touch** — 3-9 simultaneous finger touch
  - **Quick Taps** — Sequential corner taps
- **Auto-Lock** — Configurable inactivity timeout
- **App Switcher Protection** — Black overlay when backgrounded

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

### Cloud Upload (ImgBB)
- **Batch Upload** — Upload multiple photos simultaneously
- **Concurrent Processing** — 3 parallel uploads for speed
- **Expiration Settings** — Set auto-delete timers
- **Link Sharing** — Copy direct URLs or viewer links
- **Progress Tracking** — Real-time upload progress overlay

### Settings Sections
- **General** — Language, sound preferences
- **Theme** — Light/dark mode, system preference
- **Reticle** — Size, opacity, stroke width, auto-color settings
- **Camera** — Resolution, facing, photo quality
- **Image Quality** — Enhancement sliders, stabilization
- **Capture Location** — GPS, orientation, accuracy settings
- **Watermark** — Scale adjustment for metadata overlay
- **Cloud Upload** — ImgBB API key, expiration, auto-upload
- **Privacy** — Unlock gesture, pattern, auto-lock timer
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
2. Tap the install banner at the bottom of the 2048 game
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

# Start production server
npm start
```

The production server runs at `http://localhost:5000` with compiled frontend and backend.

### First Launch
1. **Permissions** — Grant access to camera, GPS, and device motion
2. **Settings** — Configure reticle and metadata display
3. **Privacy Setup** — Choose unlock method (optional)
4. **Installation** — Install as PWA when prompted

---

## Usage Guide

### Taking Photos
1. **Launch Camera** — Open app (unlock from game if privacy mode enabled)
2. **Wait for Stabilization** — Green indicator shows steady shot
3. **Frame Shot** — Position subject within reticle overlay
4. **Capture** — Tap the capture button
5. **Add Note** — Optional text note (creates folder automatically)

### Privacy Mode Unlock
Depending on configured gesture type:

**Pattern Unlock (recommended):**
- Draw the configured pattern on the 3×3 grid overlay

**Multi-Finger Touch:**
- Touch screen with configured number of fingers (3-9)

**Quick Taps:**
- Tap corners in sequence within time window

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
- **Frontend Framework** — React 18 with TypeScript
- **Build Tool** — Vite 7 with HMR support
- **Routing** — Wouter (lightweight client-side router)
- **State Management** — TanStack Query + React Context
- **Styling** — Tailwind CSS 3 + shadcn/ui components
- **Storage** — IndexedDB (browser-native database)
- **Virtualization** — react-window for gallery performance
- **Validation** — Zod for runtime type checking
- **Icons** — Lucide React + React Icons
- **Animations** — Framer Motion

### Project Structure
```
camroid-m/
├── client/src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── setting-row.tsx      # Reusable settings row
│   │   │   ├── setting-slider.tsx   # Reusable slider component
│   │   │   └── ...                  # 50+ UI primitives
│   │   ├── virtualized-gallery/     # Gallery virtualization
│   │   │   ├── VirtualizedGrid.tsx  # Grid view component
│   │   │   ├── VirtualizedList.tsx  # List view component
│   │   │   └── types.ts             # Shared types
│   │   ├── game-2048.tsx            # Privacy mode game
│   │   ├── pattern-lock.tsx         # Unlock pattern grid
│   │   ├── reticles.tsx             # Tactical overlays
│   │   ├── level-indicator.tsx      # Bubble level
│   │   └── upload-progress-overlay.tsx
│   ├── pages/
│   │   ├── camera/
│   │   │   ├── components/          # Camera UI components
│   │   │   └── index.tsx            # Camera page
│   │   ├── gallery/
│   │   │   ├── components/          # Gallery UI components
│   │   │   ├── hooks/               # Gallery-specific hooks
│   │   │   └── index.tsx            # Gallery page
│   │   ├── settings/
│   │   │   ├── sections/            # Collapsible sections
│   │   │   └── index.tsx            # Settings page
│   │   ├── photo-detail.tsx         # Photo viewer
│   │   └── game.tsx                 # Game wrapper
│   ├── hooks/
│   │   ├── use-camera.ts            # Camera API integration
│   │   ├── use-geolocation.ts       # GPS positioning
│   │   ├── use-orientation.ts       # Device orientation
│   │   ├── use-stabilization.ts     # Motion stability
│   │   ├── use-color-sampling.ts    # Auto-color detection
│   │   ├── use-long-press.ts        # Touch gestures
│   │   ├── use-touch-tracking.ts    # Base touch handling
│   │   ├── use-gestures.ts          # Swipe detection
│   │   ├── use-pwa.ts               # PWA installation
│   │   └── use-upload-progress.ts   # Upload state
│   ├── lib/
│   │   ├── db/                      # IndexedDB services
│   │   │   ├── db-core.ts           # Database core
│   │   │   ├── photo-service.ts     # Photo operations
│   │   │   ├── folder-service.ts    # Folder management
│   │   │   ├── settings-service.ts  # Settings persistence
│   │   │   └── storage-service.ts   # Storage utilities
│   │   ├── i18n/                    # Localization
│   │   │   ├── en.ts                # English translations
│   │   │   └── ru.ts                # Russian translations
│   │   ├── imgbb.ts                 # Cloud upload API
│   │   ├── image-enhancement.ts     # Image processing
│   │   ├── watermark-renderer.ts    # Metadata overlay
│   │   ├── canvas-utils.ts          # Canvas helpers
│   │   ├── constants.ts             # App constants
│   │   ├── logger.ts                # Centralized logging
│   │   ├── privacy-context.tsx      # Privacy mode state
│   │   ├── settings-context.tsx     # Settings state
│   │   └── theme-context.tsx        # Theme management
│   ├── docs/
│   │   └── ARCHITECTURE.md          # Architecture patterns
│   └── App.tsx                      # Main app component
├── server/
│   ├── index.ts                     # Express server
│   └── vite.ts                      # Vite middleware
├── shared/
│   └── schema.ts                    # Zod schemas & types
└── package.json
```

### Data Storage
All data persists in **IndexedDB** with the following stores:
- **photos** — Captured images with metadata, thumbnails, cloud data
- **settings** — User preferences and configuration
- **note_history** — Recent notes for autocomplete

### Database Services
- **photo-service.ts** — CRUD operations, pagination, filtering
- **folder-service.ts** — Folder stats, counts with caching
- **settings-service.ts** — Settings and note history
- **storage-service.ts** — Storage estimation utilities

---

## Security & Privacy

### Data Protection
- **Local-Only Storage** — All photos stored in browser's IndexedDB
- **No Server Upload** — Cloud upload only when user initiates
- **EXIF Removal** — Base64 encoding prevents sensitive metadata exposure
- **No Tracking** — Zero analytics or telemetry
- **Transient Metadata** — Sensitive data (altitude, heading) only in watermarks

### Privacy Mode Security
- **Pattern-Based Security** — User-defined unlock pattern
- **Multi-Finger Gestures** — Configurable 3-9 finger requirement
- **Auto-Lock Timer** — Automatic camera hiding after inactivity
- **App Switcher Protection** — Black overlay in task switcher

---

## Localization

Camroid M supports full bilingual interface:
- **English** — Default language
- **Русский** — Complete Russian translation
- **Auto-Detection** — Respects browser language preference
- **Manual Override** — Switch languages in settings

---

## Configuration

### Environment Variables
```env
VITE_PRIVACY_MODE=true     # Force privacy mode for all users
VITE_DEBUG_MODE=false      # Enable debug logging
```

### App Config (`client/src/config.ts`)
```typescript
CONFIG = {
  PRIVACY_MODE: false,           // Enable privacy mode
  UNLOCK_GESTURE: 'severalFingers', // 'quickTaps' | 'patternUnlock' | 'severalFingers'
  UNLOCK_PATTERN: '0-4-8-5',     // Pattern for patternUnlock
  UNLOCK_FINGERS: 4,             // Fingers for severalFingers
  AUTO_LOCK_MINUTES: 5,          // Auto-lock timeout (0 = disabled)
  DEBUG_MODE: false,             // Console logging
}
```

### Browser Compatibility
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera  | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| GPS     | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| PWA     | ✅ 90+ | ✅ 88+  | ⚠️ 15+ | ✅ 90+ |
| Orientation | ✅ 90+ | ✅ 88+ | ⚠️ 15+ | ✅ 90+ |

---

## Development

### Scripts
```bash
npm run dev        # Start development server
npm run build      # Production build
npm run check      # TypeScript validation
npm start          # Start production server
```

### Code Quality
- **TypeScript** — Strict type checking, no `any` or `@ts-ignore`
- **ESLint** — Code quality with unused-imports plugin
- **Centralized Logging** — All logs through `logger.ts`
- **Clean Code** — No dead code, unused variables, or console.log leaks

### Architecture Patterns
Documented in `client/src/docs/ARCHITECTURE.md`:
- UI Component Patterns (Radix/shadcn, overlayStyles)
- Custom Hooks Architecture (useTouchTracking, useColorSampling)
- Database Layer (Service architecture, cache invalidation)
- Performance Patterns (Memoization, Virtualization)
- Constants Management (LONG_PRESS, CAMERA, GESTURE, TIMING)

---

## Documentation

- **Architecture** — `client/src/docs/ARCHITECTURE.md`
- **Configuration** — `client/src/config.ts`
- **Localization** — `client/src/lib/i18n/`
- **Type Definitions** — `shared/schema.ts`
- **Audit Report** — `tsProblems.md`

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
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

---

## Roadmap

- [x] Cloud upload to ImgBB
- [x] Image enhancement processing
- [x] Virtualized gallery
- [x] Folder organization
- [x] Multi-finger unlock gesture
- [x] Level indicator
- [x] Auto-color reticle
- [ ] Video recording mode
- [ ] Custom theme creator
- [ ] Geofencing capabilities

---

**Camroid M** — *Precision photography meets tactical intelligence*

*Built with care for photographers, surveyors, and tactical professionals*
