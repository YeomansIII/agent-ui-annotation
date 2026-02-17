/**
 * Annotation Custom Element (Web Component) - Lit Version
 */

import { LitElement, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { ref, createRef, type Ref } from 'lit/directives/ref.js';
import type { AppState, Settings, OutputLevel, ThemeMode, BeforeAnnotationCreateHook } from '../core/types';
import { createAnnotationCore, type AnnotationCore } from '../core/controller';
import { resolveTheme } from '../themes/variables';
import { componentStyles } from './styles';
import { calculatePopupPosition } from './popup-position';
import {
  renderCollapsedToolbar,
  renderExpandedToolbar,
  renderMarkers,
  renderHoverTooltip,
  renderHighlight,
  renderSelectionRect,
  renderSettingsPanel,
  icons,
} from './templates';
import { normalizeRect } from '../core/dom/multi-select';
import { t } from '../core/i18n';
import { getCurrentRoute, isAnnotationVisibleOnRoute, getAnnotationRoute } from '../core/annotations/route';
import { createDevtoolsApi, attachDevtoolsApi, detachDevtoolsApi, type DevtoolsApi } from './devtools-api';
import { refindElement } from '../core/dom/element-refinder';

/**
 * Annotation Web Component
 *
 * Usage:
 * ```html
 * <agent-ui-annotation theme="auto" output-level="standard"></agent-ui-annotation>
 * ```
 *
 * Events:
 * - annotation:create - Fired when an annotation is created
 * - annotation:update - Fired when an annotation is updated
 * - annotation:delete - Fired when an annotation is deleted
 * - annotation:clear - Fired when all annotations are cleared
 * - annotation:copy - Fired when output is copied
 */
export class AnnotationElement extends LitElement {
  static styles = componentStyles;

  // Static properties (no decorators for lighter bundle)
  // Using 'declare' to avoid class field shadowing Lit's accessors
  // See: https://lit.dev/msg/class-field-shadowing
  static properties = {
    theme: { type: String, reflect: true },
    outputLevel: { type: String, attribute: 'output-level' },
    annotationColor: { type: String, attribute: 'annotation-color' },
    disabled: { type: Boolean },
  };

  // Public properties (from attributes)
  // Use 'declare' so TypeScript knows about them without generating class fields
  declare theme: ThemeMode;
  declare outputLevel: OutputLevel;
  declare annotationColor: string;
  declare disabled: boolean;

  constructor() {
    super();
    // Initialize default values in constructor instead of class fields
    this.theme = 'auto';
    this.outputLevel = 'standard';
    this.annotationColor = '#AF52DE';
    this.disabled = false;
  }

  // Core controller
  private core: AnnotationCore | null = null;
  private unsubscribe: (() => void) | null = null;
  private beforeCreateHook: BeforeAnnotationCreateHook | null = null;

  // Internal state
  private appState: AppState | null = null;
  private popupComment: string = '';
  private popupShaking: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private hoveredMarkerId: string | null = null;

  // Animation tracking
  private toolbarShownOnce: boolean = false;
  private settingsPanelAnimated: boolean = false;
  private animatedMarkerTooltipId: string | null = null;
  private lastRenderedSettings: string | null = null;
  private showCountSummary: boolean = false;

  // Bound handlers for cleanup
  private boundHandleResize = () => this.handleWindowResize();
  private boundHandleMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private boundHandleDocumentClick = (e: Event) => this.handleDocumentClick(e);
  private boundHandleScroll = () => this.handleScroll();

  // Textarea ref for autofocus
  private textareaRef: Ref<HTMLTextAreaElement> = createRef();
  private popupPosition: { left: number; top: number } | null = null;
  private popupPositionTimer: number | null = null;
  private currentRoute: string = getCurrentRoute();
  private routeListenerCleanup: (() => void) | null = null;
  private devtoolsApi: DevtoolsApi | null = null;

  connectedCallback() {
    super.connectedCallback();

    // Expose instance for devtools automation
    this.devtoolsApi = createDevtoolsApi(this);
    attachDevtoolsApi(this, this.devtoolsApi);

    // Initialize core
    this.core = createAnnotationCore({
      settings: this.getSettingsFromAttributes(),
      loadPersisted: true,
      onBeforeAnnotationCreate: this.beforeCreateHook ?? undefined,
      onAnnotationCreate: (annotation) => this.dispatchAnnotationEvent('annotation:create', { annotation }),
      onAnnotationUpdate: (annotation) => this.dispatchAnnotationEvent('annotation:update', { annotation }),
      onAnnotationDelete: (id) => this.dispatchAnnotationEvent('annotation:delete', { id }),
      onAnnotationsClear: (annotations) => this.dispatchAnnotationEvent('annotation:clear', { annotations }),
      onCopy: (content, level) => this.dispatchAnnotationEvent('annotation:copy', { content, level }),
    });

    this.routeListenerCleanup = this.bindRouteListeners();

    // Subscribe to state changes
    this.unsubscribe = this.core.subscribe((state) => {
      this.appState = state;
      // Reset popup comment when popup closes or opens for a different annotation
      if (!state.popupVisible) {
        this.popupComment = '';
      } else if (state.popupAnnotationId) {
        const annotation = state.annotations.get(state.popupAnnotationId);
        this.popupComment = annotation?.comment || '';
      }
      this.requestUpdate();
    });

    // Set up event listeners
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('click', this.boundHandleDocumentClick);
    window.addEventListener('resize', this.boundHandleResize);
    document.addEventListener('scroll', this.boundHandleScroll, { capture: true, passive: true });

    // Initial state
    this.appState = this.core.store.getState();
    this.updateThemeAttribute();

    // Re-find DOM elements for persisted annotations once the DOM is settled.
    // Use rAF to allow frameworks (React, Vue, etc.) to finish hydration first.
    requestAnimationFrame(() => this.refindAnnotationElements());
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    detachDevtoolsApi(this, this.devtoolsApi);
    this.devtoolsApi = null;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.routeListenerCleanup) {
      this.routeListenerCleanup();
      this.routeListenerCleanup = null;
    }

    window.removeEventListener('resize', this.boundHandleResize);
    document.removeEventListener('scroll', this.boundHandleScroll, true);
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('click', this.boundHandleDocumentClick);

    if (this.core) {
      this.core.destroy();
      this.core = null;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Handle attribute changes
    if (changedProperties.has('theme') && this.core) {
      this.core.updateSettings({ theme: this.theme });
      this.updateThemeAttribute();
    }

    if (changedProperties.has('outputLevel') && this.core) {
      this.core.updateSettings({ outputLevel: this.outputLevel });
    }

    if (changedProperties.has('annotationColor') && this.core) {
      this.core.updateSettings({ annotationColor: this.annotationColor });
    }

    if (changedProperties.has('disabled') && this.core && this.disabled) {
      this.core.deactivate();
    }

    // Focus textarea when popup opens
    if (this.appState?.popupVisible && this.textareaRef.value) {
      this.textareaRef.value.focus();
    }

    this.syncPopupPosition();
  }

  /**
   * Public API
   */

  /**
   * Set the hook called before creating annotations.
   * This must be called before connectedCallback runs (i.e., before the element is added to the DOM)
   * OR the component must be re-initialized after setting.
   *
   * For framework adapters, call this immediately after element creation.
   */
  setBeforeCreateHook(hook: BeforeAnnotationCreateHook | null) {
    this.beforeCreateHook = hook;

    // If core already exists, we need to recreate it to apply the hook
    // This handles the case where the hook is set after the element is connected
    if (this.core) {
      // Store current state
      const wasActive = this.core.isActive();
      const currentMode = this.core.getMode();

      // Destroy old core
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
      this.core.destroy();

      // Create new core with hook
      this.core = createAnnotationCore({
        settings: this.getSettingsFromAttributes(),
        loadPersisted: true,
        onBeforeAnnotationCreate: hook ?? undefined,
        onAnnotationCreate: (annotation) => this.dispatchAnnotationEvent('annotation:create', { annotation }),
        onAnnotationUpdate: (annotation) => this.dispatchAnnotationEvent('annotation:update', { annotation }),
        onAnnotationDelete: (id) => this.dispatchAnnotationEvent('annotation:delete', { id }),
        onAnnotationsClear: (annotations) => this.dispatchAnnotationEvent('annotation:clear', { annotations }),
        onCopy: (content, level) => this.dispatchAnnotationEvent('annotation:copy', { content, level }),
      });

      // Subscribe to state changes
      this.unsubscribe = this.core.subscribe((state) => {
        this.appState = state;
        if (!state.popupVisible) {
          this.popupComment = '';
        } else if (state.popupAnnotationId) {
          const annotation = state.annotations.get(state.popupAnnotationId);
          this.popupComment = annotation?.comment || '';
        }
        this.requestUpdate();
      });

      this.appState = this.core.store.getState();

      // Restore active state if it was active
      if (wasActive && currentMode !== 'disabled') {
        this.core.activate(currentMode);
      }
    }
  }

  activate() {
    this.core?.activate();
  }

  deactivate() {
    this.core?.deactivate();
  }

  toggle() {
    this.core?.toggle();
  }

  async copyOutput(level?: OutputLevel): Promise<boolean> {
    return this.core?.copyOutput(level) ?? false;
  }

  getOutput(level?: OutputLevel): string {
    return this.core?.getOutput(level) ?? '';
  }

  clearAll() {
    this.core?.annotations.clearAllAnnotations();
  }

  /**
   * Private methods
   */

  private getSettingsFromAttributes(): Partial<Settings> {
    const settings: Partial<Settings> = {};

    if (this.theme === 'light' || this.theme === 'dark' || this.theme === 'auto') {
      settings.theme = this.theme;
    }

    if (this.outputLevel === 'compact' || this.outputLevel === 'standard' || this.outputLevel === 'detailed' || this.outputLevel === 'forensic') {
      settings.outputLevel = this.outputLevel;
    }

    if (this.annotationColor) {
      settings.annotationColor = this.annotationColor;
    }

    return settings;
  }

  private updateThemeAttribute() {
    if (!this.core) return;

    const theme = this.core.getSettings().theme;
    const resolved = resolveTheme(theme);

    this.setAttribute('data-theme', theme);
    if (theme === 'auto') {
      this.setAttribute('data-resolved-theme', resolved);
    }
  }

  private handleWindowResize() {
    if (!this.core) return;

    const state = this.core.store.getState();

    // Recompute marker positions from live element references
    const newAnnotations = new Map<string, typeof state.annotations extends Map<string, infer V> ? V : never>();
    for (const [id, annotation] of state.annotations) {
      if (!annotation.element || !annotation.element.isConnected) {
        // Keep annotation as-is if element is gone
        newAnnotations.set(id, annotation);
        continue;
      }

      const rect = annotation.element.getBoundingClientRect();

      // Use stored offset percentage to maintain relative position within element
      const offsetXPercent = annotation.offsetX;
      const offsetYPercent = annotation.offsetY;

      const newClickX = rect.left + (rect.width * offsetXPercent);
      const newClickY = rect.top + (rect.height * offsetYPercent) + window.scrollY;

      // Always create new annotation object to ensure state change is detected
      newAnnotations.set(id, { ...annotation, clickX: newClickX, clickY: newClickY });
    }

    // Always update state with fresh annotations and scroll position
    this.core.store.setState({
      annotations: newAnnotations,
      scrollY: window.scrollY,
    });
  }

  /**
   * Attempt to re-find DOM elements for persisted annotations that
   * lost their element reference (e.g., after page reload).
   * Uses the stored selectorPath, ID, classes, and text content.
   * Retries up to MAX_RETRIES times for dynamically loaded content.
   */
  private refindAnnotationElements(retryCount: number = 0) {
    if (!this.core) return;

    const state = this.core.store.getState();
    const updatedAnnotations = new Map(state.annotations);
    let changed = false;
    let allFound = true;

    for (const [id, annotation] of updatedAnnotations) {
      // Only try re-finding if the element is missing or disconnected
      if (annotation.element && annotation.element.isConnected) continue;

      const element = refindElement(annotation.elementInfo);
      if (element) {
        updatedAnnotations.set(id, { ...annotation, element });
        changed = true;
      } else {
        allFound = false;
      }
    }

    if (changed) {
      this.core.store.setState({ annotations: updatedAnnotations });
    }

    // Retry for dynamically loaded content (e.g., async lists, lazy components)
    const MAX_RETRIES = 3;
    if (!allFound && retryCount < MAX_RETRIES) {
      setTimeout(() => this.refindAnnotationElements(retryCount + 1), 100 * (retryCount + 1));
    }
  }

  private handleDocumentClick(event: Event) {
    if (!this.core) return;

    const state = this.core.store.getState();
    if (!state.settingsPanelVisible && !this.showCountSummary) return;

    const path = event.composedPath();
    const clickedInside = path.some((el) => el === this);

    if (!clickedInside) {
      this.showCountSummary = false;
      if (state.settingsPanelVisible) {
        this.core.store.setState({ settingsPanelVisible: false });
      } else {
        this.requestUpdate();
      }
    }
  }

  /**
   * Keep markers tracking their elements on ANY scroll event.
   * Uses capture-phase listener on document to catch nested scroll
   * containers (not just the main page scroll).
   * This listener runs at all times (not just when activated) so that
   * dots-mode markers also move correctly when the toolbar is closed.
   */
  private handleScroll() {
    if (!this.core) return;
    // Always update the main scrollY state
    this.core.store.setState({ scrollY: window.scrollY });
    // Force a re-render so markers with live elements update position
    // (needed for nested scroll containers where scrollY doesn't change)
    this.requestUpdate();
  }

  private bindRouteListeners(): () => void {
    const routeEventName = 'agent-ui-annotation:route-change';
    const handleRouteChange = () => {
      const nextRoute = getCurrentRoute();
      if (nextRoute !== this.currentRoute) {
        this.currentRoute = nextRoute;
        this.requestUpdate();
        // Re-find elements for annotations that may now be on the visible route
        requestAnimationFrame(() => this.refindAnnotationElements());
      }
    };

    const w = window as any;
    if (!w.__agentUiAnnotationHistoryPatched) {
      const dispatch = () => window.dispatchEvent(new Event(routeEventName));
      const wrap = <T extends (...args: any[]) => any>(fn: T): T => {
        return function (this: History, ...args: Parameters<T>): ReturnType<T> {
          const result = fn.apply(this, args);
          dispatch();
          return result;
        } as T;
      };

      history.pushState = wrap(history.pushState.bind(history));
      history.replaceState = wrap(history.replaceState.bind(history));
      w.__agentUiAnnotationHistoryPatched = true;
    }

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener(routeEventName, handleRouteChange as EventListener);

    // Set initial route
    this.currentRoute = getCurrentRoute();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener(routeEventName, handleRouteChange as EventListener);
    };
  }

  private handleMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const action = target.closest('[data-action]')?.getAttribute('data-action');
    const annotationId = target.closest('[data-annotation-id]')?.getAttribute('data-annotation-id');

    if (!this.core) return;

    switch (action) {
      case 'toggle':
        this.core.toggle();
        break;

      case 'close':
        this.core.deactivate();
        break;

      case 'freeze':
        this.core.freeze.toggle();
        break;

      case 'toggle-markers': {
        const state = this.core.store.getState();
        // Cycle: full → dots → hidden → full
        const next = state.markerVisibility === 'full' ? 'dots'
          : state.markerVisibility === 'dots' ? 'hidden'
          : 'full';
        this.core.store.setState({ markerVisibility: next });
        break;
      }

      case 'copy':
        this.core.copyOutput();
        break;

      case 'clear':
        this.core.annotations.clearAllAnnotations();
        break;

      case 'theme': {
        const currentTheme = this.core.getSettings().theme;
        const resolved = resolveTheme(currentTheme);
        const newTheme = resolved === 'dark' ? 'light' : 'dark';
        this.core.updateSettings({ theme: newTheme });
        this.updateThemeAttribute();
        break;
      }

      case 'settings': {
        const currentState = this.core.store.getState();
        this.showCountSummary = false;
        this.core.store.setState({ settingsPanelVisible: !currentState.settingsPanelVisible });
        break;
      }

      case 'annotations': {
        this.showCountSummary = !this.showCountSummary;
        if (this.showCountSummary) {
          this.core.store.setState({ settingsPanelVisible: false });
        }
        this.requestUpdate();
        break;
      }

      case 'navigate-route': {
        event.preventDefault();
        const link = (target.closest('[data-route-href]') as HTMLElement);
        const href = link?.getAttribute('data-route-href');
        if (href) {
          try {
            const url = new URL(href);
            history.pushState({}, '', url.pathname + url.search + url.hash);
          } catch {
            history.pushState({}, '', href);
          }
          window.dispatchEvent(new Event('agent-ui-annotation:route-change'));
        }
        this.showCountSummary = false;
        break;
      }

      case 'popup-close':
      case 'popup-cancel':
        this.core.hidePopup();
        break;

      case 'popup-submit':
        this.handlePopupSubmit();
        break;

      case 'popup-delete':
        this.handlePopupDelete();
        break;
    }

    // Handle marker click
    if (annotationId && !action) {
      this.core.showPopup(annotationId);
    }

    // Handle settings panel changes
    const settingElement = target.closest('[data-setting]') as HTMLElement;
    if (settingElement) {
      this.handleSettingChange(settingElement);
    }
  }

  private handleSettingChange(settingElement: HTMLElement) {
    if (!this.core) return;

    const setting = settingElement.getAttribute('data-setting');
    const value = settingElement.getAttribute('data-value');

    switch (setting) {
      case 'outputLevel': {
        const select = settingElement as HTMLSelectElement;
        this.core.updateSettings({ outputLevel: select.value as OutputLevel });
        break;
      }

      case 'annotationColor':
        if (value) {
          this.core.updateSettings({ annotationColor: value });
        }
        break;

      case 'blockInteractions':
        this.core.updateSettings({ blockInteractions: value === 'true' });
        break;

      case 'showTooltips':
        this.core.updateSettings({ showTooltips: value === 'true' });
        break;

      case 'autoClearAfterCopy':
        this.core.updateSettings({ autoClearAfterCopy: value === 'true' });
        break;
    }
  }

  private handleMouseOver(event: Event) {
    const target = event.target as HTMLElement;

    // Marker hover
    const marker = target.closest('[data-annotation-id]');
    if (marker) {
      const id = marker.getAttribute('data-annotation-id');
      if (id !== this.hoveredMarkerId) {
        this.hoveredMarkerId = id;
        this.requestUpdate();
      }
      return;
    }

    // annotation count panel is click-only
  }

  private handleMouseOut(event: Event) {
    const target = event.target as HTMLElement;
    const relatedTarget = (event as MouseEvent).relatedTarget as HTMLElement | null;

    // Marker hover
    if (target.closest('[data-annotation-id]')) {
      if (!relatedTarget?.closest(`[data-annotation-id="${this.hoveredMarkerId}"]`)) {
        this.hoveredMarkerId = null;
        this.requestUpdate();
      }
      return;
    }

    // annotation count panel is click-only
  }

  private handlePopupKeyDown(event: KeyboardEvent) {
    // Submit on Enter (unless shift held for newline or IME is composing)
    // event.isComposing is true when Enter is pressed to confirm IME character selection
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.handlePopupSubmit();
    }

    // Cancel on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      this.core?.hidePopup();
    }
  }

  private handlePopupInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.popupComment = textarea.value;
  }

  private async handlePopupSubmit() {
    if (!this.core || !this.appState) return;

    const state = this.appState;
    const comment = this.popupComment.trim();

    if (state.popupAnnotationId) {
      // Update existing annotation
      this.core.annotations.updateAnnotation(state.popupAnnotationId, { comment });
    } else if (state.multiSelectElements.length > 1) {
      // Multi-select: create annotations for all selected elements
      for (let i = 0; i < state.multiSelectElements.length; i++) {
        const element = state.multiSelectElements[i];
        const elementInfo = state.multiSelectInfos[i];

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clickX = centerX;
        const clickY = centerY + window.scrollY;

        // For multi-select, marker is centered so offset is 0.5 (50%)
        const offsetX = 0.5;
        const offsetY = 0.5;

        // Note: addAnnotation may return null if cancelled by hook
        await this.core.annotations.addAnnotation(element, comment, {
          clickX,
          clickY,
          offsetX,
          offsetY,
          isMultiSelect: true,
          elementInfo,
        });
      }
    } else if (state.hoveredElement && state.popupElementInfo) {
      const clickX = state.popupClickX;
      const clickY = state.popupClickY + window.scrollY;

      // Calculate offset as percentage (0-1) from element's top-left corner
      const rect = state.hoveredElement.getBoundingClientRect();
      const offsetX = (state.popupClickX - rect.left) / rect.width;
      const offsetY = (state.popupClickY - rect.top) / rect.height;

      // Note: addAnnotation may return null if cancelled by hook
      await this.core.annotations.addAnnotation(state.hoveredElement, comment, {
        clickX,
        clickY,
        offsetX,
        offsetY,
        elementInfo: state.popupElementInfo,
      });
    }

    this.core.hidePopup();
  }

  private handlePopupDelete() {
    if (!this.core || !this.appState) return;

    if (this.appState.popupAnnotationId) {
      this.core.annotations.deleteAnnotation(this.appState.popupAnnotationId);
      this.core.hidePopup();
    }
  }

  private dispatchAnnotationEvent(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Generate route-grouped annotation count summary HTML
   */
  private generateCountSummary(annotations: import('../core/types').Annotation[]): string {
    if (annotations.length === 0) return '';

    const routeGroups = new Map<string, import('../core/types').Annotation[]>();
    for (const annotation of annotations) {
      const route = getAnnotationRoute(annotation) || this.currentRoute;
      const list = routeGroups.get(route) || [];
      list.push(annotation);
      routeGroups.set(route, list);
    }

    let html = `<div class="annotations-panel" data-annotation-list-panel><div class="annotations-panel-title">${this.escapeHtmlStr(t('toolbar.annotations'))}</div>`;
    for (const [route, routeAnnotations] of routeGroups) {
      let displayPath: string;
      try {
        displayPath = new URL(route).pathname;
      } catch {
        displayPath = route;
      }

      html += '<details class="annotations-route" open>';
      html += '<summary>';
      html += `<span class="summary-path">${this.escapeHtmlStr(displayPath)}</span>`;
      html += `<span class="summary-count">${routeAnnotations.length}</span>`;
      html += '</summary>';
      html += '<div class="annotations-preview-list">';

      for (const annotation of routeAnnotations.sort((a, b) => a.number - b.number)) {
        const commentPreview = annotation.comment.trim() || t('marker.noComment');
        html += '<div class="annotation-preview-item">';
        html += `<span class="annotation-preview-number">#${annotation.number}</span>`;
        html += `<span class="annotation-preview-target">${this.escapeHtmlStr(annotation.elementInfo.humanReadable)}</span>`;
        html += `<span class="annotation-preview-comment">${this.escapeHtmlStr(commentPreview)}</span>`;
        html += '</div>';
      }

      html += '</div></details>';
    }
    html += '</div>';

    return html;
  }

  private escapeHtmlStr(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render popup using Lit's html template for proper IME/input handling
   */
  private renderPopupTemplate(state: AppState) {
    if (!state.popupVisible) return nothing;

    const existingAnnotation = state.popupAnnotationId ? state.annotations.get(state.popupAnnotationId) : null;
    const elementInfo = existingAnnotation?.elementInfo || state.popupElementInfo;
    const isMultiSelect = state.multiSelectInfos.length > 1;
    const isEditing = !!existingAnnotation;

    if (!elementInfo && !existingAnnotation) return nothing;

    const info = elementInfo!;
    const clickX = existingAnnotation ? existingAnnotation.clickX : state.popupClickX;
    const rawClickY = existingAnnotation ? existingAnnotation.clickY : state.popupClickY;
    // Existing annotations store document-absolute coords, convert to viewport for popup
    const clickY = existingAnnotation
      ? rawClickY - window.scrollY
      : rawClickY;

    const position = this.popupPosition ?? calculatePopupPosition(clickX, clickY);

    // Build header content
    const headerContent = isMultiSelect
      ? html`
          <div class="popup-multiselect-header">
            <div class="popup-element">${t('popup.elementsSelected', { count: state.multiSelectInfos.length })}</div>
            <ul class="popup-element-list">
              ${state.multiSelectInfos.slice(0, 5).map(i => html`<li>${i.humanReadable}</li>`)}
              ${state.multiSelectInfos.length > 5 ? html`<li>${t('popup.andMore', { count: state.multiSelectInfos.length - 5 })}</li>` : nothing}
            </ul>
          </div>
        `
      : html`
          <div>
            <div class="popup-element">${info.humanReadable}</div>
            <div class="popup-path">${info.selectorPath}</div>
            ${info.componentPath ? html`<div class="popup-component">${info.componentPath}</div>` : nothing}
          </div>
        `;

    return html`
      <div
        class="popup-popover ${this.popupShaking ? 'shake' : ''}"
        style="left: ${position.left}px; top: ${position.top}px;"
        data-annotation-popup
      >
        <div class="popup-header">
          ${headerContent}
          <button class="popup-close" data-action="popup-close" title="${t('popup.close')}">
            ${unsafeHTML(icons.x)}
          </button>
        </div>

        <div class="popup-body">
          <textarea
            ${ref(this.textareaRef)}
            class="popup-textarea"
            placeholder="${isMultiSelect ? t('popup.addFeedbackMulti') : t('popup.addFeedback')}"
            .value=${this.popupComment}
            @input=${this.handlePopupInput}
            @keydown=${this.handlePopupKeyDown}
          ></textarea>
        </div>

        <div class="popup-footer">
          ${isEditing ? html`
            <button class="popup-btn danger" data-action="popup-delete">
              ${t('popup.delete')}
            </button>
          ` : nothing}
          <button class="popup-btn" data-action="popup-cancel">
            ${t('popup.cancel')}
          </button>
          <button class="popup-btn primary" data-action="popup-submit">
            ${isEditing ? t('popup.save') : isMultiSelect ? t('popup.addAnnotations', { count: state.multiSelectInfos.length }) : t('popup.addAnnotation')}
          </button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.appState || !this.core) {
      return nothing;
    }

    const state = this.appState;
    const settings = state.settings;
    const annotations = Array.from(state.annotations.values()).sort((a, b) => a.number - b.number);
    const visibleAnnotations = annotations.filter((annotation) =>
      isAnnotationVisibleOnRoute(annotation, this.currentRoute)
    );
    const totalAnnotationCount = annotations.length;
    const nextAnnotationNumber = annotations.length > 0
      ? Math.max(...annotations.map((annotation) => annotation.number)) + 1
      : 1;
    const resolvedTheme = resolveTheme(settings.theme);

    // Track animations for settings panel
    if (state.settingsPanelVisible) {
      const currentSettingsKey = JSON.stringify({
        settings,
        settingsPanelVisible: state.settingsPanelVisible,
        annotationCount: totalAnnotationCount,
        isFrozen: state.isFrozen,
        markerVisibility: state.markerVisibility,
        theme: resolvedTheme,
      });

      if (this.lastRenderedSettings !== currentSettingsKey) {
        this.lastRenderedSettings = currentSettingsKey;
      }
    } else {
      this.lastRenderedSettings = null;
    }

    // Toolbar HTML (using existing templates with unsafeHTML)
    let toolbarHtml = '';
    if (state.toolbarExpanded) {
      const showEntranceAnimation = !this.toolbarShownOnce;
      if (showEntranceAnimation) {
        this.toolbarShownOnce = true;
      }

      let settingsPanelHtml = '';
      if (state.settingsPanelVisible) {
        const skipSettingsAnimation = this.settingsPanelAnimated;
        settingsPanelHtml = renderSettingsPanel({ settings, skipAnimation: skipSettingsAnimation });
        this.settingsPanelAnimated = true;
      } else {
        this.settingsPanelAnimated = false;
      }

      toolbarHtml = renderExpandedToolbar({
        annotationCount: totalAnnotationCount,
        isFrozen: state.isFrozen,
        markerVisibility: state.markerVisibility,
        isDarkMode: resolvedTheme === 'dark',
        showCopiedFeedback: state.showCopiedFeedback,
        showClearedFeedback: state.showClearedFeedback,
        showEntranceAnimation,
        settingsPanelHtml,
        annotationsPanelHtml: this.showCountSummary && totalAnnotationCount > 0
          ? this.generateCountSummary(annotations)
          : '',
      });
    } else {
      this.toolbarShownOnce = false;
      this.settingsPanelAnimated = false;
      toolbarHtml = renderCollapsedToolbar(totalAnnotationCount);
    }

    // Markers HTML
    // Show markers when:
    //  - toolbar expanded + visibility is 'full' or 'dots'
    //  - toolbar collapsed + visibility is 'dots' (persistent dot indicators)
    const showMarkers = state.markerVisibility !== 'hidden'
      && (state.toolbarExpanded || state.markerVisibility === 'dots');
    let markersHtml = '';
    if (showMarkers) {
      let pendingMarker = null;
      let pendingMarkers: Array<{ x: number; y: number }> = [];

      if (state.popupVisible && !state.popupAnnotationId) {
        if (state.multiSelectElements.length > 1) {
          pendingMarkers = state.multiSelectElements.map((el) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            return {
              x: centerX,
              y: centerY + window.scrollY,
            };
          });
        } else if (state.pendingMarkerX !== 0) {
          pendingMarker = {
            x: state.pendingMarkerX,
            y: state.pendingMarkerY,
          };
        }
      }

      const skipTooltipAnimation = this.hoveredMarkerId !== null && this.hoveredMarkerId === this.animatedMarkerTooltipId;
      if (this.hoveredMarkerId !== null) {
        this.animatedMarkerTooltipId = this.hoveredMarkerId;
      } else {
        this.animatedMarkerTooltipId = null;
      }

      markersHtml = renderMarkers({
        annotations: visibleAnnotations,
        hoveredMarkerId: this.hoveredMarkerId,
        exitingMarkers: state.exitingMarkers,
        animatingMarkers: state.animatingMarkers,
        scrollY: state.scrollY,
        accentColor: settings.annotationColor,
        markerVisibility: state.markerVisibility,
        pendingMarker,
        pendingMarkers,
        nextNumber: nextAnnotationNumber,
        skipTooltipAnimation,
      });
    }

    // Hover tooltip HTML (suppress during Cmd/Ctrl passthrough)
    let tooltipHtml = '';
    let highlightHtml = '';
    if (state.toolbarExpanded && !state.popupVisible && !state.passthroughActive && state.hoveredElementInfo && settings.showTooltips) {
      tooltipHtml = renderHoverTooltip({
        elementInfo: state.hoveredElementInfo,
        x: this.mouseX,
        y: this.mouseY,
      });

      if (state.hoveredElement) {
        const rect = state.hoveredElement.getBoundingClientRect();
        highlightHtml = renderHighlight(rect, settings.annotationColor);
      }
    }

    // Selection rectangle HTML
    let selectionHtml = '';
    if (state.isSelecting && state.selectionRect) {
      const normalized = normalizeRect(state.selectionRect);
      selectionHtml = renderSelectionRect(normalized, settings.annotationColor);

      for (const element of state.selectionPreviewElements) {
        const rect = element.getBoundingClientRect();
        selectionHtml += renderHighlight(rect, settings.annotationColor);
      }
    }

    return html`
      <div
        class="annotation-root"
        @click=${this.handleClick}
        @change=${this.handleClick}
        @mouseover=${this.handleMouseOver}
        @mouseout=${this.handleMouseOut}
      >
        ${unsafeHTML(toolbarHtml)}
        ${unsafeHTML(markersHtml)}
        ${this.renderPopupTemplate(state)}
        ${unsafeHTML(tooltipHtml)}
        ${unsafeHTML(highlightHtml)}
        ${unsafeHTML(selectionHtml)}
      </div>
    `;
  }

  // Position toolbar after render
  protected firstUpdated() {
    this.positionToolbar();
  }

  protected willUpdate() {
    // Position toolbar on each update
    requestAnimationFrame(() => this.positionToolbar());
  }

  private syncPopupPosition() {
    if (!this.appState?.popupVisible) {
      this.popupPosition = null;
      if (this.popupPositionTimer !== null) {
        window.clearTimeout(this.popupPositionTimer);
        this.popupPositionTimer = null;
      }
      return;
    }

    const popup = this.renderRoot?.querySelector('.popup-popover') as HTMLElement | null;
    if (!popup) return;

    const rect = popup.getBoundingClientRect();
    const clickX = this.appState.popupClickX;
    const clickY = this.appState.popupClickY;
    const nextPosition = calculatePopupPosition(clickX, clickY, { width: rect.width, height: rect.height });

    popup.style.left = `${nextPosition.left}px`;
    popup.style.top = `${nextPosition.top}px`;

    this.popupPosition = nextPosition;

    if (this.popupPositionTimer === null) {
      this.popupPositionTimer = window.setTimeout(() => {
        this.popupPositionTimer = null;
        if (this.appState?.popupVisible) {
          this.syncPopupPosition();
        }
      }, 180);
    }
  }

  private positionToolbar() {
    if (!this.appState) return;

    const toolbar = this.renderRoot.querySelector('.toolbar') as HTMLElement;
    if (!toolbar) return;

    const padding = 20;
    const { toolbarPosition } = this.appState.settings;

    let x: number, y: number;

    switch (toolbarPosition) {
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-right':
        x = window.innerWidth - toolbar.offsetWidth - padding;
        y = padding;
        break;
      case 'bottom-left':
        x = padding;
        y = window.innerHeight - toolbar.offsetHeight - padding;
        break;
      case 'bottom-right':
      default:
        x = window.innerWidth - toolbar.offsetWidth - padding;
        y = window.innerHeight - toolbar.offsetHeight - padding;
        break;
    }

    if (this.appState.toolbarPosition.x !== 20 || this.appState.toolbarPosition.y !== 20) {
      x = this.appState.toolbarPosition.x;
      y = this.appState.toolbarPosition.y;
    }

    toolbar.style.left = `${x}px`;
    toolbar.style.top = `${y}px`;
  }
}

/**
 * Register the custom element
 */
export function registerAnnotationElement(tagName: string = 'agent-ui-annotation') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, AnnotationElement);
  }
}
