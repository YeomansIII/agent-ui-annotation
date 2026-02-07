/**
 * Hover tooltip template
 */

import type { ElementInfo } from '../../core/types';

export interface TooltipRenderOptions {
  elementInfo: ElementInfo;
  x: number;
  y: number;
}

/**
 * Calculate tooltip position to keep it in viewport
 */
function calculateTooltipPosition(x: number, y: number): { left: string; top: string } {
  const padding = 16;
  const tooltipWidth = 350; // max-width from CSS
  const tooltipHeight = 60; // approximate height

  let left = x + padding;
  let top = y + padding;

  // Keep within viewport
  if (left + tooltipWidth > window.innerWidth) {
    left = x - tooltipWidth - padding;
  }

  if (top + tooltipHeight > window.innerHeight) {
    top = y - tooltipHeight - padding;
  }

  // Ensure not negative
  left = Math.max(padding, left);
  top = Math.max(padding, top);

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

/**
 * Render hover tooltip
 */
export function renderHoverTooltip(options: TooltipRenderOptions): string {
  const { elementInfo, x, y } = options;
  const pos = calculateTooltipPosition(x, y);
  const componentLine = elementInfo.componentPath
    ? `<div class="hover-component">${escapeHtml(elementInfo.componentPath)}</div>`
    : '';

  return `
    <div class="hover-tooltip" style="left: ${pos.left}; top: ${pos.top};">
      <div class="hover-element">${escapeHtml(elementInfo.humanReadable)}</div>
      <div class="hover-path">${escapeHtml(elementInfo.selectorPath)}</div>
      ${componentLine}
    </div>
  `;
}

/**
 * Render empty tooltip
 */
export function renderEmptyTooltip(): string {
  return '';
}

/**
 * Render element highlight overlay
 */
export function renderHighlight(rect: DOMRect | null, accentColor: string): string {
  if (!rect) return '';

  return `
    <div
      class="highlight"
      style="
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border-color: ${accentColor};
        background-color: ${accentColor}20;
      "
    ></div>
  `;
}

/**
 * Render selection rectangle for multi-select
 */
export function renderSelectionRect(rect: { x: number; y: number; width: number; height: number } | null, accentColor: string): string {
  if (!rect) return '';

  return `
    <div
      class="selection-rect"
      style="
        left: ${rect.x}px;
        top: ${rect.y}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border-color: ${accentColor};
        background-color: ${accentColor}20;
      "
    ></div>
  `;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
