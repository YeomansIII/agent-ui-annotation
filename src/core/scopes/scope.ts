/**
 * Scope CRUD operations
 */

import type { Scope, AnnotationId, AppState } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';
import { collectElementInfo } from '../element';

/**
 * Generate a unique scope ID
 */
export function generateAnnotationId(): AnnotationId {
  return `scope-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get the next scope number
 */
export function getNextScopeNumber(scopes: Map<AnnotationId, Scope>): number {
  if (scopes.size === 0) return 1;

  const maxNumber = Math.max(...Array.from(scopes.values()).map((s) => s.number));
  return maxNumber + 1;
}

/**
 * Create a new scope
 */
export function createScope(
  element: Element,
  comment: string,
  existingScopes: Map<AnnotationId, Scope>,
  options: {
    selectedText?: string | null;
    isMultiSelect?: boolean;
    includeForensic?: boolean;
    clickX?: number;
    clickY?: number;
    offsetX?: number;
    offsetY?: number;
  } = {}
): Scope {
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
    number: getNextScopeNumber(existingScopes),
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
 * Update an existing scope's comment
 */
export function updateScopeComment(scope: Scope, comment: string): Scope {
  return {
    ...scope,
    comment,
    updatedAt: Date.now(),
  };
}

/**
 * Update an existing scope's element info (e.g., after element moved)
 */
export function updateScopeElementInfo(scope: Scope, element: Element, includeForensic: boolean = false): Scope {
  return {
    ...scope,
    element,
    elementInfo: collectElementInfo(element, includeForensic),
    updatedAt: Date.now(),
  };
}

/**
 * Renumber scopes after deletion
 */
export function renumberScopes(scopes: Map<AnnotationId, Scope>, deletedNumber: number): Map<AnnotationId, Scope> {
  const newScopes = new Map<AnnotationId, Scope>();

  for (const [id, scope] of scopes) {
    if (scope.number > deletedNumber) {
      newScopes.set(id, {
        ...scope,
        number: scope.number - 1,
      });
    } else {
      newScopes.set(id, scope);
    }
  }

  return newScopes;
}

/**
 * Create scope manager bound to store and event bus
 */
export function createAnnotationManager(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  /**
   * Add a new scope
   */
  const addScope = (
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
  ): Scope => {
    const state = store.getState();
    const includeForensic = state.settings.outputLevel === 'forensic';

    const scope = createScope(element, comment, state.scopes, {
      ...options,
      includeForensic,
    });

    const newScopes = new Map(state.scopes);
    newScopes.set(scope.id, scope);

    store.setState({ scopes: newScopes });
    eventBus.emit('scope:create', { scope });

    return scope;
  };

  /**
   * Update an existing scope
   */
  const updateScope = (id: AnnotationId, updates: { comment?: string }): Scope | null => {
    const state = store.getState();
    const scope = state.scopes.get(id);

    if (!scope) return null;

    const updatedScope = updates.comment !== undefined
      ? updateScopeComment(scope, updates.comment)
      : scope;

    const newScopes = new Map(state.scopes);
    newScopes.set(id, updatedScope);

    store.setState({ scopes: newScopes });
    eventBus.emit('scope:update', { scope: updatedScope });

    return updatedScope;
  };

  /**
   * Delete a scope
   */
  const deleteScope = (id: AnnotationId): boolean => {
    const state = store.getState();
    const scope = state.scopes.get(id);

    if (!scope) return false;

    const deletedNumber = scope.number;
    const newScopes = new Map(state.scopes);
    newScopes.delete(id);

    // Renumber remaining scopes
    const renumberedScopes = renumberScopes(newScopes, deletedNumber);

    store.batch(() => {
      store.setState({
        scopes: renumberedScopes,
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

    eventBus.emit('scope:delete', { id });

    return true;
  };

  /**
   * Clear all scopes
   */
  const clearAllScopes = (): Scope[] => {
    const state = store.getState();
    const scopes = Array.from(state.scopes.values());

    store.batch(() => {
      store.setState({
        scopes: new Map(),
        selectedAnnotationId: null,
        showClearedFeedback: true,
      });

      setTimeout(() => {
        store.setState({ showClearedFeedback: false });
      }, 2000);
    });

    eventBus.emit('scopes:clear', { scopes });

    return scopes;
  };

  /**
   * Select a scope
   */
  const selectScope = (id: AnnotationId | null): void => {
    store.setState({ selectedAnnotationId: id });
    eventBus.emit('scope:select', { id });
  };

  /**
   * Get a scope by ID
   */
  const getScope = (id: AnnotationId): Scope | undefined => {
    return store.getState().scopes.get(id);
  };

  /**
   * Get all scopes sorted by number
   */
  const getAllScopes = (): Scope[] => {
    return Array.from(store.getState().scopes.values()).sort((a, b) => a.number - b.number);
  };

  /**
   * Get scope count
   */
  const getScopeCount = (): number => {
    return store.getState().scopes.size;
  };

  return {
    addScope,
    updateScope,
    deleteScope,
    clearAllScopes,
    selectScope,
    getScope,
    getAllScopes,
    getScopeCount,
  };
}

export type AnnotationManager = ReturnType<typeof createAnnotationManager>;
