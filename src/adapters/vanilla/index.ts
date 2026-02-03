/**
 * Vanilla JS adapter for Annotation
 */

import type { Annotation, AnnotationId, OutputLevel, ThemeMode, Settings, PartialTranslationStrings, BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from '../../core/types';
import {
  AnnotationElement,
  registerAnnotationElement,
} from '../../element/annotation-element';
import { initI18n } from '../../core/i18n';

// Ensure custom element is registered
registerAnnotationElement();

export interface AnnotationOptions {
  /** Container element to append Annotation to (defaults to document.body) */
  container?: HTMLElement;
  /** Theme mode */
  theme?: ThemeMode;
  /** Output detail level */
  outputLevel?: OutputLevel;
  /** Annotation marker color */
  annotationColor?: string;
  /** Whether to auto-activate on mount */
  autoActivate?: boolean;
  /** Hook called before creating an annotation - can add context, modify comment, or cancel */
  onBeforeAnnotationCreate?: BeforeAnnotationCreateHook;
  /** Callback when an annotation is created */
  onAnnotationCreate?: (annotation: Annotation) => void;
  /** Callback when an annotation is updated */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback when an annotation is deleted */
  onAnnotationDelete?: (id: AnnotationId) => void;
  /** Callback when all annotations are cleared */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback when output is copied */
  onCopy?: (content: string, level: OutputLevel) => void;
  /** Locale for UI strings (default: 'en') */
  locale?: string;
  /** Custom translation overrides */
  translations?: PartialTranslationStrings;
  /** Whether to translate markdown output (default: false for AI compatibility) */
  translateOutput?: boolean;
}

export interface AnnotationInstance {
  /** The underlying custom element */
  element: AnnotationElement;
  /** Activate the tool */
  activate: () => void;
  /** Deactivate the tool */
  deactivate: () => void;
  /** Toggle activation */
  toggle: () => void;
  /** Copy output to clipboard */
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  /** Get output without copying */
  getOutput: (level?: OutputLevel) => string;
  /** Clear all annotations */
  clearAll: () => void;
  /** Destroy and remove the element */
  destroy: () => void;
}

/**
 * Create an Annotation instance
 *
 * @example
 * ```js
 * import { createAnnotation } from 'annotation/vanilla';
 *
 * const instance = createAnnotation({
 *   theme: 'auto',
 *   onAnnotationCreate: (annotation) => console.log('Created:', annotation),
 * });
 *
 * // Later:
 * instance.activate();
 * ```
 */
export function createAnnotation(options: AnnotationOptions = {}): AnnotationInstance {
  const {
    container = document.body,
    theme = 'auto',
    outputLevel = 'standard',
    annotationColor,
    autoActivate = false,
    onBeforeAnnotationCreate,
    onAnnotationCreate,
    onAnnotationUpdate,
    onAnnotationDelete,
    onAnnotationsClear,
    onCopy,
    locale,
    translations,
    translateOutput,
  } = options;

  // Initialize i18n if locale options provided
  if (locale || translations || translateOutput !== undefined) {
    initI18n({ locale, translations, translateOutput });
  }

  // Create element
  const element = document.createElement('agent-ui-annotation') as AnnotationElement;

  // Set the before create hook if provided (must be set before connectedCallback)
  if (onBeforeAnnotationCreate) {
    element.setBeforeCreateHook(onBeforeAnnotationCreate);
  }

  // Set attributes
  element.setAttribute('theme', theme);
  element.setAttribute('output-level', outputLevel);
  if (annotationColor) {
    element.setAttribute('annotation-color', annotationColor);
  }

  // Add event listeners
  if (onAnnotationCreate) {
    element.addEventListener('annotation:create', ((e: CustomEvent) => {
      onAnnotationCreate(e.detail.annotation);
    }) as EventListener);
  }

  if (onAnnotationUpdate) {
    element.addEventListener('annotation:update', ((e: CustomEvent) => {
      onAnnotationUpdate(e.detail.annotation);
    }) as EventListener);
  }

  if (onAnnotationDelete) {
    element.addEventListener('annotation:delete', ((e: CustomEvent) => {
      onAnnotationDelete(e.detail.id);
    }) as EventListener);
  }

  if (onAnnotationsClear) {
    element.addEventListener('annotation:clear', ((e: CustomEvent) => {
      onAnnotationsClear(e.detail.annotations);
    }) as EventListener);
  }

  if (onCopy) {
    element.addEventListener('annotation:copy', ((e: CustomEvent) => {
      onCopy(e.detail.content, e.detail.level);
    }) as EventListener);
  }

  // Append to container
  container.appendChild(element);

  // Auto-activate if requested
  if (autoActivate) {
    // Wait for next tick to ensure element is connected
    requestAnimationFrame(() => {
      element.activate();
    });
  }

  return {
    element,

    activate() {
      element.activate();
    },

    deactivate() {
      element.deactivate();
    },

    toggle() {
      element.toggle();
    },

    async copyOutput(level?: OutputLevel) {
      return element.copyOutput(level);
    },

    getOutput(level?: OutputLevel) {
      return element.getOutput(level);
    },

    clearAll() {
      element.clearAll();
    },

    destroy() {
      element.remove();
    },
  };
}

/**
 * Initialize Annotation with a simple API
 *
 * @example
 * ```js
 * import { init } from 'annotation/vanilla';
 *
 * const instance = init(); // Creates and activates immediately
 * ```
 */
export function init(options: Omit<AnnotationOptions, 'autoActivate'> = {}): AnnotationInstance {
  return createAnnotation({ ...options, autoActivate: true });
}

// Re-export types and i18n
export type { Annotation, AnnotationId, OutputLevel, ThemeMode, Settings, PartialTranslationStrings, BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult };
export { AnnotationElement, registerAnnotationElement };
export { initI18n } from '../../core/i18n';
