/**
 * Vanilla JS adapter for Annotation
 */

import type { Scope, AnnotationId, OutputLevel, ThemeMode, Settings } from '../../core/types';
import {
  AnnotationElement,
  registerAnnotationElement,
} from '../../element/annotation-element';

// Ensure custom element is registered
registerAnnotationElement();

export interface AnnotationOptions {
  /** Container element to append Annotation to (defaults to document.body) */
  container?: HTMLElement;
  /** Theme mode */
  theme?: ThemeMode;
  /** Output detail level */
  outputLevel?: OutputLevel;
  /** Scope marker color */
  scopeColor?: string;
  /** Whether to auto-activate on mount */
  autoActivate?: boolean;
  /** Callback when a scope is created */
  onScopeCreate?: (scope: Scope) => void;
  /** Callback when a scope is updated */
  onScopeUpdate?: (scope: Scope) => void;
  /** Callback when a scope is deleted */
  onScopeDelete?: (id: AnnotationId) => void;
  /** Callback when all scopes are cleared */
  onScopesClear?: (scopes: Scope[]) => void;
  /** Callback when output is copied */
  onCopy?: (content: string, level: OutputLevel) => void;
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
  /** Clear all scopes */
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
 * const scope = createAnnotation({
 *   theme: 'auto',
 *   onScopeCreate: (scope) => console.log('Created:', scope),
 * });
 *
 * // Later:
 * scope.activate();
 * ```
 */
export function createAnnotation(options: AnnotationOptions = {}): AnnotationInstance {
  const {
    container = document.body,
    theme = 'auto',
    outputLevel = 'standard',
    scopeColor,
    autoActivate = false,
    onScopeCreate,
    onScopeUpdate,
    onScopeDelete,
    onScopesClear,
    onCopy,
  } = options;

  // Create element
  const element = document.createElement('agent-ui-annotation') as AnnotationElement;

  // Set attributes
  element.setAttribute('theme', theme);
  element.setAttribute('output-level', outputLevel);
  if (scopeColor) {
    element.setAttribute('scope-color', scopeColor);
  }

  // Add event listeners
  if (onScopeCreate) {
    element.addEventListener('annotation:scope', ((e: CustomEvent) => {
      onScopeCreate(e.detail.scope);
    }) as EventListener);
  }

  if (onScopeUpdate) {
    element.addEventListener('annotation:update', ((e: CustomEvent) => {
      onScopeUpdate(e.detail.scope);
    }) as EventListener);
  }

  if (onScopeDelete) {
    element.addEventListener('annotation:delete', ((e: CustomEvent) => {
      onScopeDelete(e.detail.id);
    }) as EventListener);
  }

  if (onScopesClear) {
    element.addEventListener('annotation:clear', ((e: CustomEvent) => {
      onScopesClear(e.detail.scopes);
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
 * const scope = init(); // Creates and activates immediately
 * ```
 */
export function init(options: Omit<AnnotationOptions, 'autoActivate'> = {}): AnnotationInstance {
  return createAnnotation({ ...options, autoActivate: true });
}

// Re-export types
export type { Scope, AnnotationId, OutputLevel, ThemeMode, Settings };
export { AnnotationElement, registerAnnotationElement };
