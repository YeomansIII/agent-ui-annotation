/**
 * Tests for toolbar drag helpers
 */

import { describe, it, expect } from 'vitest';
import {
  TOOLBAR_DRAG_THRESHOLD,
  TOOLBAR_VIEWPORT_PADDING,
  clampToolbarPosition,
  hasExceededDragThreshold,
  computeDraggedToolbarPosition,
} from '../../src/core/dom/toolbar-drag';

const toolbar = { width: 48, height: 48 };
const viewport = { width: 1000, height: 800 };

describe('clampToolbarPosition', () => {
  it('keeps a position inside the viewport unchanged', () => {
    expect(clampToolbarPosition(200, 300, toolbar, viewport)).toEqual({ x: 200, y: 300 });
  });

  it('clamps to the top-left padding', () => {
    expect(clampToolbarPosition(-40, -10, toolbar, viewport)).toEqual({
      x: TOOLBAR_VIEWPORT_PADDING,
      y: TOOLBAR_VIEWPORT_PADDING,
    });
  });

  it('clamps to the bottom-right padding', () => {
    expect(clampToolbarPosition(990, 790, toolbar, viewport)).toEqual({
      x: viewport.width - toolbar.width - TOOLBAR_VIEWPORT_PADDING,
      y: viewport.height - toolbar.height - TOOLBAR_VIEWPORT_PADDING,
    });
  });

  it('uses the given padding', () => {
    expect(clampToolbarPosition(0, 0, toolbar, viewport, 8)).toEqual({ x: 8, y: 8 });
  });
});

describe('hasExceededDragThreshold', () => {
  it('treats a small movement as a click', () => {
    expect(hasExceededDragThreshold(100, 100, 103, 102)).toBe(false);
  });

  it('treats movement at the threshold as a drag', () => {
    expect(hasExceededDragThreshold(100, 100, 100 + TOOLBAR_DRAG_THRESHOLD, 100)).toBe(true);
  });

  it('uses the full distance, not a single axis', () => {
    expect(hasExceededDragThreshold(0, 0, 4, 4)).toBe(true);
  });
});

describe('computeDraggedToolbarPosition', () => {
  it('moves the toolbar by the pointer delta', () => {
    const next = computeDraggedToolbarPosition(
      { x: 100, y: 200 },
      { x: 110, y: 210 },
      { x: 160, y: 250 },
      toolbar,
      viewport
    );

    expect(next).toEqual({ x: 150, y: 240 });
  });

  it('clamps the dragged position to the viewport', () => {
    const next = computeDraggedToolbarPosition(
      { x: 100, y: 200 },
      { x: 0, y: 0 },
      { x: 5000, y: 5000 },
      toolbar,
      viewport
    );

    expect(next).toEqual({
      x: viewport.width - toolbar.width - TOOLBAR_VIEWPORT_PADDING,
      y: viewport.height - toolbar.height - TOOLBAR_VIEWPORT_PADDING,
    });
  });
});
