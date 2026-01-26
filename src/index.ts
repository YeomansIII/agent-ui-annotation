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
 * const scope = createAnnotation({
 *   theme: 'dark',
 *   onScopeCreate: (scope) => console.log('New scope:', scope),
 * });
 *
 * scope.activate();
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
 *       onScopeCreate={(scope) => console.log('New scope:', scope)}
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
  type Scope,
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
  SCOPE_COLORS,

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
