/**
 * Marker template
 */

import type { Annotation, MarkerVisibility } from '../../core/types';
import { t } from '../../core/i18n';

export interface MarkerRenderOptions {
  annotation: Annotation;
  isHovered: boolean;
  isExiting: boolean;
  isAnimating: boolean;
  scrollY: number;
  accentColor: string;
  markerVisibility?: MarkerVisibility;
  skipTooltipAnimation?: boolean;
}

/**
 * Check if an element is visible within all its ancestor scroll containers.
 * Returns false if the element is clipped (scrolled out of view) by any ancestor.
 */
function isVisibleInScrollAncestors(element: Element): boolean {
  const elementRect = element.getBoundingClientRect();
  let current = element.parentElement;

  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current);
    const overflowX = style.overflowX;
    const overflowY = style.overflowY;

    if (
      overflowX === 'hidden' || overflowX === 'scroll' || overflowX === 'auto' ||
      overflowY === 'hidden' || overflowY === 'scroll' || overflowY === 'auto'
    ) {
      const containerRect = current.getBoundingClientRect();
      if (
        elementRect.bottom <= containerRect.top ||
        elementRect.top >= containerRect.bottom ||
        elementRect.right <= containerRect.left ||
        elementRect.left >= containerRect.right
      ) {
        return false;
      }
    }

    current = current.parentElement;
  }

  return true;
}

/**
 * Calculate marker position based on live element or stored coordinates.
 *
 * When the annotation has a connected DOM element, we use
 * getBoundingClientRect() + stored offset percentages for pixel-perfect
 * tracking as the element scrolls, resizes, or repositions.
 *
 * When the element is unavailable (e.g., removed from DOM, not yet
 * re-found after reload), we fall back to stored document-absolute
 * coordinates, converting to viewport by subtracting current scrollY.
 */
function getMarkerPosition(
  annotation: Annotation,
  scrollY: number
): { x: number; y: number; hidden: boolean } {
  // Live element tracking: use getBoundingClientRect() for real-time position
  if (annotation.element && annotation.element.isConnected) {
    const rect = annotation.element.getBoundingClientRect();

    // Element is hidden (zero dimensions — display:none, collapsed, etc.)
    if (rect.width === 0 && rect.height === 0) {
      return { x: 0, y: 0, hidden: true };
    }

    // Element is clipped by an ancestor scroll container
    if (!isVisibleInScrollAncestors(annotation.element)) {
      return { x: 0, y: 0, hidden: true };
    }

    const offsetX = annotation.offsetX;
    const offsetY = annotation.offsetY;

    // getBoundingClientRect() returns viewport-relative coordinates,
    // which map directly to our fixed-position markers container
    return {
      x: rect.left + rect.width * offsetX,
      y: rect.top + rect.height * offsetY,
      hidden: false,
    };
  }

  // Fallback: stored document-absolute coords → convert to viewport
  return { x: annotation.clickX, y: annotation.clickY - scrollY, hidden: false };
}

/**
 * Render a single marker
 */
