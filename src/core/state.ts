/**
 * State shape and initial state factory
 */

import type { AppState, Settings, ToolMode, Position, AnnotationId } from './types';

/** Default settings */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  outputLevel: 'standard',
  toolbarPosition: 'bottom-right',
  showTooltips: true,
  showMarkerNumbers: true,
  freezeOnScope: false,
  persistScopes: true,
  scopeColor: '#AF52DE', // purple
  blockInteractions: true,
  autoClearAfterCopy: false,
};

/** Default toolbar position */
export const DEFAULT_TOOLBAR_POSITION: Position = {
  x: 20,
  y: 20,
};

/** Create initial state */
export function createInitialState(overrides?: Partial<AppState>): AppState {
  return {
    scopes: new Map(),
    selectedAnnotationId: null,
    hoveredElement: null,
    hoveredElementInfo: null,
    mode: 'disabled' as ToolMode,
    toolbarExpanded: false,
    toolbarPosition: { ...DEFAULT_TOOLBAR_POSITION },
    settings: { ...DEFAULT_SETTINGS },
    isSelecting: false,
    selectionRect: null,
    selectionPreviewElements: [],
    isFrozen: false,
    popupVisible: false,
    popupAnnotationId: null,
    popupElementInfo: null,
    popupClickX: 0,
    popupClickY: 0,
    pendingMarkerX: 0,
    pendingMarkerY: 0,
    pendingMarkerIsFixed: false,
    multiSelectElements: [],
    multiSelectInfos: [],
    markersVisible: true,
    animatingMarkers: new Set(),
    exitingMarkers: new Set(),
    deletingMarkerId: null,
    renumberFrom: null,
    showCopiedFeedback: false,
    showClearedFeedback: false,
    scrollY: 0,
    showEntranceAnimation: true,
    isDraggingToolbar: false,
    settingsPanelVisible: false,
    ...overrides,
  };
}

/** State selectors */
export const selectors = {
  getScopes: (state: AppState) => state.scopes,
  getScopeById: (state: AppState, id: AnnotationId) => state.scopes.get(id),
  getScopeCount: (state: AppState) => state.scopes.size,
  getScopesArray: (state: AppState) =>
    Array.from(state.scopes.values()).sort((a, b) => a.number - b.number),
  getSelectedScope: (state: AppState) =>
    state.selectedAnnotationId ? state.scopes.get(state.selectedAnnotationId) : null,
  isActive: (state: AppState) => state.mode !== 'disabled',
  isMultiSelectMode: (state: AppState) => state.mode === 'multi-select',
  getSettings: (state: AppState) => state.settings,
  getTheme: (state: AppState) => state.settings.theme,
  getOutputLevel: (state: AppState) => state.settings.outputLevel,
  areMarkersVisible: (state: AppState) => state.markersVisible && state.toolbarExpanded,
};
