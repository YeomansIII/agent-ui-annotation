/**
 * Annotation - Web page annotation toolbar for AI coding agents
 *
 * @example Basic usage (auto-registers custom element)
 * ```js
 * import 'annotation';
 *
 * // Add to HTML:
 * // <agent-ui-annotation theme="auto"></agent-ui-annotation>
 * ```
 *
 * @example Vanilla JS
 * ```js
 * import { createAnnotation } from 'annotation';
 *
 * const instance = createAnnotation({
 *   theme: 'dark',
 *   onAnnotationCreate: (annotation) => console.log('New annotation:', annotation),
 * });
 *
 * instance.activate();
 * ```
 *
 * @example React
 * ```jsx
 * import { Annotation } from 'annotation/react';
 *
 * function App() {
 *   return (
 *     <Annotation
 *       theme="auto"
 *       onAnnotationCreate={(annotation) => console.log('New annotation:', annotation)}
 *     />
 *   );
 * }
 * ```
 */

// Auto-register custom element
import { registerAnnotationElement } from './element/annotation-element';
registerAnnotationElement();

// Core exports
export {
  // Types
  type AnnotationId,
  type Position,
  type ElementRect,
  type AccessibilityInfo,
  type ComputedStylesSubset,
  type NearbyContext,
  type ElementInfo,
  type Annotation,
  type OutputLevel,
  type ThemeMode,
  type ToolbarPosition,
  type ToolMode,
  type Settings,
  type SelectionRect,
  type EnvironmentInfo,
  type EventMap,
  type AppState,
  type AnnotationEventDetail,
  type AnnotationColor,
  ANNOTATION_COLORS,

  // Controller
  createAnnotationCore,
  type AnnotationCore,
  type AnnotationCoreOptions,

  // Store
  createStore,
  type Store,

  // Event Bus
  createEventBus,
  type EventBus,

  // Element utilities
  identifyElement,
  generateSelectorPath,
  collectElementInfo,
} from './core';

// Web Component
export {
  AnnotationElement,
  registerAnnotationElement,
} from './element';

// Vanilla adapter
export {
  createAnnotation,
  init,
  type AnnotationOptions,
  type AnnotationInstance,
} from './adapters/vanilla';

// Theme utilities
export {
  resolveTheme,
  getAccentColor,
} from './themes';

// i18n
export {
  initI18n,
  registerLocale,
  t,
  tOutput,
  en,
  zhCN,
  type TranslationStrings,
  type PartialTranslationStrings,
  type I18nOptions,
} from './core/i18n';
