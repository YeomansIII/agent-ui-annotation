/**
 * Popup template for scope creation/editing
 */

import type { Scope, ElementInfo } from '../../core/types';
import { icons } from './toolbar';

export interface PopupRenderOptions {
  elementInfo: ElementInfo | null;
  existingScope: Scope | null;
  isShaking: boolean;
  clickX: number;
  clickY: number;
  /** Multiple element infos when multi-select */
  multiSelectInfos?: ElementInfo[];
}

/**
 * Calculate popup position near click point
 */
function calculatePopupPosition(clickX: number, clickY: number): { left: string; top: string } {
  const popupWidth = 340;
  const popupHeight = 220;
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default: position to the right of the click point
  let left = clickX + margin;
  let top = clickY - popupHeight / 2;

  // If would overflow right edge, position to the left of click point
  if (left + popupWidth > viewportWidth - margin) {
    left = clickX - popupWidth - margin;
  }

  // If would overflow left edge, center horizontally at click point
  if (left < margin) {
    left = Math.max(margin, clickX - popupWidth / 2);
  }

  // Clamp to viewport bounds
  left = Math.max(margin, Math.min(left, viewportWidth - popupWidth - margin));

  // Vertical positioning
  if (top < margin) {
    top = margin;
  }
  if (top + popupHeight > viewportHeight - margin) {
    top = viewportHeight - popupHeight - margin;
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

/**
 * Render the popup as a popover near the click point
 */
export function renderPopup(options: PopupRenderOptions): string {
  const { elementInfo, existingScope, isShaking, clickX, clickY, multiSelectInfos = [] } = options;

  if (!elementInfo && !existingScope) {
    return '';
  }

  const isMultiSelect = multiSelectInfos.length > 1;
  const info = existingScope?.elementInfo || elementInfo!;
  const comment = existingScope?.comment || '';
  const isEditing = !!existingScope;

  const position = calculatePopupPosition(clickX, clickY);

  // Build header content based on single vs multi-select
  let headerContent: string;
  if (isMultiSelect) {
    const elementList = multiSelectInfos
      .slice(0, 5)
      .map(i => `<li>${escapeHtml(i.humanReadable)}</li>`)
      .join('');
    const remaining = multiSelectInfos.length > 5 ? `<li>...and ${multiSelectInfos.length - 5} more</li>` : '';

    headerContent = `
      <div class="popup-multiselect-header">
        <div class="popup-element">${multiSelectInfos.length} elements selected</div>
        <ul class="popup-element-list">${elementList}${remaining}</ul>
      </div>
    `;
  } else {
    headerContent = `
      <div>
        <div class="popup-element">${escapeHtml(info.humanReadable)}</div>
        <div class="popup-path">${escapeHtml(info.selectorPath)}</div>
      </div>
    `;
  }

  return `
    <div class="popup-popover ${isShaking ? 'shake' : ''}" style="left: ${position.left}; top: ${position.top};" data-annotation-popup>
      <div class="popup-header">
        ${headerContent}
        <button class="popup-close" data-action="popup-close" title="Close">
          ${icons.x}
        </button>
      </div>

      <div class="popup-body">
        <textarea
          class="popup-textarea"
          placeholder="${isMultiSelect ? 'Add feedback for all selected elements...' : 'Add your feedback...'}"
          data-popup-input
          autofocus
        >${escapeHtml(comment)}</textarea>
      </div>

      <div class="popup-footer">
        ${isEditing ? `
          <button class="popup-btn danger" data-action="popup-delete">
            Delete
          </button>
        ` : ''}
        <button class="popup-btn" data-action="popup-cancel">
          Cancel
        </button>
        <button class="popup-btn primary" data-action="popup-submit">
          ${isEditing ? 'Save' : isMultiSelect ? `Add ${multiSelectInfos.length} Scopes` : 'Add Scope'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render empty state (no popup)
 */
export function renderEmptyPopup(): string {
  return '';
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
