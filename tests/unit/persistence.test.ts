/**
 * Tests for annotation persistence (localStorage save/load)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
} from '../../src/core/annotations/persistence';
import type { Annotation, AnnotationId } from '../../src/core/types';

function createMockAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  const id = (overrides.id ?? `ann-${Math.random().toString(36).slice(2)}`) as AnnotationId;
  return {
    id,
    number: 1,
    comment: 'Test annotation',
    element: null,
    elementInfo: {
      humanReadable: 'button "Save"',
      selectorPath: 'div > button.save',
      fullDomPath: 'html > body > div > button.save',
      componentPath: null,
      componentFramework: null,
      tagName: 'button',
      id: null,
      classes: ['save'],
      rect: { top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 },
      accessibility: {
        role: null,
        ariaLabel: null,
        ariaDescribedBy: null,
        ariaLabelledBy: null,
        tabIndex: null,
        isInteractive: true,
      },
      computedStyles: null,
      nearbyContext: {
        parent: null,
        previousSibling: null,
        nextSibling: null,
        containingLandmark: null,
      },
      innerText: 'Save',
      attributes: {},
      isFixed: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    selectedText: null,
    isMultiSelect: false,
    clickX: 50,
    clickY: 20,
    ...overrides,
  };
}

describe('Annotation persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save and load annotations', () => {
    const annotation = createMockAnnotation({ id: 'test-1' as AnnotationId });
    const map = new Map<AnnotationId, Annotation>();
    map.set(annotation.id, annotation);

    saveAnnotations(map);
    const loaded = loadAnnotations();

    expect(loaded.size).toBe(1);
    const loadedAnnotation = loaded.get('test-1' as AnnotationId);
    expect(loadedAnnotation).toBeDefined();
    expect(loadedAnnotation?.comment).toBe('Test annotation');
    expect(loadedAnnotation?.element).toBeNull();
  });

  it('should persist custom context through save/load cycle', () => {
    const annotation = createMockAnnotation({
      id: 'ctx-1' as AnnotationId,
      context: {
        route: '/test/md',
        userId: 42,
        nested: { key: 'value' },
      },
    });
    const map = new Map<AnnotationId, Annotation>();
    map.set(annotation.id, annotation);

    saveAnnotations(map);
    const loaded = loadAnnotations();

    const loadedAnnotation = loaded.get('ctx-1' as AnnotationId);
    expect(loadedAnnotation).toBeDefined();
    expect(loadedAnnotation?.context).toEqual({
      route: '/test/md',
      userId: 42,
      nested: { key: 'value' },
    });
  });

  it('should persist annotations without context (context is optional)', () => {
    const annotation = createMockAnnotation({
      id: 'no-ctx' as AnnotationId,
    });
    // Ensure no context field
    delete annotation.context;

    const map = new Map<AnnotationId, Annotation>();
    map.set(annotation.id, annotation);

    saveAnnotations(map);
    const loaded = loadAnnotations();

    const loadedAnnotation = loaded.get('no-ctx' as AnnotationId);
    expect(loadedAnnotation).toBeDefined();
    expect(loadedAnnotation?.context).toBeUndefined();
  });

  it('should persist empty context object', () => {
    const annotation = createMockAnnotation({
      id: 'empty-ctx' as AnnotationId,
      context: {},
    });
    const map = new Map<AnnotationId, Annotation>();
    map.set(annotation.id, annotation);

    saveAnnotations(map);
    const loaded = loadAnnotations();

    const loadedAnnotation = loaded.get('empty-ctx' as AnnotationId);
    expect(loadedAnnotation).toBeDefined();
    expect(loadedAnnotation?.context).toEqual({});
  });

  it('should clear annotations', () => {
    const annotation = createMockAnnotation();
    const map = new Map<AnnotationId, Annotation>();
    map.set(annotation.id, annotation);

    saveAnnotations(map);
    clearAnnotations();

    const loaded = loadAnnotations();
    expect(loaded.size).toBe(0);
  });
});
