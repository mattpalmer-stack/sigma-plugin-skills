/**
 * Colour tokens.
 *
 * Every value is copied from the validated reference palette — nothing is
 * invented or interpolated. The categorical slots are used in their published
 * fixed order and are never cycled: past the last slot, territories fold into
 * a neutral "Other" rather than repeating a hue.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * The eight categorical slots, in their published order.
 *
 * Only the first THREE clear the all-pairs gates that a map has to meet — on a
 * map any two markers can end up side by side, so every pair must be separable,
 * not just the pairs that happen to be adjacent in a legend. Slots 4–8 are still
 * used, but the plugin adds a letter badge to every marker once more than three
 * territories are on screen, so identity never rests on hue alone.
 */
export const CATEGORICAL: Record<ThemeMode, readonly string[]> = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};

/** Colour count past which markers pick up a secondary channel. */
export const SAFE_COLOR_ONLY_COUNT = 3;

export interface Theme {
  mode: ThemeMode;
  /** Chart surface — also the ring drawn around each marker. */
  surface: string;
  plane: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridline: string;
  border: string;
  categorical: readonly string[];
  /** Fill for the folded "Other" bucket and for rows with no territory. */
  neutralMark: string;
  /** Ring marking the selected marker. */
  selection: string;
}

export const LIGHT_THEME: Theme = {
  mode: 'light',
  surface: '#fcfcfb',
  plane: '#f9f9f7',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#898781',
  gridline: '#e1e0d9',
  border: 'rgba(11,11,11,0.10)',
  categorical: CATEGORICAL.light,
  neutralMark: '#898781',
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
  categorical: CATEGORICAL.dark,
  neutralMark: '#898781',
  selection: '#ffffff',
};

export function themeFor(mode: ThemeMode): Theme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
