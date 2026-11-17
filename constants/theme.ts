/**
 * PAPERTRAIL Theme & Design Tokens
 * 
 * Strict compliance with idea.md and README.md:
 * Restrained editorial warmth, tactile paper surfaces, deep espresso ink.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Core palette from specification
  paper: '#F4EEE3',       // Main app background (warm ivory/parchment)
  sheet: '#FBF7EF',       // Editor paper surface
  ink: '#382D26',         // Primary text (deep espresso brown)
  walnut: '#705844',      // Primary actions / buttons
  muted: '#8F7D6B',       // Secondary text / captions
  rule: '#DED3C3',        // Dividers, platen rules and fine borders
  brass: '#A88B5A',       // Rare accent / badges / highlights

  // Functional & semantic tones
  paperDark: '#E6DCCF',   // Deeper parchment for platen rollers & headers
  paperHover: '#EFE7DA',  // Hover / press state
  danger: '#8B3A3A',      // Trash / permanent delete warning
  dangerBg: '#FDF2F2',    // Subtle danger background
  success: '#4A6B48',     // Confirmed save / indicator
  successBg: '#F2F7F2',

  // Tactile shadows
  shadowSubtle: 'rgba(56, 45, 38, 0.06)',
  shadowMedium: 'rgba(56, 45, 38, 0.12)',
  shadowDeep: 'rgba(56, 45, 38, 0.18)',
} as const;

export const Typography = {
  fontFamilies: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, "Times New Roman", serif',
      default: 'serif',
    }) as string,
    sans: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      default: 'sans-serif',
    }) as string,
    mono: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: '"Courier New", Courier, monospace',
      default: 'monospace',
    }) as string,
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    display: 32,
    brand: 38,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const Radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  pill: 9999,
} as const;
