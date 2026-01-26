/**
 * Demo entry point
 */

// Import the main library (this registers the custom element)
import '../src/index';

// Re-export for use in demo HTML
export { createAnnotation } from '../src/adapters/vanilla';
