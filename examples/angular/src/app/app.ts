import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef, afterNextRender } from '@angular/core';
import type { AnnotationElement } from 'agent-ui-annotation';

// Register the custom element
import 'agent-ui-annotation';

@Component({
  selector: 'cta-button',
  standalone: true,
  template: `
    <button class="cta-button">{{ label }}</button>
  `,
  styles: [
    `
      .cta-button {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        background: #5b7cfa;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
    `,
  ],
})
class CTAButtonComponent {
  label = 'Start annotating';
}

@Component({
  selector: 'hero-section',
  standalone: true,
  imports: [CTAButtonComponent],
  template: `
    <section class="hero">
      <h2>Ship UI changes faster</h2>
      <p>Annotate real UI elements with precision and context.</p>
      <cta-button></cta-button>
    </section>
  `,
  styles: [
    `
      .hero {
        padding: 16px;
        border: 1px solid #333;
        border-radius: 8px;
      }
    `,
  ],
})
class HeroSectionComponent {}

@Component({
  selector: 'landing-page',
  standalone: true,
  imports: [HeroSectionComponent],
  template: `
    <div class="landing">
      <hero-section></hero-section>
    </div>
  `,
  styles: [
    `
      .landing {
        margin-top: 16px;
      }
    `,
  ],
})
class LandingPageComponent {}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LandingPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Agent UI Annotation - Angular</h1>
    <button (click)="activate()">Activate</button>
    <button (click)="copyOutput()">Copy Output</button>

    <landing-page></landing-page>

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
