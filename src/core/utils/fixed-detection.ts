/**
 * Fixed/sticky element detection utilities
 */

/**
 * Check if an element or any of its ancestors has fixed or sticky positioning
 */
export function isFixedOrSticky(element: Element | null): boolean {
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const position = style.position;

    if (position === 'fixed' || position === 'sticky') {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

/**
 * Get the fixed/sticky ancestor if one exists
 */
export function getFixedAncestor(element: Element | null): Element | null {
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const position = style.position;

    if (position === 'fixed' || position === 'sticky') {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Get the position of an element relative to either viewport (if fixed) or document
 */
export function getElementPosition(element: Element): {
  x: number;
  y: number;
  isFixed: boolean;
} {
  const rect = element.getBoundingClientRect();
  const isFixed = isFixedOrSticky(element);

  if (isFixed) {
    // For fixed elements, use viewport-relative position
    return {
      x: rect.left,
      y: rect.top,
      isFixed: true,
    };
  }

  // For non-fixed elements, use document-relative position
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    isFixed: false,
  };
}

/**
 * Convert percentage position to pixels for a given viewport dimension
 */
export function percentToPixels(percent: number, viewportDimension: number): number {
  return (percent / 100) * viewportDimension;
}

/**
 * Convert pixel position to percentage of viewport
 */
export function pixelsToPercent(pixels: number, viewportDimension: number): number {
  return (pixels / viewportDimension) * 100;
}
