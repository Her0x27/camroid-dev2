# Upgrade Checklist - Camera App

## Tasks

### 1. Sound Settings
- [ ] Change default value of `soundEnabled` to `false` in `shared/schema.ts`

### 2. Custom Reticle Position (Long Press to Shoot)
- [ ] Add reticle position settings to schema (`tapToPosition: {enabled, x, y}`)
- [ ] Add i18n translations for new reticle settings (en.ts and ru.ts)
- [ ] Create `useLongPress` hook for handling long press on camera screen
- [ ] Update `CameraViewfinder` component:
  - [ ] Add touch event handlers for long press
  - [ ] Pass position to Reticle component
  - [ ] Trigger capture on long press complete
- [ ] Update `Reticle` component to display at custom position
- [ ] Update `watermark-renderer.ts` to draw reticle at selected position on photo
- [ ] Add settings UI in `ReticleSection` for tap-to-position feature

### 3. Final Testing
- [ ] Test normal capture (button press) - reticle stays in center
- [ ] Test long press capture - reticle moves and photo is taken
- [ ] Verify reticle is drawn correctly on saved photos
- [ ] Test settings toggle for the feature

## Behavior Description

### Normal Mode (Button Press)
- Reticle displays in the center of the screen
- Photo is taken with reticle in center

### Long Press Mode
- User holds finger on camera screen
- Reticle moves to the touch position
- After hold threshold (~500ms), photo is taken with reticle at that position
- Reticle returns to center after capture

## Technical Notes

- Position stored as percentage (0-100) of viewport dimensions
- Default position: center (50, 50)
- Long press threshold: 500ms
- Both modes work independently - normal capture always uses center
