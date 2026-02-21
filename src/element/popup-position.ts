/**
 * Popup positioning helpers
 */

export interface PopupSize {
  width: number;
  height: number;
}

export interface PopupPosition {
  left: number;
  top: number;
}

const DEFAULT_POPUP_WIDTH = 340;
const DEFAULT_POPUP_HEIGHT = 320;

export function calculatePopupPosition(
  clickX: number,
  clickY: number,
  popupSize?: PopupSize,
  margin: number = 12
): PopupPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = popupSize?.width ?? DEFAULT_POPUP_WIDTH;
  const height = popupSize?.height ?? DEFAULT_POPUP_HEIGHT;

  // Default: position to the right of the click point
  let left = clickX + margin;
  let top = clickY - height / 2;

  // If would overflow right edge, position to the left of click point
  if (left + width > viewportWidth - margin) {
    left = clickX - width - margin;
  }

  // If would overflow left edge, center horizontally at click point
  if (left < margin) {
    left = Math.max(margin, clickX - width / 2);
  }

  // Clamp to viewport bounds
  left = Math.max(margin, Math.min(left, viewportWidth - width - margin));

  // Vertical positioning
  if (top < margin) {
    top = margin;
  }
  if (top + height > viewportHeight - margin) {
    top = viewportHeight - height - margin;
  }

  return { left, top };
}
