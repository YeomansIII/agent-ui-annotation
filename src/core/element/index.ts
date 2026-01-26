/**
 * Element analysis module - re-exports
 */

export { identifyElement } from './identifier';
export {
  generateSelectorPath,
  generateFullDomPath,
  generateDisplayPath,
} from './path-generator';
export {
  getAccessibilityInfo,
  formatAccessibilityInfo,
  isInteractive,
  getContainingLandmark,
  describeLandmark,
} from './accessibility';
export {
  getContextualStyles,
  getForensicStyles,
  getAllForensicStyles,
  formatStyles,
  formatInlineStyles,
} from './styles';

import type { ElementInfo, ElementRect, NearbyContext } from '../types';
import { identifyElement } from './identifier';
import { generateSelectorPath, generateFullDomPath } from './path-generator';
import { getAccessibilityInfo, getContainingLandmark, describeLandmark } from './accessibility';
import { getForensicStyles } from './styles';
import { isFixedOrSticky } from '../utils/fixed-detection';
import { getMeaningfulClasses } from '../utils/css-cleaner';

const MAX_TEXT_LENGTH = 200;

/**
 * Get the bounding rectangle of an element
 */
export function getElementRect(element: Element): ElementRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

/**
 * Get nearby context (parent, siblings)
 */
export function getNearbyContext(element: Element): NearbyContext {
  const parent = element.parentElement;
  const prevSibling = element.previousElementSibling;
  const nextSibling = element.nextElementSibling;
  const landmark = getContainingLandmark(element);

  return {
    parent: parent ? identifyElement(parent) : null,
    previousSibling: prevSibling ? identifyElement(prevSibling) : null,
    nextSibling: nextSibling ? identifyElement(nextSibling) : null,
    containingLandmark: describeLandmark(landmark),
  };
}

/**
 * Get element attributes as a record
 */
export function getElementAttributes(element: Element): Record<string, string> {
  const result: Record<string, string> = {};
  const skipAttrs = new Set(['class', 'style', 'id']); // Already captured elsewhere

  for (const attr of Array.from(element.attributes)) {
    if (!skipAttrs.has(attr.name)) {
      result[attr.name] = attr.value;
    }
  }

  return result;
}

/**
 * Get truncated inner text
 */
export function getInnerText(element: Element): string {
  const text = element.textContent || '';
  const cleaned = text.trim().replace(/\s+/g, ' ');

  if (cleaned.length <= MAX_TEXT_LENGTH) {
    return cleaned;
  }

  return cleaned.slice(0, MAX_TEXT_LENGTH - 3) + '...';
}

/**
 * Collect complete element information
 *
 * @param element - The DOM element to analyze
 * @param includeForensic - Whether to include forensic details (computed styles)
 */
export function collectElementInfo(element: Element, includeForensic: boolean = false): ElementInfo {
  return {
    humanReadable: identifyElement(element),
    selectorPath: generateSelectorPath(element),
    fullDomPath: generateFullDomPath(element),
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: getMeaningfulClasses(element),
    rect: getElementRect(element),
    accessibility: getAccessibilityInfo(element),
    computedStyles: includeForensic ? getForensicStyles(element) : null,
    nearbyContext: getNearbyContext(element),
    innerText: getInnerText(element),
    attributes: getElementAttributes(element),
    isFixed: isFixedOrSticky(element),
  };
}
