/**
 * i18n type definitions
 */

/** All translatable strings organized by category */
export interface TranslationStrings {
  toolbar: {
    activate: string;
    freeze: string;
    unfreeze: string;
    showMarkers: string;
    hideMarkers: string;
    dotsMode: string;
    copyToClipboard: string;
    clearAll: string;
    toggleTheme: string;
    settings: string;
    close: string;
    copiedFeedback: string;
    clearedFeedback: string;
  };
  popup: {
    close: string;
    addFeedback: string;
    addFeedbackMulti: string;
    cancel: string;
    delete: string;
    save: string;
    addAnnotation: string;
    addAnnotations: string;
    elementsSelected: string;
    andMore: string;
  };
  settings: {
    title: string;
    outputLevel: string;
    markerColor: string;
    blockInteractions: string;
    blockInteractionsHint: string;
    showTooltips: string;
    autoClearAfterCopy: string;
    outputLevels: {
      compact: string;
      standard: string;
      detailed: string;
      forensic: string;
    };
  };
  colors: {
    purple: string;
    blue: string;
    cyan: string;
    green: string;
    yellow: string;
    orange: string;
    red: string;
  };
  marker: {
    noComment: string;
  };
  output: {
    pageFeedback: string;
    noAnnotations: string;
    viewport: string;
    annotations: string;
    location: string;
    selectedText: string;
    feedback: string;
    component: string;
    domPath: string;
    selector: string;
    elementDetails: string;
    tag: string;
    id: string;
    classes: string;
    attributes: string;
    textContent: string;
    positionDimensions: string;
    boundingBox: string;
    size: string;
    accessibility: string;
    role: string;
    interactive: string;
    ariaLabel: string;
    describedBy: string;
    tabIndex: string;
    computedStyles: string;
    context: string;
    landmark: string;
    parent: string;
    previousSibling: string;
    nextSibling: string;
    multiSelectNote: string;
    metadata: string;
    created: string;
    updated: string;
    environment: string;
    url: string;
    devicePixelRatio: string;
    scrollPosition: string;
    timestamp: string;
    userAgent: string;
    totalAnnotations: string;
    yes: string;
    no: string;
    none: string;
  };
}

/** Partial translation strings for custom overrides */
export type PartialTranslationStrings = {
  [K in keyof TranslationStrings]?: Partial<TranslationStrings[K]>;
};

/** i18n configuration options */
export interface I18nOptions {
  /** Locale identifier (e.g., 'en', 'zh-CN') */
  locale?: string;
  /** Custom translation overrides */
  translations?: PartialTranslationStrings;
  /** Whether to translate output markdown (default: false for AI compatibility) */
  translateOutput?: boolean;
}

/** Supported built-in locales */
export type BuiltInLocale = 'en' | 'zh-CN';
