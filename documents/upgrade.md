# Camera ZeroDay - Upgrade Checklist

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## 1. Gallery Icon with Dual Counters
**Description:** Update gallery button on camera screen with two separate counters

- [x] Add camera icon with photo count (top badge)
- [x] Add cloud icon with uploaded count (bottom badge)
- [x] Add function to get cloud-uploaded photos count from IndexedDB
- [x] Style badges for Android/iPhone consistency

---

## 2. Settings Reorganization
**Description:** Split settings into organized card sections

### Cards Structure:
- [x] **General** - Language, theme, sound
- [x] **Watermark** - Metadata display, watermark scale
- [x] **Crosshair** - Reticle settings (enable, size, opacity, color)
- [x] **Capture / Location** - GPS, orientation, accuracy limit
- [x] **Cloud Upload (ImgBB)** - API key, expiration, auto-upload
- [x] **Storage** - Photo count, storage usage, clear data
- [x] **Privacy Mode** - Enable/disable, gesture type, auto-lock
- [x] **PWA** - Installation, offline mode info
- [x] **Reset** - Reset all settings

---

## 3. Privacy Mode
**Description:** Hide camera behind a fully functional 2048 game

### 3.1 Core Features:
- [x] Create fully functional 2048 game component
- [x] Design for Android and iPhone style
- [x] Implement secret gesture access:
  - [x] 4 quick taps option
  - [x] Pattern unlock option (fully functional with setup UI)
  - [x] Configurable gesture selection
- [x] Auto-lock after inactivity (configurable 1-30 min)
- [x] Dynamic favicon switching (show game icon in privacy mode)
- [x] Mask button on camera screen for quick hide

### 3.2 Settings:
- [x] Enable/disable privacy mode (default: off)
- [x] Select secret gesture type
- [x] Configure auto-lock timeout
- [ ] Test mode for gesture practice (future enhancement)

### 3.3 Infrastructure:
- [x] PrivacyContext provider for state management
- [x] GamePage for game routing
- [x] Game icon SVG for favicon switching
- [x] Activity monitoring for auto-lock
- [x] Inactivity detection and auto-return to game
- [x] App routing with privacy mode redirect

---

## 4. PWA (Progressive Web App)
**Description:** Full PWA support with offline capability

### IMPORTANT: Service Worker and caching ONLY for production!
- In development mode, SW must be unregistered/rejected

### 4.1 Manifest:
- [x] Complete manifest.json with all icon sizes
- [x] Theme colors for Android/iPhone
- [x] Proper display modes

### 4.2 Service Worker (Production Only):
- [x] Cache static assets
- [x] Cache API responses where applicable
- [x] Offline fallback page
- [x] Skip SW registration in development mode
- [x] Add environment check before SW registration

### 4.3 Installation:
- [x] Detect installability (beforeinstallprompt)
- [x] Show install button/prompt in settings
- [x] Handle iOS "Add to Home Screen" guidance
- [x] usePWA hook for install state management

---

## 5. Localization (EN/RU)
**Description:** Full internationalization support

### 5.1 Infrastructure:
- [x] Create i18n context/provider
- [x] Language detection (browser preference)
- [x] Language switcher in settings
- [x] Persist language preference

### 5.2 Translations:
- [x] Camera page strings
- [x] Gallery page strings
- [x] Settings page strings
- [x] Photo detail page strings
- [x] 2048 game strings
- [x] Error messages and toasts
- [x] Metadata labels

---

## 6. Android & iPhone Adaptation
**Description:** Full platform-specific optimization

### 6.1 Common:
- [x] Safe area insets (notch, home indicator)
- [x] Touch-friendly button sizes (w-14 h-14 for main buttons)
- [x] Responsive layouts

### 6.2 Android-specific:
- [x] Status bar color adaptation (via manifest theme-color)
- [ ] Material Design touch ripples (optional enhancement)
- [ ] Back button handling (browser handles it)

### 6.3 iPhone-specific:
- [x] Safe area insets via env(safe-area-inset-*)
- [x] PWA status bar style (black-translucent)
- [ ] Haptic feedback integration (optional enhancement)
- [ ] Swipe gestures (optional enhancement)

---

## Implementation Order

1. **Phase 1: Foundation** ✅ Completed
   - [x] Create upgrade.md checklist
   - [x] Gallery icon dual counters
   - [x] Settings reorganization

