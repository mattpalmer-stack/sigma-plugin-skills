// ---------------------------------------------------------------------------
// Brand + theme settings. Edit here; everything else reads from these.
// ---------------------------------------------------------------------------

export const BRAND_GOLD = '#C8962E';
export const BRAND_INK = '#1F1F1E';
export const FALLBACK_SCENARIO_COLOR = BRAND_GOLD;

export const DEFAULT_COUNTRY = 'Brazil'; // falls back to the first country
export const DROPDOWN_THRESHOLD = 4; // more scenarios than this -> dropdown
export const BAND_OPACITY = 0.16;
export const ABOVE_FILL_OPACITY = 0.18;
export const CHART_HEIGHT = 290;

export interface Palette {
  text: string;
  muted: string;
  surface: string; // KPI cards
  border: string;
  selectedRow: string;
  gold: string;
  ink: string; // baseline line, probability tick
  pathway: string;
  good: string;
  goodBg: string;
  warn: string;
  warnBg: string;
  bad: string;
  badBg: string;
  aboveFill: string; // red used for the above-pathway fill
  grid: string;
}

export const LIGHT: Palette = {
  text: '#1F1F1E',
  muted: '#6B6A66',
  surface: '#F6F5F1',
  border: 'rgba(31,31,30,0.18)',
  selectedRow: '#F6F5F1',
  gold: BRAND_GOLD,
  ink: BRAND_INK,
  pathway: '#3B6D11',
  good: '#3B6D11',
  goodBg: '#DDEFC8',
  warn: '#7A5200',
  warnBg: '#F6E6BF',
  bad: '#A32D2D',
  badBg: '#F7D9D9',
  aboveFill: '#E24B4A',
  grid: 'rgba(31,31,30,0.08)',
};

export const DARK: Palette = {
  text: '#ECEAE3',
  muted: '#A19F97',
  surface: '#2A2A28',
  border: 'rgba(236,234,227,0.22)',
  selectedRow: '#2A2A28',
  gold: '#D9A93F',
  ink: '#E6E4DC',
  pathway: '#97C459',
  good: '#97C459',
  goodBg: 'rgba(151,196,89,0.2)',
  warn: '#E8C26A',
  warnBg: 'rgba(232,194,106,0.2)',
  bad: '#F09595',
  badBg: 'rgba(240,149,149,0.2)',
  aboveFill: '#F09595',
  grid: 'rgba(236,234,227,0.1)',
};

export const cssVars = (p: Palette): Record<string, string> => ({
  '--text': p.text,
  '--muted': p.muted,
  '--surface': p.surface,
  '--border': p.border,
  '--selected-row': p.selectedRow,
  '--gold': p.gold,
  '--ink': p.ink,
  '--pathway': p.pathway,
  '--good': p.good,
  '--good-bg': p.goodBg,
  '--warn': p.warn,
  '--warn-bg': p.warnBg,
  '--bad': p.bad,
  '--bad-bg': p.badBg,
});

export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
