import type { ThemeMode } from './palette';

export type MapStyleName = 'Light' | 'Dark';

export const MAP_STYLE_NAMES: MapStyleName[] = ['Light', 'Dark'];
export const DEFAULT_MAP_STYLE: MapStyleName = 'Light';

/**
 * Recessive basemap styling: the map is context, the markers are the data.
 *
 * Points of interest are switched off deliberately — the rows being plotted are
 * restaurants, and Google's own restaurant pins would compete with (and be
 * mistaken for) the plugin's markers.
 */
const LIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f4f4f1' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#898781' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fcfcfb' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#e1e0d9' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eceee8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#898781' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f7f6f2' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e1e0d9' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbe4ec' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9fb0c0' }] },
];

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242423' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#898781' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a19' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#383835' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1f1f1e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2a' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#898781' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#383835' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#15202b' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5a68' }] },
];

export function mapStyleFor(name: string | undefined): {
  styles: google.maps.MapTypeStyle[];
  mode: ThemeMode;
} {
  return name === 'Dark'
    ? { styles: DARK_STYLE, mode: 'dark' }
    : { styles: LIGHT_STYLE, mode: 'light' };
}
