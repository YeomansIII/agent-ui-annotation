import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef, afterNextRender } from '@angular/core';
import type { AnnotationElement } from 'agent-ui-annotation';

// Register the custom element
import 'agent-ui-annotation';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Agent UI Annotation - Angular</h1>
    <button (click)="activate()">Activate</button>
    <button (click)="copyOutput()">Copy Output</button>

    <agent-ui-annotation
      #annotation
      theme="auto"
      output-level="standard"
    ></agent-ui-annotation>
  `,
})
export class App {
  annotationRef = viewChild<ElementRef<AnnotationElement>>('annotation');

  constructor() {
    afterNextRender(() => {
      const element = this.annotationRef()?.nativeElement;
      if (!element) return;

      element.addEventListener('annotation:create', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        console.log('Created:', detail.annotation);
      });

      element.addEventListener('annotation:copy', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        console.log('Copied:', detail.content);
      });
    });
  }

  activate() {
    this.annotationRef()?.nativeElement.activate();
  }

  copyOutput() {
    this.annotationRef()?.nativeElement.copyOutput();
  }
}
