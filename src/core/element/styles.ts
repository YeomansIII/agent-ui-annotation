/**
 * Computed style collection for elements
 */

import type { ComputedStylesSubset } from '../types';

/** Default/browser values that should be excluded from output */
const DEFAULT_VALUES = new Set([
  'none',
  'normal',
  'auto',
  '0px',
  '0',
  'transparent',
  'static',
  'visible',
  'start',
  'baseline',
  'stretch',
  'currentcolor',
  'rgba(0, 0, 0, 0)',
  'rgb(0, 0, 0)',
  'initial',
  'inherit',
  'unset',
]);

/** Style properties relevant for text elements */
const TEXT_PROPERTIES = [
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'letterSpacing',
  'textTransform',
];

/** Style properties relevant for buttons/links */
const BUTTON_PROPERTIES = [
  'backgroundColor',
  'color',
  'padding',
  'borderRadius',
  'fontSize',
  'fontWeight',
  'border',
  'boxShadow',
  'cursor',
];

/** Style properties relevant for form inputs */
const INPUT_PROPERTIES = [
  'backgroundColor',
  'color',
  'padding',
  'borderRadius',
  'fontSize',
  'border',
  'outline',
  'boxShadow',
];

/** Style properties relevant for media elements */
const MEDIA_PROPERTIES = [
  'width',
  'height',
  'objectFit',
  'borderRadius',
  'boxShadow',
  'border',
];

/** Style properties relevant for containers */
const CONTAINER_PROPERTIES = [
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
  'padding',
  'margin',
  'backgroundColor',
  'borderRadius',
  'boxShadow',
];

/** Full list of properties for forensic output */
const FORENSIC_PROPERTIES = [
  // Colors
  'color',
  'backgroundColor',
  'borderColor',
  'outlineColor',
  // Typography
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textTransform',
  'whiteSpace',
  'wordBreak',
  'wordSpacing',
  // Box Model
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'border',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'boxSizing',
  // Layout
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'float',
  'clear',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'order',
  'gap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  // Visual Effects
  'opacity',
  'visibility',
  'overflow',
  'overflowX',
  'overflowY',
  'boxShadow',
  'textShadow',
  'filter',
  'backdropFilter',
  // Transform
  'transform',
  'transformOrigin',
  'transition',
  'animation',
  // Other
  'zIndex',
  'cursor',
  'pointerEvents',
  'userSelect',
  'objectFit',
  'objectPosition',
];

/**
 * Determine element category for style selection
 */
function getElementCategory(element: Element): 'text' | 'button' | 'input' | 'media' | 'container' {
  const tagName = element.tagName.toLowerCase();

  // Buttons
  if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    (element instanceof HTMLInputElement &&
      ['button', 'submit', 'reset'].includes(element.type))
  ) {
    return 'button';
  }

  // Links
  if (tagName === 'a') {
    return 'button';
  }

  // Form inputs
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
    return 'input';
  }

  // Media
  if (tagName === 'img' || tagName === 'video' || tagName === 'canvas' || tagName === 'svg') {
    return 'media';
  }

  // Text elements
  if (
    /^h[1-6]$/.test(tagName) ||
    tagName === 'p' ||
    tagName === 'span' ||
    tagName === 'label' ||
    tagName === 'code' ||
    tagName === 'pre' ||
    tagName === 'blockquote' ||
    tagName === 'li'
  ) {
    return 'text';
  }

  // Default to container
  return 'container';
}

/**
 * Get relevant style properties for an element category
 */
function getRelevantProperties(category: 'text' | 'button' | 'input' | 'media' | 'container'): string[] {
  switch (category) {
    case 'text':
      return TEXT_PROPERTIES;
    case 'button':
      return BUTTON_PROPERTIES;
    case 'input':
      return INPUT_PROPERTIES;
    case 'media':
      return MEDIA_PROPERTIES;
    case 'container':
      return CONTAINER_PROPERTIES;
  }
}

/**
 * Check if a style value is a default/meaningless value
 */
function isDefaultValue(value: string): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase().trim();
  return DEFAULT_VALUES.has(normalized);
}

/**
 * Format a CSS property name for output
 */
function formatPropertyName(camelCase: string): string {
  return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Collect contextual styles (relevant to element type)
 */
export function getContextualStyles(element: Element): Record<string, string> {
  const category = getElementCategory(element);
  const properties = getRelevantProperties(category);
  const computed = window.getComputedStyle(element);
  const result: Record<string, string> = {};

  for (const prop of properties) {
    const value = computed.getPropertyValue(formatPropertyName(prop)) ||
      (computed as unknown as Record<string, string>)[prop];

    if (value && !isDefaultValue(value)) {
      result[prop] = value;
    }
  }

  return result;
}

/**
 * Collect full computed styles for forensic output
 */
export function getForensicStyles(element: Element): ComputedStylesSubset {
  const computed = window.getComputedStyle(element);

  return {
    display: computed.display,
    position: computed.position,
    visibility: computed.visibility,
    opacity: computed.opacity,
    zIndex: computed.zIndex,
    overflow: computed.overflow,
    pointerEvents: computed.pointerEvents,
    cursor: computed.cursor,
    backgroundColor: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize,
    fontFamily: computed.fontFamily,
    fontWeight: computed.fontWeight,
    lineHeight: computed.lineHeight,
    padding: computed.padding,
    margin: computed.margin,
    border: computed.border,
    borderRadius: computed.borderRadius,
    boxShadow: computed.boxShadow,
    transform: computed.transform,
    transition: computed.transition,
  };
}

/**
 * Collect all non-default forensic styles
 */
export function getAllForensicStyles(element: Element): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const result: Record<string, string> = {};

  for (const prop of FORENSIC_PROPERTIES) {
    const kebabProp = formatPropertyName(prop);
    const value = computed.getPropertyValue(kebabProp);

    if (value && !isDefaultValue(value)) {
      result[kebabProp] = value;
    }
  }

  return result;
}

/**
 * Format styles as a string for output
 */
export function formatStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([prop, value]) => `${formatPropertyName(prop)}: ${value}`)
    .join('\n');
}

/**
 * Format styles as inline CSS
 */
export function formatInlineStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([prop, value]) => `${formatPropertyName(prop)}: ${value};`)
    .join(' ');
}
