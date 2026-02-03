/**
 * Settings panel template
 */

import type { Settings, OutputLevel } from '../../core/types';
import { ANNOTATION_COLORS } from '../../core/types';
import { t } from '../../core/i18n';

export interface SettingsPanelOptions {
  settings: Settings;
  skipAnimation?: boolean;
}

/**
 * Render the settings panel
 */
export function renderSettingsPanel(options: SettingsPanelOptions): string {
  const { settings, skipAnimation = false } = options;

  const outputLevelOptions: { value: OutputLevel; label: string }[] = [
    { value: 'compact', label: t('settings.outputLevels.compact') },
    { value: 'standard', label: t('settings.outputLevels.standard') },
    { value: 'detailed', label: t('settings.outputLevels.detailed') },
    { value: 'forensic', label: t('settings.outputLevels.forensic') },
  ];

  const colorOptions = Object.entries(ANNOTATION_COLORS).map(([name, hex]) => ({
    name,
    translatedName: t(`colors.${name}`),
    hex,
    active: settings.annotationColor === hex,
  }));

  return `
    <div class="settings-panel${skipAnimation ? ' no-animate' : ''}" data-annotation-settings>
      <div class="settings-title">${t('settings.title')}</div>

      <div class="settings-group">
        <label class="settings-label">${t('settings.outputLevel')}</label>
        <select class="settings-select" data-setting="outputLevel">
          ${outputLevelOptions
            .map(
              (opt) =>
                `<option value="${opt.value}" ${settings.outputLevel === opt.value ? 'selected' : ''}>${opt.label}</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="settings-group">
        <label class="settings-label">${t('settings.markerColor')}</label>
        <div class="color-picker">
          ${colorOptions
            .map(
              (color) =>
                `<button
                  class="color-option ${color.active ? 'active' : ''}"
                  style="background: ${color.hex};"
                  data-setting="annotationColor"
                  data-value="${color.hex}"
                  title="${color.translatedName}"
                ></button>`
            )
            .join('')}
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">${t('settings.blockInteractions')}</span>
          <button
            class="settings-switch ${settings.blockInteractions ? 'active' : ''}"
            data-setting="blockInteractions"
            data-value="${!settings.blockInteractions}"
            title="${t('settings.blockInteractionsHint')}"
          ></button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">${t('settings.showTooltips')}</span>
          <button
            class="settings-switch ${settings.showTooltips ? 'active' : ''}"
            data-setting="showTooltips"
            data-value="${!settings.showTooltips}"
          ></button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">${t('settings.autoClearAfterCopy')}</span>
          <button
            class="settings-switch ${settings.autoClearAfterCopy ? 'active' : ''}"
            data-setting="autoClearAfterCopy"
            data-value="${!settings.autoClearAfterCopy}"
          ></button>
        </div>
      </div>
    </div>
  `;
}
