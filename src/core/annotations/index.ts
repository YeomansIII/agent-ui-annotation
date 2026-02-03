/**
 * Annotations module - re-exports
 */

export {
  generateAnnotationId,
  getNextAnnotationNumber,
  createAnnotation,
  updateAnnotationComment,
  updateAnnotationElementInfo,
  renumberAnnotations,
  createAnnotationManager,
  type AnnotationManager,
} from './annotation';

export {
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
  saveSettings,
  loadSettings,
  saveTheme,
  loadTheme,
  createAutoSaver,
  cleanupExpiredAnnotations,
} from './persistence';

export {
  generateOutput,
  copyToClipboard,
  getEnvironmentInfo,
} from './output';
