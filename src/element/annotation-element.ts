/**
 * Annotation Custom Element (Web Component)
 */

import type { AppState, Settings, OutputLevel, ThemeMode } from '../core/types';
import { createAnnotationCore, type AnnotationCore } from '../core/controller';
import { resolveTheme } from '../themes/variables';
import { componentStyles } from './styles';
import {
  renderCollapsedToolbar,
  renderExpandedToolbar,
  renderMarkers,
  renderPopup,
  renderHoverTooltip,
  renderHighlight,
  renderSelectionRect,
  renderSettingsPanel,
} from './templates';
import { normalizeRect } from '../core/dom/multi-select';

/**
 * Annotation Web Component
 *
 * Usage:
 * ```html
 * <agent-ui-annotation theme="auto" output-level="standard"></agent-ui-annotation>
 * ```
 *
 * Events:
 * - annotation:scope - Fired when a scope is created
 * - annotation:update - Fired when a scope is updated
 * - annotation:delete - Fired when a scope is deleted
 * - annotation:clear - Fired when all scopes are cleared
 * - annotation:copy - Fired when output is copied
 */
export class AnnotationElement extends HTMLElement {
  private core: AnnotationCore | null = null;
  private shadow: ShadowRoot;
  private unsubscribe: (() => void) | null = null;
  private styleElement: HTMLStyleElement;
  private contentElement: HTMLDivElement;

  // Popup state
  private isComposing = false;
  private popupShaking = false;

  // Hover tracking
  private mouseX = 0;
  private mouseY = 0;
  private hoveredMarkerId: string | null = null;

  // Track if toolbar has been shown before (to prevent re-animation)
  private toolbarShownOnce = false;

  // Track if settings panel has animated (to prevent re-animation on state changes)
  private settingsPanelAnimated = false;

  // Track which marker tooltip has animated (to prevent re-animation)
  private animatedMarkerTooltipId: string | null = null;

  // Track last rendered settings to avoid unnecessary re-renders when settings panel is open
  private lastRenderedSettings: string | null = null;

  static get observedAttributes() {
    return ['theme', 'output-level', 'scope-color', 'disabled'];
  }

  constructor() {
    super();

    // Create shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });

    // Create style element
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = componentStyles;

    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'annotation-root';

    this.shadow.appendChild(this.styleElement);
    this.shadow.appendChild(this.contentElement);
  }

  connectedCallback() {
    // Initialize core
    this.core = createAnnotationCore({
      settings: this.getSettingsFromAttributes(),
      loadPersisted: true,
      onScopeCreate: (scope) => this.dispatchScopeEvent('annotation:scope', { scope }),
      onScopeUpdate: (scope) => this.dispatchScopeEvent('annotation:update', { scope }),
      onScopeDelete: (id) => this.dispatchScopeEvent('annotation:delete', { id }),
      onScopesClear: (scopes) => this.dispatchScopeEvent('annotation:clear', { scopes }),
      onCopy: (content, level) => this.dispatchScopeEvent('annotation:copy', { content, level }),
    });

    // Subscribe to state changes
    this.unsubscribe = this.core.subscribe((state) => this.render(state));

    // Set up event listeners
    this.setupEventListeners();

    // Initial render
    this.render(this.core.store.getState());

    // Set theme attribute for CSS
    this.updateThemeAttribute();
  }

  disconnectedCallback() {
    // Clean up
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.core) {
      this.core.destroy();
      this.core = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue || !this.core) return;

