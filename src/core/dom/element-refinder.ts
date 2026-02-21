/**
 * Element re-finding after page reload
 *
 * Uses two reliable strategies to locate a DOM element from stored ElementInfo:
 * 1. CSS selector path (most specific, generated at annotation time)
 * 2. Element ID (fast, reliable when present)
 */

import type { ElementInfo } from '../types';

/**
 * Attempt to re-find a DOM element using stored element information.
 *
 * Returns the matched element or null if no reasonable match is found.
 */
export function refindElement(elementInfo: ElementInfo): Element | null {
  // Strategy 1: CSS selector path (the stored selector was designed to be unique)
  const bySelectorPath = findBySelectorPath(elementInfo);
  if (bySelectorPath) return bySelectorPath;

  // Strategy 2: Element ID
  const byId = findById(elementInfo);
  if (byId) return byId;

  return null;
}

/**
 * Strategy 1: Use the stored CSS selector path.
 * This is the most reliable method since generateSelectorPath() produces
 * unique selectors (often with nth-child).
 */
function findBySelectorPath(info: ElementInfo): Element | null {
  if (!info.selectorPath) return null;

  try {
    const element = document.querySelector(info.selectorPath);
    if (element && isTagMatch(element, info)) {
      return element;
    }
  } catch {
    // Invalid selector (shouldn't happen, but be safe)
  }

  return null;
}

/**
 * Strategy 2: Find by element ID.
 * IDs should be unique per page, so this is fast and reliable.
 */
function findById(info: ElementInfo): Element | null {
  if (!info.id) return null;

  const element = document.getElementById(info.id);
  if (element && isTagMatch(element, info)) {
    return element;
  }

  return null;
}

/**
 * Quick check that the candidate element has the same tag name.
 */
function isTagMatch(element: Element, info: ElementInfo): boolean {
  return element.tagName.toLowerCase() === info.tagName;
}
