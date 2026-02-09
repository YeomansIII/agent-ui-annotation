/**
 * State shape and initial state factory
 */

import type { AppState, Settings, ToolMode, Position, AnnotationId, MarkerVisibility } from './types';

/** Default settings */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  outputLevel: 'standard',
  toolbarPosition: 'bottom-right',
  showTooltips: true,
  showMarkerNumbers: true,
  freezeOnAnnotation: false,
  persistAnnotations: true,
  annotationColor: '#AF52DE', // purple
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
    annotations: new Map(),
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
    multiSelectElements: [],
    multiSelectInfos: [],
    markerVisibility: 'full' as MarkerVisibility,
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
    passthroughActive: false,
    ...overrides,
  };
}

/** State selectors */
export const selectors = {
  getAnnotations: (state: AppState) => state.annotations,
  getAnnotationById: (state: AppState, id: AnnotationId) => state.annotations.get(id),
  getAnnotationCount: (state: AppState) => state.annotations.size,
  getAnnotationsArray: (state: AppState) =>
    Array.from(state.annotations.values()).sort((a, b) => a.number - b.number),
  getSelectedAnnotation: (state: AppState) =>
    state.selectedAnnotationId ? state.annotations.get(state.selectedAnnotationId) : null,
  isActive: (state: AppState) => state.mode !== 'disabled',
  isMultiSelectMode: (state: AppState) => state.mode === 'multi-select',
  getSettings: (state: AppState) => state.settings,
  getTheme: (state: AppState) => state.settings.theme,
  getOutputLevel: (state: AppState) => state.settings.outputLevel,
  areMarkersVisible: (state: AppState) => state.markerVisibility !== 'hidden' && state.toolbarExpanded,
};
