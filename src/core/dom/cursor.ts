/**
 * Cursor style injection for active state
 */

const CURSOR_STYLE_ID = 'annotation-cursor-styles';

/** CSS for cursor override */
const CURSOR_CSS = `
  /* Crosshair for most elements */
  body:not([data-annotation-disabled]):not([data-annotation-passthrough]) *:not([data-annotation-toolbar] *):not([data-annotation-marker] *):not([data-annotation-popup] *) {
    cursor: crosshair !important;
  }

  /* Text cursor for text selection */
  body:not([data-annotation-disabled]) p:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) span:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h1:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h2:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h3:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h4:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h5:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) h6:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) li:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) td:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) th:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) code:not([data-annotation-toolbar] *),
  body:not([data-annotation-disabled]) pre:not([data-annotation-toolbar] *) {
    cursor: text !important;
  }

  /* Pointer for Annotation UI elements */
  [data-annotation-marker],
  [data-annotation-marker] *,
  [data-annotation-toolbar] button,
  [data-annotation-popup] button {
    cursor: pointer !important;
  }

  /* Default for toolbar */
  [data-annotation-toolbar],
  [data-annotation-toolbar] *,
  [data-annotation-popup],
  [data-annotation-popup] * {
    cursor: default !important;
  }

  /* Crosshair for multi-select mode */
  body[data-annotation-multiselect]:not([data-annotation-passthrough]) *:not([data-annotation-toolbar] *):not([data-annotation-marker] *):not([data-annotation-popup] *) {
    cursor: crosshair !important;
  }

  /* Move cursor when dragging toolbar */
  body[data-annotation-dragging] * {
    cursor: move !important;
  }
`;

let styleElement: HTMLStyleElement | null = null;

/**
 * Inject cursor override styles
 */
export function injectCursorStyles(): void {
  if (styleElement) return;

  styleElement = document.createElement('style');
  styleElement.id = CURSOR_STYLE_ID;
  styleElement.textContent = CURSOR_CSS;
  document.head.appendChild(styleElement);
}

/**
 * Remove cursor override styles
 */
export function removeCursorStyles(): void {
  if (!styleElement) return;

  styleElement.remove();
  styleElement = null;
}

/**
 * Set multi-select mode cursor
 */
export function setMultiSelectMode(enabled: boolean): void {
  if (enabled) {
    document.body.setAttribute('data-annotation-multiselect', '');
  } else {
    document.body.removeAttribute('data-annotation-multiselect');
  }
}

/**
 * Set dragging mode cursor
 */
export function setDraggingMode(enabled: boolean): void {
  if (enabled) {
    document.body.setAttribute('data-annotation-dragging', '');
  } else {
    document.body.removeAttribute('data-annotation-dragging');
  }
}

/**
 * Set passthrough mode to show original page cursor
 */
export function setPassthroughMode(enabled: boolean): void {
  if (enabled) {
    document.body.setAttribute('data-annotation-passthrough', '');
  } else {
    document.body.removeAttribute('data-annotation-passthrough');
  }
}

/**
 * Set disabled state
 */
export function setDisabledState(disabled: boolean): void {
  if (disabled) {
    document.body.setAttribute('data-annotation-disabled', '');
  } else {
    document.body.removeAttribute('data-annotation-disabled');
  }
}

/**
 * Clean up all cursor-related attributes and styles
 */
export function cleanupCursorStyles(): void {
  removeCursorStyles();
  document.body.removeAttribute('data-annotation-multiselect');
  document.body.removeAttribute('data-annotation-dragging');
  document.body.removeAttribute('data-annotation-disabled');
  document.body.removeAttribute('data-annotation-passthrough');
}
