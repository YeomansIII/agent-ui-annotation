/**
 * Themes module - re-exports
 */

export { lightTheme, type LightTheme } from './light';
export { darkTheme, type DarkTheme } from './dark';
export {
  LIGHT_THEME,
  DARK_THEME,
  SHARED_VARS,
  generateThemeCSS,
  resolveTheme,
  getAccentColor,
} from './variables';

import type { LightTheme } from './light';
import type { DarkTheme } from './dark';

export type Theme = LightTheme | DarkTheme;
export type ThemeName = 'light' | 'dark';
