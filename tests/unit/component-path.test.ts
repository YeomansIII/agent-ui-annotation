import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getComponentPathInfo } from '../../src/core/element/component-path';

describe('component path detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete (window as any).ng;
  });

  it('detects nested React component path with file/line labels', () => {
    const el = document.createElement('button');

    const appType = function App() {};
    const landingType = function LandingPage() {};
    const heroType = function HeroSection() {};
    const ctaType = function CTAButton() {};

    const appOwner = { type: appType, _debugSource: { fileName: '/src/App.tsx', lineNumber: 10 } } as any;
    const landingOwner = { type: landingType, _debugSource: { fileName: '/src/LandingPage.tsx', lineNumber: 20 }, _debugOwner: appOwner } as any;
    const heroOwner = { type: heroType, _debugSource: { fileName: '/src/HeroSection.tsx', lineNumber: 30 }, _debugOwner: landingOwner } as any;
    const ctaOwner = { type: ctaType, _debugSource: { fileName: '/src/CTAButton.tsx', lineNumber: 40 }, _debugOwner: heroOwner } as any;

    const fiber = { type: ctaType, _debugOwner: ctaOwner, _debugSource: { fileName: '/src/CTAButton.tsx', lineNumber: 40 } } as any;

    (el as any).__reactFiber$test = fiber;

    const info = getComponentPathInfo(el);

    expect(info.framework).toBe('react');
    expect(info.path).toBe('App (App.tsx:10) > LandingPage (LandingPage.tsx:20) > HeroSection (HeroSection.tsx:30) > CTAButton (CTAButton.tsx:40)');
  });

  it('falls back to component names when React debug source is missing', () => {
    const el = document.createElement('button');

    const appType = function App() {};
    const landingType = function LandingPage() {};
    const heroType = function HeroSection() {};
    const ctaType = function CTAButton() {};

    const appOwner = { type: appType } as any;
    const landingOwner = { type: landingType, _debugOwner: appOwner } as any;
    const heroOwner = { type: heroType, _debugOwner: landingOwner } as any;
    const ctaOwner = { type: ctaType, _debugOwner: heroOwner } as any;

    const fiber = { type: ctaType, _debugOwner: ctaOwner } as any;
    (el as any).__reactFiber$test = fiber;

    const info = getComponentPathInfo(el);

    expect(info.framework).toBe('react');
    expect(info.path).toBe('App > LandingPage > HeroSection > CTAButton');
  });

  it('detects nested Vue component path with file labels', () => {
    const el = document.createElement('button');

    const app = { type: { name: 'App', __file: '/src/App.vue' }, parent: null } as any;
    const landing = { type: { name: 'LandingPage', __file: '/src/LandingPage.vue' }, parent: app } as any;
    const hero = { type: { name: 'HeroSection', __file: '/src/HeroSection.vue' }, parent: landing } as any;
    const cta = { type: { name: 'CTAButton', __file: '/src/CTAButton.vue' }, parent: hero } as any;

    (el as any).__vueParentComponent = cta;

    const info = getComponentPathInfo(el);

    expect(info.framework).toBe('vue');
    expect(info.path).toBe('App (App.vue) > LandingPage (LandingPage.vue) > HeroSection (HeroSection.vue) > CTAButton (CTAButton.vue)');
  });

  it('detects nested Svelte component path with file/line labels', () => {
    const landing = document.createElement('div');
    const hero = document.createElement('div');
    const cta = document.createElement('button');

    landing.appendChild(hero);
    hero.appendChild(cta);

    (landing as any).__svelte_meta = { loc: { file: '/src/LandingPage.svelte', line: 5 } };
    (hero as any).__svelte_meta = { loc: { file: '/src/HeroSection.svelte', line: 10 } };
    (cta as any).__svelte_meta = { loc: { file: '/src/CTAButton.svelte', line: 15 } };

    const info = getComponentPathInfo(cta);

    expect(info.framework).toBe('svelte');
    expect(info.path).toBe('LandingPage.svelte:5 > HeroSection.svelte:10 > CTAButton.svelte:15');
  });

  it('detects nested Angular component path via ng debug APIs', () => {
    const appRoot = document.createElement('app-root');
    const landing = document.createElement('landing-page');
    const hero = document.createElement('hero-section');
    const ctaHost = document.createElement('cta-button');
    const button = document.createElement('button');

    appRoot.appendChild(landing);
    landing.appendChild(hero);
    hero.appendChild(ctaHost);
    ctaHost.appendChild(button);

    const appComp = { constructor: { name: '_App' } } as any;
    const landingComp = { constructor: { name: '_LandingPageComponent' } } as any;
    const heroComp = { constructor: { name: '_HeroSectionComponent' } } as any;
    const ctaComp = { constructor: { name: '_CTAButtonComponent' } } as any;

    (window as any).ng = {
      getComponent: (el: Element) => {
        if (el === landing) return landingComp;
        if (el === hero) return heroComp;
        if (el === ctaHost) return ctaComp;
        return null;
      },
      getOwningComponent: (el: Element) => {
        if (el === button) return ctaComp;
        if (el === ctaHost) return heroComp;
        if (el === hero) return landingComp;
        if (el === landing) return appComp;
        return null;
      },
    };

    const info = getComponentPathInfo(button);

    expect(info.framework).toBe('angular');
    expect(info.path).toBe('_App > _LandingPageComponent > _HeroSectionComponent > _CTAButtonComponent');
  });
});