export function renderMarker(options: MarkerRenderOptions): string {
  const { annotation, isHovered, isExiting, isAnimating, scrollY, accentColor, markerVisibility = 'full', skipTooltipAnimation = false } = options;

  const pos = getMarkerPosition(annotation, scrollY);

  // Don't render markers whose elements are hidden
  if (pos.hidden) return '';

  const isDots = markerVisibility === 'dots';

  const classes = [
    'marker',
    isExiting ? 'exiting' : '',
    isAnimating ? 'entering' : '',
    isDots ? 'dot-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = `
    left: ${pos.x}px;
    top: ${pos.y}px;
    background-color: ${accentColor};
  `;

  return `
    <div
      class="${classes}"
      style="${style}"
      data-annotation-marker
      data-annotation-id="${annotation.id}"
      title="${annotation.elementInfo.humanReadable}"
    >
      ${isDots ? '' : annotation.number}
      ${!isDots && isHovered ? renderMarkerTooltip(annotation, skipTooltipAnimation, pos.x, pos.y) : ''}
    </div>
  `;
}

/**
 * Render marker tooltip with viewport-aware positioning.
 * Uses the marker's viewport position to determine if the tooltip
 * should appear below (near top edge) or shift horizontally (near side edges).
 */
function renderMarkerTooltip(annotation: Annotation, skipAnimation: boolean, markerX: number, markerY: number): string {
  const element = annotation.elementInfo.humanReadable;
  const comment = annotation.comment
    ? annotation.comment.length > 100
      ? annotation.comment.slice(0, 100) + '...'
      : annotation.comment
    : t('marker.noComment');

  const tooltipWidth = 300; // max-width from CSS
  const tooltipHeight = 60; // approximate
  const edgeMargin = 16;

  const classes = ['marker-tooltip'];

  // Vertical: show below if marker is too close to top of viewport
  if (markerY < tooltipHeight + edgeMargin + 24) {
    classes.push('below');
  }

  // Horizontal: shift if marker is too close to viewport edges
  if (markerX < tooltipWidth / 2 + edgeMargin) {
    classes.push('align-start');
  } else if (markerX > window.innerWidth - tooltipWidth / 2 - edgeMargin) {
    classes.push('align-end');
  }

  if (skipAnimation) classes.push('no-animate');

  return `
    <div class="${classes.join(' ')}">
      <div class="tooltip-element">${escapeHtml(element)}</div>
      <div class="tooltip-comment">${escapeHtml(comment)}</div>
    </div>
  `;
}

export interface PendingMarker {
  x: number;
  y: number;
}

/**
 * Render a pending marker (shown while popup is open before annotation is created)
 */
function renderPendingMarker(pending: PendingMarker, scrollY: number, accentColor: string, nextNumber: number): string {
  const x = pending.x;
  const y = pending.y - scrollY;

  const style = `
    left: ${x}px;
    top: ${y}px;
    background-color: ${accentColor};
    opacity: 0.7;
  `;

  return `
    <div
      class="marker pending"
      style="${style}"
      data-annotation-marker
      data-pending="true"
    >
      ${nextNumber}
    </div>
  `;
}

/**
 * Render all markers
 */
export function renderMarkers(options: {
  annotations: Annotation[];
  hoveredMarkerId: string | null;
  exitingMarkers: Set<string>;
  animatingMarkers: Set<string>;
  scrollY: number;
  accentColor: string;
  markerVisibility?: MarkerVisibility;
  pendingMarker?: PendingMarker | null;
  pendingMarkers?: PendingMarker[];
  nextNumber?: number;
  skipTooltipAnimation?: boolean;
}): string {
  const { annotations, hoveredMarkerId, exitingMarkers, animatingMarkers, scrollY, accentColor, markerVisibility = 'full', pendingMarker, pendingMarkers = [], nextNumber, skipTooltipAnimation = false } = options;

  const markerHtml = annotations
    .map((annotation) =>
      renderMarker({
        annotation,
        isHovered: annotation.id === hoveredMarkerId,
        isExiting: exitingMarkers.has(annotation.id),
        isAnimating: animatingMarkers.has(annotation.id),
        scrollY,
        accentColor,
        markerVisibility,
        skipTooltipAnimation,
      })
    )
    .join('');

  // Add pending markers if popup is open for new annotation(s)
  let pendingHtml = '';

  const baseNumber = nextNumber ?? (annotations.length + 1);

  if (pendingMarkers.length > 0) {
    // Multi-select: render pending markers for all selected elements
    pendingHtml = pendingMarkers
      .map((pm, i) => renderPendingMarker(pm, scrollY, accentColor, baseNumber + i))
      .join('');
  } else if (pendingMarker) {
    // Single selection: render one pending marker
    pendingHtml = renderPendingMarker(pendingMarker, scrollY, accentColor, baseNumber);
  }

  return `<div class="markers">${markerHtml}${pendingHtml}</div>`;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
