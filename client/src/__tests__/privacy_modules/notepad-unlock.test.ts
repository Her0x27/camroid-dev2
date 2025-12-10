import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPhraseChecker } from '@/privacy_modules/notepad/unlock-logic';

describe('Notepad Phrase Unlock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createPhraseChecker', () => {
    it('should trigger unlock when text contains secret phrase', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('this is a secret message');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should not trigger unlock when text does not contain secret phrase', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('this is a normal message');
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
      cleanup();
    });

    it('should be case-sensitive', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('this is a SECRET message');
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
      cleanup();
    });

    it('should trigger unlock when phrase is at the beginning', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('secret at the start');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should trigger unlock when phrase is at the end', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('at the end is secret');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should trigger unlock when phrase is the entire text', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('secret');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  describe('debounce behavior', () => {
    it('should debounce rapid text changes', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('s');
      vi.advanceTimersByTime(100);
      
      check('se');
      vi.advanceTimersByTime(100);
      
      check('sec');
      vi.advanceTimersByTime(100);
      
      check('secr');
      vi.advanceTimersByTime(100);
      
      check('secre');
      vi.advanceTimersByTime(100);
      
      check('secret');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should only trigger once after debounce period', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('hello secret world');
      vi.advanceTimersByTime(200);
      
      check('hello secret world!');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should cancel previous timeout on new input', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('secret');
      vi.advanceTimersByTime(400);
      
      check('nothing here');
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
      cleanup();
    });

    it('should use custom debounce time', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock, 1000);

      check('secret');
      vi.advanceTimersByTime(500);
      expect(onUnlock).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(500);
      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  describe('edge cases', () => {
    it('should not trigger unlock if unlockValue is empty', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('', onUnlock);

      check('any text');
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
      cleanup();
    });

    it('should handle special characters in phrase', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('pass@123!', onUnlock);

      check('my password is pass@123!');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should handle multi-word phrase', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('open sesame', onUnlock);

      check('please open sesame door');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should handle empty text input', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('');
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
      cleanup();
    });

    it('should handle unicode characters', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('секрет', onUnlock);

      check('мой секрет');
      vi.advanceTimersByTime(500);

      expect(onUnlock).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('should cleanup properly', () => {
      const onUnlock = vi.fn();
      const { check, cleanup } = createPhraseChecker('secret', onUnlock);

      check('secret');
      cleanup();
      vi.advanceTimersByTime(500);

      expect(onUnlock).not.toHaveBeenCalled();
    });
  });
});
