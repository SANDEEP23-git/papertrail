/**
 * PAPERTRAIL — Paper Collection Styles
 * 
 * Complies with specification:
 * - Classic Ruled Paper
 * - Blank Paper
 * - Dotted Paper
 * - Grid Paper
 * - Vintage Cream Paper
 * - Aged Paper
 * - Minimal White Paper
 * - Dark Slate Paper
 */

export interface PaperStyle {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  patternType: 'none' | 'ruled' | 'dotted' | 'grid';
  ruleColor?: string;
  marginColor?: string;
  previewBg: string;
}

export const CuratedPapers: PaperStyle[] = [
  {
    id: 'blank',
    name: 'Tactile Parchment',
    description: 'Warm ivory blank sheet (Default)',
    backgroundColor: '#FBF7EF',
    textColor: '#382D26',
    borderColor: '#DED3C3',
    patternType: 'none',
    previewBg: '#FBF7EF',
  },
  {
    id: 'classic-ruled',
    name: 'Classic Ruled',
    description: 'Editorial lined notebook paper',
    backgroundColor: '#FBF7EF',
    textColor: '#382D26',
    borderColor: '#DED3C3',
    patternType: 'ruled',
    ruleColor: '#E6DCB8',
    marginColor: '#C86D51',
    previewBg: '#F8F3E6',
  },
  {
    id: 'dotted',
    name: 'Dotted Matrix',
    description: 'Isometric bullet journal matrix',
    backgroundColor: '#FAF5ED',
    textColor: '#382D26',
    borderColor: '#DED3C3',
    patternType: 'dotted',
    ruleColor: '#D8CCA8',
    previewBg: '#FAF5ED',
  },
  {
    id: 'grid',
    name: 'Quadrille Grid',
    description: 'Fine drafting and structured notes',
    backgroundColor: '#FBF7EF',
    textColor: '#382D26',
    borderColor: '#DED3C3',
    patternType: 'grid',
    ruleColor: '#E8DEC5',
    previewBg: '#F6F0DF',
  },
  {
    id: 'vintage-cream',
    name: 'Vintage Cream',
    description: 'Aged golden typewriter parchment',
    backgroundColor: '#F6EED8',
    textColor: '#2E241E',
    borderColor: '#D5C4A1',
    patternType: 'none',
    previewBg: '#F6EED8',
  },
  {
    id: 'aged-antique',
    name: 'Aged Antique',
    description: 'Weathered historical paper patina',
    backgroundColor: '#EDE1C9',
    textColor: '#261D17',
    borderColor: '#C6B291',
    patternType: 'none',
    previewBg: '#EDE1C9',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Crisp contemporary bright paper',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    borderColor: '#E2E2E2',
    patternType: 'none',
    previewBg: '#FFFFFF',
  },
  {
    id: 'dark-slate',
    name: 'Dark Slate',
    description: 'Muted charcoal nocturnal paper',
    backgroundColor: '#24201E',
    textColor: '#EFE6DA',
    borderColor: '#4A413B',
    patternType: 'none',
    previewBg: '#24201E',
  },
];