    switch (name) {
      case 'theme':
        this.core.updateSettings({ theme: (newValue as ThemeMode) || 'auto' });
        this.updateThemeAttribute();
        break;

      case 'output-level':
        this.core.updateSettings({ outputLevel: (newValue as OutputLevel) || 'standard' });
        break;

      case 'scope-color':
        this.core.updateSettings({ scopeColor: newValue || '#AF52DE' });
        break;

      case 'disabled':
        if (newValue !== null) {
          this.core.deactivate();
        }
        break;
    }
  }

  /**
   * Public API
   */

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
    this.core?.scopes.clearAllScopes();
  }

  /**
   * Private methods
   */

  private getSettingsFromAttributes(): Partial<Settings> {
    const settings: Partial<Settings> = {};

    const theme = this.getAttribute('theme');
    if (theme === 'light' || theme === 'dark' || theme === 'auto') {
      settings.theme = theme;
    }

    const outputLevel = this.getAttribute('output-level');
    if (outputLevel === 'compact' || outputLevel === 'standard' || outputLevel === 'detailed' || outputLevel === 'forensic') {
      settings.outputLevel = outputLevel;
    }

    const scopeColor = this.getAttribute('scope-color');
    if (scopeColor) {
      settings.scopeColor = scopeColor;
    }

    return settings;
  }

  private updateThemeAttribute() {
    if (!this.core) return;

    const theme = this.core.getSettings().theme;
    const resolved = resolveTheme(theme);

    this.setAttribute('data-theme', theme);
    // Also set resolved theme for CSS
    if (theme === 'auto') {
      this.setAttribute('data-resolved-theme', resolved);
    }
  }

  private setupEventListeners() {
    // Handle clicks on toolbar buttons
    this.shadow.addEventListener('click', this.handleClick.bind(this));

    // Handle mouse events for hover
    this.shadow.addEventListener('mouseover', this.handleMouseOver.bind(this));
    this.shadow.addEventListener('mouseout', this.handleMouseOut.bind(this));

    // Track mouse position for tooltip
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));

    // Handle keyboard in popup
    this.shadow.addEventListener('keydown', this.handleKeyDown.bind(this) as EventListener);

    // Handle IME composition
    this.shadow.addEventListener('compositionstart', () => { this.isComposing = true; });
    this.shadow.addEventListener('compositionend', () => { this.isComposing = false; });

    // Handle select change for settings
    this.shadow.addEventListener('change', this.handleChange.bind(this));

    // Close settings panel when clicking outside
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: Event) {
    if (!this.core) return;

    const state = this.core.store.getState();
    if (!state.settingsPanelVisible) return;

    // Check if click was inside the Annotation element
    const path = event.composedPath();
    const clickedInside = path.some((el) => el === this);

    if (!clickedInside) {
      this.core.store.setState({ settingsPanelVisible: false });
    }
  }

  private handleChange(event: Event) {
    const target = event.target as HTMLElement;
    this.handleSettingChange(target);
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const action = target.closest('[data-action]')?.getAttribute('data-action');
    const scopeId = target.closest('[data-scope-id]')?.getAttribute('data-scope-id');

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

      case 'toggle-markers':
        const state = this.core.store.getState();
        this.core.store.setState({ markersVisible: !state.markersVisible });
        break;

      case 'copy':
        this.core.copyOutput();
        break;

      case 'clear':
        this.core.scopes.clearAllScopes();
        break;

      case 'theme':
        const currentTheme = this.core.getSettings().theme;
        const resolved = resolveTheme(currentTheme);
        const newTheme = resolved === 'dark' ? 'light' : 'dark';
        this.core.updateSettings({ theme: newTheme });
        this.updateThemeAttribute();
        break;

      case 'settings':
        const currentState = this.core.store.getState();
        this.core.store.setState({ settingsPanelVisible: !currentState.settingsPanelVisible });
        break;

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
    if (scopeId && !action) {
      this.core.showPopup(scopeId);
    }

    // Handle settings panel changes
    const settingAttr = target.closest('[data-setting]')?.getAttribute('data-setting');
    if (settingAttr) {
      this.handleSettingChange(target);
    }
  }

  private handleSettingChange(target: HTMLElement) {
    if (!this.core) return;

    const settingElement = target.closest('[data-setting]') as HTMLElement;
    if (!settingElement) return;

    const setting = settingElement.getAttribute('data-setting');
    const value = settingElement.getAttribute('data-value');

    switch (setting) {
      case 'outputLevel':
        const select = settingElement as HTMLSelectElement;
        this.core.updateSettings({ outputLevel: select.value as any });
        break;

      case 'scopeColor':
        if (value) {
          this.core.updateSettings({ scopeColor: value });
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
    const marker = target.closest('[data-scope-id]');

    if (marker) {
      this.hoveredMarkerId = marker.getAttribute('data-scope-id');
      this.render(this.core!.store.getState());
    }
  }

  private handleMouseOut(event: Event) {
    const target = event.target as HTMLElement;
    const marker = target.closest('[data-scope-id]');

    if (marker) {
      this.hoveredMarkerId = null;
      this.render(this.core!.store.getState());
    }
  }

  private handleMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (!target.matches('[data-popup-input]')) return;

    // Submit on Enter (unless composing or shift held)
    if (event.key === 'Enter' && !event.shiftKey && !this.isComposing) {
      event.preventDefault();
      this.handlePopupSubmit();
    }

    // Cancel on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      this.core?.hidePopup();
    }
  }

  private handlePopupSubmit() {
    if (!this.core) return;

    const state = this.core.store.getState();
    const textarea = this.shadow.querySelector('[data-popup-input]') as HTMLTextAreaElement;
    const comment = textarea?.value?.trim() || '';

    if (state.popupAnnotationId) {
      // Update existing scope
      this.core.scopes.updateScope(state.popupAnnotationId, { comment });
    } else if (state.multiSelectElements.length > 1) {
      // Multi-select: create scopes for all selected elements
      for (let i = 0; i < state.multiSelectElements.length; i++) {
        const element = state.multiSelectElements[i];
        const elementInfo = state.multiSelectInfos[i];

        // Position marker at element center
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Convert to document coords for non-fixed elements
        const isFixed = elementInfo.isFixed;
        const clickX = centerX;
        const clickY = isFixed ? centerY : centerY + window.scrollY;

        this.core.scopes.addScope(element, comment, {
          clickX,
          clickY,
          isMultiSelect: true,
        });
      }
    } else if (state.hoveredElement && state.popupElementInfo) {
      // Single element selection
      // Convert viewport coords to document coords for non-fixed elements
      const isFixed = state.popupElementInfo.isFixed;
      const clickX = state.popupClickX;
      const clickY = isFixed ? state.popupClickY : state.popupClickY + window.scrollY;

      // Create new scope with click position
      this.core.scopes.addScope(state.hoveredElement, comment, {
        clickX,
        clickY,
      });
    }

    this.core.hidePopup();
  }

  private handlePopupDelete() {
    if (!this.core) return;

    const state = this.core.store.getState();
    if (state.popupAnnotationId) {
      this.core.scopes.deleteScope(state.popupAnnotationId);
      this.core.hidePopup();
    }
  }

  private dispatchScopeEvent(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private render(state: AppState) {
    const settings = state.settings;
    const scopes = Array.from(state.scopes.values()).sort((a, b) => a.number - b.number);
    const resolvedTheme = resolveTheme(settings.theme);

    // When settings panel is open, skip re-renders unless settings/visibility actually changed
    // This prevents the dropdown from closing when DOM is rebuilt
    if (state.settingsPanelVisible) {
      const currentSettingsKey = JSON.stringify({
        settings,
        settingsPanelVisible: state.settingsPanelVisible,
        scopeCount: scopes.length,
        isFrozen: state.isFrozen,
        markersVisible: state.markersVisible,
        theme: resolvedTheme,
      });

      if (this.lastRenderedSettings === currentSettingsKey) {
        // Nothing relevant changed, skip re-render to keep dropdown open
        return;
      }
      this.lastRenderedSettings = currentSettingsKey;
    } else {
      this.lastRenderedSettings = null;
    }

    let html = '';

    // Toolbar
    if (state.toolbarExpanded) {
      // Only show entrance animation on first expand
      const showEntranceAnimation = !this.toolbarShownOnce;
      if (showEntranceAnimation) {
        this.toolbarShownOnce = true;
      }

      // Track settings panel animation
      let settingsPanelHtml = '';
      if (state.settingsPanelVisible) {
        const skipSettingsAnimation = this.settingsPanelAnimated;
        settingsPanelHtml = renderSettingsPanel({ settings, skipAnimation: skipSettingsAnimation });
        this.settingsPanelAnimated = true;
      } else {
        // Reset when panel is hidden so animation plays again on next open
        this.settingsPanelAnimated = false;
      }

      html += renderExpandedToolbar({
        scopeCount: scopes.length,
        isFrozen: state.isFrozen,
        markersVisible: state.markersVisible,
        isDarkMode: resolvedTheme === 'dark',
        showCopiedFeedback: state.showCopiedFeedback,
        showClearedFeedback: state.showClearedFeedback,
        showEntranceAnimation,
        settingsPanelHtml,
      });
    } else {
      // Reset the flag when toolbar is collapsed so animation plays again on next expand
      this.toolbarShownOnce = false;
      this.settingsPanelAnimated = false;
      html += renderCollapsedToolbar(scopes.length);
    }

    // Markers
    if (state.toolbarExpanded && state.markersVisible) {
      // Show pending marker(s) if popup is open for new scope(s) (not editing existing)
      let pendingMarker = null;
      let pendingMarkers: Array<{ x: number; y: number; isFixed: boolean }> = [];

      if (state.popupVisible && !state.popupAnnotationId) {
        if (state.multiSelectElements.length > 1) {
          // Multi-select: create pending markers for all selected elements
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
          // Single selection: show one pending marker
          pendingMarker = {
            x: state.pendingMarkerX,
            y: state.pendingMarkerY,
            isFixed: state.pendingMarkerIsFixed,
          };
        }
      }

      // Track marker tooltip animation - skip if same marker is still hovered
      const skipTooltipAnimation = this.hoveredMarkerId !== null && this.hoveredMarkerId === this.animatedMarkerTooltipId;
      if (this.hoveredMarkerId !== null) {
        this.animatedMarkerTooltipId = this.hoveredMarkerId;
      } else {
        this.animatedMarkerTooltipId = null;
      }

      html += renderMarkers({
        scopes,
        hoveredMarkerId: this.hoveredMarkerId,
        exitingMarkers: state.exitingMarkers,
        animatingMarkers: state.animatingMarkers,
        scrollY: state.scrollY,
        accentColor: settings.scopeColor,
        pendingMarker,
        pendingMarkers,
        skipTooltipAnimation,
      });
    }

    // Popup
    if (state.popupVisible) {
      const existingScope = state.popupAnnotationId ? state.scopes.get(state.popupAnnotationId) : null;
      html += renderPopup({
        elementInfo: existingScope?.elementInfo || state.popupElementInfo,
        existingScope: existingScope || null,
        isShaking: this.popupShaking,
        clickX: existingScope ? existingScope.clickX : state.popupClickX,
        clickY: existingScope ? existingScope.clickY : state.popupClickY,
        multiSelectInfos: state.multiSelectInfos,
      });
    }

    // Hover tooltip (only when not showing popup)
    if (state.toolbarExpanded && !state.popupVisible && state.hoveredElementInfo && settings.showTooltips) {
      html += renderHoverTooltip({
        elementInfo: state.hoveredElementInfo,
        x: this.mouseX,
        y: this.mouseY,
      });

      // Highlight
      if (state.hoveredElement) {
        const rect = state.hoveredElement.getBoundingClientRect();
        html += renderHighlight(rect, settings.scopeColor);
      }
    }

    // Selection rectangle and preview highlights
    if (state.isSelecting && state.selectionRect) {
      const normalized = normalizeRect(state.selectionRect);
      html += renderSelectionRect(normalized, settings.scopeColor);

      // Render highlights for elements within selection
      for (const element of state.selectionPreviewElements) {
        const rect = element.getBoundingClientRect();
        html += renderHighlight(rect, settings.scopeColor);
      }
    }

    this.contentElement.innerHTML = html;

    // Position toolbar
    this.positionToolbar(state);

    // Focus textarea in popup
    if (state.popupVisible) {
      const textarea = this.shadow.querySelector('[data-popup-input]') as HTMLTextAreaElement;
      textarea?.focus();
    }
  }

  private positionToolbar(state: AppState) {
    const toolbar = this.shadow.querySelector('.toolbar') as HTMLElement;
    if (!toolbar) return;

    // Default to bottom-right
    const padding = 20;
    const { toolbarPosition } = state.settings;

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

    // Use custom position if set
    if (state.toolbarPosition.x !== 20 || state.toolbarPosition.y !== 20) {
      x = state.toolbarPosition.x;
      y = state.toolbarPosition.y;
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
