import type { BasemapName } from '../types';
import type { ThemeMode } from './palette';

export interface BasemapSpec {
  url: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
  /** Which token set the plugin chrome should use over this basemap. */
  mode: ThemeMode;
}

const OSM_CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Neutral, low-saturation basemaps so the data marks carry the colour. All are
 * CARTO raster tiles, which need no API key.
 */
export const BASEMAPS: Record<BasemapName, BasemapSpec> = {
  Light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: OSM_CARTO_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 20,
    mode: 'light',
  },
  Dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: OSM_CARTO_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 20,
    mode: 'dark',
  },
  Voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: OSM_CARTO_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 20,
    mode: 'light',
  },
};

export const BASEMAP_NAMES = Object.keys(BASEMAPS) as BasemapName[];

export const DEFAULT_BASEMAP: BasemapName = 'Light';

export function basemapFor(name: string | undefined): BasemapSpec {
  return BASEMAPS[(name as BasemapName) in BASEMAPS ? (name as BasemapName) : DEFAULT_BASEMAP];
}
