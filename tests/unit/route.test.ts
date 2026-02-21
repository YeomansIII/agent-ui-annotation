/**
 * Tests for route helpers (SPA-aware annotations)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeRoute,
  resolveRoute,
  getCurrentRoute,
  getAnnotationRoute,
  isAnnotationVisibleOnRoute,
} from '../../src/core/annotations/route';
import type { Annotation } from '../../src/core/types';

function createMockAnnotation(context?: Record<string, unknown>): Annotation {
  return {
    id: `ann-${Math.random().toString(36).slice(2)}`,
    number: 1,
    comment: 'test',
    element: null,
    elementInfo: {
      humanReadable: 'button',
      selectorPath: 'button',
      fullDomPath: 'html > body > button',
      componentPath: null,
      componentFramework: null,
      tagName: 'button',
      id: null,
      classes: [],
      rect: { top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 },
      accessibility: {
        role: null,
        ariaLabel: null,
        ariaDescribedBy: null,
        ariaLabelledBy: null,
        tabIndex: null,
        isInteractive: true,
      },
      computedStyles: null,
      nearbyContext: { parent: null, previousSibling: null, nextSibling: null, containingLandmark: null },
      innerText: 'Click',
      attributes: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    selectedText: null,
    isMultiSelect: false,
    clickX: 50,
    clickY: 20,
    offsetX: 0.5,
    offsetY: 0.5,
    context,
  };
}

describe('normalizeRoute', () => {
  it('should return the same URL when there is no hash', () => {
    expect(normalizeRoute('http://localhost:3000/foo')).toBe('http://localhost:3000/foo');
  });

  it('should strip the hash portion', () => {
    expect(normalizeRoute('http://localhost:3000/foo#section1')).toBe('http://localhost:3000/foo');
  });

  it('should handle URL with only a hash', () => {
    expect(normalizeRoute('http://localhost:3000/#top')).toBe('http://localhost:3000/');
  });

  it('should handle empty string', () => {
    expect(normalizeRoute('')).toBe('');
  });

  it('should handle relative paths with hash', () => {
    expect(normalizeRoute('/page#anchor')).toBe('/page');
  });
});

describe('resolveRoute', () => {
  it('should return full URLs as-is (after normalizing)', () => {
    expect(resolveRoute('http://example.com/path')).toBe('http://example.com/path');
  });

  it('should convert relative paths to full href', () => {
    const result = resolveRoute('/alpha');
    expect(result).toMatch(/^https?:\/\//);
    expect(result).toContain('/alpha');
  });

  it('should strip hash from full URL', () => {
    expect(resolveRoute('http://example.com/path#hash')).toBe('http://example.com/path');
  });

  it('should handle paths without leading slash', () => {
    const result = resolveRoute('beta');
    expect(result).toMatch(/^https?:\/\//);
    expect(result).toContain('/beta');
  });
});

describe('getCurrentRoute', () => {
  it('should return the current URL without hash', () => {
    const route = getCurrentRoute();
    expect(route).toMatch(/^https?:\/\/localhost/);
    expect(route).not.toContain('#');
  });
});

describe('getAnnotationRoute', () => {
  it('should return null for annotations without context', () => {
    const annotation = createMockAnnotation();
    delete annotation.context;
    expect(getAnnotationRoute(annotation)).toBeNull();
  });

  it('should return null for annotations with empty context', () => {
    const annotation = createMockAnnotation({});
    expect(getAnnotationRoute(annotation)).toBeNull();
  });

  it('should return null for annotations with empty route string', () => {
    const annotation = createMockAnnotation({ route: '  ' });
    expect(getAnnotationRoute(annotation)).toBeNull();
  });

  it('should return normalized full href for relative route', () => {
    const annotation = createMockAnnotation({ route: '/alpha' });
    const route = getAnnotationRoute(annotation);
    expect(route).toMatch(/^https?:\/\//);
    expect(route).toContain('/alpha');
  });

  it('should return normalized full href for absolute URL route', () => {
    const annotation = createMockAnnotation({ route: 'http://example.com/beta#anchor' });
    const route = getAnnotationRoute(annotation);
    expect(route).toBe('http://example.com/beta');
  });
});

describe('isAnnotationVisibleOnRoute', () => {
  it('should return true for annotations without a route (always visible)', () => {
    const annotation = createMockAnnotation();
    delete annotation.context;
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/any')).toBe(true);
  });

  it('should return true when annotation route matches current route', () => {
    const annotation = createMockAnnotation({ route: 'http://localhost:3000/alpha' });
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/alpha')).toBe(true);
  });

  it('should return false when annotation route does not match current route', () => {
    const annotation = createMockAnnotation({ route: 'http://localhost:3000/alpha' });
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/beta')).toBe(false);
  });

  it('should match routes ignoring hash differences', () => {
    // Both routes resolve to same URL when hash is stripped
    const annotation = createMockAnnotation({ route: 'http://localhost:3000/page#section1' });
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/page')).toBe(true);
  });

  it('should return true on any route when annotation element is connected', () => {
    // Simulate an element that exists on multiple routes (e.g., a nav item)
    const annotation = createMockAnnotation({ route: 'http://localhost:3000/alpha' });
    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement); // makes isConnected = true
    annotation.element = mockElement;

    // Should be visible on a DIFFERENT route because element is connected
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/beta')).toBe(true);

    document.body.removeChild(mockElement);
  });

  it('should fall back to route matching when element is disconnected', () => {
    const annotation = createMockAnnotation({ route: 'http://localhost:3000/alpha' });
    const mockElement = document.createElement('div');
    // NOT appended to DOM, so isConnected = false
    annotation.element = mockElement;

    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/beta')).toBe(false);
    expect(isAnnotationVisibleOnRoute(annotation, 'http://localhost:3000/alpha')).toBe(true);
  });
});
