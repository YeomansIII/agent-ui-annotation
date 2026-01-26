/**
 * Core module - main exports
 */

// Types
export type {
  AnnotationId,
  Position,
  ElementRect,
  AccessibilityInfo,
  ComputedStylesSubset,
  NearbyContext,
  ElementInfo,
  Scope,
  OutputLevel,
  ThemeMode,
  ToolbarPosition,
  ToolMode,
  Settings,
  SelectionRect,
  EnvironmentInfo,
  EventMap,
  AppState,
  AnnotationEventDetail,
  AnnotationColor,
} from './types';

export { SCOPE_COLORS } from './types';

// Store
export { createStore, type Store, type Listener, type Selector, type Unsubscribe } from './store';

// Event Bus
export { createEventBus, type EventBus, type EventHandler } from './event-bus';

// State
export { createInitialState, DEFAULT_SETTINGS, DEFAULT_TOOLBAR_POSITION, selectors } from './state';

// Controller
export {
  createAnnotationCore,
  type AnnotationCore,
  type AnnotationCoreOptions,
} from './controller';

// Scopes
export {
  createAnnotationManager,
  type AnnotationManager,
  generateOutput,
  copyToClipboard,
  getEnvironmentInfo,
  saveScopes,
  loadScopes,
  clearScopes,
  saveSettings,
  loadSettings,
  saveTheme,
  loadTheme,
  createAutoSaver,
  cleanupExpiredScopes,
} from './scopes';

// Element
export {
  identifyElement,
  generateSelectorPath,
  generateFullDomPath,
  generateDisplayPath,
  getAccessibilityInfo,
  formatAccessibilityInfo,
  isInteractive,
  getContainingLandmark,
  describeLandmark,
  getContextualStyles,
  getForensicStyles,
  getAllForensicStyles,
  formatStyles,
  formatInlineStyles,
  collectElementInfo,
  getElementRect,
  getNearbyContext,
  getElementAttributes,
  getInnerText,
} from './element';

// DOM
export {
  createEventHandlers,
  type EventHandlers,
  isAnnotationElement,
  getTargetElement,
  getSelectedText,
  createHoverDetection,
  type HoverDetection,
  createMultiSelect,
  type MultiSelect,
  normalizeRect,
  createFreezeManager,
  type FreezeManager,
  injectCursorStyles,
  removeCursorStyles,
  setMultiSelectMode,
  setDraggingMode,
  setDisabledState,
  cleanupCursorStyles,
} from './dom';

// Utils
export {
  throttle,
  debounce,
  type ThrottledFunction,
  cleanClassName,
  cleanClassList,
  getMeaningfulClasses,
  getFirstMeaningfulClass,
  formatClassSelector,
  isFixedOrSticky,
  getFixedAncestor,
  getElementPosition,
  percentToPixels,
  pixelsToPercent,
} from './utils';
