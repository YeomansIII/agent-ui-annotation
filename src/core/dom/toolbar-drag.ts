/**
 * Helpers for dragging the floating toolbar / activation button
 */

import type { Position } from '../types';

/** Movement (px) required before a pointer gesture counts as a drag */
export const TOOLBAR_DRAG_THRESHOLD = 5;

/** Minimum gap between the toolbar and the viewport edge */
export const TOOLBAR_VIEWPORT_PADDING = 20;

export interface ToolbarSize {
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Keep the toolbar fully inside the viewport.
 */
export function clampToolbarPosition(
  x: number,
  y: number,
  toolbar: ToolbarSize,
  viewport: ViewportSize,
  padding: number = TOOLBAR_VIEWPORT_PADDING
): Position {
  const maxX = Math.max(padding, viewport.width - toolbar.width - padding);
  const maxY = Math.max(padding, viewport.height - toolbar.height - padding);

  return {
    x: Math.min(Math.max(x, padding), maxX),
    y: Math.min(Math.max(y, padding), maxY),
  };
}

/**
 * True when the pointer has moved far enough to count as a drag, not a click.
 */
export function hasExceededDragThreshold(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  threshold: number = TOOLBAR_DRAG_THRESHOLD
): boolean {
  const dx = currentX - startX;
  const dy = currentY - startY;
  return dx * dx + dy * dy >= threshold * threshold;
}

/**
 * Translate the toolbar by the pointer delta and clamp to the viewport.
 */
export function computeDraggedToolbarPosition(
  origin: Position,
  startPointer: Position,
  currentPointer: Position,
  toolbar: ToolbarSize,
  viewport: ViewportSize,
  padding: number = TOOLBAR_VIEWPORT_PADDING
): Position {
  return clampToolbarPosition(
    origin.x + (currentPointer.x - startPointer.x),
    origin.y + (currentPointer.y - startPointer.y),
    toolbar,
    viewport,
    padding
  );
}
