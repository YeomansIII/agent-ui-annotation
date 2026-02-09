/**
 * Core controller - ties together all core functionality
 */

import type { AppState, Annotation, AnnotationId, Settings, ToolMode, OutputLevel, EventMap, BeforeAnnotationCreateHook } from './types';
import { createStore, type Store } from './store';
import { createEventBus, type EventBus } from './event-bus';
import { createInitialState, DEFAULT_SETTINGS } from './state';
import { createAnnotationManager, type AnnotationManager } from './annotations/annotation';
import {
  loadAnnotations,
  loadSettings,
  saveSettings,
  createAutoSaver,
} from './annotations/persistence';
import { generateOutput, copyToClipboard } from './annotations/output';
import { createEventHandlers } from './dom/events';
import { createHoverDetection } from './dom/hover-detection';
import { createMultiSelect } from './dom/multi-select';
import { createFreezeManager, type FreezeManager } from './dom/freeze';
import {
  injectCursorStyles,
  setMultiSelectMode,
  setDisabledState,
  cleanupCursorStyles,
} from './dom/cursor';
import { collectElementInfo } from './element';

export interface AnnotationCoreOptions {
  /** Initial settings override */
  settings?: Partial<Settings>;
  /** Whether to load persisted annotations */
  loadPersisted?: boolean;
  /** Hook called before creating an annotation - can add context, modify comment, or cancel */
  onBeforeAnnotationCreate?: BeforeAnnotationCreateHook;
  /** Callback when an annotation is created */
  onAnnotationCreate?: (annotation: Annotation) => void;
  /** Callback when an annotation is updated */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback when an annotation is deleted */
  onAnnotationDelete?: (id: AnnotationId) => void;
  /** Callback when all annotations are cleared */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback when output is copied */
  onCopy?: (content: string, level: OutputLevel) => void;
  /** Whether to copy to clipboard automatically */
  copyToClipboard?: boolean;
}

export interface AnnotationCore {
  /** Store for state management */
  store: Store<AppState>;
  /** Event bus for cross-component communication */
  eventBus: EventBus<EventMap>;
  /** Annotation manager for CRUD operations */
  annotations: AnnotationManager;
  /** Freeze manager for animations/videos */
  freeze: FreezeManager;

  /** Activate the tool */
  activate: (mode?: ToolMode) => void;
  /** Deactivate the tool */
  deactivate: () => void;
  /** Toggle activation */
  toggle: () => void;
  /** Check if active */
  isActive: () => boolean;

  /** Set tool mode */
  setMode: (mode: ToolMode) => void;
  /** Get current mode */
  getMode: () => ToolMode;

  /** Update settings */
  updateSettings: (settings: Partial<Settings>) => void;
  /** Get current settings */
  getSettings: () => Settings;

  /** Generate and copy output */
  copyOutput: (level?: OutputLevel) => Promise<boolean>;
  /** Get output without copying */
  getOutput: (level?: OutputLevel) => string;

  /** Show popup for creating/editing annotation */
  showPopup: (annotationId?: AnnotationId) => void;
  /** Hide popup */
  hidePopup: () => void;

  /** Subscribe to state changes */
  subscribe: (listener: (state: AppState) => void) => () => void;

  /** Destroy and clean up */
  destroy: () => void;
}

/**
 * Create the core Annotation controller
 */
