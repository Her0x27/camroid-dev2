export function deferToIdle<T>(
  fn: () => Promise<T>,
  timeout: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      fn().then(resolve).catch(reject);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => execute(), { timeout });
    } else {
      setTimeout(execute, 0);
    }
  });
}

export function deferToNextFrame<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        fn().then(resolve).catch(reject);
      }, 0);
    });
  });
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
