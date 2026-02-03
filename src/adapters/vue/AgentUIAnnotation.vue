<script setup lang="ts">
/**
 * Vue 3 component wrapper for agent-ui-annotation
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { Annotation, AnnotationId, OutputLevel, ThemeMode, BeforeAnnotationCreateHook } from '../../core/types';
import { registerAnnotationElement, type AnnotationElement } from '../../element/annotation-element';
import type { AgentUIAnnotationExpose } from './types';

// Ensure custom element is registered
registerAnnotationElement();

const props = withDefaults(defineProps<{
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
}>(), {
  theme: 'auto',
  outputLevel: 'standard',
  disabled: false,
});

const emit = defineEmits<{
  annotationCreate: [annotation: Annotation];
  annotationUpdate: [annotation: Annotation];
  annotationDelete: [id: AnnotationId];
  annotationsClear: [annotations: Annotation[]];
  copy: [content: string, level: OutputLevel];
}>();

const elementRef = ref<AnnotationElement | null>(null);

// Event handlers
const handleCreate = (e: Event) => {
  const detail = (e as CustomEvent).detail as { annotation: Annotation };
  emit('annotationCreate', detail.annotation);
};

const handleUpdate = (e: Event) => {
  const detail = (e as CustomEvent).detail as { annotation: Annotation };
  emit('annotationUpdate', detail.annotation);
};

const handleDelete = (e: Event) => {
  const detail = (e as CustomEvent).detail as { id: AnnotationId };
  emit('annotationDelete', detail.id);
};

const handleClear = (e: Event) => {
  const detail = (e as CustomEvent).detail as { annotations: Annotation[] };
  emit('annotationsClear', detail.annotations);
};

const handleCopy = (e: Event) => {
  const detail = (e as CustomEvent).detail as { content: string; level: OutputLevel };
  emit('copy', detail.content, detail.level);
};

onMounted(() => {
  const element = elementRef.value;
  if (!element) return;

  // Set the before create hook if provided
  if (props.onBeforeAnnotationCreate) {
    element.setBeforeCreateHook(props.onBeforeAnnotationCreate);
  }

  element.addEventListener('annotation:create', handleCreate);
  element.addEventListener('annotation:update', handleUpdate);
  element.addEventListener('annotation:delete', handleDelete);
  element.addEventListener('annotation:clear', handleClear);
  element.addEventListener('annotation:copy', handleCopy);
});

onUnmounted(() => {
  const element = elementRef.value;
  if (!element) return;

  element.removeEventListener('annotation:create', handleCreate);
  element.removeEventListener('annotation:update', handleUpdate);
  element.removeEventListener('annotation:delete', handleDelete);
  element.removeEventListener('annotation:clear', handleClear);
  element.removeEventListener('annotation:copy', handleCopy);
});

// Watch disabled prop
watch(() => props.disabled, (newValue) => {
  if (newValue && elementRef.value) {
    elementRef.value.deactivate();
  }
});

// Watch onBeforeAnnotationCreate prop
watch(() => props.onBeforeAnnotationCreate, (newValue) => {
  if (elementRef.value) {
    elementRef.value.setBeforeCreateHook(newValue ?? null);
  }
});

// Exposed methods
const activate = () => {
  elementRef.value?.activate();
};

const deactivate = () => {
  elementRef.value?.deactivate();
};

const toggle = () => {
  elementRef.value?.toggle();
};

const copyOutput = async (level?: OutputLevel): Promise<boolean> => {
  return elementRef.value?.copyOutput(level) ?? false;
};

const getOutput = (level?: OutputLevel): string => {
  return elementRef.value?.getOutput(level) ?? '';
};

const clearAll = () => {
  elementRef.value?.clearAll();
};

defineExpose<AgentUIAnnotationExpose>({
  activate,
  deactivate,
  toggle,
  copyOutput,
  getOutput,
  clearAll,
});
</script>

<template>
  <agent-ui-annotation
    ref="elementRef"
    :theme="theme"
    :output-level="outputLevel"
    :annotation-color="annotationColor"
    :disabled="disabled ? '' : undefined"
  />
</template>
