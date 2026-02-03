/**
 * Angular adapter for agent-ui-annotation
 *
 * Usage in Angular:
 *
 * 1. Import in your module:
 * ```typescript
 * import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 * import { initAgentUIAnnotation } from 'agent-ui-annotation/angular';
 *
 * // Initialize with i18n options (optional)
 * initAgentUIAnnotation({ locale: 'zh-CN' });
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
 *   locale="zh-CN"
 *   (annotation:create)="onAnnotationCreate($event)"
 *   (annotation:copy)="onCopy($event)"
 * ></agent-ui-annotation>
 * ```
 *
 * 3. Access element in component:
 * ```typescript
 * import { ViewChild, ElementRef } from '@angular/core';
 * import type { AnnotationElement, BeforeAnnotationCreateHook } from 'agent-ui-annotation';
 *
 * @Component({ ... })
 * export class AppComponent {
 *   @ViewChild('annotation') annotationRef!: ElementRef<AnnotationElement>;
 *
 *   activate() {
 *     this.annotationRef.nativeElement.activate();
 *   }
 *
 *   // Set up the before create hook to add custom context
 *   ngAfterViewInit() {
 *     this.annotationRef.nativeElement.setBeforeCreateHook((data) => ({
 *       context: {
 *         route: window.location.pathname,
 *         timestamp: new Date().toISOString(),
 *       },
 *     }));
 *   }
 * }
 * ```
 */

import { registerAnnotationElement } from '../../element/annotation-element';
import { initI18n, type I18nOptions } from '../../core/i18n';

// Register the custom element
registerAnnotationElement();

// Re-export types for Angular templates
export type { Annotation, AnnotationId, OutputLevel, ThemeMode, Settings, PartialTranslationStrings, I18nOptions, BeforeAnnotationCreateHook, BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from '../../core/types';
export { AnnotationElement } from '../../element/annotation-element';
export { initI18n } from '../../core/i18n';

/**
 * Initialize agent-ui-annotation for Angular
 * Call this in your app's initialization
 * @param i18nOptions Optional i18n configuration (locale, translations, translateOutput)
 */
export function initAgentUIAnnotation(i18nOptions?: I18nOptions) {
  registerAnnotationElement();
  if (i18nOptions) {
    initI18n(i18nOptions);
  }
}
