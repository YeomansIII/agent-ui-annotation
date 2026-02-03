/**
 * i18n module tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initI18n,
  t,
  tOutput,
  registerLocale,
  getCurrentTranslations,
  isOutputTranslationEnabled,
  resetI18n,
  en,
  zhCN,
} from '../../src/core/i18n';
import type { TranslationStrings } from '../../src/core/i18n/types';

describe('i18n', () => {
  beforeEach(() => {
    resetI18n();
  });

  describe('t()', () => {
    it('returns English translation by default', () => {
      expect(t('toolbar.settings')).toBe('Settings');
      expect(t('toolbar.copyToClipboard')).toBe('Copy to clipboard');
    });

    it('returns translation for nested keys', () => {
      expect(t('settings.outputLevels.compact')).toBe('Compact');
      expect(t('settings.outputLevels.forensic')).toBe('Forensic');
    });

    it('interpolates variables', () => {
      expect(t('popup.addAnnotations', { count: 5 })).toBe('Add 5 Annotations');
      expect(t('popup.elementsSelected', { count: 3 })).toBe('3 elements selected');
      expect(t('popup.andMore', { count: 2 })).toBe('...and 2 more');
    });

    it('returns key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('keeps unmatched variables in place', () => {
      expect(t('popup.addAnnotations', {})).toBe('Add {{count}} Annotations');
    });
  });

  describe('initI18n()', () => {
    it('switches to Chinese locale', () => {
      initI18n({ locale: 'zh-CN' });
      expect(t('toolbar.settings')).toBe('设置');
      expect(t('toolbar.copyToClipboard')).toBe('复制到剪贴板');
    });

    it('falls back to English for unknown locale', () => {
      initI18n({ locale: 'unknown-locale' });
      expect(t('toolbar.settings')).toBe('Settings');
    });

    it('merges custom translations', () => {
      initI18n({
        locale: 'en',
        translations: {
          toolbar: {
            copiedFeedback: 'Custom copied message!',
          },
        },
      });
      expect(t('toolbar.copiedFeedback')).toBe('Custom copied message!');
      expect(t('toolbar.settings')).toBe('Settings'); // Others unchanged
    });

    it('deep merges nested custom translations', () => {
      initI18n({
        locale: 'en',
        translations: {
          settings: {
            outputLevels: {
              compact: 'Super Compact',
            },
          },
        },
      });
      expect(t('settings.outputLevels.compact')).toBe('Super Compact');
      expect(t('settings.outputLevels.standard')).toBe('Standard'); // Others unchanged
    });
  });

  describe('tOutput()', () => {
    it('returns English by default (translateOutput: false)', () => {
      initI18n({ locale: 'zh-CN', translateOutput: false });
      expect(tOutput('output.location')).toBe('Location');
      expect(tOutput('output.feedback')).toBe('Feedback');
    });

    it('returns translated output when translateOutput is true', () => {
      initI18n({ locale: 'zh-CN', translateOutput: true });
      expect(tOutput('output.location')).toBe('位置');
      expect(tOutput('output.feedback')).toBe('反馈');
    });

    it('interpolates variables in output', () => {
      initI18n({ translateOutput: false });
      expect(tOutput('popup.addAnnotations', { count: 3 })).toBe('Add 3 Annotations');
    });
  });

  describe('registerLocale()', () => {
    it('registers a custom locale', () => {
      const customLocale: TranslationStrings = {
        ...en,
        toolbar: {
          ...en.toolbar,
          settings: 'Einstellungen',
        },
      };
      registerLocale('de', customLocale);
      initI18n({ locale: 'de' });
      expect(t('toolbar.settings')).toBe('Einstellungen');
    });
  });

  describe('getCurrentTranslations()', () => {
    it('returns current translations object', () => {
      const translations = getCurrentTranslations();
      expect(translations.toolbar.settings).toBe('Settings');
    });

    it('reflects locale change', () => {
      initI18n({ locale: 'zh-CN' });
      const translations = getCurrentTranslations();
      expect(translations.toolbar.settings).toBe('设置');
    });
  });

  describe('isOutputTranslationEnabled()', () => {
    it('returns false by default', () => {
      expect(isOutputTranslationEnabled()).toBe(false);
    });

    it('returns true when enabled', () => {
      initI18n({ translateOutput: true });
      expect(isOutputTranslationEnabled()).toBe(true);
    });
  });

  describe('built-in locales', () => {
    it('exports English locale', () => {
      expect(en.toolbar.settings).toBe('Settings');
      expect(en.popup.cancel).toBe('Cancel');
    });

    it('exports Chinese locale', () => {
      expect(zhCN.toolbar.settings).toBe('设置');
      expect(zhCN.popup.cancel).toBe('取消');
    });

    it('has all required keys in Chinese locale', () => {
      // Check a sampling of keys to ensure completeness
      expect(zhCN.toolbar.activate).toBeDefined();
      expect(zhCN.popup.addAnnotation).toBeDefined();
      expect(zhCN.settings.outputLevel).toBeDefined();
      expect(zhCN.colors.purple).toBeDefined();
      expect(zhCN.marker.noComment).toBeDefined();
      expect(zhCN.output.pageFeedback).toBeDefined();
    });
  });

  describe('resetI18n()', () => {
    it('resets to English and disables output translation', () => {
      initI18n({ locale: 'zh-CN', translateOutput: true });
      expect(t('toolbar.settings')).toBe('设置');
      expect(isOutputTranslationEnabled()).toBe(true);

      resetI18n();
      expect(t('toolbar.settings')).toBe('Settings');
      expect(isOutputTranslationEnabled()).toBe(false);
    });
  });
});
