export const TIMING = {
  TAP_TIMEOUT_MS: 1000,
  PATTERN_TAP_TIMEOUT_MS: 800,
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 300,
  PATTERN_CLEAR_DELAY_MS: 300,
} as const;

export const GESTURE = {
  MIN_PATTERN_LENGTH: 4,
  MIN_SWIPE_DISTANCE_PX: 30,
  QUICK_TAP_COUNT: 4,
  PATTERN_UNLOCK_TAP_COUNT: 5,
} as const;

export const GAME = {
  GRID_SIZE: 4,
  WINNING_TILE: 2048,
  NEW_TILE_PROBABILITY_2: 0.9,
} as const;

export const UPLOAD = {
  CONCURRENT_UPLOADS: 3,
  DEFAULT_EXPIRATION: 0,
} as const;

export const STORAGE_KEYS = {
  SETTINGS: "tactical-camera-settings",
  GAME_BEST_SCORE: "game2048-best",
  PRIVACY_SETTINGS: "tactical-camera-privacy",
  LANGUAGE: "tactical-camera-language",
} as const;

export const PATTERN_LOCK = {
  GRID_SIZE: 3,
  DEFAULT_SIZE: 240,
  DEFAULT_DOT_SIZE: 20,
  HIT_RADIUS_MULTIPLIER: 0.4,
} as const;

export const IMAGE = {
  JPEG_QUALITY_HIGH: 0.92,
  JPEG_QUALITY_MEDIUM: 0.8,
  JPEG_QUALITY_LOW: 0.7,
  THUMBNAIL_SIZE: 300,
  NOTE_HISTORY_LIMIT: 100,
  CONTRAST_CENTER: 128,
  MAX_OPACITY_OFFSET: 200,
} as const;

export const SENSORS = {
  ORIENTATION_THROTTLE_MS: 100,
  HEADING_THRESHOLD_DEG: 2,
  TILT_THRESHOLD_DEG: 3,
  ROLL_THRESHOLD_DEG: 3,
  POSITION_THRESHOLD_METERS: 3,
  ALTITUDE_THRESHOLD_METERS: 2,
  GPS_ACCURACY_THRESHOLD_METERS: 100,
  GPS_TIMEOUT_MS: 30000,
  GPS_MAXIMUM_AGE_MS: 0,
  EARTH_RADIUS_METERS: 6371000,
} as const;

export const CAMERA = {
  COLOR_SAMPLE_INTERVAL_MS: 100,
  COLOR_SAMPLE_MAX_SIZE: 100,
  STABILITY_THRESHOLD: 0.5,
  STABILITY_SAMPLES: 5,
  VELOCITY_THRESHOLD: 0.3,
  STABILITY_CHECK_INTERVAL_MS: 100,
} as const;

export const GALLERY = {
  /** Minimum dimension for gallery list item */
  LIST_ITEM_HEIGHT: 80,
  /** Gap between grid items in pixels */
  GRID_GAP_PX: 8,
  /** Minimum cell size for grid in pixels */
  MIN_CELL_SIZE_PX: 120,
  /** Width of scrollbar for calculation */
  SCROLLBAR_WIDTH_PX: 17,
  /** Initial photos to load per page */
  INITIAL_PAGE_SIZE: 50,
  /** Photos to load on infinite scroll */
  PAGE_SIZE: 50,
  /** Pagination offset threshold for loading more */
  LOAD_MORE_THRESHOLD: 5,
  /** Maximum safe photo selection */
  MAX_SELECTION_SIZE: 1000,
} as const;

export const UI = {
  /** Default card width for modals */
  MODAL_CARD_WIDTH_PX: 320,
  /** Overlay z-index for modals and progress */
  OVERLAY_Z_INDEX: 50,
  /** Focus ring width */
  FOCUS_RING_WIDTH: 2,
} as const;
