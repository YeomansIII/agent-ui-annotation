/**
 * Svelte 5 adapter for agent-ui-annotation
 */

// Component and hook
export { default as AgentUIAnnotation } from './AgentUIAnnotation.svelte';
export { useAgentUIAnnotation } from './useAgentUIAnnotation';

// Types
export type { AgentUIAnnotationProps, AgentUIAnnotationExpose } from './types';

// Re-export core types for convenience
export type {
  Annotation,
  AnnotationId,
  OutputLevel,
  ThemeMode,
  Settings,
  ElementInfo,
} from '../../core/types';

// Re-export element for advanced use cases
export { AnnotationElement } from '../../element/annotation-element';
