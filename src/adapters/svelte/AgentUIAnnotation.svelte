<!--
  Svelte 5 component wrapper for agent-ui-annotation
-->
<script lang="ts">
import { onMount } from 'svelte';
import type { Annotation, AnnotationId, OutputLevel, ThemeMode, BeforeAnnotationCreateHook } from '../../core/types';
import { registerAnnotationElement, type AnnotationElement } from '../../element/annotation-element';

interface Props {
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

let {
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
}: Props = $props();

let elementRef: AnnotationElement | undefined = $state();

// Event handlers
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

onMount(() => {
  // Register custom element on first mount
  registerAnnotationElement();

  const element = elementRef;
  if (!element) return;

  // Set the before create hook if provided
  if (onBeforeAnnotationCreate) {
    element.setBeforeCreateHook(onBeforeAnnotationCreate);
  }

  element.addEventListener('annotation:create', handleCreate);
  element.addEventListener('annotation:update', handleUpdate);
  element.addEventListener('annotation:delete', handleDelete);
  element.addEventListener('annotation:clear', handleClear);
  element.addEventListener('annotation:copy', handleCopy);

  // Watch disabled prop changes via effect inside onMount
  const stopEffect = $effect.root(() => {
    $effect(() => {
      if (disabled && elementRef) {
        elementRef.deactivate();
      }
    });

    // Watch onBeforeAnnotationCreate prop changes
    $effect(() => {
      if (elementRef) {
        elementRef.setBeforeCreateHook(onBeforeAnnotationCreate ?? null);
      }
    });
  });

  return () => {
    element.removeEventListener('annotation:create', handleCreate);
    element.removeEventListener('annotation:update', handleUpdate);
    element.removeEventListener('annotation:delete', handleDelete);
    element.removeEventListener('annotation:clear', handleClear);
    element.removeEventListener('annotation:copy', handleCopy);
    stopEffect();
  };
});

// Exported methods
export function activate() {
  elementRef?.activate();
}

export function deactivate() {
  elementRef?.deactivate();
}

export function toggle() {
  elementRef?.toggle();
}

export async function copyOutput(level?: OutputLevel): Promise<boolean> {
  return elementRef?.copyOutput(level) ?? false;
}

export function getOutput(level?: OutputLevel): string {
  return elementRef?.getOutput(level) ?? '';
}

export function clearAll() {
  elementRef?.clearAll();
}
</script>

<agent-ui-annotation
  bind:this={elementRef}
  theme={theme}
  output-level={outputLevel}
  annotation-color={annotationColor}
  disabled={disabled ? '' : undefined}
></agent-ui-annotation>
