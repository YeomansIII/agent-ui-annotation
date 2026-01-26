/**
 * CSS selector path generator
 */

import { getFirstMeaningfulClass, cleanClassName } from '../utils/css-cleaner';

const MAX_PATH_DEPTH = 4;

/** Elements that don't contribute meaningfully to paths */
const SKIP_TAGS = new Set(['html', 'body', 'main', 'div', 'span']);

/** Elements that are good path anchors */
const ANCHOR_TAGS = new Set([
  'header',
  'footer',
  'nav',
  'aside',
  'article',
  'section',
  'form',
  'table',
  'ul',
  'ol',
  'dialog',
]);

/**
 * Get a selector segment for a single element
 */
function getElementSelector(element: Element): string {
  const tagName = element.tagName.toLowerCase();

  // ID is the strongest selector
  if (element.id) {
    // Clean potential hash from ID
    const cleanId = cleanClassName(element.id);
    if (cleanId && cleanId === element.id) {
      return `#${element.id}`;
    }
  }

  // Get meaningful class
  const meaningfulClass = getFirstMeaningfulClass(element);

  // For semantic elements, prefer tag name
  if (ANCHOR_TAGS.has(tagName)) {
    return meaningfulClass ? `${tagName}.${meaningfulClass}` : tagName;
  }

  // For generic elements, prefer class
  if (meaningfulClass) {
    // If it's a div/span, just use the class
    if (SKIP_TAGS.has(tagName)) {
      return `.${meaningfulClass}`;
    }
    return `${tagName}.${meaningfulClass}`;
  }

  // Check for role attribute
  const role = element.getAttribute('role');
  if (role) {
    return `[role="${role}"]`;
  }

  // Check for data-testid
  const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  // Check for name attribute on form elements
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    if (element.name) {
      return `${tagName}[name="${element.name}"]`;
    }
  }

  // Check for type on buttons/inputs
  if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
    const type = element.type;
    if (type && type !== 'text' && type !== 'submit') {
      return `${tagName}[type="${type}"]`;
    }
  }

  // Check for href on links
  if (element instanceof HTMLAnchorElement && element.href) {
    try {
      const url = new URL(element.href);
      if (url.origin === window.location.origin && url.pathname !== '/') {
        // Use path for internal links
        return `a[href="${url.pathname}"]`;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Fall back to tag name
  return tagName;
}

/**
 * Check if a selector uniquely identifies the element
 */
function isUniqueSelector(selector: string, element: Element): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch {
    return false;
  }
}

/**
 * Get nth-child suffix if needed for uniqueness
 */
function getNthChildSuffix(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return '';

  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === element.tagName
  );

  if (siblings.length <= 1) return '';

  const index = siblings.indexOf(element) + 1;
  return `:nth-of-type(${index})`;
}

/**
 * Build path segments from element to a good ancestor
 */
function buildPathSegments(element: Element): string[] {
  const segments: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < MAX_PATH_DEPTH) {
    const tagName = current.tagName.toLowerCase();

    // Stop at body/html
    if (tagName === 'body' || tagName === 'html') {
      break;
    }

    const selector = getElementSelector(current);

    // If we find an ID, we can stop
    if (selector.startsWith('#')) {
      segments.unshift(selector);
      break;
    }

    // Skip meaningless containers unless they have useful selectors
    if (SKIP_TAGS.has(tagName) && selector === tagName) {
      current = current.parentElement;
      continue;
    }

    segments.unshift(selector);
    depth++;

    // If we reach an anchor tag, we might be able to stop
    if (ANCHOR_TAGS.has(tagName) && depth >= 2) {
      break;
    }

    current = current.parentElement;
  }

  return segments;
}

/**
 * Generate a CSS selector path for an element
 *
 * Goals:
 * - Maximum 4 levels deep
 * - Prefer IDs > meaningful classes > tag names
 * - Clean CSS module hashes
 */
export function generateSelectorPath(element: Element): string {
  // First, try direct unique selectors
  const directSelector = getElementSelector(element);
  if (directSelector.startsWith('#') || isUniqueSelector(directSelector, element)) {
    return directSelector;
  }

  // Build path segments
  const segments = buildPathSegments(element);

  if (segments.length === 0) {
    return element.tagName.toLowerCase();
  }

  // Try the path as-is
  let path = segments.join(' > ');
  if (isUniqueSelector(path, element)) {
    return path;
  }

  // Add nth-child to the last segment if needed
  const lastSegment = segments[segments.length - 1];
  const nthSuffix = getNthChildSuffix(element);
  if (nthSuffix) {
    segments[segments.length - 1] = lastSegment + nthSuffix;
    path = segments.join(' > ');
    if (isUniqueSelector(path, element)) {
      return path;
    }
  }

  // If still not unique, just return the path (best effort)
  return path;
}

/**
 * Generate a full DOM path (for forensic output)
 * Returns complete ancestry from html to element
 */
export function generateFullDomPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current) {
    const tagName = current.tagName.toLowerCase();

    if (tagName === 'html') {
      segments.unshift('html');
      break;
    }

    let segment = tagName;

    // Add ID if present
    if (current.id) {
      segment += `#${current.id}`;
    }

    // Add classes
    const classes = Array.from(current.classList).slice(0, 3);
    if (classes.length > 0) {
      segment += '.' + classes.join('.');
    }

    // Add nth-child for non-unique elements
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        segment += `:nth-child(${index})`;
      }
    }

    segments.unshift(segment);
    current = current.parentElement;
  }

  return segments.join(' > ');
}

/**
 * Generate a simple path for display purposes
 * More readable than selector path, shows hierarchy
 */
export function generateDisplayPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < 4) {
    const tagName = current.tagName.toLowerCase();

    if (tagName === 'body' || tagName === 'html') {
      break;
    }

    let segment = tagName;

    // Add ID if present
    if (current.id) {
      segment = `#${current.id}`;
    } else {
      // Add first meaningful class
      const cls = getFirstMeaningfulClass(current);
      if (cls) {
        segment = SKIP_TAGS.has(tagName) ? `.${cls}` : `${tagName}.${cls}`;
      }
    }

    segments.unshift(segment);

    // Stop at ID
    if (current.id) break;

    current = current.parentElement;
    depth++;
  }

  return segments.join(' > ');
}
