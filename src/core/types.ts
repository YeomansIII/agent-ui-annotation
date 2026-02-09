/**
 * Core TypeScript interfaces for Annotation
 */

/** Unique identifier for annotations */
export type AnnotationId = string;

/** Position coordinates */
export interface Position {
  x: number;
  y: number;
}

/** Element bounding rectangle */
export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

/** Accessibility information for an element */
export interface AccessibilityInfo {
  role: string | null;
  ariaLabel: string | null;
  ariaDescribedBy: string | null;
  ariaLabelledBy: string | null;
  tabIndex: number | null;
  isInteractive: boolean;
}

/** Computed styles subset for forensic output */
export interface ComputedStylesSubset {
  display: string;
  position: string;
  visibility: string;
  opacity: string;
  zIndex: string;
  overflow: string;
  pointerEvents: string;
  cursor: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  lineHeight: string;
  padding: string;
  margin: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  transform: string;
  transition: string;
}

/** Element context for nearby elements */
export interface NearbyContext {
  parent: string | null;
  previousSibling: string | null;
  nextSibling: string | null;
  containingLandmark: string | null;
}

/** Full element information collected for annotation */
export interface ElementInfo {
  /** Human-readable identifier like 'button "Save"' */
  humanReadable: string;
  /** CSS selector path */
  selectorPath: string;
  /** Full DOM path for forensic output */
  fullDomPath: string;
  /** Framework component path (if detected) */
  componentPath: string | null;
  /** Framework name for component path */
  componentFramework: string | null;
  /** Element tag name */
  tagName: string;
  /** Element ID if present */
  id: string | null;
  /** Class list */
  classes: string[];
  /** Bounding rectangle */
  rect: ElementRect;
  /** Accessibility info */
  accessibility: AccessibilityInfo;
  /** Computed styles (forensic) */
  computedStyles: ComputedStylesSubset | null;
  /** Nearby element context */
  nearbyContext: NearbyContext;
  /** Inner text (truncated) */
  innerText: string;
  /** Element attributes */
  attributes: Record<string, string>;
  /** Whether element is fixed/sticky positioned */
  isFixed: boolean;
}

/** Single annotation */
export interface Annotation {
  id: AnnotationId;
  /** Display number (1-based) */
  number: number;
  /** User's comment/note */
  comment: string;
  /** Element information snapshot */
  elementInfo: ElementInfo;
  /** Original DOM element reference (may become stale) */
  element: Element | null;
  /** Timestamp of creation */
  createdAt: number;
  /** Timestamp of last update */
  updatedAt: number;
  /** Selected text at time of annotation creation */
  selectedText: string | null;
  /** Whether created via multi-select */
  isMultiSelect: boolean;
  /** Click X coordinate (document-relative for non-fixed, viewport-relative for fixed) */
  clickX: number;
  /** Click Y coordinate (document-relative for non-fixed, viewport-relative for fixed) */
  clickY: number;
  /** Offset as percentage (0-1) from element's left edge at creation time (for resize repositioning) */
  offsetX?: number;
  /** Offset as percentage (0-1) from element's top edge at creation time (for resize repositioning) */
  offsetY?: number;
  /** Custom context data provided by onBeforeAnnotationCreate hook */
  context?: Record<string, unknown>;
}

/** Data passed to the onBeforeAnnotationCreate hook */
export interface BeforeAnnotationCreateData {
  /** The DOM element being annotated */
  element: Element;
  /** Collected element information */
  elementInfo: ElementInfo;
  /** User's comment/note */
  comment: string;
  /** Text selected on the page at time of annotation (if any) */
  selectedText: string | null;
  /** Whether this annotation is part of a multi-select batch */
  isMultiSelect: boolean;
  /** Click X coordinate */
  clickX: number;
  /** Click Y coordinate */
  clickY: number;
}

/** Result from the onBeforeAnnotationCreate hook */
export interface BeforeAnnotationCreateResult {
  /** Custom context data to attach to the annotation */
  context?: Record<string, unknown>;
  /** Override the comment (optional) */
  comment?: string;
  /** Set to true to cancel annotation creation */
  cancel?: boolean;
}

/** Hook type for onBeforeAnnotationCreate - supports sync and async */
export type BeforeAnnotationCreateHook = (
  data: BeforeAnnotationCreateData
) => BeforeAnnotationCreateResult | Promise<BeforeAnnotationCreateResult> | void | Promise<void>;


/** Output detail level */
export type OutputLevel = 'compact' | 'standard' | 'detailed' | 'forensic';

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** Toolbar position */
export type ToolbarPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Tool mode */
export type ToolMode = 'select' | 'multi-select' | 'disabled';

/** Settings configuration */
export interface Settings {
  theme: ThemeMode;
  outputLevel: OutputLevel;
  toolbarPosition: ToolbarPosition;
  showTooltips: boolean;
  showMarkerNumbers: boolean;
  freezeOnAnnotation: boolean;
  persistAnnotations: boolean;
  annotationColor: string;
  blockInteractions: boolean;
  autoClearAfterCopy: boolean;
}

