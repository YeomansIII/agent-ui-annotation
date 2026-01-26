/**
 * Observable store with subscribe/batch functionality
 */

export type Listener<T> = (state: T) => void;
export type Selector<T, R> = (state: T) => R;
export type Unsubscribe = () => void;

export interface Store<T> {
  /** Get current state */
  getState(): T;
  /** Merge partial state update */
  setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
  /** Subscribe to state changes, optionally filtered by selector */
  subscribe(listener: Listener<T>, selector?: Selector<T, unknown>): Unsubscribe;
  /** Batch multiple state updates into a single notification */
  batch(fn: () => void): void;
  /** Reset state to initial value */
  reset(initialState: T): void;
  /** Destroy store and clean up */
  destroy(): void;
}

/**
 * Create a new observable store
 */
export function createStore<T extends object>(initialState: T): Store<T> {
  let state: T = { ...initialState };
  let listeners: Set<{ listener: Listener<T>; selector?: Selector<T, unknown>; prevSelected?: unknown }> = new Set();
  let isBatching = false;
  let hasChanges = false;
  let isDestroyed = false;

  const notify = () => {
    if (isDestroyed) return;

    listeners.forEach((entry) => {
      try {
        if (entry.selector) {
          const selected = entry.selector(state);
          if (!Object.is(selected, entry.prevSelected)) {
            entry.prevSelected = selected;
            entry.listener(state);
          }
        } else {
          entry.listener(state);
        }
      } catch (error) {
        console.error('[Annotation Store] Listener error:', error);
      }
    });
  };

  const getState = (): T => {
    return state;
  };

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)): void => {
    if (isDestroyed) return;

    const nextPartial = typeof partial === 'function' ? partial(state) : partial;
    const nextState = { ...state, ...nextPartial };

    // Check if state actually changed
    const hasActualChanges = Object.keys(nextPartial).some(
      (key) => !Object.is(state[key as keyof T], nextState[key as keyof T])
    );

    if (!hasActualChanges) return;

    state = nextState;

    if (isBatching) {
      hasChanges = true;
    } else {
      notify();
    }
  };

  const subscribe = (listener: Listener<T>, selector?: Selector<T, unknown>): Unsubscribe => {
    if (isDestroyed) return () => {};

    const entry = {
      listener,
      selector,
      prevSelected: selector ? selector(state) : undefined,
    };

    listeners.add(entry);

    return () => {
      listeners.delete(entry);
    };
  };

  const batch = (fn: () => void): void => {
    if (isDestroyed) return;

    isBatching = true;
    hasChanges = false;

    try {
      fn();
    } finally {
      isBatching = false;
      if (hasChanges) {
        notify();
      }
    }
  };

  const reset = (newInitialState: T): void => {
    if (isDestroyed) return;
    state = { ...newInitialState };
    notify();
  };

  const destroy = (): void => {
    isDestroyed = true;
    listeners.clear();
  };

  return {
    getState,
    setState,
    subscribe,
    batch,
    reset,
    destroy,
  };
}

/**
 * Create a derived store that computes values from another store
 */
export function createDerivedStore<T extends object, R>(
  sourceStore: Store<T>,
  selector: Selector<T, R>
): { getValue: () => R; subscribe: (listener: (value: R) => void) => Unsubscribe } {
  let currentValue = selector(sourceStore.getState());

  return {
    getValue: () => currentValue,
    subscribe: (listener: (value: R) => void) => {
      return sourceStore.subscribe((state) => {
        const newValue = selector(state);
        if (!Object.is(newValue, currentValue)) {
          currentValue = newValue;
          listener(newValue);
        }
      });
    },
  };
}