2. **Phase 2: Core Features** ✅ Completed
   - [x] Localization system (EN/RU)
   - [x] PWA improvements (production-only SW)

3. **Phase 3: Advanced Features** ✅ Completed
   - [x] Privacy Mode with 2048 game
   - [x] Platform adaptation refinements
   - [x] Mask button on camera
   - [x] Safe area insets

---

## Technical Notes

### Service Worker Strategy
```javascript
// Only register SW in production
if (import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
} else {
  // Unregister any existing SW in development
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
```

### Localization Structure
```
client/src/lib/
├── i18n/
│   ├── context.tsx      # I18n provider
│   ├── translations/
│   │   ├── en.ts        # English strings
│   │   └── ru.ts        # Russian strings
│   └── index.ts         # Exports
```

### Privacy Mode Flow
1. User enables privacy mode in settings
2. App shows 2048 game instead of camera (auto-redirect)
3. Secret gesture (4 quick taps) reveals camera
4. Mask button on camera allows quick return to game
5. Inactivity triggers auto-lock back to game

### Safe Area Implementation
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Applied to:
- Camera page (bottom controls)
- Settings page (header + main)
- Gallery page (header + main)
- Photo detail (bottom header)
- 2048 game (full container)

---

## 7. Pattern Unlock (Completed)
**Description:** Draw pattern gesture for revealing privacy mode

- [x] Create PatternLock component with 3x3 grid
- [x] Gesture recognition (touch tracking)
- [x] Pattern encoding (dot sequence to string)
- [x] Pattern setup UI in settings with confirmation
- [x] Visual feedback (error shake animation)
- [x] Pattern verification in game-2048 privacy mode
- [x] Two unlock methods (4 taps + pattern drawing)
- [x] Settings integration (enable/select unlock method)

---

## 8. Image Stabilization & Enhancement
**Description:** Software-based stabilization and post-processing for improved photo quality

### 8.1 Stabilization on Capture:
- [x] Motion detection between video frames (Laplacian variance + motion-based analysis)
- [x] Stability indicator on camera screen (visual feedback with % stability)
- [x] Wait for stable moment before capture
- [x] Configurable stability threshold (30-90%)

### 8.2 Image Post-Processing:
- [x] Unsharp Mask — edge sharpening enhancement
- [x] Denoising — noise reduction preserving details (bilateral-like filtering)
- [x] Automatic contrast optimization

### 8.3 Settings:
- [x] Stabilization toggle in settings
- [x] Detail enhancement toggle
- [x] Sharpness level slider (0-100%)
- [x] Noise reduction level slider (0-100%)
- [x] Contrast level slider (0-100%)

### 8.4 Infrastructure:
- [x] use-stabilization hook for analyzing frame stability
- [x] image-enhancement module for post-processing
- [x] Integration into photo capture workflow

### 8.5 UI Components:
- [x] ImageQualitySection in settings with collapsible card
- [x] StabilityIndicator overlay on camera viewfinder
- [x] Real-time stability percentage display
- [x] Translations (EN/RU)

---

## 9. Terminal-Style Notifications
**Description:** Compact, transparent notifications in terminal aesthetic

### 9.1 Visual Design:
- [x] Bottom-left positioning (non-intrusive)
- [x] Transparent black background with backdrop blur
- [x] Monospace font (Roboto Mono)
- [x] Terminal prompt symbol (>)
- [x] Color-coded by type:
  - Default: Emerald green
  - Success: Emerald green
  - Error: Red
  - Warning: Amber

### 9.2 Behavior:
- [x] Auto-dismiss after 3 seconds
- [x] Stack up to 5 notifications
- [x] Slide in from left animation
- [x] Small close button on hover
- [x] Terminal icons (Terminal, AlertCircle, CheckCircle, AlertTriangle)

### 9.3 Components:
- [x] Updated ToastViewport (bottom-left, safe-bottom)
- [x] Updated Toast variants (terminal colors)
- [x] TerminalIcon component for status icons
- [x] Compact ToastTitle and ToastDescription

---

## 10. Light/Dark Theme Toggle
**Description:** Full light theme support with localStorage persistence

### 10.1 Theme System:
- [x] ThemeProvider context for global theme state
- [x] Light theme with updated CSS variables
- [x] Dark theme as default
- [x] localStorage persistence of theme preference
- [x] Automatic DOM class toggling (.light class)

