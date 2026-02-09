/**
 * Tests for devtools API module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDevtoolsApi,
  attachDevtoolsApi,
  detachDevtoolsApi,
} from '../../src/element/devtools-api';
import type { AnnotationElement } from '../../src/element/annotation-element';

function createMockHost(overrides: Record<string, any> = {}): AnnotationElement {
  const host = {
    activate: vi.fn(),
    deactivate: vi.fn(),
    toggle: vi.fn(),
    core: {
      setMode: vi.fn(),
      getMode: vi.fn().mockReturnValue('select'),
      showPopup: vi.fn(),
      hidePopup: vi.fn(),
      copyOutput: vi.fn().mockResolvedValue(true),
      getOutput: vi.fn().mockReturnValue('# Output'),
      getSettings: vi.fn().mockReturnValue({ outputLevel: 'standard' }),
      store: {
        getState: vi.fn().mockReturnValue({
          annotations: new Map(),
        }),
      },
      eventBus: {
        emit: vi.fn(),
      },
    },
    currentRoute: 'http://localhost:3000/',
    ...overrides,
  } as unknown as AnnotationElement;
  return host;
}

describe('createDevtoolsApi', () => {
  it('should create an API object with all expected methods', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    expect(api).toBeDefined();
    expect(typeof api.activate).toBe('function');
    expect(typeof api.deactivate).toBe('function');
    expect(typeof api.toggle).toBe('function');
    expect(typeof api.setMode).toBe('function');
    expect(typeof api.getMode).toBe('function');
    expect(typeof api.openPopupAtElement).toBe('function');
    expect(typeof api.openPopupAtSelector).toBe('function');
    expect(typeof api.openPopupAtPoint).toBe('function');
    expect(typeof api.showPopupForAnnotation).toBe('function');
    expect(typeof api.closePopup).toBe('function');
    expect(typeof api.copyOutput).toBe('function');
    expect(typeof api.getOutput).toBe('function');
    expect(typeof api.getAnnotations).toBe('function');
    expect(typeof api.getVisibleAnnotations).toBe('function');
    expect(typeof api.getCurrentRoute).toBe('function');
    expect(typeof api.getState).toBe('function');
  });

  it('should delegate activate/deactivate/toggle to host', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    api.activate();
    expect(host.activate).toHaveBeenCalled();

    api.deactivate();
    expect(host.deactivate).toHaveBeenCalled();

    api.toggle();
    expect(host.toggle).toHaveBeenCalled();
  });

  it('should delegate setMode and getMode to core', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    api.setMode('multi-select');
    expect((host as any).core.setMode).toHaveBeenCalledWith('multi-select');

    const mode = api.getMode();
    expect(mode).toBe('select');
  });

  it('should delegate closePopup to core.hidePopup', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    api.closePopup();
    expect((host as any).core.hidePopup).toHaveBeenCalled();
  });

  it('should return empty array for getAnnotations when no annotations', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    const annotations = api.getAnnotations();
    expect(annotations).toEqual([]);
  });

  it('should return current route', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    expect(api.getCurrentRoute()).toBe('http://localhost:3000/');
  });

  it('openPopupAtSelector should return false for non-existent selector', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    const result = api.openPopupAtSelector('.non-existent-class-xyz');
    expect(result).toBe(false);
  });
});

describe('attachDevtoolsApi / detachDevtoolsApi', () => {
  afterEach(() => {
    // Clean up window globals
    const w = window as any;
    delete w.__agentUiAnnotation;
    delete w.__agentUiAnnotationApi;
    delete w.__agentUiAnnotationApis;
    delete w.__agentUiAnnotationInstances;
  });

  it('should set window globals on attach', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    attachDevtoolsApi(host, api);

    const w = window as any;
    expect(w.__agentUiAnnotation).toBe(host);
    expect(w.__agentUiAnnotationApi).toBe(api);
    expect(w.__agentUiAnnotationInstances).toContain(host);
    expect(w.__agentUiAnnotationApis).toContain(api);
  });

  it('should clean up window globals on detach', () => {
    const host = createMockHost();
    const api = createDevtoolsApi(host);

    attachDevtoolsApi(host, api);
    detachDevtoolsApi(host, api);

    const w = window as any;
    expect(w.__agentUiAnnotation).toBeUndefined();
    expect(w.__agentUiAnnotationApi).toBeUndefined();
    expect(w.__agentUiAnnotationInstances).toBeUndefined();
    expect(w.__agentUiAnnotationApis).toBeUndefined();
  });

  it('should handle multiple instances', () => {
    const host1 = createMockHost();
    const host2 = createMockHost();
    const api1 = createDevtoolsApi(host1);
    const api2 = createDevtoolsApi(host2);

    attachDevtoolsApi(host1, api1);
    attachDevtoolsApi(host2, api2);

    const w = window as any;
    expect(w.__agentUiAnnotationInstances).toHaveLength(2);
    expect(w.__agentUiAnnotationApis).toHaveLength(2);

    detachDevtoolsApi(host1, api1);
    expect(w.__agentUiAnnotationInstances).toHaveLength(1);
    expect(w.__agentUiAnnotationApis).toHaveLength(1);
  });
});
