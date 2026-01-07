/**
 * YourCow Brand Design Tokens
 *
 * Centralized design constants for the investor platform.
 * Use these tokens throughout the application for consistency.
 */

export const BRAND_COLORS = {
  // Primary - Deep Green (trust, nature, agriculture)
  green: {
    DEFAULT: '#1B5E20',
    dark: '#0D4715',
    light: '#2E7D32',
    lighter: '#4CAF50',
  },

  // Secondary - Sky Blue (liquidity, clarity)
  blue: {
    DEFAULT: '#4FC3F7',
    light: '#81D4FA',
    dark: '#0288D1',
  },

  // Accent - Warm Brown (real assets, earth)
  brown: {
    DEFAULT: '#8D6E63',
    light: '#A1887F',
    dark: '#5D4037',
  },

  // Neutrals
  neutral: {
    bg: '#FAFAF8',      // Off-white background
    white: '#FFFFFF',
    gray: {
      50: '#F5F5F4',
      100: '#E7E5E4',
      200: '#D6D3D1',
      300: '#A8A29E',
      400: '#78716C',
      500: '#57534E',
      600: '#44403C',
      700: '#292524',
      800: '#1C1917',
      900: '#0C0A09',
    },
  },
} as const;

export const BRAND_COPY = {
  name: 'YourCow',
  tagline: 'Invest in real cattle assets',
  description: 'Structured liquidity aligned with real production cycles',
  trustBadge: 'Backed by real agricultural assets',
} as const;

export const ANIMATION_TIMINGS = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;
