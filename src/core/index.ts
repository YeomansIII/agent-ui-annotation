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
  Annotation,
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

export { ANNOTATION_COLORS } from './types';

// i18n
export {
  initI18n,
  registerLocale,
  t,
  tOutput,
  getCurrentTranslations,
  isOutputTranslationEnabled,
  resetI18n,
  en,
  zhCN,
  type TranslationStrings,
  type PartialTranslationStrings,
  type I18nOptions,
  type BuiltInLocale,
} from './i18n';

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

// Annotations
export {
  createAnnotationManager,
  type AnnotationManager,
  generateOutput,
  copyToClipboard,
  getEnvironmentInfo,
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
  saveSettings,
  loadSettings,
  saveTheme,
  loadTheme,
  createAutoSaver,
  cleanupExpiredAnnotations,
} from './annotations';

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