### 10.2 Light Theme Colors:
- [x] Bright backgrounds (98% white)
- [x] Dark foregrounds (9% black)
- [x] Adjusted shadows for light mode
- [x] Maintained tactical green primary color
- [x] Improved contrast for readability

### 10.3 Settings:
- [x] ThemeSection in settings UI
- [x] Select dropdown for Light/Dark modes
- [x] Full localization (EN/RU)
- [x] Real-time theme switching

### 10.4 Infrastructure:
- [x] useTheme hook
- [x] Theme context system
- [x] CSS variable updates on theme change

---

## 11. Reticle Enhancements
**Description:** Color scheme selector and parameter adjustments

### 11.1 Color Schemes:
- [x] 5 color schemes: Contrast, Tactical, Neon, Monochrome, Warm
- [x] Dynamic color selection based on background luminance
- [x] Palette variations for light/dark/mid brightness levels

### 11.2 UI Controls:
- [x] Color scheme selector in ReticleSection
- [x] Conditional display (only when Auto Color enabled)
- [x] Full localization for all schemes

### 11.3 Parameter Updates:
- [x] Reticle size: min 1% (was 5%)
- [x] Stroke width: max 30% (was 10%)
- [x] Zod schema validation updated

---

## 12. Modern Camera Screen Icons
**Description:** Modernize camera screen icons to match settings page style

### 12.1 Visual Design:
- [x] Unified color scheme with settings (text-primary for icons)
- [x] Glass-morphism effect (backdrop-blur + semi-transparent bg)
- [x] Subtle glow effect on primary color icons
- [x] Consistent border radius and spacing

### 12.2 CameraControls Updates:
- [x] Gallery button: Modern container with primary-colored icon
- [x] Note button: Primary icon color with indicator dot
- [x] Settings button: Primary icon color
- [x] Improved badge styling for counters

### 12.3 Capture Button:
- [x] Pulsing animation when ready
- [x] Primary color glow effect
- [x] Smooth state transitions
- [x] Enhanced visual feedback

### 12.4 CameraViewfinder Updates:
- [x] Loading overlay with modern styling
- [x] Mask button with unified design
- [x] Stability indicator in settings style
- [x] Note overlay with glass-morphism

### 12.5 Transparent Bottom Panel:
- [x] Removed background and border from bottom controls container
- [x] Controls now float transparently over camera feed
- [x] Improved immersive experience

---

## 13. Camera Error Messages Localization
**Description:** Localize camera error strings for multi-language support

### 13.1 Error Messages:
- [x] Add `cameraAccessDenied` key: "Camera access denied. Please allow camera permissions."
- [x] Add `cameraNotFound` key: "No camera found on this device."
- [x] English translations in `en.ts`
- [x] Russian translations in `ru.ts`

### 13.2 Implementation:
- [x] Added to `errors` section in i18n translations
- [x] Ready for integration into `use-camera.ts` hook
- [x] Type-safe with TypeScript interface matching

---

## 14. Camera Lens Switching (Zoom API)
**Description:** Support for switching between wide-angle, main, and telephoto lenses on Android devices

### 14.1 Zoom API Implementation:
- [x] Extend useCamera hook with zoom capabilities detection
- [x] Add getCapabilities() call to get zoom range (min/max/step)
- [x] Implement setZoom() function with applyConstraints
- [x] Store current zoom level in state
- [x] Handle devices without zoom support gracefully

### 14.2 Camera Enumeration:
- [x] Enumerate all available video devices via enumerateDevices()
- [x] Filter back-facing cameras
- [x] Provide camera selection by deviceId
- [x] Display camera labels for diagnostics

### 14.3 UI Components:
- [x] ZoomControls component with preset buttons (0.6x, 1x, 2x)
- [x] Dynamic preset buttons based on available zoom range
- [x] Current zoom indicator display
- [ ] Zoom slider for fine control (optional)
- [x] Visual feedback for active zoom level

### 14.4 Integration:
- [x] Add ZoomControls to camera viewfinder
- [x] Position controls above bottom panel
- [ ] Persist zoom level preference (optional)
- [x] Handle zoom during camera switch (front/back)

### 14.5 Diagnostics Mode:
- [ ] Display camera capabilities in settings
- [ ] Show available cameras list with labels
- [ ] Show zoom range (min/max/step)
- [ ] Show supported constraints

