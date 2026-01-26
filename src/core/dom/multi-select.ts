/**
 * Multi-select drag selection functionality
 */

import type { AppState, SelectionRect, Position } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';
import { isAnnotationElement } from './events';

/** Minimum drag distance to trigger selection mode */
const DRAG_THRESHOLD = 8;

/** Minimum selection area to be valid */
const MIN_SELECTION_SIZE = 20;

/**
 * Create multi-select manager
 */
export function createMultiSelect(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  let startPosition: Position | null = null;
  let isDragging = false;
  let isActive = false;

  /**
   * Prevent text selection during drag
   */
  const preventTextSelection = () => {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  /**
   * Restore text selection
   */
  const restoreTextSelection = () => {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };

  /**
   * Handle start of potential drag
   */
  const handleStart = (position: Position) => {
    startPosition = position;
    isDragging = false;
  };

  /**
   * Handle mouse move during drag
   */
  const handleMove = (event: MouseEvent) => {
    if (!startPosition) return;

    const dx = event.clientX - startPosition.x;
    const dy = event.clientY - startPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Start dragging if threshold exceeded
    if (!isDragging && distance > DRAG_THRESHOLD) {
      isDragging = true;
      preventTextSelection();

      const rect: SelectionRect = {
        startX: startPosition.x,
        startY: startPosition.y,
        endX: event.clientX,
        endY: event.clientY,
      };

      store.setState({
        isSelecting: true,
        selectionRect: rect,
        selectionPreviewElements: findElementsInSelection(rect),
      });
    }

    // Update selection rectangle and preview elements
    if (isDragging) {
      const rect: SelectionRect = {
        startX: startPosition.x,
        startY: startPosition.y,
        endX: event.clientX,
        endY: event.clientY,
      };

      store.setState({
        selectionRect: rect,
        selectionPreviewElements: findElementsInSelection(rect),
      });
    }
  };

  /**
   * Handle end of drag
   */
  const handleEnd = (): Element[] => {
    const state = store.getState();
    const rect = state.selectionRect;
    const previewElements = state.selectionPreviewElements;

    // Reset state
    startPosition = null;
    isDragging = false;
    restoreTextSelection();

    store.setState({
      isSelecting: false,
      selectionRect: null,
      selectionPreviewElements: [],
    });

    if (!rect) return [];

    // Check if selection is large enough
    const width = Math.abs(rect.endX - rect.startX);
    const height = Math.abs(rect.endY - rect.startY);

    if (width < MIN_SELECTION_SIZE && height < MIN_SELECTION_SIZE) {
      return [];
    }

    // Return the preview elements (already calculated during drag)
    return previewElements.length > 0 ? previewElements : findElementsInSelection(rect);
  };

  /**
   * Cancel current selection
   */
  const cancel = () => {
    startPosition = null;
    isDragging = false;
    restoreTextSelection();
    store.setState({
      isSelecting: false,
      selectionRect: null,
      selectionPreviewElements: [],
    });
  };

  /**
   * Set up event listeners for multi-select mode
   * Works in both 'select' and 'multi-select' modes
   */
  const handleMouseDown = (event: MouseEvent) => {
    const state = store.getState();

    // Work in select mode (drag becomes multi) or explicit multi-select mode
    if (state.mode !== 'select' && state.mode !== 'multi-select') return;

    // Don't start if popup is open
    if (state.popupVisible) return;

    const target = event.target as Element;
    if (isAnnotationElement(target)) return;

    // Only track left mouse button
    if (event.button !== 0) return;

    handleStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!startPosition) return;
    handleMove(event);
  };

  const handleMouseUp = () => {
    if (!startPosition) return;

    const elements = handleEnd();
    if (elements.length > 0) {
      eventBus.emit('multiselect:end', { elements });
    }
  };

  /**
   * Attach multi-select handlers
   */
  const attach = () => {
    if (isActive) return;

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    isActive = true;
  };

  /**
   * Detach multi-select handlers
   */
  const detach = () => {
    if (!isActive) return;

    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);

    cancel();
    isActive = false;
  };

  return {
    attach,
    detach,
    cancel,
    isActive: () => isActive,
    isDragging: () => isDragging,
  };
}

/**
 * Find interactive elements within selection rectangle
 */
function findElementsInSelection(rect: SelectionRect): Element[] {
  // Normalize rectangle bounds
  const minX = Math.min(rect.startX, rect.endX);
  const maxX = Math.max(rect.startX, rect.endX);
  const minY = Math.min(rect.startY, rect.endY);
  const maxY = Math.max(rect.startY, rect.endY);

  // Query interactive elements
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

    // Check intersection with selection rectangle
    const intersects =
      bounds.right >= minX &&
      bounds.left <= maxX &&
      bounds.bottom >= minY &&
      bounds.top <= maxY;

    if (!intersects) continue;

    // Skip elements that are too large
    const isTooLarge =
      bounds.width > viewport.width * 0.8 &&
      bounds.height > viewport.height * 0.5;

    if (isTooLarge) continue;

    // Skip elements that are too small
    const isTooSmall = bounds.width < 10 || bounds.height < 10;

    if (isTooSmall) continue;

    results.push(element);
  }

  // Filter to keep only leaf nodes (elements that don't contain other selected elements)
  return results.filter((element) => {
    return !results.some(
      (other) => other !== element && element.contains(other)
    );
  });
}

/**
 * Get normalized selection rectangle (ensures start < end)
 */
export function normalizeRect(rect: SelectionRect): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const x = Math.min(rect.startX, rect.endX);
  const y = Math.min(rect.startY, rect.endY);
  const width = Math.abs(rect.endX - rect.startX);
  const height = Math.abs(rect.endY - rect.startY);

  return { x, y, width, height };
}

export type MultiSelect = ReturnType<typeof createMultiSelect>;
