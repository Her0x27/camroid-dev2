import { vi } from 'vitest';

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock('@/lib/config-loader', () => ({
  getConfig: () => ({
    PRIVACY_MODE: false,
    UNLOCK_GESTURE: 'severalFingers',
    AUTO_LOCK_MINUTES: 5,
    UNLOCK_PATTERN: '0-4-8-5',
    UNLOCK_FINGERS: 4,
    SELECTED_MODULE: 'game-2048',
    MODULE_UNLOCK_VALUES: {
      'calculator': '123456=',
      'notepad': 'secret',
      'game-2048': '',
    },
    DEBUG_MODE: false,
  }),
  initConfig: vi.fn().mockResolvedValue(undefined),
  subscribeToConfig: vi.fn().mockReturnValue(() => {}),
  updateConfig: vi.fn(),
  isBackendAvailable: vi.fn().mockReturnValue(false),
}));
