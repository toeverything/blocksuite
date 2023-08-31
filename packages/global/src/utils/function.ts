export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function noop(_?: unknown) {
  return;
}

/**
 * @example
 * ```ts
 * const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);
 *
 * const throttledLog = throttle(log, 1000);
 *
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * throttledLog("Hello, world!");
 * ```
 */
export function throttle<
  Args extends unknown[],
  T extends (...args: Args) => void,
>(
  fn: (...args: Args) => void,
  limit: number,
  options?: { leading?: boolean; trailing?: boolean }
): T;
export function throttle<
  Args extends unknown[],
  T extends (this: unknown, ...args: Args) => void,
>(fn: T, limit: number, { leading = true, trailing = true } = {}): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;

  const setTimer = () => {
    if (lastArgs && trailing) {
      fn(...lastArgs);
      lastArgs = null;
      timer = setTimeout(setTimer, limit);
    } else {
      timer = null;
    }
  };

  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) {
      // in throttle
      lastArgs = args;
      return;
    }
    // Execute the function on the leading edge
    if (leading) {
      fn.apply(this, args);
    }
    timer = setTimeout(setTimer, limit);
  } as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
  { leading = true, trailing = true } = {}
): T => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const setTimer = () => {
    if (lastArgs && trailing) {
      fn(...lastArgs);
      lastArgs = null;
      timer = setTimeout(setTimer, limit);
    } else {
      timer = null;
    }
  };

  return function (...args: Parameters<T>) {
    if (timer) {
      lastArgs = args;
      clearTimeout(timer);
    }
    if (leading && !timer) {
      fn(...args);
    }
    timer = setTimeout(setTimer, limit);
  } as T;
};
