# Architecture Documentation

This document describes the key architectural patterns and conventions used in this project.

---

## 1. UI Component Patterns

### 1.1 Radix UI / shadcn/ui Components

All UI components in `client/src/components/ui/` follow the shadcn/ui pattern:

```typescript
const Component = React.forwardRef<ElementType, ComponentProps>(
  ({ className, ...props }, ref) => (
    <RadixPrimitive
      ref={ref}
      className={cn(baseStyles, className)}
      {...props}
    />
  )
);
Component.displayName = "ComponentName";
```

**Key conventions:**
- Use `forwardRef` for ref forwarding
- Use `cn()` from `@/lib/utils` for merging class names
- Always set `displayName` for better debugging
- Import shared styles from `@/components/ui/styles.ts`

### 1.2 Shared Overlay Styles

Common dialog/sheet overlay styles are centralized in `client/src/components/ui/styles.ts`:

```typescript
import { overlayStyles, dialogContentStyles, dialogCloseButtonStyles } from "@/components/ui/styles";
```

Used in: `alert-dialog.tsx`, `dialog.tsx`, `sheet.tsx`

### 1.3 Settings Components

For settings pages, use reusable components:

- `SettingRow` - Label with optional icon and Switch/custom control
- `SettingSlider` - Label with integrated slider and value display

```tsx
import { SettingRow } from "@/components/ui/setting-row";
import { SettingSlider } from "@/components/ui/setting-slider";

<SettingRow
  id="sound-enabled"
  icon={<Volume2 className="h-4 w-4" />}
  label="Enable Sound"
  checked={settings.soundEnabled}
  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
/>

<SettingSlider
  icon={<Maximize2 className="h-4 w-4" />}
  label="Size"
  value={settings.size}
  onValueChange={(value) => updateSettings({ size: value })}
  min={1}
  max={100}
  unit="%"
/>
```

---

## 2. Custom Hooks Architecture

### 2.1 Touch Tracking (Base Hook)

`useTouchTracking` provides shared logic for touch/mouse gesture handling:

```typescript
import { useTouchTracking } from "@/hooks/use-touch-tracking";

const { handleStart, handleMove, handleEnd, handleCancel, wasLongPress } = useTouchTracking({
  onLongPress: () => console.log("Long press!"),
  longPressDelay: LONG_PRESS.DEFAULT_DELAY_MS,
  moveThreshold: LONG_PRESS.DEFAULT_MOVE_THRESHOLD_PX,
});
```

Used by: `useGestures`, `useLongPress`

### 2.2 Color Sampling

`useColorSampling` automatically determines contrasting reticle color:

```typescript
import { useColorSampling } from "@/hooks/use-color-sampling";

const reticleColor = useColorSampling({
  videoRef,
  enabled: isReady && settings.reticle.enabled,
  autoColor: settings.reticle.autoColor,
  reticleSize: settings.reticle.size,
  colorScheme: settings.reticle.colorScheme || "tactical",
});
```

### 2.3 Gallery Hooks

The gallery page uses specialized hooks for better separation:

- `useGallerySelection` - Selection management
- `useGalleryView` - View mode and folder navigation
- `useGalleryFilters` - Filtering and sorting
- `useGalleryPhotos` - Photo loading and pagination
- `useUploadHandler` - Cloud upload logic
- `useLinksDialog` - Links dialog state

---

## 3. Database Layer

### 3.1 Service Architecture

Database operations are organized into specialized services in `client/src/lib/db/`:

```
db/
├── db-core.ts        # Low-level IndexedDB operations, caching
├── photo-service.ts  # Photo CRUD operations
├── folder-service.ts # Folder operations and statistics
├── settings-service.ts # Settings persistence
├── storage-service.ts  # Storage utilities
└── index.ts          # Re-exports all functions
```

### 3.2 Folder Counts Cache

Folder statistics use a simple invalidation-based cache:

```typescript
// Cache is automatically invalidated on photo save/delete
invalidateFolderCountsCache();
```

Cache TTL: 30 seconds (configurable in `db-core.ts`)

---

## 4. Constants

All magic numbers are centralized in `client/src/lib/constants.ts`:

```typescript
import { LONG_PRESS, CAMERA, GESTURE, TIMING } from "@/lib/constants";

// Examples:
LONG_PRESS.DEFAULT_DELAY_MS      // 500
LONG_PRESS.DEFAULT_MOVE_THRESHOLD_PX  // 10
CAMERA.DEFAULT_RETICLE_SIZE      // 30
GESTURE.DEFAULT_SWIPE_THRESHOLD_PX   // 50
```

---

## 5. Performance Patterns

### 5.1 Memoization

- Use `useCallback` for event handlers in memoized components
- Use `useMemo` for expensive computations and config objects
- Wrap components with `React.memo` when appropriate

### 5.2 Parallel Operations

Use `Promise.all` for independent async operations:

```typescript
const [counts, latest] = await Promise.all([
  getPhotoCounts(),
  getLatestPhoto(),
]);
```

### 5.3 Virtualization

Gallery uses `react-window` for virtualized rendering:

- `VirtualizedPhotoList` - List view with virtualized rows
- `VirtualizedPhotoGrid` - Grid view with virtualized cells

---

## 6. State Management

### 6.1 Settings Context

Global settings are managed via `SettingsContext`:

```typescript
const { settings, updateSettings, updateReticle } = useSettings();
```

Settings are debounced before saving to IndexedDB.

### 6.2 Camera Page State

CameraPage uses inline state management with:
- `useState` for capture/processing states
- `useMemo` for captureConfig grouping
- `useColorSampling` for automatic reticle color

---

## 7. Code Organization

### 7.1 File Size Guidelines

- Keep components under 400 lines
- Extract hooks for complex logic
- Split large components into sub-components

### 7.2 Component Structure

```
pages/
└── camera/
    ├── index.tsx          # Main page component (~350 lines)
    └── components/
        ├── index.ts       # Re-exports
        ├── CameraControls.tsx
        ├── CameraViewfinder.tsx
        └── PhotoNoteDialog.tsx
```

### 7.3 Virtualized Gallery Structure

```
components/
└── virtualized-gallery/
    ├── index.ts              # Re-exports
    ├── types.ts              # Shared interfaces
    ├── VirtualizedList.tsx   # List view components
    ├── VirtualizedGrid.tsx   # Grid view components
    └── AutoSizerContainer.tsx
```
