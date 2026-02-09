/**
 * Tests for event blocking behaviour
 *
 * When blockInteractions is ON and the tool is active, ALL click / keyboard /
 * mousedown / mouseup events on non-annotation targets must be blocked from
 * reaching the page.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEventHandlers,
  isAnnotationElement,
  isAnnotationEvent,
} from '../../src/core/dom/events';
import { createStore } from '../../src/core/store';
import { createEventBus } from '../../src/core/event-bus';
import { createInitialState, DEFAULT_SETTINGS } from '../../src/core/state';
import type { AppState, EventMap } from '../../src/core/types';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return createInitialState({
    settings: { ...DEFAULT_SETTINGS, blockInteractions: true },
    ...overrides,
  });
}

function createMockEvent<T extends Event>(
  EventCtor: { new (type: string, init?: any): T },
  type: string,
  init: Record<string, unknown> = {}
): T {
  const event = new EventCtor(type, { bubbles: true, cancelable: true, ...init });
  vi.spyOn(event, 'preventDefault');
  vi.spyOn(event, 'stopPropagation');
  vi.spyOn(event, 'stopImmediatePropagation');
  return event;
}

describe('Event blocking', () => {
  let store: ReturnType<typeof createStore<AppState>>;
  let eventBus: ReturnType<typeof createEventBus<EventMap>>;
  let handlers: ReturnType<typeof createEventHandlers>;
  let target: HTMLButtonElement;

  beforeEach(() => {
    store = createStore(makeState());
    eventBus = createEventBus<EventMap>();
    handlers = createEventHandlers(store, eventBus);
    // Create a real target element so event.target is an Element
    target = document.createElement('button');
    target.textContent = 'Page Button';
    document.body.appendChild(target);
  });

  afterEach(() => {
    handlers.detach();
    target.remove();
  });

  describe('when blockInteractions is ON and tool is active', () => {
    beforeEach(() => {
      store.setState({ mode: 'select' });
      handlers.attach();
    });

    it('should block click events from reaching the page', () => {
      const event = createMockEvent(MouseEvent, 'click', { clientX: 100, clientY: 200 });
      target.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should block mousedown events from reaching the page', () => {
      const event = createMockEvent(MouseEvent, 'mousedown', { clientX: 100, clientY: 200 });
      target.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should block mouseup events from reaching the page', () => {
      const event = createMockEvent(MouseEvent, 'mouseup', { clientX: 100, clientY: 200 });
      target.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should block keydown events from reaching the page', () => {
      const event = createMockEvent(KeyboardEvent, 'keydown', { key: 'a' });
      target.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });

    it('should block keyup events from reaching the page', () => {
      const event = createMockEvent(KeyboardEvent, 'keyup', { key: 'a' });
      target.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });

    it('should block special keys like Tab and Enter', () => {
      for (const key of ['Tab', 'Enter', ' ', 'ArrowDown']) {
        const event = createMockEvent(KeyboardEvent, 'keydown', { key });
        target.dispatchEvent(event);
        expect(event.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('when blockInteractions is OFF', () => {
    beforeEach(() => {
      store.setState({
        mode: 'select',
        settings: { ...DEFAULT_SETTINGS, blockInteractions: false },
      });
      handlers.attach();
    });

    it('should NOT block click events', () => {
      const event = createMockEvent(MouseEvent, 'click', { clientX: 100, clientY: 200 });
      target.dispatchEvent(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should NOT block keydown events', () => {
      const event = createMockEvent(KeyboardEvent, 'keydown', { key: 'a' });
      target.dispatchEvent(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('when tool is disabled', () => {
    beforeEach(() => {
      store.setState({
        mode: 'disabled',
        settings: { ...DEFAULT_SETTINGS, blockInteractions: true },
      });
      handlers.attach();
    });

    it('should NOT block click events', () => {
      const event = createMockEvent(MouseEvent, 'click', { clientX: 100, clientY: 200 });
      target.dispatchEvent(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should NOT block keydown events', () => {
      const event = createMockEvent(KeyboardEvent, 'keydown', { key: 'a' });
      target.dispatchEvent(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });
});

describe('isAnnotationElement / isAnnotationEvent', () => {
  it('should identify agent-ui-annotation element', () => {
    const el = document.createElement('agent-ui-annotation');
    expect(isAnnotationElement(el)).toBe(true);
  });

  it('should identify elements with annotation data attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-annotation-toolbar', '');
    expect(isAnnotationElement(el)).toBe(true);
  });

  it('should return false for regular page elements', () => {
    const el = document.createElement('button');
    expect(isAnnotationElement(el)).toBe(false);
  });
});
