/**
 * Typed event emitter for cross-component communication
 */

import type { EventMap } from './types';

export type EventHandler<T> = (payload: T) => void;
export type Unsubscribe = () => void;

export interface EventBus<Events extends Record<string, unknown>> {
  /** Emit an event with payload */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  /** Subscribe to an event */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe;
  /** Subscribe to an event, automatically unsubscribe after first emission */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe;
  /** Remove all listeners for an event, or all listeners if no event specified */
  off<K extends keyof Events>(event?: K): void;
  /** Destroy the event bus */
  destroy(): void;
}

/**
 * Create a typed event bus
 */
export function createEventBus<Events extends Record<string, unknown> = EventMap>(): EventBus<Events> {
  type HandlerMap = Map<keyof Events, Set<EventHandler<unknown>>>;

  let handlers: HandlerMap = new Map();
  let isDestroyed = false;

  const emit = <K extends keyof Events>(event: K, payload: Events[K]): void => {
    if (isDestroyed) return;

    const eventHandlers = handlers.get(event);
    if (!eventHandlers) return;

    // Create a copy to avoid issues with handlers that unsubscribe themselves
    const handlersCopy = Array.from(eventHandlers);

    handlersCopy.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[Annotation EventBus] Error in handler for "${String(event)}":`, error);
      }
    });
  };

  const on = <K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe => {
    if (isDestroyed) return () => {};

    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }

    const eventHandlers = handlers.get(event)!;
    eventHandlers.add(handler as EventHandler<unknown>);

    return () => {
      eventHandlers.delete(handler as EventHandler<unknown>);
      if (eventHandlers.size === 0) {
        handlers.delete(event);
      }
    };
  };

  const once = <K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe => {
    const unsubscribe = on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  };

  const off = <K extends keyof Events>(event?: K): void => {
    if (isDestroyed) return;

    if (event !== undefined) {
      handlers.delete(event);
    } else {
      handlers.clear();
    }
  };

  const destroy = (): void => {
    isDestroyed = true;
    handlers.clear();
  };

  return {
    emit,
    on,
    once,
    off,
    destroy,
  };
}

/**
 * Create a namespaced event bus that prefixes all events
 */
export function createNamespacedEventBus<Events extends Record<string, unknown>>(
  parentBus: EventBus<Record<string, unknown>>,
  namespace: string
): EventBus<Events> {
  const prefixEvent = (event: string | number | symbol) => `${namespace}:${String(event)}`;

  return {
    emit: (event, payload) => {
      parentBus.emit(prefixEvent(event), payload);
    },
    on: (event, handler) => {
      return parentBus.on(prefixEvent(event), handler as EventHandler<unknown>);
    },
    once: (event, handler) => {
      return parentBus.once(prefixEvent(event), handler as EventHandler<unknown>);
    },
    off: (event) => {
      if (event !== undefined) {
        parentBus.off(prefixEvent(event));
      }
    },
    destroy: () => {
      // Namespaced bus doesn't destroy parent
    },
  };
}
