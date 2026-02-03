/**
 * Marker template
 */

import type { Annotation } from '../../core/types';
import { t } from '../../core/i18n';

export interface MarkerRenderOptions {
  annotation: Annotation;
  isHovered: boolean;
  isExiting: boolean;
  isAnimating: boolean;
  scrollY: number;
  accentColor: string;
  skipTooltipAnimation?: boolean;
}

/**
 * Calculate marker position based on click coordinates
 *
 * Click coordinates are stored as:
 * - Fixed elements: viewport coordinates
 * - Non-fixed elements: document coordinates (viewport + scroll at click time)
 *
 * Rendering:
 * - Fixed elements: use stored coords directly (CSS position: fixed)
 * - Non-fixed elements: subtract current scroll to get viewport position
 */
function getMarkerPosition(annotation: Annotation, scrollY: number): { x: number; y: number; isFixed: boolean } {
  const isFixed = annotation.elementInfo.isFixed;
  const x = annotation.clickX;
  const y = annotation.clickY;

  if (isFixed) {
    // Fixed elements: coords are viewport-relative, use directly
    return { x, y, isFixed: true };
  }

  // Non-fixed elements: coords are document-relative, convert to viewport
  return { x, y: y - scrollY, isFixed: false };
}

/**
 * Render a single marker
 */
export function renderMarker(options: MarkerRenderOptions): string {
  const { annotation, isHovered, isExiting, isAnimating, scrollY, accentColor, skipTooltipAnimation = false } = options;

  const pos = getMarkerPosition(annotation, scrollY);

  const classes = [
    'marker',
    pos.isFixed ? 'fixed' : '',
    isExiting ? 'exiting' : '',
    isAnimating ? 'entering' : '',
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
      ${annotation.number}
      ${isHovered ? renderMarkerTooltip(annotation, skipTooltipAnimation) : ''}
    </div>
  `;
}

/**
 * Render marker tooltip
 */
function renderMarkerTooltip(annotation: Annotation, skipAnimation: boolean): string {
  const element = annotation.elementInfo.humanReadable;
  const comment = annotation.comment
    ? annotation.comment.length > 100
      ? annotation.comment.slice(0, 100) + '...'
      : annotation.comment
    : t('marker.noComment');

  return `
    <div class="marker-tooltip${skipAnimation ? ' no-animate' : ''}">
      <div class="tooltip-element">${escapeHtml(element)}</div>
      <div class="tooltip-comment">${escapeHtml(comment)}</div>
    </div>
  `;
}

export interface PendingMarker {
  x: number;
  y: number;
  isFixed: boolean;
}

/**
 * Render a pending marker (shown while popup is open before annotation is created)
 */
function renderPendingMarker(pending: PendingMarker, scrollY: number, accentColor: string, nextNumber: number): string {
  const x = pending.x;
  const y = pending.isFixed ? pending.y : pending.y - scrollY;

  const style = `
    left: ${x}px;
    top: ${y}px;
    background-color: ${accentColor};
    opacity: 0.7;
  `;

  return `
    <div
      class="marker pending${pending.isFixed ? ' fixed' : ''}"
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
  pendingMarker?: PendingMarker | null;
  pendingMarkers?: PendingMarker[];
  skipTooltipAnimation?: boolean;
}): string {
  const { annotations, hoveredMarkerId, exitingMarkers, animatingMarkers, scrollY, accentColor, pendingMarker, pendingMarkers = [], skipTooltipAnimation = false } = options;

  const markerHtml = annotations
    .map((annotation) =>
      renderMarker({
        annotation,
        isHovered: annotation.id === hoveredMarkerId,
        isExiting: exitingMarkers.has(annotation.id),
        isAnimating: animatingMarkers.has(annotation.id),
        scrollY,
        accentColor,
        skipTooltipAnimation,
      })
    )
    .join('');

  // Add pending markers if popup is open for new annotation(s)
  let pendingHtml = '';

  if (pendingMarkers.length > 0) {
    // Multi-select: render pending markers for all selected elements
    pendingHtml = pendingMarkers
      .map((pm, i) => renderPendingMarker(pm, scrollY, accentColor, annotations.length + 1 + i))
      .join('');
  } else if (pendingMarker) {
    // Single selection: render one pending marker
    pendingHtml = renderPendingMarker(pendingMarker, scrollY, accentColor, annotations.length + 1);
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
