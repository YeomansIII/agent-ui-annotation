/**
 * Theme CSS variables and constants
 */

export const LIGHT_THEME = {
  // Background
  '--as-bg-primary': 'rgba(255, 255, 255, 0.95)',
  '--as-bg-secondary': 'rgba(245, 245, 245, 0.95)',
  '--as-bg-hover': 'rgba(0, 0, 0, 0.05)',
  '--as-bg-active': 'rgba(0, 0, 0, 0.1)',
  '--as-bg-overlay': 'rgba(255, 255, 255, 0.8)',

  // Text
  '--as-text-primary': '#1a1a1a',
  '--as-text-secondary': '#666666',
  '--as-text-muted': '#999999',
  '--as-text-inverse': '#ffffff',

  // Border
  '--as-border-primary': 'rgba(0, 0, 0, 0.1)',
  '--as-border-secondary': 'rgba(0, 0, 0, 0.05)',

  // Accent (scope color)
  '--as-accent': '#AF52DE',
  '--as-accent-hover': '#9B47C7',
  '--as-accent-light': 'rgba(175, 82, 222, 0.1)',

  // Status
  '--as-success': '#34C759',
  '--as-warning': '#FF9500',
  '--as-error': '#FF3B30',

  // Shadow
  '--as-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '--as-shadow-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
  '--as-shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.15)',

  // Blur
  '--as-backdrop-blur': 'blur(12px)',
};

export const DARK_THEME = {
  // Background
  '--as-bg-primary': 'rgba(24, 24, 27, 0.95)',
  '--as-bg-secondary': 'rgba(39, 39, 42, 0.95)',
  '--as-bg-hover': 'rgba(255, 255, 255, 0.1)',
  '--as-bg-active': 'rgba(255, 255, 255, 0.15)',
  '--as-bg-overlay': 'rgba(24, 24, 27, 0.8)',

  // Text
  '--as-text-primary': '#ffffff',
  '--as-text-secondary': '#a1a1aa',
  '--as-text-muted': '#71717a',
  '--as-text-inverse': '#1a1a1a',

  // Border
  '--as-border-primary': 'rgba(255, 255, 255, 0.1)',
  '--as-border-secondary': 'rgba(255, 255, 255, 0.05)',

  // Accent (scope color)
  '--as-accent': '#AF52DE',
  '--as-accent-hover': '#C77DFF',
  '--as-accent-light': 'rgba(175, 82, 222, 0.2)',

  // Status
  '--as-success': '#34C759',
  '--as-warning': '#FF9500',
  '--as-error': '#FF3B30',

  // Shadow
  '--as-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
  '--as-shadow-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
  '--as-shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.4)',

  // Blur
  '--as-backdrop-blur': 'blur(12px)',
};

/** Shared CSS variables (theme-independent) */
export const SHARED_VARS = {
  // Spacing
  '--as-space-xs': '4px',
  '--as-space-sm': '8px',
  '--as-space-md': '12px',
  '--as-space-lg': '16px',
  '--as-space-xl': '24px',

  // Border radius
  '--as-radius-sm': '4px',
  '--as-radius-md': '8px',
  '--as-radius-lg': '12px',
  '--as-radius-full': '9999px',

  // Typography
  '--as-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--as-font-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  '--as-font-size-xs': '10px',
  '--as-font-size-sm': '12px',
  '--as-font-size-md': '14px',
  '--as-font-size-lg': '16px',

  // Transitions
  '--as-transition-fast': '100ms ease',
  '--as-transition-normal': '200ms ease',
  '--as-transition-slow': '300ms ease',

  // Z-index
  '--as-z-toolbar': '999999',
  '--as-z-markers': '999998',
  '--as-z-popup': '1000000',
  '--as-z-tooltip': '1000001',
  '--as-z-overlay': '999997',
};

/**
 * Generate CSS variables string for a theme
 */
export function generateThemeCSS(theme: 'light' | 'dark'): string {
  const themeVars = theme === 'light' ? LIGHT_THEME : DARK_THEME;
  const allVars = { ...SHARED_VARS, ...themeVars };

  return Object.entries(allVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

/**
 * Get the resolved theme based on mode
 */
export function resolveTheme(mode: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Get accent color by name
 */
export function getAccentColor(name: string): string {
  const colors: Record<string, string> = {
    purple: '#AF52DE',
    blue: '#3c82f7',
    cyan: '#5AC8FA',
    green: '#34C759',
    yellow: '#FFD60A',
    orange: '#FF9500',
    red: '#FF3B30',
  };

  return colors[name] || colors.purple;
}
