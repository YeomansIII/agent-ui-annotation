/**
 * Store tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../../src/core/store';

describe('createStore', () => {
  it('should create store with initial state', () => {
    const initialState = { count: 0, name: 'test' };
    const store = createStore(initialState);

    expect(store.getState()).toEqual(initialState);
  });

  it('should update state with partial', () => {
    const store = createStore({ count: 0, name: 'test' });

    store.setState({ count: 5 });

    expect(store.getState().count).toBe(5);
    expect(store.getState().name).toBe('test');
  });

  it('should update state with function', () => {
    const store = createStore({ count: 0 });

    store.setState((state) => ({ count: state.count + 1 }));

    expect(store.getState().count).toBe(1);
  });

  it('should notify listeners on state change', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ count: 1 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it('should unsubscribe listeners', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not notify if state did not change', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ count: 0 }); // Same value

    expect(listener).not.toHaveBeenCalled();
  });

  it('should batch multiple updates into single notification', () => {
    const store = createStore({ count: 0, name: 'test' });
    const listener = vi.fn();

    store.subscribe(listener);

    store.batch(() => {
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ name: 'updated' });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({ count: 2, name: 'updated' });
  });

  it('should filter notifications with selector', () => {
    const store = createStore({ count: 0, name: 'test' });
    const listener = vi.fn();

    store.subscribe(listener, (state) => state.count);

    store.setState({ name: 'changed' }); // Should not notify
    expect(listener).not.toHaveBeenCalled();

    store.setState({ count: 1 }); // Should notify
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should reset state', () => {
    const store = createStore({ count: 5, name: 'test' });

    store.reset({ count: 0, name: 'reset' });

    expect(store.getState()).toEqual({ count: 0, name: 'reset' });
  });

  it('should stop notifying after destroy', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();

    store.subscribe(listener);
    store.destroy();
    store.setState({ count: 1 });

    expect(listener).not.toHaveBeenCalled();
  });
});
