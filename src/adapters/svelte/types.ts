/**
 * Svelte 5 adapter types for agent-ui-annotation
 */

import type { Annotation, AnnotationId, OutputLevel, ThemeMode } from '../../core/types';

/** Props for the AgentUIAnnotation Svelte component */
export interface AgentUIAnnotationProps {
  /** Theme mode */
  theme?: ThemeMode;
  /** Output detail level */
  outputLevel?: OutputLevel;
  /** Annotation marker color */
  annotationColor?: string;
  /** Whether the tool is disabled */
  disabled?: boolean;
  /** Callback when annotation is created */
  onAnnotationCreate?: (annotation: Annotation) => void;
  /** Callback when annotation is updated */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback when annotation is deleted */
  onAnnotationDelete?: (id: AnnotationId) => void;
  /** Callback when all annotations are cleared */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback when output is copied */
  onCopy?: (content: string, level: OutputLevel) => void;
}

/** Methods exposed via component instance */
export interface AgentUIAnnotationExpose {
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  getOutput: (level?: OutputLevel) => string;
  clearAll: () => void;
}
