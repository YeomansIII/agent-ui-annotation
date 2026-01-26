/**
 * Core utilities - re-exports
 */

export { throttle, debounce, type ThrottledFunction } from './throttle';
export {
  cleanClassName,
  cleanClassList,
  getMeaningfulClasses,
  getFirstMeaningfulClass,
  formatClassSelector,
} from './css-cleaner';
export {
  isFixedOrSticky,
  getFixedAncestor,
  getElementPosition,
  percentToPixels,
  pixelsToPercent,
} from './fixed-detection';
