/**
 * Tests for element re-finding after page reload
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { refindElement } from '../../src/core/dom/element-refinder';
import type { ElementInfo } from '../../src/core/types';

function createMockElementInfo(overrides: Partial<ElementInfo> = {}): ElementInfo {
  return {
    humanReadable: 'button "Save"',
    selectorPath: '',
    fullDomPath: 'html > body > div > button',
    componentPath: null,
    componentFramework: null,
    tagName: 'button',
    id: null,
    classes: [],
    rect: { top: 100, left: 200, width: 120, height: 40, right: 320, bottom: 140 },
    accessibility: {
      role: null,
      ariaLabel: null,
      ariaDescribedBy: null,
      ariaLabelledBy: null,
      tabIndex: null,
      isInteractive: true,
    },
    computedStyles: null,
    nearbyContext: {
      parent: null,
      previousSibling: null,
      nextSibling: null,
      containingLandmark: null,
    },
    innerText: 'Save',
    attributes: {},
    ...overrides,
  };
}

describe('Element re-finding', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Strategy 1: CSS selector path', () => {
    it('should find element by selector path', () => {
      container.innerHTML = '<button class="save-btn">Save</button>';
      const info = createMockElementInfo({
        selectorPath: '#test-container > button.save-btn',
      });

      const found = refindElement(info);
      expect(found).not.toBeNull();
      expect(found?.textContent).toBe('Save');
    });

    it('should not match if selector returns wrong tag', () => {
      container.innerHTML = '<span class="save-btn">Save</span>';
      const info = createMockElementInfo({
        selectorPath: '#test-container > span.save-btn',
        tagName: 'button', // Looking for a button, not a span
      });

      const found = refindElement(info);
      expect(found).toBeNull(); // Tag mismatch
    });

    it('should handle invalid selectors gracefully', () => {
      const info = createMockElementInfo({
        selectorPath: '!!!invalid[[[selector',
      });

      const found = refindElement(info);
      expect(found).toBeNull();
    });
  });

  describe('Strategy 2: Element ID', () => {
    it('should find element by ID', () => {
      container.innerHTML = '<button id="save-button">Save</button>';
      const info = createMockElementInfo({
        id: 'save-button',
        tagName: 'button',
      });

      const found = refindElement(info);
      expect(found).not.toBeNull();
      expect(found?.id).toBe('save-button');
    });

    it('should not match ID if tag name is wrong', () => {
      container.innerHTML = '<div id="save-button">Save</div>';
      const info = createMockElementInfo({
        id: 'save-button',
        tagName: 'button',
      });

      const found = refindElement(info);
      expect(found).toBeNull();
    });
  });

  describe('Fallback chain', () => {
    it('should return null when no strategy matches', () => {
      container.innerHTML = '<div>Completely different content</div>';
      const info = createMockElementInfo({
        selectorPath: '#nonexistent > button',
        id: null,
        tagName: 'button',
        classes: [],
        innerText: '',
      });

      const found = refindElement(info);
      expect(found).toBeNull();
    });

    it('should fall through to ID when selector fails', () => {
      container.innerHTML = '<button id="my-btn">Click me</button>';
      const info = createMockElementInfo({
        selectorPath: '#wrong-container > button', // Wrong selector
        id: 'my-btn',
        tagName: 'button',
      });

      const found = refindElement(info);
      expect(found).not.toBeNull();
      expect(found?.id).toBe('my-btn');
    });
  });
});