### 14.6 Localization:
- [x] English translations for camera errors
- [x] Russian translations for camera errors
- [x] "Requested device not found" localized
- [ ] Camera diagnostics strings (optional)

### Technical Notes:
```javascript
// Zoom API usage
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', zoom: true }
});

const track = stream.getVideoTracks()[0];
const capabilities = track.getCapabilities();
// capabilities.zoom = { min: 1, max: 10, step: 0.1 }

// Set zoom level (triggers lens switch on many Android devices)
await track.applyConstraints({
  advanced: [{ zoom: 0.6 }]  // Wide-angle
});
await track.applyConstraints({
  advanced: [{ zoom: 2.0 }]  // Telephoto
});
```

### Lens Switching Behavior:
- zoom < 1.0 → Ultra-wide lens (if available)
- zoom = 1.0 → Main lens
- zoom > 2.0 → Telephoto lens (if available)
- Actual switching points vary by device manufacturer

---

## Future Enhancements (Optional)
- [ ] Haptic feedback for iOS
- [ ] Material ripple effects for Android
- [ ] Test mode for gestures
- [ ] Additional reticle types

---

## Implementation Phases Summary

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | Gallery icon, Settings reorganization |
| Phase 2: Core Features | ✅ Complete | Localization, PWA, Privacy Mode |
| Phase 3: Advanced Features | ✅ Complete | Pattern Unlock, Safe Area, Level Indicator |
| Phase 4: Image Quality | ✅ Complete | Stabilization, Enhancement, Post-processing |
| Phase 5: UI Polish | ✅ Complete | Terminal-style notifications |
| Phase 6: Theming & Reticles | ✅ Complete | Light/Dark theme, Color schemes for reticles |
| Phase 7: Camera UI Modernization | ✅ Complete | Modern icons, unified styling |
| Phase 8: Camera Lens Switching | ✅ Complete | Zoom API, multi-lens support |
| Phase 9: Loading Animations | ✅ Complete | Gallery shimmer, Settings branded loader |

---

*Last Updated: December 2, 2025 - Privacy verification completed, all core features verified working*

---

## 15. Metadata Privacy & Security
**Description:** Ensure sensitive telemetry data is never persisted - only shown as watermarks on photos

### 15.1 Security Model:
**Sensitive data (FORBIDDEN from storage):**
- altitude (высота)
- accuracy (точность GPS)  
- heading (направление)
- tilt (наклон)
- device model and camera info

**Safe data (allowed in storage):**
- timestamp (дата/время)
- latitude/longitude (GPS координаты)
- imageData/thumbnailData (base64)
- cloud upload status
- note (заметка) ✓ KEEP
- folder (папка) ✓ KEEP

**Derived display-only data (computed on read):**
- filename (generated from timestamp)
- resolution (computed from image)
- file size (computed from base64 length)
- quality setting

### 15.2 Implementation Tasks:
- [x] Remove sensitive fields from shared/schema.ts (Photo type)
- [x] Update client/src/pages/camera/index.tsx savePhoto to exclude sensitive data
- [x] Keep sensitive data transient in camera capture for watermark rendering only
- [x] Update gallery components to work with simplified schema (no changes needed - they only use safe fields)

### 15.3 Photo Metadata Panel:
- [x] Create PhotoMetadataPanel component (right-side Sheet)
- [x] Display only safe fields: filename, date, resolution, size, GPS
- [x] Add Info button to photo-detail page
- [x] Full i18n localization (EN/RU)

### 15.4 Camera Resolution Localization:
- [x] Localize resolution options in CameraSettingsSection
- [x] Add resolution-related translations to i18n

### 15.5 Privacy Verification:
- [x] Verify canvas export strips EXIF (already done - canvas toDataURL removes EXIF)
- [x] Verify IndexedDB contains no sensitive fields (code review completed - savePhotoWithNote only saves safe fields)
- [x] Test watermark still displays sensitive telemetry visually (watermark rendering unchanged)

### 15.6 Migration Note for Existing Users:
Photos captured before this update may still contain sensitive metadata in IndexedDB.
To purge sensitive fields from existing records:
1. Export photos you want to keep
2. Clear browser data or delete and re-add them
3. New photos will only store safe metadata

