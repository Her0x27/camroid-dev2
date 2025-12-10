import { describe, it, expect, beforeEach } from 'vitest';
import { privacyModuleRegistry, PrivacyModuleRegistry } from '@/privacy_modules/registry';
import type { PrivacyModuleConfig } from '@/privacy_modules/types';

const createMockConfig = (id: string, title: string): PrivacyModuleConfig => ({
  id,
  title,
  favicon: `/favicon-${id}.svg`,
  icon: () => null,
  component: {} as any,
  unlockMethod: {
    type: 'sequence',
    defaultValue: '123=',
    labelKey: 'testLabel',
  },
  supportsUniversalUnlock: true,
});

describe('PrivacyModuleRegistry', () => {
  let registry: PrivacyModuleRegistry;

  beforeEach(() => {
    registry = new PrivacyModuleRegistry();
  });

  describe('register()', () => {
    it('should register a new module', () => {
      const config = createMockConfig('calculator', 'Calculator');
      registry.register(config);
      
      expect(registry.has('calculator')).toBe(true);
    });

    it('should override existing module with same id', () => {
      const config1 = createMockConfig('calculator', 'Calculator v1');
      const config2 = createMockConfig('calculator', 'Calculator v2');
      
      registry.register(config1);
      registry.register(config2);
      
      expect(registry.get('calculator')?.title).toBe('Calculator v2');
    });

    it('should register multiple modules', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      registry.register(createMockConfig('notepad', 'Notepad'));
      registry.register(createMockConfig('game-2048', '2048'));
      
      expect(registry.getAll()).toHaveLength(3);
    });
  });

  describe('get()', () => {
    it('should return module by id', () => {
      const config = createMockConfig('calculator', 'Calculator');
      registry.register(config);
      
      const result = registry.get('calculator');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('calculator');
      expect(result?.title).toBe('Calculator');
    });

    it('should return undefined for non-existent id', () => {
      const result = registry.get('non-existent');
      
      expect(result).toBeUndefined();
    });
  });

  describe('getDefault()', () => {
    it('should return default module (game-2048)', () => {
      registry.register(createMockConfig('game-2048', '2048'));
      registry.register(createMockConfig('calculator', 'Calculator'));
      
      const result = registry.getDefault();
      
      expect(result?.id).toBe('game-2048');
    });

    it('should return undefined if default module not registered', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      
      const result = registry.getDefault();
      
      expect(result).toBeUndefined();
    });
  });

  describe('getAll()', () => {
    it('should return empty array when no modules registered', () => {
      const result = registry.getAll();
      
      expect(result).toEqual([]);
    });

    it('should return all registered modules', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      registry.register(createMockConfig('notepad', 'Notepad'));
      
      const result = registry.getAll();
      
      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toContain('calculator');
      expect(result.map(m => m.id)).toContain('notepad');
    });
  });

  describe('has()', () => {
    it('should return true for registered module', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      
      expect(registry.has('calculator')).toBe(true);
    });

    it('should return false for non-registered module', () => {
      expect(registry.has('calculator')).toBe(false);
    });
  });

  describe('setDefaultId()', () => {
    it('should change default module when id exists', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      registry.register(createMockConfig('notepad', 'Notepad'));
      
      registry.setDefaultId('notepad');
      
      expect(registry.getDefault()?.id).toBe('notepad');
    });

    it('should not change default module when id does not exist', () => {
      registry.register(createMockConfig('game-2048', '2048'));
      
      registry.setDefaultId('non-existent');
      
      expect(registry.getDefault()?.id).toBe('game-2048');
    });
  });

  describe('clear()', () => {
    it('should remove all registered modules', () => {
      registry.register(createMockConfig('calculator', 'Calculator'));
      registry.register(createMockConfig('notepad', 'Notepad'));
      
      registry.clear();
      
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should reset default id to game-2048', () => {
      registry.register(createMockConfig('notepad', 'Notepad'));
      registry.setDefaultId('notepad');
      registry.clear();
      registry.register(createMockConfig('game-2048', '2048'));
      
      expect(registry.getDefault()?.id).toBe('game-2048');
    });
  });
});

describe('privacyModuleRegistry singleton', () => {
  it('should be an instance of PrivacyModuleRegistry', () => {
    expect(privacyModuleRegistry).toBeInstanceOf(PrivacyModuleRegistry);
  });

  it('should export the same singleton instance', async () => {
    const { privacyModuleRegistry: registry2 } = await import('@/privacy_modules/registry');
    expect(registry2).toBe(privacyModuleRegistry);
  });
});