/** Selection rectangle for multi-select */
export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/** Environment info for forensic output */
export interface EnvironmentInfo {
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  url: string;
  timestamp: string;
  scrollPosition: { x: number; y: number };
}

/** Event types emitted by the event bus */
export type EventMap = {
  'annotation:create': { annotation: Annotation };
  'annotation:update': { annotation: Annotation };
  'annotation:delete': { id: AnnotationId };
  'annotation:select': { id: AnnotationId | null };
  'annotations:clear': { annotations: Annotation[] };
  'element:hover': { element: Element | null; elementInfo: ElementInfo | null };
  'element:click': { element: Element; elementInfo: ElementInfo; clickX: number; clickY: number };
  'mode:change': { mode: ToolMode };
  'toolbar:toggle': { expanded: boolean };
  'toolbar:drag': { position: Position };
  'settings:change': { settings: Partial<Settings> };
  'output:copy': { content: string; level: OutputLevel };
  'multiselect:start': { position: Position };
  'multiselect:update': { rect: SelectionRect };
  'multiselect:end': { elements: Element[] };
  'freeze:toggle': { frozen: boolean };
  'activate': undefined;
  'deactivate': undefined;
}

/** Store state shape */
export interface AppState {
  /** Map of all annotations by ID */
  annotations: Map<AnnotationId, Annotation>;
  /** Currently selected annotation ID */
  selectedAnnotationId: AnnotationId | null;
  /** Currently hovered element */
  hoveredElement: Element | null;
  /** Info about hovered element */
  hoveredElementInfo: ElementInfo | null;
  /** Current tool mode */
  mode: ToolMode;
  /** Whether toolbar is expanded */
  toolbarExpanded: boolean;
  /** Toolbar position */
  toolbarPosition: Position;
  /** User settings */
  settings: Settings;
  /** Whether currently drag-selecting */
  isSelecting: boolean;
  /** Current selection rectangle */
  selectionRect: SelectionRect | null;
  /** Elements currently within selection rectangle (for preview highlighting) */
  selectionPreviewElements: Element[];
  /** Whether animations/videos are frozen */
  isFrozen: boolean;
  /** Whether popup is visible */
  popupVisible: boolean;
  /** ID of annotation being edited in popup */
  popupAnnotationId: AnnotationId | null;
  /** Element info for popup (stored separately from hover to prevent clearing) */
  popupElementInfo: ElementInfo | null;
  /** Click position for popup placement (viewport coords) */
  popupClickX: number;
  popupClickY: number;
  /** Click position for marker placement (document coords for non-fixed, viewport for fixed) */
  pendingMarkerX: number;
  pendingMarkerY: number;
  /** Whether pending marker element is fixed */
  pendingMarkerIsFixed: boolean;
  /** Multiple selected elements for batch annotation creation */
  multiSelectElements: Element[];
  /** Element infos for multi-select (parallel array to multiSelectElements) */
  multiSelectInfos: ElementInfo[];
  /** Whether markers are visible */
  markersVisible: boolean;
  /** Set of marker IDs that are animating */
  animatingMarkers: Set<AnnotationId>;
  /** Set of marker IDs that are exiting */
  exitingMarkers: Set<AnnotationId>;
  /** ID of marker being deleted */
  deletingMarkerId: AnnotationId | null;
  /** Marker ID to start renumbering from */
  renumberFrom: number | null;
  /** Whether "copied" feedback is showing */
  showCopiedFeedback: boolean;
  /** Whether "cleared" feedback is showing */
  showClearedFeedback: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether entrance animation should play */
  showEntranceAnimation: boolean;
  /** Whether toolbar is being dragged */
  isDraggingToolbar: boolean;
  /** Whether settings panel is visible */
  settingsPanelVisible: boolean;
  /** Whether Cmd/Ctrl passthrough mode is active (temporarily lets mouse events reach the page) */
  passthroughActive: boolean;
}

/** Custom element events */
export interface AnnotationEventDetail {
  'annotation:create': { annotation: Annotation };
  'annotation:update': { annotation: Annotation };
  'annotation:delete': { id: AnnotationId };
  'annotation:clear': { annotations: Annotation[] };
  'annotation:copy': { content: string; level: OutputLevel };
  'annotation:error': { message: string; error?: Error };
}

/** Marker color options */
export const ANNOTATION_COLORS = {
  purple: '#AF52DE',
  blue: '#3c82f7',
  cyan: '#5AC8FA',
  green: '#34C759',
  yellow: '#FFD60A',
  orange: '#FF9500',
  red: '#FF3B30',
} as const;

export type AnnotationColor = keyof typeof ANNOTATION_COLORS;

/** Re-export i18n types for convenience */
export type { TranslationStrings, PartialTranslationStrings, I18nOptions, BuiltInLocale } from './i18n/types';
