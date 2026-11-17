/**
 * PAPERTRAIL — Curated Writing Typography & Ink Palette
 * 
 * Complies with specification:
 * - Curated readable editorial font families
 * - Natural, paper-appropriate vintage ink tones
 * - Line spacing and sizing scales
 */

import { Platform } from 'react-native';

export interface InkColor {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const CuratedInks: InkColor[] = [
  {
    id: 'espresso',
    name: 'Dark Brown',
    hex: '#382D26',
    description: 'Traditional warm espresso typewriter ribbon (Default)',
  },
  {
    id: 'black',
    name: 'Classic Black',
    hex: '#181513',
    description: 'Deep archival carbon black',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    hex: '#1B263B',
    description: 'Quiet dusk fountain pen tone',
  },
  {
    id: 'royal',
    name: 'Royal Blue',
    hex: '#1E3A8A',
    description: 'Vibrant literary editorial blue',
  },
  {
    id: 'burgundy',
    name: 'Vintage Burgundy',
    hex: '#581C28',
    description: 'Deep aged vintage wine red',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    hex: '#1E3A24',
    description: 'Restrained moss and pine green',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    hex: '#2B2D42',
    description: 'Soft graphite lead finish',
  },
];

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: string;
  previewText: string;
}

export const CuratedFonts: FontOption[] = [
  {
    id: 'serif',
    name: 'Classic Serif',
    family: Platform.select({
      android: 'serif',
      ios: 'Georgia',
      default: 'Georgia, "Times New Roman", serif',
    }) as string,
    category: 'Serif',
    previewText: 'Every thought leaves a lasting mark on paper.',
  },
  {
    id: 'editorial',
    name: 'Elegant Editorial',
    family: Platform.select({
      android: 'serif',
      ios: 'Baskerville',
      default: 'Baskerville, "Playfair Display", Georgia, serif',
    }) as string,
    category: 'Serif',
    previewText: 'Deliberate, literary prose with measured grace.',
  },
  {
    id: 'sans',
    name: 'Modern Sans',
    family: Platform.select({
      android: 'sans-serif',
      ios: 'System',
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }) as string,
    category: 'Sans-Serif',
    previewText: 'Crisp, contemporary legibility for fast drafting.',
  },
  {
    id: 'minimal',
    name: 'Minimal Sans',
    family: Platform.select({
      android: 'sans-serif-light',
      ios: 'Trebuchet MS',
      default: '"Trebuchet MS", "Lucida Grande", "Segoe UI", sans-serif',
    }) as string,
    category: 'Sans-Serif',
    previewText: 'Restrained simplicity that keeps writing first.',
  },
  {
    id: 'typewriter',
    name: 'Vintage Typewriter',
    family: Platform.select({
      android: 'monospace',
      ios: 'Courier',
      default: '"Courier New", Courier, monospace',
    }) as string,
    category: 'Monospace',
    previewText: 'Mechanical hammer strikes on platen roller.',
  },
  {
    id: 'handwriting',
    name: 'Handwriting-Inspired',
    family: Platform.select({
      android: 'serif',
      ios: 'Snell Roundhand',
      default: '"Caveat", "Segoe Script", "Brush Script MT", cursive',
    }) as string,
    category: 'Script',
    previewText: 'The warmth of personal cursive journaling.',
  },
];

export const FontSizes = [
  { label: 'Compact', value: 14 },
  { label: 'Normal', value: 16 },
  { label: 'Editorial', value: 18 },
  { label: 'Large', value: 20 },
  { label: 'Spacious', value: 24 },
];

export const LineSpacings = [
  { label: 'Tight', value: 1.4 },
  { label: 'Balanced', value: 1.6 },
  { label: 'Relaxed', value: 1.8 },
  { label: 'Double', value: 2.1 },
];
