/**
 * Adapters module - Framework wrappers
 */

// React adapter is exported separately to avoid bundling React
// import from 'agent-ui-annotation/react'

// Vanilla adapter
export * from './vanilla';

// Angular module
export { initAgentUIAnnotation } from './angular/annotation.module';
