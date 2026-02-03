/**
 * Annotation CRUD operations
 */

import type { Annotation, AnnotationId, AppState } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';
import { collectElementInfo } from '../element';

/**
 * Generate a unique annotation ID
 */
export function generateAnnotationId(): AnnotationId {
  return `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get the next annotation number
 */
export function getNextAnnotationNumber(annotations: Map<AnnotationId, Annotation>): number {
  if (annotations.size === 0) return 1;

  const maxNumber = Math.max(...Array.from(annotations.values()).map((s) => s.number));
  return maxNumber + 1;
}

/**
 * Create a new annotation
 */
export function createAnnotation(
  element: Element,
  comment: string,
  existingAnnotations: Map<AnnotationId, Annotation>,
  options: {
    selectedText?: string | null;
    isMultiSelect?: boolean;
    includeForensic?: boolean;
    clickX?: number;
    clickY?: number;
    offsetX?: number;
    offsetY?: number;
  } = {}
): Annotation {
  const {
    selectedText = null,
    isMultiSelect = false,
    includeForensic = false,
    clickX = 0,
    clickY = 0,
    offsetX,
    offsetY,
  } = options;

  const now = Date.now();
  const elementInfo = collectElementInfo(element, includeForensic);

  return {
    id: generateAnnotationId(),
    number: getNextAnnotationNumber(existingAnnotations),
    comment,
    elementInfo,
    element,
    createdAt: now,
    updatedAt: now,
    selectedText,
    isMultiSelect,
    clickX,
    clickY,
    offsetX,
    offsetY,
  };
}

/**
 * Update an existing annotation's comment
 */
export function updateAnnotationComment(annotation: Annotation, comment: string): Annotation {
  return {
    ...annotation,
    comment,
    updatedAt: Date.now(),
  };
}

/**
 * Update an existing annotation's element info (e.g., after element moved)
 */
export function updateAnnotationElementInfo(annotation: Annotation, element: Element, includeForensic: boolean = false): Annotation {
  return {
    ...annotation,
    element,
    elementInfo: collectElementInfo(element, includeForensic),
    updatedAt: Date.now(),
  };
}

/**
 * Renumber annotations after deletion
 */
export function renumberAnnotations(annotations: Map<AnnotationId, Annotation>, deletedNumber: number): Map<AnnotationId, Annotation> {
  const newAnnotations = new Map<AnnotationId, Annotation>();

  for (const [id, annotation] of annotations) {
    if (annotation.number > deletedNumber) {
      newAnnotations.set(id, {
        ...annotation,
        number: annotation.number - 1,
      });
    } else {
      newAnnotations.set(id, annotation);
    }
  }

  return newAnnotations;
}

/**
 * Create annotation manager bound to store and event bus
 */
export function createAnnotationManager(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  /**
   * Add a new annotation
   */
  const addAnnotation = (
    element: Element,
    comment: string,
    options?: {
      selectedText?: string | null;
      isMultiSelect?: boolean;
      clickX?: number;
      clickY?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): Annotation => {
    const state = store.getState();
    const includeForensic = state.settings.outputLevel === 'forensic';

    const annotation = createAnnotation(element, comment, state.annotations, {
      ...options,
      includeForensic,
    });

    const newAnnotations = new Map(state.annotations);
    newAnnotations.set(annotation.id, annotation);

    store.setState({ annotations: newAnnotations });
    eventBus.emit('annotation:create', { annotation });

    return annotation;
  };

  /**
   * Update an existing annotation
   */
  const updateAnnotation = (id: AnnotationId, updates: { comment?: string }): Annotation | null => {
    const state = store.getState();
    const annotation = state.annotations.get(id);

    if (!annotation) return null;

    const updatedAnnotation = updates.comment !== undefined
      ? updateAnnotationComment(annotation, updates.comment)
      : annotation;

    const newAnnotations = new Map(state.annotations);
    newAnnotations.set(id, updatedAnnotation);

    store.setState({ annotations: newAnnotations });
    eventBus.emit('annotation:update', { annotation: updatedAnnotation });

    return updatedAnnotation;
  };

  /**
   * Delete an annotation
   */
  const deleteAnnotation = (id: AnnotationId): boolean => {
    const state = store.getState();
    const annotation = state.annotations.get(id);

    if (!annotation) return false;

    const deletedNumber = annotation.number;
    const newAnnotations = new Map(state.annotations);
    newAnnotations.delete(id);

    // Renumber remaining annotations
    const renumberedAnnotations = renumberAnnotations(newAnnotations, deletedNumber);

    store.batch(() => {
      store.setState({
        annotations: renumberedAnnotations,
        deletingMarkerId: id,
        renumberFrom: deletedNumber,
      });

      // Clear the deleting state after animation
      setTimeout(() => {
        store.setState({
          deletingMarkerId: null,
          renumberFrom: null,
        });
      }, 300);
    });

    eventBus.emit('annotation:delete', { id });

    return true;
  };

  /**
   * Clear all annotations
   */
  const clearAllAnnotations = (): Annotation[] => {
    const state = store.getState();
    const annotations = Array.from(state.annotations.values());

    store.batch(() => {
      store.setState({
        annotations: new Map(),
        selectedAnnotationId: null,
        showClearedFeedback: true,
      });

      setTimeout(() => {
        store.setState({ showClearedFeedback: false });
      }, 2000);
    });

    eventBus.emit('annotations:clear', { annotations });

    return annotations;
  };

  /**
   * Select an annotation
   */
  const selectAnnotation = (id: AnnotationId | null): void => {
    store.setState({ selectedAnnotationId: id });
    eventBus.emit('annotation:select', { id });
  };

  /**
   * Get an annotation by ID
   */
  const getAnnotation = (id: AnnotationId): Annotation | undefined => {
    return store.getState().annotations.get(id);
  };

  /**
   * Get all annotations sorted by number
   */
  const getAllAnnotations = (): Annotation[] => {
    return Array.from(store.getState().annotations.values()).sort((a, b) => a.number - b.number);
  };

  /**
   * Get annotation count
   */
  const getAnnotationCount = (): number => {
    return store.getState().annotations.size;
  };

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAllAnnotations,
    selectAnnotation,
    getAnnotation,
    getAllAnnotations,
    getAnnotationCount,
  };
}

export type AnnotationManager = ReturnType<typeof createAnnotationManager>;
