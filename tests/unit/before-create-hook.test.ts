/**
 * Tests for onBeforeAnnotationCreate hook functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnnotationManager } from '../../src/core/annotations/annotation';
import { createStore } from '../../src/core/store';
import { createEventBus } from '../../src/core/event-bus';
import { createInitialState } from '../../src/core/state';
import type { AppState, EventMap, BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from '../../src/core/types';

// Mock DOM element
function createMockElement(): Element {
  const el = document.createElement('button');
  el.textContent = 'Test Button';
  el.id = 'test-button';
  el.className = 'btn primary';
  document.body.appendChild(el);
  return el;
}

describe('onBeforeAnnotationCreate hook', () => {
  let store: ReturnType<typeof createStore<AppState>>;
  let eventBus: ReturnType<typeof createEventBus<EventMap>>;
  let mockElement: Element;

  beforeEach(() => {
    store = createStore(createInitialState());
    eventBus = createEventBus<EventMap>();
    mockElement = createMockElement();
  });

  it('should create annotation without hook', async () => {
    const manager = createAnnotationManager(store, eventBus);

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(annotation).not.toBeNull();
    expect(annotation?.comment).toBe('Test comment');
    // Route is always auto-set in context
    expect(annotation?.context?.route).toBeDefined();
  });

  it('should add context from hook', async () => {
    const hook = vi.fn((data: BeforeAnnotationCreateData): BeforeAnnotationCreateResult => ({
      context: {
        route: '/test-route',
        userId: 123,
      },
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(annotation).not.toBeNull();
    expect(annotation?.context?.userId).toBe(123);
    // Hook-supplied route '/test-route' is resolved to a full href
    expect(annotation?.context?.route).toContain('/test-route');
  });

  it('should pass correct data to hook', async () => {
    let receivedData: BeforeAnnotationCreateData | null = null;
    const hook = vi.fn((data: BeforeAnnotationCreateData) => {
      receivedData = data;
      return {};
    });

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    await manager.addAnnotation(mockElement, 'Test comment', {
      selectedText: 'selected text',
      isMultiSelect: true,
      clickX: 100,
      clickY: 200,
    });

    expect(receivedData).not.toBeNull();
    expect(receivedData?.element).toBe(mockElement);
    expect(receivedData?.comment).toBe('Test comment');
    expect(receivedData?.selectedText).toBe('selected text');
    expect(receivedData?.isMultiSelect).toBe(true);
    expect(receivedData?.clickX).toBe(100);
    expect(receivedData?.clickY).toBe(200);
    expect(receivedData?.elementInfo).toBeDefined();
    expect(receivedData?.elementInfo.humanReadable).toContain('button');
  });

  it('should allow hook to modify comment', async () => {
    const hook = vi.fn((): BeforeAnnotationCreateResult => ({
      comment: 'Modified comment',
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Original comment');

    expect(annotation?.comment).toBe('Modified comment');
  });

  it('should allow hook to cancel annotation creation', async () => {
    const hook = vi.fn((): BeforeAnnotationCreateResult => ({
      cancel: true,
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(annotation).toBeNull();
    expect(store.getState().annotations.size).toBe(0);
  });

  it('should support async hooks', async () => {
    const hook = vi.fn(async (): Promise<BeforeAnnotationCreateResult> => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        context: { asyncData: 'loaded' },
      };
    });

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(annotation?.context?.asyncData).toBe('loaded');
    expect(annotation?.context?.route).toBeDefined();
  });

  it('should continue on hook error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hook = vi.fn(() => {
      throw new Error('Hook error');
    });

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(annotation).not.toBeNull();
    expect(annotation?.comment).toBe('Test comment');
    expect(consoleError).toHaveBeenCalledWith(
      '[Annotation] onBeforeAnnotationCreate hook error:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it('should handle hook returning void', async () => {
    const hook = vi.fn(() => {
      // Return nothing
    });

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Test comment');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(annotation).not.toBeNull();
    expect(annotation?.comment).toBe('Test comment');
    // Route is auto-added even when hook returns void
    expect(annotation?.context?.route).toBeDefined();
  });

  it('should handle hook returning partial result', async () => {
    const hook = vi.fn((): BeforeAnnotationCreateResult => ({
      context: { partial: true },
      // comment and cancel not provided
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    const annotation = await manager.addAnnotation(mockElement, 'Original comment');

    expect(annotation?.comment).toBe('Original comment');
    expect(annotation?.context?.partial).toBe(true);
    expect(annotation?.context?.route).toBeDefined();
  });

  it('should emit annotation:create event with context', async () => {
    const createListener = vi.fn();
    eventBus.on('annotation:create', createListener);

    const hook = vi.fn((): BeforeAnnotationCreateResult => ({
      context: { test: 'value' },
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    await manager.addAnnotation(mockElement, 'Test comment');

    expect(createListener).toHaveBeenCalledTimes(1);
    const emittedAnnotation = createListener.mock.calls[0][0].annotation;
    expect(emittedAnnotation.context.test).toBe('value');
    expect(emittedAnnotation.context.route).toBeDefined();
  });

  it('should not emit event when cancelled', async () => {
    const createListener = vi.fn();
    eventBus.on('annotation:create', createListener);

    const hook = vi.fn((): BeforeAnnotationCreateResult => ({
      cancel: true,
    }));

    const manager = createAnnotationManager(store, eventBus, {
      onBeforeAnnotationCreate: hook,
    });

    await manager.addAnnotation(mockElement, 'Test comment');

    expect(createListener).not.toHaveBeenCalled();
  });
});
