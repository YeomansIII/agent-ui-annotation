/**
 * Angular adapter for agent-ui-annotation
 *
 * Usage in Angular:
 *
 * 1. Import in your module:
 * ```typescript
 * import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 * import 'agent-ui-annotation'; // Registers the custom element
 *
 * @NgModule({
 *   schemas: [CUSTOM_ELEMENTS_SCHEMA],
 *   // ...
 * })
 * export class AppModule {}
 * ```
 *
 * 2. Use in template:
 * ```html
 * <agent-ui-annotation
 *   theme="auto"
 *   output-level="standard"
 *   (annotation:create)="onAnnotationCreate($event)"
 *   (annotation:copy)="onCopy($event)"
 * ></agent-ui-annotation>
 * ```
 *
 * 3. Access element in component:
 * ```typescript
 * import { ViewChild, ElementRef } from '@angular/core';
 * import type { AnnotationElement } from 'agent-ui-annotation';
 *
 * @Component({ ... })
 * export class AppComponent {
 *   @ViewChild('annotation') annotationRef!: ElementRef<AnnotationElement>;
 *
 *   activate() {
 *     this.annotationRef.nativeElement.activate();
 *   }
 * }
 * ```
 */

import { registerAnnotationElement } from '../../element/annotation-element';

// Register the custom element
registerAnnotationElement();

// Re-export types for Angular templates
export type { Annotation, AnnotationId, OutputLevel, ThemeMode, Settings } from '../../core/types';
export { AnnotationElement } from '../../element/annotation-element';

/**
 * Initialize agent-ui-annotation for Angular
 * Call this in your app's initialization
 */
export function initAgentUIAnnotation() {
  registerAnnotationElement();
}
