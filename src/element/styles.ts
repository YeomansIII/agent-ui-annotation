/**
 * Shadow DOM styles for Annotation web component (Lit version)
 */

import { css, unsafeCSS } from 'lit';
import { LIGHT_THEME, DARK_THEME, SHARED_VARS } from '../themes/variables';

/**
 * Generate CSS string from variable object
 */
function varsToCSS(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
}

/**
 * Main stylesheet for the Annotation web component
 */
export const componentStyles = css`
  /* CSS Variables */
  :host {
    ${unsafeCSS(varsToCSS(SHARED_VARS))}
    ${unsafeCSS(varsToCSS(LIGHT_THEME))}
  }

  :host([data-theme="dark"]) {
    ${unsafeCSS(varsToCSS(DARK_THEME))}
  }

  @media (prefers-color-scheme: dark) {
    :host([data-theme="auto"]) {
      ${unsafeCSS(varsToCSS(DARK_THEME))}
    }
  }

  /* Reset */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Base styles */
  :host {
    all: initial;
    font-family: var(--as-font-family);
    font-size: var(--as-font-size-md);
    color: var(--as-text-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Toolbar container */
  .toolbar {
    position: fixed;
    z-index: var(--as-z-toolbar);
    display: flex;
    align-items: center;
    gap: var(--as-space-sm);
    padding: var(--as-space-sm) var(--as-space-md);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-full);
    box-shadow: var(--as-shadow-lg);
    backdrop-filter: var(--as-backdrop-blur);
    user-select: none;
    transition: transform var(--as-transition-normal), opacity var(--as-transition-normal);
  }

  .toolbar.collapsed {
    padding: var(--as-space-sm);
  }

  .toolbar.dragging {
    cursor: move;
    opacity: 0.9;
  }

  /* Toolbar entrance animation */
  .toolbar.entering {
    animation: toolbar-enter 0.3s ease-out;
  }

  @keyframes toolbar-enter {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .popup-component {
    font-size: var(--as-font-size-xs);
    color: var(--as-text-tertiary);
    margin-top: 2px;
  }

  /* Toolbar buttons */
  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--as-radius-md);
    color: var(--as-text-primary);
    cursor: pointer;
    transition: background var(--as-transition-fast), color var(--as-transition-fast);
  }

  .toolbar-btn:hover {
    background: var(--as-bg-hover);
  }

  .toolbar-btn:active {
    background: var(--as-bg-active);
  }

  .toolbar-btn.active {
    background: var(--as-accent-light);
    color: var(--as-accent);
  }

  .toolbar-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Toggle button (collapsed state) */
  .toggle-btn {
    position: relative;
    width: 36px;
    height: 36px;
  }

  .toggle-btn .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--as-accent);
    border-radius: var(--as-radius-full);
    color: var(--as-text-inverse);
    font-size: var(--as-font-size-xs);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Separator */
  .separator {
    width: 1px;
    height: 20px;
    background: var(--as-border-primary);
    margin: 0 var(--as-space-xs);
  }

  /* Annotation count */
  .annotation-count {
    display: flex;
    align-items: center;
    gap: var(--as-space-xs);
    padding: 0 var(--as-space-sm);
    font-size: var(--as-font-size-sm);
    font-weight: 500;
    color: var(--as-text-secondary);
  }

  .annotation-count .count {
    color: var(--as-text-primary);
    font-weight: 600;
  }

  /* Feedback toast */
  .feedback {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    padding: var(--as-space-sm) var(--as-space-md);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    box-shadow: var(--as-shadow-md);
    font-size: var(--as-font-size-sm);
    white-space: nowrap;
    animation: feedback-enter 0.2s ease-out;
  }

  @keyframes feedback-enter {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .feedback.success {
    border-color: var(--as-success);
    color: var(--as-success);
  }

  /* Markers container */
  .markers {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: var(--as-z-markers);
    pointer-events: none;
  }

  /* Individual marker */
  .marker {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--as-accent);
    border: 2px solid white;
    border-radius: 50%;
    color: white;
    font-size: var(--as-font-size-xs);
    font-weight: 700;
    box-shadow: var(--as-shadow-md);
    pointer-events: auto;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform var(--as-transition-fast), box-shadow var(--as-transition-fast);
  }

  .marker:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: var(--as-shadow-lg);
  }

  .marker.pending {
    opacity: 0.7;
    animation: marker-pulse 1s ease-in-out infinite;
  }

  .marker.dot-only {
    width: 10px;
    height: 10px;
    font-size: 0;
    border-width: 1.5px;
    box-shadow: var(--as-shadow-sm);
    pointer-events: none;
  }

  @keyframes marker-pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }

  /* Marker animations */
  .marker.entering {
    animation: marker-enter 0.25s ease-out;
  }

  .marker.exiting {
    animation: marker-exit 0.2s ease-in forwards;
  }

  @keyframes marker-enter {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes marker-exit {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
  }

  /* Marker tooltip */
  .marker-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--as-space-sm) var(--as-space-md);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    box-shadow: var(--as-shadow-md);
    font-size: var(--as-font-size-sm);
    white-space: nowrap;
    max-width: 300px;
    pointer-events: none;
    z-index: var(--as-z-tooltip);
    animation: tooltip-enter 0.15s ease-out;
  }

  .marker-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--as-bg-primary);
  }

  @keyframes tooltip-enter {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .tooltip-element {
    font-weight: 500;
    color: var(--as-text-primary);
    margin-bottom: 2px;
  }

  .tooltip-comment {
    color: var(--as-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Popup - Popover style (positioned near click point) */
  .popup-popover {
    position: fixed;
    z-index: var(--as-z-popup);
    width: 340px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    overflow: auto;
    padding: var(--as-space-lg);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-lg);
    box-shadow: var(--as-shadow-lg);
    animation: popover-enter 0.15s ease-out;
  }

  @keyframes popover-enter {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .popup-popover.shake {
    animation: popup-shake 0.3s ease-out;
  }

  @keyframes popup-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--as-space-md);
  }

  .popup-element {
    font-weight: 500;
    color: var(--as-text-primary);
    font-size: var(--as-font-size-md);
  }

  .popup-path {
    font-family: var(--as-font-mono);
    font-size: var(--as-font-size-xs);
    color: var(--as-text-muted);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .popup-multiselect-header {
    flex: 1;
    min-width: 0;
  }

  .popup-element-list {
    list-style: none;
    margin: var(--as-space-xs) 0 0 0;
    padding: 0;
    font-size: var(--as-font-size-xs);
    color: var(--as-text-secondary);
    max-height: 80px;
    overflow-y: auto;
  }

  .popup-element-list li {
    padding: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .popup-close {
    padding: var(--as-space-xs);
    background: transparent;
    border: none;
    border-radius: var(--as-radius-sm);
    color: var(--as-text-muted);
    cursor: pointer;
    transition: background var(--as-transition-fast), color var(--as-transition-fast);
  }

  .popup-close:hover {
    background: var(--as-bg-hover);
    color: var(--as-text-primary);
  }

  .popup-body {
    margin-bottom: var(--as-space-lg);
  }

  .popup-textarea {
    width: 100%;
    min-height: 100px;
    padding: var(--as-space-md);
    background: var(--as-bg-secondary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    color: var(--as-text-primary);
    font-family: inherit;
    font-size: var(--as-font-size-md);
    line-height: 1.5;
    resize: vertical;
    transition: border-color var(--as-transition-fast);
  }

  .popup-textarea:focus {
    outline: none;
    border-color: var(--as-accent);
  }

  .popup-textarea::placeholder {
    color: var(--as-text-muted);
  }

  .popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--as-space-sm);
  }

  .popup-btn {
    padding: var(--as-space-sm) var(--as-space-lg);
    background: transparent;
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    color: var(--as-text-primary);
    font-size: var(--as-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background var(--as-transition-fast), border-color var(--as-transition-fast);
  }

  .popup-btn:hover {
    background: var(--as-bg-hover);
  }

  .popup-btn.primary {
    background: var(--as-accent);
    border-color: var(--as-accent);
    color: white;
  }

  .popup-btn.primary:hover {
    background: var(--as-accent-hover);
    border-color: var(--as-accent-hover);
  }

  .popup-btn.danger {
    color: var(--as-error);
  }

  .popup-btn.danger:hover {
    background: rgba(255, 59, 48, 0.1);
  }

  /* Hover tooltip (follows cursor) */
  .hover-tooltip {
    position: fixed;
    z-index: var(--as-z-tooltip);
    padding: var(--as-space-sm) var(--as-space-md);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    box-shadow: var(--as-shadow-md);
    font-size: var(--as-font-size-sm);
    max-width: 350px;
    pointer-events: none;
  }

  .hover-element {
    font-weight: 500;
    color: var(--as-text-primary);
    margin-bottom: 2px;
  }

  .hover-path {
    font-family: var(--as-font-mono);
    font-size: var(--as-font-size-xs);
    color: var(--as-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hover-component {
    font-size: var(--as-font-size-xs);
    color: var(--as-text-tertiary);
    margin-top: 2px;
  }

  /* Selection rectangle */
  .selection-rect {
    position: fixed;
    z-index: var(--as-z-overlay);
    border: 2px dashed var(--as-accent);
    background: var(--as-accent-light);
    pointer-events: none;
  }

  /* Highlight overlay */
  .highlight {
    position: fixed;
    z-index: var(--as-z-overlay);
    border: 2px solid var(--as-accent);
    background: var(--as-accent-light);
    pointer-events: none;
    transition: all 0.1s ease-out;
  }

  /* Settings panel */
  .settings-panel {
    position: absolute;
    bottom: calc(100% + var(--as-space-md));
    right: 0;
    width: 280px;
    padding: var(--as-space-md);
    background: var(--as-bg-primary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-lg);
    box-shadow: var(--as-shadow-lg);
    animation: settings-enter 0.2s ease-out;
  }

  @keyframes settings-enter {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settings-title {
    font-weight: 600;
    margin-bottom: var(--as-space-md);
    padding-bottom: var(--as-space-sm);
    border-bottom: 1px solid var(--as-border-primary);
  }

  .settings-group {
    margin-bottom: var(--as-space-md);
  }

  .settings-label {
    display: block;
    font-size: var(--as-font-size-sm);
    color: var(--as-text-secondary);
    margin-bottom: var(--as-space-xs);
  }

  .settings-select {
    width: 100%;
    padding: var(--as-space-sm);
    background: var(--as-bg-secondary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-md);
    color: var(--as-text-primary);
    font-size: var(--as-font-size-sm);
    cursor: pointer;
  }

  .settings-select:focus {
    outline: none;
    border-color: var(--as-accent);
  }

  .settings-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--as-space-sm) 0;
  }

  .settings-toggle-label {
    font-size: var(--as-font-size-sm);
  }

  .settings-switch {
    position: relative;
    width: 40px;
    height: 22px;
    background: var(--as-bg-secondary);
    border: 1px solid var(--as-border-primary);
    border-radius: var(--as-radius-full);
    cursor: pointer;
    transition: background var(--as-transition-fast);
  }

  .settings-switch.active {
    background: var(--as-accent);
    border-color: var(--as-accent);
  }

  .settings-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform var(--as-transition-fast);
  }

  .settings-switch.active::after {
    transform: translateX(18px);
  }

  /* Color picker */
  .color-picker {
    display: flex;
    gap: var(--as-space-xs);
    flex-wrap: wrap;
  }

  .color-option {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: transform var(--as-transition-fast), border-color var(--as-transition-fast);
  }

  .color-option:hover {
    transform: scale(1.15);
  }

  .color-option.active {
    border-color: var(--as-text-primary);
  }

  /* Utility classes */
  .hidden {
    display: none !important;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Skip animation for elements that have already animated */
  .no-animate {
    animation: none !important;
  }
`;
