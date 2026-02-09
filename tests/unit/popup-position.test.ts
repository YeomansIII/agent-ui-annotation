/**
 * Tests for popup positioning helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePopupPosition } from '../../src/element/popup-position';

// Mock window dimensions
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true, configurable: true });
};

describe('calculatePopupPosition', () => {
  beforeEach(() => {
    setViewport(1024, 768);
  });

  it('should position popup to the right of click point by default', () => {
    const pos = calculatePopupPosition(200, 400);
    expect(pos.left).toBeGreaterThan(200);
    expect(pos.top).toBeLessThan(400);
  });

  it('should flip popup to the left when near right edge', () => {
    const pos = calculatePopupPosition(900, 400);
    // popup (default 340px wide) should be to the left of the click point
    expect(pos.left).toBeLessThan(900);
  });

  it('should clamp popup to top edge', () => {
    const pos = calculatePopupPosition(200, 10);
    expect(pos.top).toBeGreaterThanOrEqual(12); // margin
  });

  it('should clamp popup to bottom edge', () => {
    const pos = calculatePopupPosition(200, 750);
    const defaultHeight = 320;
    expect(pos.top + defaultHeight).toBeLessThanOrEqual(768);
  });

  it('should clamp popup to left edge', () => {
    const pos = calculatePopupPosition(5, 400);
    expect(pos.left).toBeGreaterThanOrEqual(12); // margin
  });

  it('should use custom popup size when provided', () => {
    const pos = calculatePopupPosition(500, 400, { width: 200, height: 150 });
    expect(pos.left).toBeGreaterThan(0);
    expect(pos.top).toBeGreaterThan(0);
  });

  it('should use custom margin', () => {
    const pos = calculatePopupPosition(200, 400, undefined, 20);
    expect(pos.left).toBeGreaterThanOrEqual(20);
    expect(pos.top).toBeGreaterThanOrEqual(20);
  });

  it('should handle very small viewports', () => {
    setViewport(200, 200);
    const pos = calculatePopupPosition(100, 100, { width: 180, height: 180 });
    expect(pos.left).toBeGreaterThanOrEqual(0);
    expect(pos.top).toBeGreaterThanOrEqual(0);
    expect(pos.left + 180).toBeLessThanOrEqual(200);
  });

  it('should handle click at viewport center', () => {
    const pos = calculatePopupPosition(512, 384);
    expect(pos.left).toBeGreaterThan(0);
    expect(pos.top).toBeGreaterThan(0);
  });

  it('should handle click at origin (0, 0)', () => {
    const pos = calculatePopupPosition(0, 0);
    expect(pos.left).toBeGreaterThanOrEqual(12);
    expect(pos.top).toBeGreaterThanOrEqual(12);
  });
});