Note: The Google Maps deep-link shows "No GPS" if latitude=0 (0°N in Atlantic Ocean) - edge case unlikely for tactical use.

---

## 16. Camera Resolution Settings Integration Fix
**Description:** Fix camera resolution settings not being applied when capturing photos

### 16.1 Problem Identified:
- [x] Settings UI allows changing `cameraResolution` (auto, 4k, 1080p, 720p, 480p)
- [x] Setting is saved correctly to storage
- [ ] But `useCamera` hook does NOT receive `cameraResolution` parameter
- [ ] `startCamera()` function uses hardcoded resolution (1920x1080)
- [ ] Resolution changes in settings have NO effect on actual camera stream

### 16.2 Root Cause:
```javascript
// Current broken code in use-camera.ts (hardcoded values):
const videoConstraints = {
  width: { ideal: 1920, max: 3840 },
  height: { ideal: 1080, max: 2160 },
};

// camera/index.tsx only passes facingMode and photoQuality:
useCamera({ facingMode: settings.cameraFacing, photoQuality: settings.photoQuality });
// Missing: cameraResolution!
```

### 16.3 Fix Tasks:
- [x] Add `cameraResolution` to `UseCameraOptions` interface
- [x] Update `startCamera()` to apply resolution based on setting:
  - auto → use device maximum
  - 4k → { ideal: 3840, max: 3840 } x { ideal: 2160, max: 2160 }
  - 1080p → { ideal: 1920, max: 1920 } x { ideal: 1080, max: 1080 }
  - 720p → { ideal: 1280, max: 1280 } x { ideal: 720, max: 720 }
  - 480p → { ideal: 640, max: 640 } x { ideal: 480, max: 480 }
- [x] Pass `settings.cameraResolution` to `useCamera` in camera/index.tsx
- [x] Verify resolution changes take effect (restart camera when setting changes)

### 16.4 Verification:
- [x] Change resolution in settings
- [x] Confirm camera stream uses correct resolution
- [x] Captured photos match selected resolution

### 16.5 Implementation Notes:
- Resolution constraints now properly applied via `getResolutionConstraints()` function
- Camera stream automatically restarts when resolution setting changes (via useCallback dependency)
- Auto mode uses device maximum capabilities (ideal: 4096x2160)
- Fixed presets use exact max values to enforce resolution limits

---

## 17. Gallery & Settings Loading Animations with Full Accessibility
**Description:** Beautiful, accessible loading animations for gallery and settings pages with prefers-reduced-motion support

### 17.1 Core Features:
#### Gallery Loading:
- [x] Shimmer-effect for skeleton loaders (gradient animation instead of pulse)
- [x] Staggered skeleton animations (sequential reveal)
- [x] Fade-in animation for loaded photos
- [x] Responsive skeleton grid matching actual layout (columns prop support)
- [x] Three skeleton variants: Grid, List, Folders
- [x] Smooth transition between loading and loaded states

#### Settings Page Loading:
- [x] Branded loader with Crosshair icon (tactical theme consistency)
- [x] Pulsing ring effects around icon (outer and inner rings)
- [x] Fade-in + slide-up appearance for setting sections
- [x] Staggered animation for sequential section reveal
- [x] Spring-based motion for smooth, natural feel

### 17.2 Accessibility Support:
#### ARIA Attributes (for all loaders):
- [x] `role="status"` - Announces loading state to screen readers
- [x] `aria-busy="true"` - Indicates active loading process
- [x] `aria-label` - Descriptive label for loading state (PageLoader)
- [x] `aria-hidden="true"` - Decorative animations hidden from screen readers
- [x] `sr-only` text - Screen reader only "Loading..." text for announcements

#### Reduced Motion Support:
- [x] CSS media query `@media (prefers-reduced-motion: reduce)` for all animations
- [x] Framer Motion `useReducedMotion()` hook integration in AnimatedSection/Container/Item
- [x] Disabled: shimmer, pulse-ring, crosshair-rotate, fade-in-up, spin, bounce, pulse
- [x] Graceful fallback: static visible state when motion disabled
- [x] Color maintained: shimmer shows muted background color (not animated gradient)

### 17.3 Component Architecture:

