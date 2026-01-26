/**
 * Throttled hover detection for element highlighting
 */

import type { AppState } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';
import { throttle } from '../utils/throttle';
import { collectElementInfo } from '../element';
import { isAnnotationElement } from './events';

const THROTTLE_MS = 50;

/**
 * Create hover detection handler
 */
export function createHoverDetection(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  let isActive = false;
  let currentElement: Element | null = null;

  /**
   * Process hover target
   */
  const processHover = (event: MouseEvent) => {
    const state = store.getState();

    // Don't process hover when disabled or selecting
    if (state.mode === 'disabled' || state.isSelecting) {
      if (state.hoveredElement !== null) {
        store.setState({
          hoveredElement: null,
          hoveredElementInfo: null,
        });
        eventBus.emit('element:hover', { element: null, elementInfo: null });
      }
      return;
    }

    // When popup or settings panel is open, don't update hover state (keep it stable)
    if (state.popupVisible || state.settingsPanelVisible) {
      return;
    }

    const target = event.target as Element;

    // Skip Annotation elements
    if (isAnnotationElement(target)) {
      if (currentElement !== null) {
        currentElement = null;
        store.setState({
          hoveredElement: null,
          hoveredElementInfo: null,
        });
        eventBus.emit('element:hover', { element: null, elementInfo: null });
      }
      return;
    }

    // Skip if same element
    if (target === currentElement) {
      return;
    }

    currentElement = target;

    // Collect element info
    const includeForensic = state.settings.outputLevel === 'forensic';
    const elementInfo = collectElementInfo(target, includeForensic);

    store.setState({
      hoveredElement: target,
      hoveredElementInfo: elementInfo,
    });

    eventBus.emit('element:hover', { element: target, elementInfo });
  };

  // Create throttled handler
  const throttledHandler = throttle(processHover, THROTTLE_MS, {
    leading: true,
    trailing: true,
  });

  /**
   * Handle mouse leave to clear hover state
   */
  const handleMouseLeave = (event: MouseEvent) => {
    // Only clear if leaving the document
    const relatedTarget = event.relatedTarget as Element | null;
    if (relatedTarget && document.documentElement.contains(relatedTarget)) {
      return;
    }

    currentElement = null;
    store.setState({
      hoveredElement: null,
      hoveredElementInfo: null,
    });
    eventBus.emit('element:hover', { element: null, elementInfo: null });
  };

  /**
   * Attach hover detection
   */
  const attach = () => {
    if (isActive) return;

    document.addEventListener('mousemove', throttledHandler, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    isActive = true;
  };

  /**
   * Detach hover detection
   */
  const detach = () => {
    if (!isActive) return;

    document.removeEventListener('mousemove', throttledHandler);
    document.removeEventListener('mouseleave', handleMouseLeave);
    throttledHandler.cancel();

    currentElement = null;
    store.setState({
      hoveredElement: null,
      hoveredElementInfo: null,
    });

    isActive = false;
  };

  /**
   * Clear current hover state
   */
  const clearHover = () => {
    currentElement = null;
    store.setState({
      hoveredElement: null,
      hoveredElementInfo: null,
    });
    eventBus.emit('element:hover', { element: null, elementInfo: null });
  };

  return {
    attach,
    detach,
    clearHover,
    isActive: () => isActive,
  };
}

export type HoverDetection = ReturnType<typeof createHoverDetection>;
