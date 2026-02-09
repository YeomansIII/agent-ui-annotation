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

/**
 * Calculate popup position near click point
 */
function calculatePopupPosition(clickX: number, clickY: number): { left: string; top: string } {
  const popupWidth = 340;
  const popupHeight = 220;
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = clickX + margin;
  let top = clickY - popupHeight / 2;

  if (left + popupWidth > viewportWidth - margin) {
    left = clickX - popupWidth - margin;
  }

  if (left < margin) {
    left = Math.max(margin, clickX - popupWidth / 2);
  }

  left = Math.max(margin, Math.min(left, viewportWidth - popupWidth - margin));

  if (top < margin) {
    top = margin;
  }
  if (top + popupHeight > viewportHeight - margin) {
    top = viewportHeight - popupHeight - margin;
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

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

  // Bound handlers for cleanup
  private boundHandleResize = () => this.handleWindowResize();
  private boundHandleMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private boundHandleDocumentClick = (e: Event) => this.handleDocumentClick(e);

  // Textarea ref for autofocus
  private textareaRef: Ref<HTMLTextAreaElement> = createRef();

  connectedCallback() {
    super.connectedCallback();

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

    // Initial state
    this.appState = this.core.store.getState();
    this.updateThemeAttribute();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    window.removeEventListener('resize', this.boundHandleResize);
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
      // If offset isn't stored (legacy annotations), fall back to center (0.5)
      const offsetXPercent = annotation.offsetX ?? 0.5;
      const offsetYPercent = annotation.offsetY ?? 0.5;

      const newClickX = rect.left + (rect.width * offsetXPercent);
      const newClickY = annotation.elementInfo.isFixed
        ? rect.top + (rect.height * offsetYPercent)
        : rect.top + (rect.height * offsetYPercent) + window.scrollY;

      // Always create new annotation object to ensure state change is detected
      newAnnotations.set(id, { ...annotation, clickX: newClickX, clickY: newClickY });
    }

    // Always update state with fresh annotations and scroll position
    this.core.store.setState({
      annotations: newAnnotations,
      scrollY: window.scrollY,
    });
  }

  private handleDocumentClick(event: Event) {
    if (!this.core) return;

    const state = this.core.store.getState();
    if (!state.settingsPanelVisible) return;

    const path = event.composedPath();
    const clickedInside = path.some((el) => el === this);

    if (!clickedInside) {
      this.core.store.setState({ settingsPanelVisible: false });
    }
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
        this.core.store.setState({ markersVisible: !state.markersVisible });
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
        this.core.store.setState({ settingsPanelVisible: !currentState.settingsPanelVisible });
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
    const marker = target.closest('[data-annotation-id]');

    if (marker) {
      this.hoveredMarkerId = marker.getAttribute('data-annotation-id');
      this.requestUpdate();
    }
  }

  private handleMouseOut(event: Event) {
    const target = event.target as HTMLElement;
    const marker = target.closest('[data-annotation-id]');

    if (marker) {
      this.hoveredMarkerId = null;
      this.requestUpdate();
    }
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

        const isFixed = elementInfo.isFixed;
        const clickX = centerX;
        const clickY = isFixed ? centerY : centerY + window.scrollY;

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
      const isFixed = state.popupElementInfo.isFixed;
      const clickX = state.popupClickX;
      const clickY = isFixed ? state.popupClickY : state.popupClickY + window.scrollY;

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
    const clickY = existingAnnotation ? existingAnnotation.clickY : state.popupClickY;
    const position = calculatePopupPosition(clickX, clickY);

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
        style="left: ${position.left}; top: ${position.top};"
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
    const resolvedTheme = resolveTheme(settings.theme);

    // Track animations for settings panel
    if (state.settingsPanelVisible) {
      const currentSettingsKey = JSON.stringify({
        settings,
        settingsPanelVisible: state.settingsPanelVisible,
        annotationCount: annotations.length,
        isFrozen: state.isFrozen,
        markersVisible: state.markersVisible,
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
        annotationCount: annotations.length,
        isFrozen: state.isFrozen,
        markersVisible: state.markersVisible,
        isDarkMode: resolvedTheme === 'dark',
        showCopiedFeedback: state.showCopiedFeedback,
        showClearedFeedback: state.showClearedFeedback,
        showEntranceAnimation,
        settingsPanelHtml,
      });
    } else {
      this.toolbarShownOnce = false;
      this.settingsPanelAnimated = false;
      toolbarHtml = renderCollapsedToolbar(annotations.length);
    }

    // Markers HTML
    let markersHtml = '';
    if (state.toolbarExpanded && state.markersVisible) {
      let pendingMarker = null;
      let pendingMarkers: Array<{ x: number; y: number; isFixed: boolean }> = [];

      if (state.popupVisible && !state.popupAnnotationId) {
        if (state.multiSelectElements.length > 1) {
          pendingMarkers = state.multiSelectElements.map((el, i) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const isFixed = state.multiSelectInfos[i]?.isFixed || false;

            return {
              x: centerX,
              y: isFixed ? centerY : centerY + window.scrollY,
              isFixed,
            };
          });
        } else if (state.pendingMarkerX !== 0) {
          pendingMarker = {
            x: state.pendingMarkerX,
            y: state.pendingMarkerY,
            isFixed: state.pendingMarkerIsFixed,
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
        annotations,
        hoveredMarkerId: this.hoveredMarkerId,
        exitingMarkers: state.exitingMarkers,
        animatingMarkers: state.animatingMarkers,
        scrollY: state.scrollY,
        accentColor: settings.annotationColor,
        pendingMarker,
        pendingMarkers,
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
