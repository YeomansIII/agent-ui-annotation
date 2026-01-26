/**
 * Marker template
 */

import type { Scope } from '../../core/types';

export interface MarkerRenderOptions {
  scope: Scope;
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
function getMarkerPosition(scope: Scope, scrollY: number): { x: number; y: number; isFixed: boolean } {
  const isFixed = scope.elementInfo.isFixed;
  const x = scope.clickX;
  const y = scope.clickY;

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
  const { scope, isHovered, isExiting, isAnimating, scrollY, accentColor, skipTooltipAnimation = false } = options;

  const pos = getMarkerPosition(scope, scrollY);

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
      data-scope-id="${scope.id}"
      title="${scope.elementInfo.humanReadable}"
    >
      ${scope.number}
      ${isHovered ? renderMarkerTooltip(scope, skipTooltipAnimation) : ''}
    </div>
  `;
}

/**
 * Render marker tooltip
 */
function renderMarkerTooltip(scope: Scope, skipAnimation: boolean): string {
  const element = scope.elementInfo.humanReadable;
  const comment = scope.comment
    ? scope.comment.length > 100
      ? scope.comment.slice(0, 100) + '...'
      : scope.comment
    : '(no comment)';

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
 * Render a pending marker (shown while popup is open before scope is created)
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
  scopes: Scope[];
  hoveredMarkerId: string | null;
  exitingMarkers: Set<string>;
  animatingMarkers: Set<string>;
  scrollY: number;
  accentColor: string;
  pendingMarker?: PendingMarker | null;
  pendingMarkers?: PendingMarker[];
  skipTooltipAnimation?: boolean;
}): string {
  const { scopes, hoveredMarkerId, exitingMarkers, animatingMarkers, scrollY, accentColor, pendingMarker, pendingMarkers = [], skipTooltipAnimation = false } = options;

  const markerHtml = scopes
    .map((scope) =>
      renderMarker({
        scope,
        isHovered: scope.id === hoveredMarkerId,
        isExiting: exitingMarkers.has(scope.id),
        isAnimating: animatingMarkers.has(scope.id),
        scrollY,
        accentColor,
        skipTooltipAnimation,
      })
    )
    .join('');

  // Add pending markers if popup is open for new scope(s)
  let pendingHtml = '';

  if (pendingMarkers.length > 0) {
    // Multi-select: render pending markers for all selected elements
    pendingHtml = pendingMarkers
      .map((pm, i) => renderPendingMarker(pm, scrollY, accentColor, scopes.length + 1 + i))
      .join('');
  } else if (pendingMarker) {
    // Single selection: render one pending marker
    pendingHtml = renderPendingMarker(pendingMarker, scrollY, accentColor, scopes.length + 1);
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
