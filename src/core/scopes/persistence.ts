/**
 * LocalStorage persistence for scopes and settings
 */

import type { Scope, AnnotationId, Settings, ElementInfo } from '../types';

const SCOPE_KEY_PREFIX = 'annotation-scopes-';
const SETTINGS_KEY = 'annotation-settings';
const THEME_KEY = 'annotation-theme';

/** Retention period in milliseconds (7 days) */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Serializable version of Scope (without DOM element reference)
 */
interface SerializedScope {
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
}

/**
 * Get storage key for current page
 */
function getScopeStorageKey(): string {
  return SCOPE_KEY_PREFIX + window.location.pathname;
}

/**
 * Serialize a scope for storage
 */
function serializeScope(scope: Scope): SerializedScope {
  return {
    id: scope.id,
    number: scope.number,
    comment: scope.comment,
    elementInfo: scope.elementInfo,
    createdAt: scope.createdAt,
    updatedAt: scope.updatedAt,
    selectedText: scope.selectedText,
    isMultiSelect: scope.isMultiSelect,
    clickX: scope.clickX,
    clickY: scope.clickY,
  };
}

/**
 * Deserialize a scope from storage
 */
function deserializeScope(data: SerializedScope): Scope {
  return {
    ...data,
    element: null, // DOM reference can't be restored
  };
}

/**
 * Filter out expired scopes
 */
function filterExpired(scopes: SerializedScope[]): SerializedScope[] {
  const cutoff = Date.now() - RETENTION_MS;
  return scopes.filter((scope) => scope.createdAt > cutoff);
}

/**
 * Save scopes to LocalStorage
 */
export function saveScopes(scopes: Map<AnnotationId, Scope>): boolean {
  try {
    const key = getScopeStorageKey();
    const serialized = Array.from(scopes.values()).map(serializeScope);
    localStorage.setItem(key, JSON.stringify(serialized));
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to save scopes:', error);
    return false;
  }
}

/**
 * Load scopes from LocalStorage
 */
export function loadScopes(): Map<AnnotationId, Scope> {
  try {
    const key = getScopeStorageKey();
    const stored = localStorage.getItem(key);

    if (!stored) {
      return new Map();
    }

    const parsed = JSON.parse(stored) as SerializedScope[];
    const filtered = filterExpired(parsed);

    // If we filtered out expired scopes, save the cleaned list
    if (filtered.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
    }

    const scopes = new Map<AnnotationId, Scope>();
    for (const data of filtered) {
      scopes.set(data.id, deserializeScope(data));
    }

    return scopes;
  } catch (error) {
    console.error('[Annotation] Failed to load scopes:', error);
    return new Map();
  }
}

/**
 * Clear scopes from LocalStorage
 */
export function clearScopes(): boolean {
  try {
    const key = getScopeStorageKey();
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('[Annotation] Failed to clear scopes:', error);
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
  getScopes: () => Map<AnnotationId, Scope>,
  debounceMs: number = 1000
): { save: () => void; flush: () => void; destroy: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    saveScopes(getScopes());
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
 * Clean up all expired scopes across all pages
 */
export function cleanupExpiredScopes(): number {
  let cleaned = 0;

  try {
    const keys = Object.keys(localStorage);
    const cutoff = Date.now() - RETENTION_MS;

    for (const key of keys) {
      if (!key.startsWith(SCOPE_KEY_PREFIX)) continue;

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const parsed = JSON.parse(stored) as SerializedScope[];
        const filtered = parsed.filter((scope) => scope.createdAt > cutoff);

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
    console.error('[Annotation] Failed to cleanup expired scopes:', error);
  }

  return cleaned;
}
