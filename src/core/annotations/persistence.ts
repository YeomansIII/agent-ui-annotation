/**
 * LocalStorage persistence for annotations and settings
 */

import type { Annotation, AnnotationId, Settings, ElementInfo } from '../types';

const ANNOTATION_KEY_PREFIX = 'annotation-annotations-';
const SETTINGS_KEY = 'annotation-settings';
const THEME_KEY = 'annotation-theme';

/** Retention period in milliseconds (7 days) */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Serializable version of Annotation (without DOM element reference)
 */
interface SerializedAnnotation {
  id: AnnotationId;
  number: number;
  comment: string;
  elementInfo: ElementInfo;
  createdAt: number;
  updatedAt: number;
  selectedText: string | null;
  isMultiSelect: boolean;
  clickX: number;
  clickY: number;
  /** Offset percentage (0-1) from element's left edge */
  offsetX: number;
  /** Offset percentage (0-1) from element's top edge */
  offsetY: number;
  context?: Record<string, unknown>;
}

/**
 * Get storage key for current origin (SPA-safe)
 */
function getAnnotationStorageKey(): string {
  return ANNOTATION_KEY_PREFIX + window.location.origin;
}

function readStoredAnnotations(key: string): SerializedAnnotation[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as SerializedAnnotation[];
  } catch {
    return [];
  }
}

/**
 * Serialize an annotation for storage
 */
function serializeAnnotation(annotation: Annotation): SerializedAnnotation {
  const serialized: SerializedAnnotation = {
    id: annotation.id,
    number: annotation.number,
    comment: annotation.comment,
    elementInfo: annotation.elementInfo,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
    selectedText: annotation.selectedText,
    isMultiSelect: annotation.isMultiSelect,
    clickX: annotation.clickX,
    clickY: annotation.clickY,
    offsetX: annotation.offsetX ?? 0.5,
    offsetY: annotation.offsetY ?? 0.5,
  };

  if (annotation.context !== undefined) serialized.context = annotation.context;

  return serialized;
}

/**
 * Deserialize an annotation from storage
 */
function deserializeAnnotation(data: SerializedAnnotation): Annotation {
  const annotation: Annotation = {
    id: data.id,
    number: data.number,
    comment: data.comment,
    elementInfo: data.elementInfo,
    element: null, // DOM reference will be restored by element re-finding
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    selectedText: data.selectedText,
    isMultiSelect: data.isMultiSelect,
    clickX: data.clickX,
    clickY: data.clickY,
    offsetX: data.offsetX,
    offsetY: data.offsetY,
  };

  if (data.context !== undefined) annotation.context = data.context;

  return annotation;
}

/**
 * Filter out expired annotations
 */
function filterExpired(annotations: SerializedAnnotation[]): SerializedAnnotation[] {
  const cutoff = Date.now() - RETENTION_MS;
  return annotations.filter((annotation) => annotation.createdAt > cutoff);
}

/**
 * Save annotations to LocalStorage
 */
export function saveAnnotations(annotations: Map<AnnotationId, Annotation>): boolean {
  try {
    const key = getAnnotationStorageKey();
    const serialized = Array.from(annotations.values()).map(serializeAnnotation);
    localStorage.setItem(key, JSON.stringify(serialized));
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to save annotations:', error);
    return false;
  }
}

/**
 * Load annotations from LocalStorage
 */
export function loadAnnotations(): Map<AnnotationId, Annotation> {
  try {
    const key = getAnnotationStorageKey();
    const parsed = readStoredAnnotations(key);
    const filtered = filterExpired(parsed);

    if (filtered.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
    }

    const annotations = new Map<AnnotationId, Annotation>();
    for (const data of filtered) {
      annotations.set(data.id, deserializeAnnotation(data));
    }

    return annotations;
  } catch (error) {
    console.error('[Annotation] Failed to load annotations:', error);
    return new Map();
  }
}

/**
 * Clear annotations from LocalStorage
 */
export function clearAnnotations(): boolean {
  try {
    const key = getAnnotationStorageKey();
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to clear annotations:', error);
    return false;
  }
}

/**
 * Save settings to LocalStorage
 */
export function saveSettings(settings: Settings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to save settings:', error);
    return false;
  }
}

/**
 * Load settings from LocalStorage
 */
export function loadSettings(): Partial<Settings> | null {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Partial<Settings>;
  } catch (error) {
    console.error('[Annotation] Failed to load settings:', error);
    return null;
  }
}

/**
 * Save theme preference
 */
export function saveTheme(theme: 'light' | 'dark'): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to save theme:', error);
    return false;
  }
}

/**
 * Load theme preference
 */
export function loadTheme(): 'light' | 'dark' | null {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  } catch (error) {
    console.error('[Annotation] Failed to load theme:', error);
    return null;
  }
}

/**
 * Create an auto-save handler that debounces saves
 */
export function createAutoSaver(
  getAnnotations: () => Map<AnnotationId, Annotation>,
  debounceMs: number = 1000
): { save: () => void; flush: () => void; destroy: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    saveAnnotations(getAnnotations());
  };

  const save = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(flush, debounceMs);
  };

  const destroy = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { save, flush, destroy };
}

/**
 * Clean up all expired annotations across all pages
 */
export function cleanupExpiredAnnotations(): number {
  let cleaned = 0;

  try {
    const keys = Object.keys(localStorage);
    const cutoff = Date.now() - RETENTION_MS;

    for (const key of keys) {
      if (!key.startsWith(ANNOTATION_KEY_PREFIX)) continue;

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const parsed = JSON.parse(stored) as SerializedAnnotation[];
        const filtered = parsed.filter((annotation) => annotation.createdAt > cutoff);

        if (filtered.length === 0) {
          localStorage.removeItem(key);
          cleaned += parsed.length;
        } else if (filtered.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          cleaned += parsed.length - filtered.length;
        }
      } catch {
        // Skip malformed entries
      }
    }
  } catch (error) {
    console.error('[Annotation] Failed to cleanup expired annotations:', error);
  }

  return cleaned;
}
