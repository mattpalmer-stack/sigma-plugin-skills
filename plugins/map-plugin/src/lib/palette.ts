/**
 * Colour tokens for the map.
 *
 * Every value here is copied from the validated reference palette — nothing is
 * invented or interpolated. The sequential hue is blue; the steps below are the
 * published 100–700 ramp.
 */

/** The published blue sequential ramp, light → dark. */
export const BLUE = {
  100: '#cde2fb',
  150: '#b7d3f6',
  200: '#9ec5f4',
  250: '#86b6ef',
  300: '#6da7ec',
  350: '#5598e7',
  400: '#3987e5',
  450: '#2a78d6',
  500: '#256abf',
  550: '#1c5cab',
  600: '#184f95',
  650: '#104281',
  700: '#0d366b',
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  /** Chart surface — also the colour of the ring drawn around each marker. */
  surface: string;
  plane: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridline: string;
  border: string;
  /** Marker ramp, low magnitude → high magnitude. */
  ramp: readonly string[];
  /** Fill for markers when no "colour by" column is configured. */
  neutralMark: string;
  /** Ring colour marking the selected point. */
  selection: string;
}

/**
 * Markers sit on top of a basemap rather than on bare surface, so the ramp is
 * treated as *ordinal* rather than continuous: the step nearest the surface has
 * to stay legible. On light that means starting no lighter than step 250; on
 * dark, going no darker than step 600. Both ends respect those floors.
 */
const LIGHT_RAMP = [BLUE[250], BLUE[350], BLUE[450], BLUE[550], BLUE[650]] as const;

/** Dark mode is a selected set of steps from the same ramp, not a flipped one. */
const DARK_RAMP = [BLUE[550], BLUE[450], BLUE[350], BLUE[250], BLUE[150]] as const;

export const LIGHT_THEME: Theme = {
  mode: 'light',
  surface: '#fcfcfb',
  plane: '#f9f9f7',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#898781',
  gridline: '#e1e0d9',
  border: 'rgba(11,11,11,0.10)',
  ramp: LIGHT_RAMP,
  neutralMark: BLUE[450],
  selection: '#0b0b0b',
};

export const DARK_THEME: Theme = {
  mode: 'dark',
  surface: '#1a1a19',
  plane: '#0d0d0d',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  textMuted: '#898781',
  gridline: '#2c2c2a',
  border: 'rgba(255,255,255,0.10)',
  ramp: DARK_RAMP,
  neutralMark: BLUE[350],
  selection: '#ffffff',
};

export function themeFor(mode: ThemeMode): Theme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
