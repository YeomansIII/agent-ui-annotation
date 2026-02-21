/**
 * DOM interaction module - re-exports
 */

export {
  createEventHandlers,
  isAnnotationElement,
  getTargetElement,
  getSelectedText,
  type EventHandlers,
} from './events';

export {
  createHoverDetection,
  type HoverDetection,
} from './hover-detection';

export {
  createMultiSelect,
  normalizeRect,
  type MultiSelect,
} from './multi-select';

export {
  createFreezeManager,
  type FreezeManager,
} from './freeze';

export {
  injectCursorStyles,
  removeCursorStyles,
  setMultiSelectMode,
  setDraggingMode,
  setDisabledState,
  cleanupCursorStyles,
} from './cursor';

export {
  refindElement,
} from './element-refinder';