#### GalleryLoadingSkeleton (`client/src/components/gallery-loading-skeleton.tsx`):
```typescript
interface GalleryLoadingSkeletonProps {
  columns?: number;  // Responsive grid columns
  variant?: 'grid' | 'list' | 'folders';
  count?: number;    // Number of skeleton items (default: 8)
}
```
- Features shimmer animation on skeleton items
- Staggered animation via CSS animation-delay
- Supports all 3 gallery view modes
- Responsive grid layout matching gallery display

#### PageLoader (`client/src/components/page-loader.tsx`):
```typescript
interface PageLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'fullscreen' | 'inline' | 'overlay' | 'branded';
  className?: string;
  text?: string;  // Optional loading text (branded variant only)
}
```
- **fullscreen**: min-h-screen with centered spinner (default)
- **inline**: Compact inline loader (p-4 padding)
- **overlay**: Positioned absolute with semi-transparent background
- **branded**: Crosshair icon with dual pulsing rings + bouncing dots

#### BrandedLoader (`client/src/components/page-loader.tsx`):
- Standalone branded loader component
- Size variants: sm, md, lg
- Crosshair icon with rotating animation (8s linear)
- Dual pulsing rings: outer (scale 0.9→1.4) and inner (scale 0.8→1.2)
- Optional text label below animation

#### AnimatedSection Components (`client/src/components/animated-section.tsx`):
```typescript
export const AnimatedSection: React.FC<AnimatedSectionProps>
export const AnimatedContainer: React.FC<AnimatedContainerProps>
export const AnimatedItem: React.FC<AnimatedContainerProps>
```
- **AnimatedSection**: Single element fade-in + slide-up with delay control
- **AnimatedContainer**: Parent wrapper with staggered children animation
- **AnimatedItem**: Child element in container with individual animation
- All use Framer Motion with `useReducedMotion()` hook
- Spring-based motion: stiffness=400, damping=30 (default mode)
- Reduced motion: simple opacity transition (duration=0.2s)

### 17.4 CSS Animations in index.css:

#### Shimmer Effect:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--card)) 0%,
    hsl(var(--muted)) 50%,
    hsl(var(--card)) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}
```

#### Pulsing Ring Animations:
```css
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.3; }
  100% { transform: scale(0.8); opacity: 0.8; }
}

@keyframes pulse-ring-outer {
  0% { transform: scale(0.9); opacity: 0.5; }
  50% { transform: scale(1.4); opacity: 0; }
  100% { transform: scale(0.9); opacity: 0.5; }
}
```

#### Crosshair Rotation:
```css
@keyframes crosshair-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-crosshair-rotate {
  animation: crosshair-rotate 8s linear infinite;
}
```

#### Prefers-Reduced-Motion Media Query:
```css
@media (prefers-reduced-motion: reduce) {
  .shimmer { animation: none; background: hsl(var(--muted)); }
  .animate-pulse-ring, .animate-pulse-ring-outer { animation: none; }
  .animate-crosshair-rotate { animation: none; }
  .animate-fade-in-up { animation: none; opacity: 1; transform: none; }
  .animate-spin, .animate-bounce, .animate-pulse { animation: none; }
}
```

### 17.5 Integration Points:

#### Gallery Page (`client/src/pages/gallery/index.tsx`):
- Display `GalleryLoadingSkeleton` during photo loading
- Use correct `columns` and `variant` props based on view mode
- Fade in photos using `AnimatedItem` wrapper
- Proper ARIA attributes on loading container

#### Settings Page (`client/src/pages/settings/index.tsx`):
- Wrap section groups with `AnimatedContainer`
- Wrap individual `CollapsibleCard` sections with `AnimatedItem`
- Staggered reveal of settings sections (0.06s stagger delay)
- Reduced motion hook automatically adjusts animation timing

#### Page Loader Component:
- Used in multiple pages for full-page loading states
- Supports all 4 variants for different contexts
- ARIA attributes properly configured for accessibility
- `sr-only` text provides screen reader context

### 17.6 Testing & Verification Checklist:
- [x] Shimmer effect animates smoothly (1.8s cycle)
- [x] Gallery skeletons appear in staggered sequence
- [x] Crosshair loader spins at correct speed (8s rotation)
- [x] Pulsing rings expand/contract with correct timing (2s cycle)
- [x] Bouncing dots animate with 150ms stagger
- [x] Reduced motion disabled: all animations stop immediately
- [x] ARIA attributes properly announced by screen readers
- [x] No console errors or warnings with animations
- [x] Animations work on all devices (iOS/Android)
- [x] Performance: 60fps animation frame rate maintained
- [x] TypeScript types properly defined for all components

### 17.7 Browser Compatibility:
- [x] CSS animations supported in all modern browsers
- [x] Framer Motion v11+ supported in all targets
- [x] `prefers-reduced-motion` supported in Chrome, Firefox, Safari, Edge
- [x] ARIA attributes supported for accessibility
- [x] Spring animations degrade gracefully on older devices

### 17.8 Performance Considerations:
- Shimmer uses CSS linear-gradient (GPU accelerated)
- Ring animations use transform property (optimized for rendering)
- Skeleton elements use will-change for animation optimization
- Framer Motion animations batched for efficiency
- No layout thrashing during animations
- Staggered delays prevent simultaneous rendering of many elements

---

## 18. Production Readiness Improvements
**Description:** Final polish for production deployment including error tracking, bundle optimization, and security hardening

### 18.1 Sentry Error Tracking:
- [x] Install `@sentry/react` package
- [x] Initialize Sentry in `client/src/main.tsx` with production-only activation
- [x] Configure browser tracing integration for performance monitoring
- [x] Configure session replay (100% on errors, 10% sampling for normal sessions)
- [x] Update ErrorBoundary to capture errors with component stack traces
- [x] Capture unhandled promise rejections and global errors
- [x] Filter out node_modules from stack traces for cleaner reports

**Configuration:**
```typescript
// Environment variable required for activation:
VITE_SENTRY_DSN=https://your-key@sentry.io/project-id

