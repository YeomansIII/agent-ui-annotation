/**
 * Popup template for annotation creation/editing
 */

import type { Annotation, ElementInfo } from '../../core/types';
import { t } from '../../core/i18n';
import { icons } from './toolbar';

export interface PopupRenderOptions {
  elementInfo: ElementInfo | null;
  existingAnnotation: Annotation | null;
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
  const { elementInfo, existingAnnotation, isShaking, clickX, clickY, multiSelectInfos = [] } = options;

  if (!elementInfo && !existingAnnotation) {
    return '';
  }

  const isMultiSelect = multiSelectInfos.length > 1;
  const info = existingAnnotation?.elementInfo || elementInfo!;
  const comment = existingAnnotation?.comment || '';
  const isEditing = !!existingAnnotation;

  const position = calculatePopupPosition(clickX, clickY);

  // Build header content based on single vs multi-select
  let headerContent: string;
  if (isMultiSelect) {
    const elementList = multiSelectInfos
      .slice(0, 5)
      .map(i => `<li>${escapeHtml(i.humanReadable)}</li>`)
      .join('');
    const remaining = multiSelectInfos.length > 5 ? `<li>${t('popup.andMore', { count: multiSelectInfos.length - 5 })}</li>` : '';

    headerContent = `
      <div class="popup-multiselect-header">
        <div class="popup-element">${t('popup.elementsSelected', { count: multiSelectInfos.length })}</div>
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
        <button class="popup-close" data-action="popup-close" title="${t('popup.close')}">
          ${icons.x}
        </button>
      </div>

      <div class="popup-body">
        <textarea
          class="popup-textarea"
          placeholder="${isMultiSelect ? t('popup.addFeedbackMulti') : t('popup.addFeedback')}"
          data-popup-input
          autofocus
        >${escapeHtml(comment)}</textarea>
      </div>

      <div class="popup-footer">
        ${isEditing ? `
          <button class="popup-btn danger" data-action="popup-delete">
            ${t('popup.delete')}
          </button>
        ` : ''}
        <button class="popup-btn" data-action="popup-cancel">
          ${t('popup.cancel')}
        </button>
        <button class="popup-btn primary" data-action="popup-submit">
          ${isEditing ? t('popup.save') : isMultiSelect ? t('popup.addAnnotations', { count: multiSelectInfos.length }) : t('popup.addAnnotation')}
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