export function createAnnotationCore(options: AnnotationCoreOptions = {}): AnnotationCore {
  const {
    settings: initialSettings,
    loadPersisted = true,
    onBeforeAnnotationCreate,
    onAnnotationCreate,
    onAnnotationUpdate,
    onAnnotationDelete,
    onAnnotationsClear,
    onCopy,
    copyToClipboard: shouldCopyToClipboard = true,
  } = options;

  // Load persisted data
  const persistedSettings = loadPersisted ? loadSettings() : null;
  const persistedAnnotations = loadPersisted ? loadAnnotations() : new Map();

  // Merge settings
  const mergedSettings: Settings = {
    ...DEFAULT_SETTINGS,
    ...persistedSettings,
    ...initialSettings,
  };

  // Create store with initial state
  const store = createStore(
    createInitialState({
      settings: mergedSettings,
      annotations: persistedAnnotations,
    })
  );

  // Create event bus
  const eventBus = createEventBus<EventMap>();

  // Create managers
  const annotationManager = createAnnotationManager(store, eventBus, {
    onBeforeAnnotationCreate,
  });
  const freezeManager = createFreezeManager(store, eventBus);
  const eventHandlers = createEventHandlers(store, eventBus);
  const hoverDetection = createHoverDetection(store, eventBus);
  const multiSelect = createMultiSelect(store, eventBus);

  // Create auto-saver
  const autoSaver = createAutoSaver(() => store.getState().annotations, 1000);

  // Set up event listeners for callbacks
  if (onAnnotationCreate) {
    eventBus.on('annotation:create', ({ annotation }) => onAnnotationCreate(annotation));
  }

  if (onAnnotationUpdate) {
    eventBus.on('annotation:update', ({ annotation }) => onAnnotationUpdate(annotation));
  }

  if (onAnnotationDelete) {
    eventBus.on('annotation:delete', ({ id }) => onAnnotationDelete(id));
  }

  if (onAnnotationsClear) {
    eventBus.on('annotations:clear', ({ annotations }) => onAnnotationsClear(annotations));
  }

  // Auto-save on annotation changes
  eventBus.on('annotation:create', () => autoSaver.save());
  eventBus.on('annotation:update', () => autoSaver.save());
  eventBus.on('annotation:delete', () => autoSaver.save());
  eventBus.on('annotations:clear', () => autoSaver.save());

  // Save settings on change
  eventBus.on('settings:change', ({ settings }) => {
    const currentSettings = store.getState().settings;
    saveSettings({ ...currentSettings, ...settings });
  });

  // Handle element clicks to create annotations
  eventBus.on('element:click', ({ element, elementInfo, clickX, clickY }) => {
    const state = store.getState();

    if (state.mode === 'disabled') return;

    // clickX/clickY from events are always document-absolute coordinates.
    // For popup positioning, we need viewport coords.
    const viewportY = clickY - window.scrollY;

    // Show popup for creating annotation with pending marker
    store.setState({
      popupVisible: true,
      popupAnnotationId: null,
      popupElementInfo: elementInfo,
      popupClickX: clickX, // X is always viewport-relative
      popupClickY: viewportY, // Convert to viewport for popup positioning
      pendingMarkerX: clickX, // Document coords for marker
      pendingMarkerY: clickY,
      hoveredElement: element,
      hoveredElementInfo: elementInfo,
    });
  });

  // Handle multi-select completion
  eventBus.on('multiselect:end', ({ elements }) => {
    if (elements.length === 0) return;

    const state = store.getState();
    const includeForensic = state.settings.outputLevel === 'forensic';

    // Collect element info for all selected elements
    const elementInfos = elements.map(el => collectElementInfo(el, includeForensic));

    // Position popup near the center of the selection area
    const rects = elements.map(el => el.getBoundingClientRect());
    const minX = Math.min(...rects.map(r => r.left));
    const maxX = Math.max(...rects.map(r => r.right));
    const minY = Math.min(...rects.map(r => r.top));
    const maxY = Math.max(...rects.map(r => r.bottom));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    store.setState({
      popupVisible: true,
      popupAnnotationId: null,
      popupElementInfo: elementInfos[0], // Primary element for display
      popupClickX: centerX,
      popupClickY: centerY,
      pendingMarkerX: 0, // No single pending marker for multi-select
      pendingMarkerY: 0,
      multiSelectElements: elements,
      multiSelectInfos: elementInfos,
      hoveredElement: elements[0],
      hoveredElementInfo: elementInfos[0],
    });
  });

  /**
   * Activate the tool
   */
  const activate = (mode: ToolMode = 'select') => {
    const state = store.getState();
    if (state.mode !== 'disabled') return;

    store.batch(() => {
      store.setState({
        mode,
        toolbarExpanded: true,
        markerVisibility: 'full',
        scrollY: window.scrollY, // Initialize scroll position
      });
    });

    // Attach event handlers
    eventHandlers.attach();
    hoverDetection.attach();
    multiSelect.attach(); // Always attach for drag-to-select functionality

    // Inject cursor styles
    injectCursorStyles();
    setDisabledState(false);

    if (mode === 'multi-select') {
      setMultiSelectMode(true);
    }

    eventBus.emit('activate', undefined as never);
    eventBus.emit('mode:change', { mode });
  };

  /**
   * Deactivate the tool
   */
  const deactivate = () => {
    const state = store.getState();
    if (state.mode === 'disabled') return;

    store.batch(() => {
      store.setState({
        mode: 'disabled',
        toolbarExpanded: false,
        popupVisible: false,
        popupAnnotationId: null,
        isSelecting: false,
        selectionRect: null,
      });
    });

    // Detach event handlers
    eventHandlers.detach();
    hoverDetection.detach();
    multiSelect.detach();

    // Clean up cursor styles
    cleanupCursorStyles();

    // Unfreeze if frozen
    if (state.isFrozen) {
      freezeManager.unfreeze();
    }

    eventBus.emit('deactivate', undefined as never);
    eventBus.emit('mode:change', { mode: 'disabled' });
  };

  /**
   * Toggle activation
   */
  const toggle = () => {
    const state = store.getState();
    if (state.mode === 'disabled') {
      activate();
    } else {
      deactivate();
    }
  };

  /**
   * Check if active
   */
  const isActive = () => store.getState().mode !== 'disabled';

  /**
   * Set tool mode
   */
  const setMode = (mode: ToolMode) => {
    const state = store.getState();

    if (mode === 'disabled') {
      deactivate();
      return;
    }

    if (state.mode === 'disabled') {
      activate(mode);
      return;
    }

    // Switch between select and multi-select
    if (mode === 'multi-select' && state.mode !== 'multi-select') {
      multiSelect.attach();
      setMultiSelectMode(true);
    } else if (mode === 'select' && state.mode === 'multi-select') {
      multiSelect.detach();
      setMultiSelectMode(false);
    }

    store.setState({ mode });
    eventBus.emit('mode:change', { mode });
  };

  /**
   * Get current mode
   */
  const getMode = () => store.getState().mode;

  /**
   * Update settings
   */
  const updateSettings = (newSettings: Partial<Settings>) => {
    const state = store.getState();
    const merged = { ...state.settings, ...newSettings };

    store.setState({ settings: merged });
    eventBus.emit('settings:change', { settings: newSettings });
  };

  /**
   * Get current settings
   */
  const getSettings = () => store.getState().settings;

  /**
   * Generate and copy output
   */
  const copyOutput = async (level?: OutputLevel): Promise<boolean> => {
    const state = store.getState();
    const outputLevel = level || state.settings.outputLevel;
    const annotations = annotationManager.getAllAnnotations();

    const content = generateOutput(annotations, outputLevel);

    let success = true;
    if (shouldCopyToClipboard) {
      success = await copyToClipboard(content);
    }

    if (success) {
      store.setState({ showCopiedFeedback: true });
      setTimeout(() => {
        store.setState({ showCopiedFeedback: false });
      }, 2000);

      if (onCopy) {
        onCopy(content, outputLevel);
      }

      eventBus.emit('output:copy', { content, level: outputLevel });

      // Auto-clear if enabled
      if (state.settings.autoClearAfterCopy) {
        annotationManager.clearAllAnnotations();
      }
    }

    return success;
  };

  /**
   * Get output without copying
   */
  const getOutput = (level?: OutputLevel): string => {
    const state = store.getState();
    const outputLevel = level || state.settings.outputLevel;
    const annotations = annotationManager.getAllAnnotations();

    return generateOutput(annotations, outputLevel);
  };

  /**
   * Show popup for creating/editing annotation
   */
  const showPopup = (annotationId?: AnnotationId) => {
    if (annotationId) {
      // Editing existing annotation - use its stored click position
      const annotation = store.getState().annotations.get(annotationId);
      if (annotation) {
        const popupClickY = annotation.clickY - window.scrollY;
        store.setState({
          popupVisible: true,
          popupAnnotationId: annotationId,
          popupElementInfo: annotation.elementInfo,
          popupClickX: annotation.clickX,
          popupClickY: popupClickY,
        });
        return;
      }
    }
    store.setState({
      popupVisible: true,
      popupAnnotationId: annotationId || null,
    });
  };

  /**
   * Hide popup
   */
  const hidePopup = () => {
    store.setState({
      popupVisible: false,
      popupAnnotationId: null,
      popupElementInfo: null,
      popupClickX: 0,
      popupClickY: 0,
      pendingMarkerX: 0,
      pendingMarkerY: 0,
      multiSelectElements: [],
      multiSelectInfos: [],
    });
  };

  /**
   * Subscribe to state changes
   */
  const subscribe = (listener: (state: AppState) => void) => {
    return store.subscribe(listener);
  };

  /**
   * Destroy and clean up
   */
  const destroy = () => {
    deactivate();
    autoSaver.flush();
    autoSaver.destroy();
    freezeManager.destroy();
    eventBus.destroy();
    store.destroy();
  };

  return {
    store,
    eventBus,
    annotations: annotationManager,
    freeze: freezeManager,
    activate,
    deactivate,
    toggle,
    isActive,
    setMode,
    getMode,
    updateSettings,
    getSettings,
    copyOutput,
    getOutput,
    showPopup,
    hidePopup,
    subscribe,
    destroy,
  };
}