// Sentry is only initialized in production when DSN is provided
if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: "camera-zeroday@1.0.0",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### 18.2 Bundle Size Optimization:
- [x] Remove unused `recharts` package (~150KB potential savings)
- [x] Remove unused `chart.tsx` component file
- [x] Verify lazy loading for all pages (CameraPage, GalleryPage, SettingsPage, etc.)
- [x] Verify tree-shaking for lucide-react (individual icon imports)

**Bundle Analysis (After Optimization):**
| Chunk | Size (gzip) | Contents |
|-------|-------------|----------|
| Main bundle | 497 KB (157 KB) | React, Radix UI, Sentry, Framer Motion, TanStack Query |
| index.css | 86 KB (14 KB) | Tailwind + custom styles |
| game.js | 17 KB (6 KB) | 2048 game component |
| photo-detail.js | 16 KB (5 KB) | Photo detail page |
| collapsible.js | 6 KB (3 KB) | Collapsible component |

### 18.3 Service Worker Enhancements:
- [x] Add version control (`CACHE_VERSION = '1.0.0'`)
- [x] Enhanced precache list: `/`, `/index.html`, `/manifest.json`, `/favicon.png`
- [x] Implement stale-while-revalidate for runtime assets (JS, CSS, fonts, images)
- [x] Improve cache cleanup using version prefix matching

**File:** `client/public/sw.js`

### 18.4 Security Headers:
- [x] Content-Security-Policy with flexible connect-src for webhooks
- [x] X-Frame-Options: DENY (clickjacking protection)
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy: camera, geolocation, accelerometer

**File:** `server/index.ts`

### 18.5 Accessibility Improvements:
- [x] Keyboard capture support for photo taking (Space/Enter keys)
- [x] Proper input field handling (ignores key events when focused)
- [x] Hook ordering fix for handleCapture dependency

**File:** `client/src/pages/camera/index.tsx`

### 18.6 Documentation:
- [x] Create rollback procedure guide (`documents/rollback-procedure.md`)
- [x] Update production audit status (`documents/production-audit.md`)
- [x] Update this upgrade log with production readiness section

### 18.7 Verification Checklist:
- [x] Sentry integration code added and tested
- [x] Bundle builds without errors
- [x] Service worker caches correctly in production
- [x] Security headers present in server responses
- [x] Keyboard shortcuts work on camera page
- [x] Application runs without console errors

### 18.8 Deployment Notes:

**Required Environment Variables:**
```bash
# Optional - Sentry error tracking (production only)
VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
```

**Production Build:**
```bash
npm run build
# Output: dist/public (frontend) + dist/index.cjs (server)
```

**Verification Steps:**
1. Check Sentry dashboard for test errors
2. Verify service worker registration in browser DevTools
3. Confirm security headers in Network tab
4. Test keyboard photo capture (Space/Enter)

---
