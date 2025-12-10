import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSequenceChecker } from '@/privacy_modules/calculator/unlock-logic';

describe('Calculator Sequence Unlock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createSequenceChecker', () => {
    it('should return true on correct sequence', () => {
      const checker = createSequenceChecker('123=');

      expect(checker.check('1')).toBe(false);
      expect(checker.check('2')).toBe(false);
      expect(checker.check('3')).toBe(false);
      expect(checker.check('=')).toBe(true);
    });

    it('should return false on partial sequence', () => {
      const checker = createSequenceChecker('123=');

      checker.check('1');
      checker.check('2');
      checker.check('3');

      expect(checker.getSequence()).toBe('123');
    });

    it('should return false on wrong sequence', () => {
      const checker = createSequenceChecker('123=');

      expect(checker.check('9')).toBe(false);
      expect(checker.check('8')).toBe(false);
      expect(checker.check('7')).toBe(false);
      expect(checker.check('=')).toBe(false);
    });

    it('should reset sequence on mismatch', () => {
      const checker = createSequenceChecker('123=');

      checker.check('1');
      checker.check('9');
      
      expect(checker.getSequence()).toBe('');
    });

    it('should restart sequence if new char matches start', () => {
      const checker = createSequenceChecker('123=');

      checker.check('1');
      checker.check('2');
      checker.check('1');
      
      expect(checker.getSequence()).toBe('1');
    });

    it('should handle complex sequence 123456=', () => {
      const checker = createSequenceChecker('123456=');

      '12345'.split('').forEach(char => {
        expect(checker.check(char)).toBe(false);
      });
      expect(checker.check('6')).toBe(false);
      expect(checker.check('=')).toBe(true);
    });

    it('should handle operations in sequence', () => {
      const checker = createSequenceChecker('1+2=');

      expect(checker.check('1')).toBe(false);
      expect(checker.check('+')).toBe(false);
      expect(checker.check('2')).toBe(false);
      expect(checker.check('=')).toBe(true);
    });

    it('should reset sequence after successful unlock', () => {
      const checker = createSequenceChecker('12=');

      checker.check('1');
      checker.check('2');
      const result = checker.check('=');

      expect(result).toBe(true);
      expect(checker.getSequence()).toBe('');
    });
  });

  describe('timeout behavior', () => {
    it('should reset sequence after timeout', () => {
      const checker = createSequenceChecker('123=', 3000);

      checker.check('1');
      checker.check('2');
      
      expect(checker.getSequence()).toBe('12');

      vi.advanceTimersByTime(3000);
      
      expect(checker.getSequence()).toBe('');
    });

    it('should extend timeout on new input', () => {
      const checker = createSequenceChecker('123=', 3000);

      checker.check('1');
      vi.advanceTimersByTime(2000);
      
      checker.check('2');
      vi.advanceTimersByTime(2000);
      
      expect(checker.getSequence()).toBe('12');

      vi.advanceTimersByTime(1500);
      expect(checker.getSequence()).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should return false if unlockValue is empty', () => {
      const checker = createSequenceChecker('');

      expect(checker.check('1')).toBe(false);
      expect(checker.check('=')).toBe(false);
    });

    it('should handle single character unlock value', () => {
      const checker = createSequenceChecker('=');

      expect(checker.check('=')).toBe(true);
    });

    it('should allow manual reset', () => {
      const checker = createSequenceChecker('123=');

      checker.check('1');
      checker.check('2');
      checker.reset();

      expect(checker.getSequence()).toBe('');
    });
  });
});
