/**
 * React adapter for agent-ui-annotation
 */

import React, { useEffect, useRef, useCallback, type FC } from 'react';
import type { Annotation, AnnotationId, OutputLevel, ThemeMode, BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from '../../core/types';
import { registerAnnotationElement, type AnnotationElement } from '../../element/annotation-element';

// Ensure custom element is registered
registerAnnotationElement();

// Extend JSX types for the custom element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'agent-ui-annotation': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          theme?: string;
          'output-level'?: string;
          'annotation-color'?: string;
          disabled?: string;
          ref?: React.Ref<AnnotationElement>;
        },
        HTMLElement
      >;
    }
  }
}

export interface AgentUIAnnotationProps {
  /** Theme mode */
  theme?: ThemeMode;
  /** Output detail level */
  outputLevel?: OutputLevel;
  /** Annotation marker color */
  annotationColor?: string;
  /** Whether the tool is disabled */
  disabled?: boolean;
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
  /** Additional class name */
  className?: string;
}

export interface AgentUIAnnotationRef {
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  getOutput: (level?: OutputLevel) => string;
  clearAll: () => void;
}

/**
 * React component wrapper for agent-ui-annotation
 */
export const AgentUIAnnotation: FC<AgentUIAnnotationProps> = ({
  theme = 'auto',
  outputLevel = 'standard',
  annotationColor,
  disabled = false,
  onBeforeAnnotationCreate,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationsClear,
  onCopy,
  className,
}) => {
  const ref = useRef<AnnotationElement>(null);

  // Set up the before create hook
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.setBeforeCreateHook(onBeforeAnnotationCreate ?? null);
  }, [onBeforeAnnotationCreate]);

  // Handle events
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleCreate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { annotation: Annotation };
      onAnnotationCreate?.(detail.annotation);
    };

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { annotation: Annotation };
      onAnnotationUpdate?.(detail.annotation);
    };

    const handleDelete = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: AnnotationId };
      onAnnotationDelete?.(detail.id);
    };

    const handleClear = (e: Event) => {
      const detail = (e as CustomEvent).detail as { annotations: Annotation[] };
      onAnnotationsClear?.(detail.annotations);
    };

    const handleCopy = (e: Event) => {
      const detail = (e as CustomEvent).detail as { content: string; level: OutputLevel };
      onCopy?.(detail.content, detail.level);
    };

    element.addEventListener('annotation:create', handleCreate);
    element.addEventListener('annotation:update', handleUpdate);
    element.addEventListener('annotation:delete', handleDelete);
    element.addEventListener('annotation:clear', handleClear);
    element.addEventListener('annotation:copy', handleCopy);

    return () => {
      element.removeEventListener('annotation:create', handleCreate);
      element.removeEventListener('annotation:update', handleUpdate);
      element.removeEventListener('annotation:delete', handleDelete);
      element.removeEventListener('annotation:clear', handleClear);
      element.removeEventListener('annotation:copy', handleCopy);
    };
  }, [onAnnotationCreate, onAnnotationUpdate, onAnnotationDelete, onAnnotationsClear, onCopy]);

  return React.createElement('agent-ui-annotation', {
    ref,
    theme,
    'output-level': outputLevel,
    'annotation-color': annotationColor,
    disabled: disabled ? '' : undefined,
    class: className,
  });
};

/**
 * Hook for using agent-ui-annotation imperatively
 */
export function useAgentUIAnnotation(): {
  ref: React.RefObject<AnnotationElement | null>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  getOutput: (level?: OutputLevel) => string;
  clearAll: () => void;
} {
  const ref = useRef<AnnotationElement | null>(null);

  const activate = useCallback(() => {
    ref.current?.activate();
  }, []);

  const deactivate = useCallback(() => {
    ref.current?.deactivate();
  }, []);

  const toggle = useCallback(() => {
    ref.current?.toggle();
  }, []);

  const copyOutput = useCallback(async (level?: OutputLevel) => {
    return ref.current?.copyOutput(level) ?? false;
  }, []);

  const getOutput = useCallback((level?: OutputLevel) => {
    return ref.current?.getOutput(level) ?? '';
  }, []);

  const clearAll = useCallback(() => {
    ref.current?.clearAll();
  }, []);

  return {
    ref,
    activate,
    deactivate,
    toggle,
    copyOutput,
    getOutput,
    clearAll,
  };
}

export default AgentUIAnnotation;

// Re-export hook types for convenience
export type { BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult };
