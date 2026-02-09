/**
 * Tests for marker positioning with live element tracking
 */

import { describe, it, expect } from 'vitest';
import { renderMarker, type MarkerRenderOptions } from '../../src/element/templates/marker';
import type { Annotation } from '../../src/core/types';

function createMockAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'test-1',
    number: 1,
    comment: 'Test',
    element: null,
    elementInfo: {
      humanReadable: 'button "Save"',
      selectorPath: 'button.save',
      fullDomPath: 'html > body > button.save',
      componentPath: null,
      componentFramework: null,
      tagName: 'button',
      id: null,
      classes: ['save'],
      rect: { top: 100, left: 200, width: 100, height: 40, right: 300, bottom: 140 },
      accessibility: {
        role: null, ariaLabel: null, ariaDescribedBy: null,
        ariaLabelledBy: null, tabIndex: null, isInteractive: true,
      },
      computedStyles: null,
      nearbyContext: { parent: null, previousSibling: null, nextSibling: null, containingLandmark: null },
      innerText: 'Save',
      attributes: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    selectedText: null,
    isMultiSelect: false,
    clickX: 250,
    clickY: 620,
    offsetX: 0.5,
    offsetY: 0.5,
    ...overrides,
  };
}

function makeRenderOptions(annotation: Annotation, overrides: Partial<MarkerRenderOptions> = {}): MarkerRenderOptions {
  return {
    annotation,
    isHovered: false,
    isExiting: false,
    isAnimating: false,
    scrollY: 0,
    accentColor: '#AF52DE',
    ...overrides,
  };
}

describe('Marker positioning', () => {
  describe('with live element (element connected)', () => {
    it('should use getBoundingClientRect for position', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);
      // Override getBoundingClientRect to return known values
      el.getBoundingClientRect = () => ({
        top: 150, left: 300, width: 100, height: 40,
        right: 400, bottom: 190, x: 300, y: 150,
        toJSON: () => {},
      });

      const annotation = createMockAnnotation({
        element: el,
        offsetX: 0.5,
        offsetY: 0.5,
      });

      const html = renderMarker(makeRenderOptions(annotation));

      // Position should be center of the element: left=350, top=170
      expect(html).toContain('left: 350px');
      expect(html).toContain('top: 170px');

      el.remove();
    });

    it('should hide marker when element has zero dimensions', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      el.getBoundingClientRect = () => ({
        top: 0, left: 0, width: 0, height: 0,
        right: 0, bottom: 0, x: 0, y: 0,
        toJSON: () => {},
      });

      const annotation = createMockAnnotation({ element: el });
      const html = renderMarker(makeRenderOptions(annotation));

      // Should return empty string (hidden)
      expect(html).toBe('');

      el.remove();
    });

    it('should respect stored offset percentages', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);
      el.getBoundingClientRect = () => ({
        top: 100, left: 200, width: 200, height: 100,
        right: 400, bottom: 200, x: 200, y: 100,
        toJSON: () => {},
      });

      // Offset at 25% from left, 75% from top
      const annotation = createMockAnnotation({
        element: el,
        offsetX: 0.25,
        offsetY: 0.75,
      });

      const html = renderMarker(makeRenderOptions(annotation));

      // Position: left = 200 + 200*0.25 = 250, top = 100 + 100*0.75 = 175
      expect(html).toContain('left: 250px');
      expect(html).toContain('top: 175px');

      el.remove();
    });
  });

  describe('without live element (fallback to stored coords)', () => {
    it('should use stored document coords converted to viewport', () => {
      const annotation = createMockAnnotation({
        element: null,
        clickX: 250,
        clickY: 620, // document-relative
      });

      // scrollY = 100 → viewport Y = 620 - 100 = 520
      const html = renderMarker(makeRenderOptions(annotation, { scrollY: 100 }));

      expect(html).toContain('left: 250px');
      expect(html).toContain('top: 520px');
    });
  });
});
