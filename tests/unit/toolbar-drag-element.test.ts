/**
 * Tests for dragging the activation button in the web component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnnotationElement, registerAnnotationElement } from '../../src/element/annotation-element';

registerAnnotationElement();

function mockToolbarRect(toolbar: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
  vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect);
}

function dispatchPointer(target: EventTarget, type: string, init: PointerEventInit) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      ...init,
    })
  );
}

describe('AnnotationElement toolbar drag', () => {
  let element: AnnotationElement;

  beforeEach(async () => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    element = document.createElement('agent-ui-annotation') as AnnotationElement;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('activates on a click that does not move far enough to drag', async () => {
    const toolbar = element.renderRoot.querySelector('.toolbar') as HTMLElement;
    expect(toolbar.classList.contains('collapsed')).toBe(true);
    mockToolbarRect(toolbar, { left: 932, top: 732, width: 48, height: 48 });

    dispatchPointer(toolbar, 'pointerdown', { clientX: 950, clientY: 750 });
    dispatchPointer(document, 'pointermove', { clientX: 952, clientY: 751 });
    dispatchPointer(document, 'pointerup', { clientX: 952, clientY: 751 });
    toolbar.querySelector('button')?.click();
    await element.updateComplete;

    const expanded = element.renderRoot.querySelector('.toolbar') as HTMLElement;
    expect(expanded.classList.contains('collapsed')).toBe(false);
  });

  it('moves the activation button and does not activate it after a drag', async () => {
    const toolbar = element.renderRoot.querySelector('.toolbar') as HTMLElement;
    mockToolbarRect(toolbar, { left: 932, top: 732, width: 48, height: 48 });

    dispatchPointer(toolbar, 'pointerdown', { clientX: 950, clientY: 750 });
    dispatchPointer(document, 'pointermove', { clientX: 200, clientY: 180 });
    dispatchPointer(document, 'pointerup', { clientX: 200, clientY: 180 });
    toolbar.querySelector('button')?.click();
    await element.updateComplete;

    const after = element.renderRoot.querySelector('.toolbar') as HTMLElement;
    expect(after.classList.contains('collapsed')).toBe(true);
    expect(after.style.left).toBe('182px');
    expect(after.style.top).toBe('162px');
    expect(localStorage.getItem('annotation-toolbar-position')).toContain('"x":182');
  });
});
