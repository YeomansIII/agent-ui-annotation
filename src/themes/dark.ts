/**
 * Dark theme
 */

export const darkTheme = {
  name: 'dark' as const,

  colors: {
    background: {
      primary: 'rgba(24, 24, 27, 0.95)',
      secondary: 'rgba(39, 39, 42, 0.95)',
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.15)',
      overlay: 'rgba(24, 24, 27, 0.8)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      muted: '#71717a',
      inverse: '#1a1a1a',
    },
    border: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
    },
    accent: {
      default: '#AF52DE',
      hover: '#C77DFF',
      light: 'rgba(175, 82, 222, 0.2)',
    },
    status: {
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
};

export type DarkTheme = typeof darkTheme;
