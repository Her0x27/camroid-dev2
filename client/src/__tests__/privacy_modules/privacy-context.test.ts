import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configToSettings, loadPrivacySettings } from '@/lib/privacy-context';
import type { DynamicConfig } from '@/lib/config-loader';

vi.mock('@/lib/config-loader', () => ({
  getConfig: vi.fn(),
  initConfig: vi.fn().mockResolvedValue(undefined),
  subscribeToConfig: vi.fn().mockReturnValue(() => {}),
  updateConfig: vi.fn(),
  isBackendAvailable: vi.fn().mockReturnValue(false),
}));

import { getConfig } from '@/lib/config-loader';

const defaultConfig: DynamicConfig = {
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
  ALLOWED_PROXY_HOSTS: [],
};

describe('Privacy Context Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConfig).mockReturnValue(defaultConfig);
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('configToSettings()', () => {
    it('should convert config to settings correctly', () => {
      const result = configToSettings(defaultConfig);

      expect(result.enabled).toBe(false);
      expect(result.gestureType).toBe('severalFingers');
      expect(result.autoLockMinutes).toBe(5);
      expect(result.secretPattern).toBe('0-4-8-5');
      expect(result.unlockFingers).toBe(4);
      expect(result.selectedModule).toBe('game-2048');
      expect(result.moduleUnlockValues).toEqual({
        'calculator': '123456=',
        'notepad': 'secret',
        'game-2048': '',
      });
    });

    it('should create a copy of moduleUnlockValues', () => {
      const result = configToSettings(defaultConfig);
      
      result.moduleUnlockValues['calculator'] = 'modified';
      
      expect(defaultConfig.MODULE_UNLOCK_VALUES['calculator']).toBe('123456=');
    });

    it('should handle patternUnlock gesture type', () => {
      const config: DynamicConfig = {
        ...defaultConfig,
        UNLOCK_GESTURE: 'patternUnlock',
      };

      const result = configToSettings(config);

      expect(result.gestureType).toBe('patternUnlock');
    });

    it('should handle privacy mode enabled', () => {
      const config: DynamicConfig = {
        ...defaultConfig,
        PRIVACY_MODE: true,
      };

      const result = configToSettings(config);

      expect(result.enabled).toBe(true);
    });
  });

  describe('loadPrivacySettings()', () => {
    it('should return default settings when no localStorage data', () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(null);
      
      const result = loadPrivacySettings();

      expect(result.enabled).toBe(false);
      expect(result.selectedModule).toBe('game-2048');
    });

    it('should force enabled=true when PRIVACY_MODE is true in config', () => {
      vi.mocked(getConfig).mockReturnValue({
        ...defaultConfig,
        PRIVACY_MODE: true,
      });
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify({ enabled: false }));
      
      const result = loadPrivacySettings();

      expect(result.enabled).toBe(true);
    });

    it('should merge localStorage data with default settings', () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify({
        selectedModule: 'calculator',
        autoLockMinutes: 10,
      }));
      
      const result = loadPrivacySettings();

      expect(result.selectedModule).toBe('calculator');
      expect(result.autoLockMinutes).toBe(10);
      expect(result.gestureType).toBe('severalFingers');
    });

    it('should merge moduleUnlockValues from localStorage', () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify({
        moduleUnlockValues: {
          'calculator': '999999=',
        },
      }));
      
      const result = loadPrivacySettings();

      expect(result.moduleUnlockValues['calculator']).toBe('999999=');
      expect(result.moduleUnlockValues['notepad']).toBe('secret');
    });

    it('should return default settings on invalid JSON', () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue('invalid json {{{');
      
      const result = loadPrivacySettings();

      expect(result.selectedModule).toBe('game-2048');
      expect(result.enabled).toBe(false);
    });

    it('should handle empty localStorage object', () => {
      vi.mocked(window.localStorage.getItem).mockReturnValue(JSON.stringify({}));
      
      const result = loadPrivacySettings();

      expect(result.selectedModule).toBe('game-2048');
      expect(result.autoLockMinutes).toBe(5);
    });
  });

  describe('settings validation', () => {
    it('should handle all unlock fingers values (3-9)', () => {
      [3, 4, 5, 6, 7, 8, 9].forEach(fingers => {
        const config: DynamicConfig = {
          ...defaultConfig,
          UNLOCK_FINGERS: fingers,
        };
        
        const result = configToSettings(config);
        expect(result.unlockFingers).toBe(fingers);
      });
    });

    it('should handle zero auto-lock minutes (disabled)', () => {
      const config: DynamicConfig = {
        ...defaultConfig,
        AUTO_LOCK_MINUTES: 0,
      };
      
      const result = configToSettings(config);
      expect(result.autoLockMinutes).toBe(0);
    });

    it('should handle complex unlock patterns', () => {
      const patterns = ['0-4-8', '0-1-2-5-8-7-6-3', '4'];
      
      patterns.forEach(pattern => {
        const config: DynamicConfig = {
          ...defaultConfig,
          UNLOCK_PATTERN: pattern,
        };
        
        const result = configToSettings(config);
        expect(result.secretPattern).toBe(pattern);
      });
    });
  });
});
