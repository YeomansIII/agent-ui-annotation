/**
 * Vue 3 adapter types for agent-ui-annotation
 */

import type { Annotation, AnnotationId, OutputLevel, ThemeMode, BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from '../../core/types';

/** Props for the AgentUIAnnotation Vue component */
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
}

// Re-export hook types for convenience
export type { BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult };

/** Methods exposed via defineExpose */
export interface AgentUIAnnotationExpose {
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  getOutput: (level?: OutputLevel) => string;
  clearAll: () => void;
}

/** Events emitted by the component */
export interface AgentUIAnnotationEmits {
  (e: 'annotationCreate', annotation: Annotation): void;
  (e: 'annotationUpdate', annotation: Annotation): void;
  (e: 'annotationDelete', id: AnnotationId): void;
  (e: 'annotationsClear', annotations: Annotation[]): void;
  (e: 'copy', content: string, level: OutputLevel): void;
}
