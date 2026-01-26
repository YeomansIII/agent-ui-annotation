/**
 * Scopes module - re-exports
 */

export {
  generateAnnotationId,
  getNextScopeNumber,
  createScope,
  updateScopeComment,
  updateScopeElementInfo,
  renumberScopes,
  createAnnotationManager,
  type AnnotationManager,
} from './scope';

export {
  saveScopes,
  loadScopes,
  clearScopes,
  saveSettings,
  loadSettings,
  saveTheme,
  loadTheme,
  createAutoSaver,
  cleanupExpiredScopes,
} from './persistence';

export {
  generateOutput,
  copyToClipboard,
  getEnvironmentInfo,
} from './output';
