/**
 * Light theme
 */

export const lightTheme = {
  name: 'light' as const,

  colors: {
    background: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(245, 245, 245, 0.95)',
      hover: 'rgba(0, 0, 0, 0.05)',
      active: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      muted: '#999999',
      inverse: '#ffffff',
    },
    border: {
      primary: 'rgba(0, 0, 0, 0.1)',
      secondary: 'rgba(0, 0, 0, 0.05)',
    },
    accent: {
      default: '#AF52DE',
      hover: '#9B47C7',
      light: 'rgba(175, 82, 222, 0.1)',
    },
    status: {
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
};

export type LightTheme = typeof lightTheme;
