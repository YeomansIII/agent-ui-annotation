/**
 * DOM event handling for Annotation
 */

import type { AppState, Position } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';
import { collectElementInfo } from '../element';

/** Data attributes used by Annotation */
const DATA_TOOLBAR = 'data-annotation-toolbar';
const DATA_MARKER = 'data-annotation-marker';
const DATA_POPUP = 'data-annotation-popup';
const DATA_SETTINGS = 'data-annotation-settings';

/**
 * Check if an element is part of the Annotation UI
 */
export function isAnnotationElement(element: Element | null): boolean {
  if (!element) return false;

  // Check for the custom element itself (clicks on shadow DOM elements appear as the host)
  if (element.tagName.toLowerCase() === 'agent-ui-annotation') {
    return true;
  }

  // Check for the closest agent-ui-annotation ancestor
  if (element.closest('agent-ui-annotation')) {
    return true;
  }

  // Check for data attributes (for non-shadow-dom scenarios)
  return (
    element.hasAttribute(DATA_TOOLBAR) ||
    element.hasAttribute(DATA_MARKER) ||
    element.hasAttribute(DATA_POPUP) ||
    element.hasAttribute(DATA_SETTINGS) ||
    element.closest(`[${DATA_TOOLBAR}], [${DATA_MARKER}], [${DATA_POPUP}], [${DATA_SETTINGS}]`) !== null
  );
}

/**
 * Check if a mouse event originated from within Annotation UI (including shadow DOM)
 */
export function isAnnotationEvent(event: MouseEvent): boolean {
  // Use composedPath to check the actual event path including shadow DOM
  const path = event.composedPath();
  for (const target of path) {
    if (target instanceof Element) {
      if (target.tagName.toLowerCase() === 'agent-ui-annotation') {
        return true;
      }
      if (target.hasAttribute && (
        target.hasAttribute(DATA_TOOLBAR) ||
        target.hasAttribute(DATA_MARKER) ||
        target.hasAttribute(DATA_POPUP) ||
        target.hasAttribute(DATA_SETTINGS)
      )) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get the target element from a mouse event, excluding Annotation elements
 */
export function getTargetElement(event: MouseEvent): Element | null {
  const target = event.target as Element;

  if (isAnnotationElement(target)) {
    return null;
  }

  return target;
}

/**
 * Get current text selection
 */
export function getSelectedText(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return null;
  }

  const text = selection.toString().trim();
  return text.length > 0 ? text : null;
}

/**
 * Create DOM event handlers bound to store and event bus
 */
export function createEventHandlers(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  let isActive = false;

  /**
   * Handle click events
   */
  const handleClick = (event: MouseEvent) => {
    const state = store.getState();

    if (state.mode === 'disabled') return;

    // Check composedPath to properly detect clicks inside shadow DOM
    if (isAnnotationEvent(event)) return;

    // Don't process element selection when settings panel is open
    if (state.settingsPanelVisible) return;

    const target = getTargetElement(event);
    if (!target) return;

    // Prevent default only when active and targeting interactive elements
    if (state.settings.blockInteractions) {
      const isInteractive = target.matches('a, button, input, select, textarea, [role="button"], [onclick]');
      if (isInteractive) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    const includeForensic = state.settings.outputLevel === 'forensic';
    const elementInfo = collectElementInfo(target, includeForensic);

    // Store click position:
    // - For fixed elements: use viewport coordinates directly
    // - For non-fixed elements: convert to document coordinates (add scroll offset)
    const clickX = event.clientX;
    const clickY = elementInfo.isFixed ? event.clientY : event.clientY + window.scrollY;

    eventBus.emit('element:click', {
      element: target,
      elementInfo,
      clickX,
      clickY
    });
  };

  /**
   * Handle mouse down for potential drag selection
   */
  const handleMouseDown = (event: MouseEvent) => {
    const state = store.getState();

    if (state.mode !== 'multi-select') return;

    const target = event.target as Element;
    if (isAnnotationElement(target)) return;

    const position: Position = {
      x: event.clientX,
      y: event.clientY,
    };

    eventBus.emit('multiselect:start', { position });
  };

  /**
   * Handle mouse move for drag selection
   */
  const handleMouseMove = (event: MouseEvent) => {
    const state = store.getState();

    if (!state.isSelecting && state.selectionRect === null) return;

    if (state.isSelecting && state.selectionRect) {
      const rect = {
        startX: state.selectionRect.startX,
        startY: state.selectionRect.startY,
        endX: event.clientX,
        endY: event.clientY,
      };

      eventBus.emit('multiselect:update', { rect });
    }
  };

  /**
   * Handle mouse up to complete drag selection
   */
  const handleMouseUp = (_event: MouseEvent) => {
    const state = store.getState();

    if (!state.isSelecting) return;

    // Find elements in selection rectangle
    const rect = state.selectionRect;
    if (!rect) return;

    const elements = findElementsInRect(rect);
    eventBus.emit('multiselect:end', { elements });
  };

  /**
   * Handle scroll events
   */
  const handleScroll = () => {
    store.setState({ scrollY: window.scrollY });
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    const state = store.getState();

    // Escape to cancel current operation
    if (event.key === 'Escape') {
      if (state.popupVisible) {
        store.setState({ popupVisible: false, popupAnnotationId: null });
        event.preventDefault();
      } else if (state.isSelecting) {
        store.setState({ isSelecting: false, selectionRect: null });
        event.preventDefault();
      } else if (state.mode !== 'disabled') {
        eventBus.emit('deactivate', undefined as never);
        event.preventDefault();
      }
    }
  };

  /**
   * Attach event listeners
   */
  const attach = () => {
    if (isActive) return;

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('keydown', handleKeyDown, true);

    isActive = true;
  };

  /**
   * Detach event listeners
   */
  const detach = () => {
    if (!isActive) return;

    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('scroll', handleScroll);
    document.removeEventListener('keydown', handleKeyDown, true);

    isActive = false;
  };

  return {
    attach,
    detach,
    isActive: () => isActive,
  };
}

/**
 * Find interactive elements within a selection rectangle
 */
function findElementsInRect(rect: { startX: number; startY: number; endX: number; endY: number }): Element[] {
  // Normalize rectangle
  const minX = Math.min(rect.startX, rect.endX);
  const maxX = Math.max(rect.startX, rect.endX);
  const minY = Math.min(rect.startY, rect.endY);
  const maxY = Math.max(rect.startY, rect.endY);

  // Query for interactive elements
  const selector = 'button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th';
  const candidates = document.querySelectorAll(selector);

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const results: Element[] = [];

  for (const element of candidates) {
    // Skip Annotation elements
    if (isAnnotationElement(element)) continue;

    const bounds = element.getBoundingClientRect();

    // Skip elements that don't intersect selection
    if (
      bounds.right < minX ||
      bounds.left > maxX ||
      bounds.bottom < minY ||
      bounds.top > maxY
    ) {
      continue;
    }

    // Skip elements too large (> 80% viewport width AND > 50% height)
    if (bounds.width > viewport.width * 0.8 && bounds.height > viewport.height * 0.5) {
      continue;
    }

    // Skip elements too small (< 10x10)
    if (bounds.width < 10 || bounds.height < 10) {
      continue;
    }

    results.push(element);
  }

  // Filter out parent elements (keep only leaf nodes in selection)
  return results.filter((element) => {
    return !results.some(
      (other) => other !== element && element.contains(other)
    );
  });
}

export type EventHandlers = ReturnType<typeof createEventHandlers>;
