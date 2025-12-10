export interface SequenceChecker {
  check: (char: string) => boolean;
  reset: () => void;
  getSequence: () => string;
}

export function createSequenceChecker(
  unlockValue: string,
  timeout: number = 3000
): SequenceChecker {
  let inputSequence = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    inputSequence = '';
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const check = (newChar: string): boolean => {
    if (!unlockValue) return false;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    inputSequence += newChar;

    if (inputSequence === unlockValue) {
      reset();
      return true;
    }

    if (!unlockValue.startsWith(inputSequence)) {
      inputSequence = newChar;
      if (!unlockValue.startsWith(inputSequence)) {
        inputSequence = '';
      }
    }

    timeoutId = setTimeout(() => {
      inputSequence = '';
    }, timeout);

    return false;
  };

  const getSequence = () => inputSequence;

  return { check, reset, getSequence };
}
