/**
 * Accessibility information collection
 */

import type { AccessibilityInfo } from '../types';

/** Selectors for interactive elements */
const INTERACTIVE_SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[contenteditable="true"]',
];

/**
 * Check if an element is interactive (focusable and activatable)
 */
export function isInteractive(element: Element): boolean {
  // Check if matches any interactive selector
  for (const selector of INTERACTIVE_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch {
      // Ignore invalid selectors
    }
  }

  // Check for click handlers (heuristic)
  if (element.hasAttribute('onclick') || element.hasAttribute('data-onclick')) {
    return true;
  }

  // Check cursor style (heuristic)
  const style = window.getComputedStyle(element);
  if (style.cursor === 'pointer') {
    return true;
  }

  return false;
}

/**
 * Get the ARIA role of an element
 */
function getRole(element: Element): string | null {
  // Explicit role
  const explicitRole = element.getAttribute('role');
  if (explicitRole) {
    return explicitRole;
  }

  // Implicit roles based on tag name
  const tagName = element.tagName.toLowerCase();
  const implicitRoles: Record<string, string | null> = {
    a: element.hasAttribute('href') ? 'link' : null,
    article: 'article',
    aside: 'complementary',
    button: 'button',
    dialog: 'dialog',
    footer: 'contentinfo',
    form: 'form',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    header: 'banner',
    img: 'img',
    input: getInputRole(element as HTMLInputElement),
    li: 'listitem',
    main: 'main',
    nav: 'navigation',
    ol: 'list',
    option: 'option',
    progress: 'progressbar',
    section: element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby') ? 'region' : null,
    select: 'combobox',
    table: 'table',
    tbody: 'rowgroup',
    td: 'cell',
    textarea: 'textbox',
    th: 'columnheader',
    thead: 'rowgroup',
    tr: 'row',
    ul: 'list',
  } as Record<string, string | null>;

  return implicitRoles[tagName] || null;
}

/**
 * Get implicit role for input element based on type
 */
function getInputRole(element: HTMLInputElement): string | null {
  const type = element.type;
  const inputRoles: Record<string, string> = {
    button: 'button',
    checkbox: 'checkbox',
    email: 'textbox',
    image: 'button',
    number: 'spinbutton',
    radio: 'radio',
    range: 'slider',
    reset: 'button',
    search: 'searchbox',
    submit: 'button',
    tel: 'textbox',
    text: 'textbox',
    url: 'textbox',
  };

  return inputRoles[type] || 'textbox';
}

/**
 * Get tab index, returning null if not set
 */
function getTabIndex(element: Element): number | null {
  if (element.hasAttribute('tabindex')) {
    return (element as HTMLElement).tabIndex;
  }

  // Return implied tabindex for natively focusable elements
  if (element.matches('a[href], button, input, select, textarea, [contenteditable="true"]')) {
    return 0;
  }

  return null;
}

/**
 * Get referenced element text by ID
 */
function getReferencedText(attrValue: string | null): string | null {
  if (!attrValue) return null;

  const ids = attrValue.split(/\s+/);
  const texts: string[] = [];

  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) {
      const text = element.textContent?.trim();
      if (text) {
        texts.push(text);
      }
    }
  }

  return texts.length > 0 ? texts.join(' ') : null;
}

/**
 * Collect accessibility information for an element
 */
export function getAccessibilityInfo(element: Element): AccessibilityInfo {
  return {
    role: getRole(element),
    ariaLabel: element.getAttribute('aria-label'),
    ariaDescribedBy: getReferencedText(element.getAttribute('aria-describedby')),
    ariaLabelledBy: getReferencedText(element.getAttribute('aria-labelledby')),
    tabIndex: getTabIndex(element),
    isInteractive: isInteractive(element),
  };
}

/**
 * Format accessibility info as a string for output
 */
export function formatAccessibilityInfo(info: AccessibilityInfo): string {
  const parts: string[] = [];

  if (info.role) {
    parts.push(`Role: ${info.role}`);
  }

  if (info.ariaLabel) {
    parts.push(`Label: "${info.ariaLabel}"`);
  }

  if (info.ariaLabelledBy) {
    parts.push(`Labelled by: "${info.ariaLabelledBy}"`);
  }

  if (info.ariaDescribedBy) {
    parts.push(`Described by: "${info.ariaDescribedBy}"`);
  }

  if (info.tabIndex !== null) {
    parts.push(`Tab index: ${info.tabIndex}`);
  }

  if (info.isInteractive) {
    parts.push('Interactive: yes');
  }

  return parts.join('\n');
}

/**
 * Get the containing landmark element, if any
 */
export function getContainingLandmark(element: Element): Element | null {
  const landmarkRoles = ['banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search'];
  const landmarkTags = ['header', 'footer', 'nav', 'main', 'aside', 'form', 'section'];

  let current = element.parentElement;

  while (current && current !== document.body) {
    const role = current.getAttribute('role');
    if (role && landmarkRoles.includes(role)) {
      return current;
    }

    const tagName = current.tagName.toLowerCase();
    if (landmarkTags.includes(tagName)) {
      // Section needs aria-label to be a landmark
      if (tagName === 'section') {
        if (current.hasAttribute('aria-label') || current.hasAttribute('aria-labelledby')) {
          return current;
        }
      } else {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Describe a landmark element
 */
export function describeLandmark(element: Element | null): string | null {
  if (!element) return null;

  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  const label = element.getAttribute('aria-label');

  if (label) {
    return `${role} "${label}"`;
  }

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelText = getReferencedText(labelledBy);
    if (labelText) {
      return `${role} "${labelText}"`;
    }
  }

  return role;
}
