/**
 * Settings panel template
 */

import type { Settings, OutputLevel } from '../../core/types';
import { SCOPE_COLORS } from '../../core/types';

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
    { value: 'compact', label: 'Compact' },
    { value: 'standard', label: 'Standard' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'forensic', label: 'Forensic' },
  ];

  const colorOptions = Object.entries(SCOPE_COLORS).map(([name, hex]) => ({
    name,
    hex,
    active: settings.scopeColor === hex,
  }));

  return `
    <div class="settings-panel${skipAnimation ? ' no-animate' : ''}" data-annotation-settings>
      <div class="settings-title">Settings</div>

      <div class="settings-group">
        <label class="settings-label">Output Level</label>
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
        <label class="settings-label">Marker Color</label>
        <div class="color-picker">
          ${colorOptions
            .map(
              (color) =>
                `<button
                  class="color-option ${color.active ? 'active' : ''}"
                  style="background: ${color.hex};"
                  data-setting="scopeColor"
                  data-value="${color.hex}"
                  title="${color.name}"
                ></button>`
            )
            .join('')}
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">Block page interactions</span>
          <button
            class="settings-switch ${settings.blockInteractions ? 'active' : ''}"
            data-setting="blockInteractions"
            data-value="${!settings.blockInteractions}"
            title="Prevent clicks from activating buttons/links while annotating"
          ></button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">Show tooltips</span>
          <button
            class="settings-switch ${settings.showTooltips ? 'active' : ''}"
            data-setting="showTooltips"
            data-value="${!settings.showTooltips}"
          ></button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle">
          <span class="settings-toggle-label">Auto-clear after copy</span>
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
