export interface PhraseChecker {
  check: (text: string) => void;
  cleanup: () => void;
}

export function createPhraseChecker(
  unlockValue: string,
  onUnlock: () => void,
  debounceMs: number = 500
): PhraseChecker {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const check = (text: string): void => {
    if (!unlockValue || !onUnlock) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (text.includes(unlockValue)) {
        onUnlock();
      }
    }, debounceMs);
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { check, cleanup };
}
