/**
 * Throttle utility - limits function execution rate
 */

export type ThrottledFunction<T extends (...args: never[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * Creates a throttled function that only invokes `fn` at most once per `wait` milliseconds
 */
export function throttle<T extends (...args: never[]) => unknown>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;

  const invoke = (time: number) => {
    lastInvokeTime = time;
    const args = lastArgs!;
    lastArgs = null;
    fn(...args);
  };

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = lastCallTime !== null ? time - lastCallTime : 0;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    );
  };

  const remainingWait = (time: number): number => {
    const timeSinceLastCall = lastCallTime !== null ? time - lastCallTime : 0;
    const timeWaiting = wait - timeSinceLastCall;

    return Math.max(0, timeWaiting);
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeoutId = null;
    if (trailing && lastArgs) {
      invoke(time);
    }
    lastArgs = null;
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = null;
    timeoutId = null;
  };

  const flush = () => {
    if (timeoutId !== null) {
      trailingEdge(Date.now());
    }
  };

  const throttled = (...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        // First call or after wait period
        if (leading) {
          invoke(time);
        }
        timeoutId = setTimeout(timerExpired, wait);
      }
    }
  };

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled;
}

/**
 * Creates a debounced function that delays invoking `fn` until after `wait` ms
 * have elapsed since the last time it was invoked
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait: number,
  options: { leading?: boolean; maxWait?: number } = {}
): ThrottledFunction<T> {
  const { leading = false, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const invoke = () => {
    const args = lastArgs!;
    lastArgs = null;
    fn(...args);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastArgs = null;
    lastCallTime = null;
  };

  const flush = () => {
    if (timeoutId !== null && lastArgs) {
      invoke();
      cancel();
    }
  };

  const debounced = (...args: Parameters<T>) => {
    const time = Date.now();
    const isLeading = leading && lastCallTime === null;

    lastArgs = args;
    lastCallTime = time;

    if (isLeading) {
      invoke();
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (!leading || lastArgs) {
        invoke();
      }
      cancel();
    }, wait);

    // Set up max wait timeout if specified
    if (maxWait !== undefined && maxTimeoutId === null) {
      maxTimeoutId = setTimeout(() => {
        if (lastArgs) {
          invoke();
        }
        cancel();
      }, maxWait);
    }
  };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
