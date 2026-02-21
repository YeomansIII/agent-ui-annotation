/**
 * DevTools MCP API
 *
 * Exposes a clean, concise API on `window.__agentUiAnnotationApi` so that
 * Chrome DevTools MCP (or any automation) can programmatically drive the
 * annotation tool: activate / deactivate, open popups, inspect annotations,
 * copy output, etc.
 */

import type { Annotation, OutputLevel } from '../core/types';
import type { AnnotationElement } from './annotation-element';
import { collectElementInfo } from '../core/element';
import { isAnnotationVisibleOnRoute } from '../core/annotations/route';

export interface DevtoolsApi {
  /** Activate the annotation tool */
  activate(): void;
  /** Deactivate the annotation tool */
  deactivate(): void;
  /** Toggle activation */
  toggle(): void;
  /** Set tool mode */
  setMode(mode: 'select' | 'multi-select' | 'disabled'): void;
  /** Get current mode */
  getMode(): string | undefined;

  /** Open annotation popup at a DOM element */
  openPopupAtElement(element: Element, options?: { x?: number; y?: number }): boolean;
  /** Open annotation popup at the first element matching a CSS selector */
  openPopupAtSelector(selector: string): boolean;
  /** Open annotation popup at viewport coordinates */
  openPopupAtPoint(x: number, y: number): boolean;
  /** Show popup for an existing annotation by ID */
  showPopupForAnnotation(id: string): void;
  /** Close the currently open popup */
  closePopup(): void;

  /** Copy output to clipboard */
  copyOutput(level?: OutputLevel): Promise<boolean> | undefined;
  /** Get output as string without copying */
  getOutput(level?: OutputLevel): string | undefined;

  /** Get all annotations */
  getAnnotations(): import('../core/types').Annotation[];
  /** Get annotations visible on the current route */
  getVisibleAnnotations(): import('../core/types').Annotation[];
  /** Get the current route */
  getCurrentRoute(): string;
  /** Get full app state */
  getState(): import('../core/types').AppState | undefined;
}

/**
 * Open the annotation popup for a given element.
 * Computes center coordinates from the element rect and emits the
 * `element:click` event so the core controller handles the rest.
 */
export function openPopupAtElement(
  host: AnnotationElement,
  element: Element,
  options?: { x?: number; y?: number },
): boolean {
  const core = (host as any).core;
  if (!core || !element) return false;

  const includeForensic = core.getSettings().outputLevel === 'forensic';
  const elementInfo = collectElementInfo(element, includeForensic);
  const rect = element.getBoundingClientRect();
  const clientX = options?.x ?? rect.left + rect.width / 2;
  const clientY = options?.y ?? rect.top + rect.height / 2;
  const clickX = clientX;
  const clickY = clientY + window.scrollY;

  core.eventBus.emit('element:click', { element, elementInfo, clickX, clickY });
  return true;
}

/**
 * Create the devtools API object bound to a specific AnnotationElement.
 */
export function createDevtoolsApi(host: AnnotationElement): DevtoolsApi {
  return {
    activate: () => host.activate(),
    deactivate: () => host.deactivate(),
    toggle: () => host.toggle(),
    setMode: (mode) => (host as any).core?.setMode(mode),
    getMode: () => (host as any).core?.getMode(),

    openPopupAtElement: (element, opts) => openPopupAtElement(host, element, opts),
    openPopupAtSelector: (selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      return openPopupAtElement(host, element);
    },
    openPopupAtPoint: (x, y) => {
      const element = document.elementFromPoint(x, y);
      if (!element) return false;
      return openPopupAtElement(host, element, { x, y });
    },
    showPopupForAnnotation: (id) => (host as any).core?.showPopup(id),
    closePopup: () => (host as any).core?.hidePopup(),

    copyOutput: (level?) => (host as any).core?.copyOutput(level),
    getOutput: (level?) => (host as any).core?.getOutput(level),

    getAnnotations: () =>
      Array.from((host as any).core?.store.getState().annotations.values() ?? []) as Annotation[],
    getVisibleAnnotations: () => {
      const annotations: Annotation[] = Array.from(
        (host as any).core?.store.getState().annotations.values() ?? [],
      );
      const currentRoute = (host as any).currentRoute;
      return annotations.filter((a: any) => isAnnotationVisibleOnRoute(a, currentRoute));
    },
    getCurrentRoute: () => (host as any).currentRoute,
    getState: () => (host as any).core?.store.getState(),
  };
}

/**
 * Attach the devtools API to window globals.
 */
export function attachDevtoolsApi(host: AnnotationElement, api: DevtoolsApi): void {
  if (typeof window === 'undefined') return;
  const w = window as any;

  w.__agentUiAnnotation = host;
  w.__agentUiAnnotationApi = api;

  w.__agentUiAnnotationInstances = Array.isArray(w.__agentUiAnnotationInstances)
    ? [...new Set([...w.__agentUiAnnotationInstances, host])]
    : [host];

  w.__agentUiAnnotationApis = Array.isArray(w.__agentUiAnnotationApis)
    ? [...new Set([...w.__agentUiAnnotationApis, api])]
    : [api];
}

/**
 * Detach the devtools API from window globals.
 */
export function detachDevtoolsApi(host: AnnotationElement, api: DevtoolsApi | null): void {
  if (typeof window === 'undefined') return;
  const w = window as any;

  if (w.__agentUiAnnotation === host) delete w.__agentUiAnnotation;
  if (w.__agentUiAnnotationApi === api) delete w.__agentUiAnnotationApi;

  if (Array.isArray(w.__agentUiAnnotationApis)) {
    w.__agentUiAnnotationApis = w.__agentUiAnnotationApis.filter((a: unknown) => a !== api);
    if (w.__agentUiAnnotationApis.length === 0) delete w.__agentUiAnnotationApis;
  }

  if (Array.isArray(w.__agentUiAnnotationInstances)) {
    w.__agentUiAnnotationInstances = w.__agentUiAnnotationInstances.filter((i: unknown) => i !== host);
    if (w.__agentUiAnnotationInstances.length === 0) delete w.__agentUiAnnotationInstances;
  }
}
