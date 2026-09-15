import { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { mapStyleFor } from '../lib/mapStyles';
import type { Theme } from '../lib/palette';
import type { TerritoryScale } from '../lib/territories';
import type { MapPoint } from '../types';

const MARKER_SCALE = 9;
const SELECTED_MARKER_SCALE = 12;
/** Ring in the surface colour so overlapping markers stay separable. */
const RING_WEIGHT = 2;
const SELECTED_RING_WEIGHT = 3;
/** Cap the auto-fit so a single location does not slam to street level. */
const MAX_AUTO_ZOOM = 16;

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Google signals key problems (invalid, referrer-restricted, billing disabled)
 * through this global rather than by rejecting the import promise.
 */
let authFailed = false;
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

let librariesPromise: Promise<{
  maps: google.maps.MapsLibrary;
  core: google.maps.CoreLibrary;
  marker: google.maps.MarkerLibrary;
}> | null = null;

function loadLibraries(apiKey: string) {
  if (!librariesPromise) {
    setOptions({ key: apiKey, v: 'weekly' });
    window.gm_authFailure = () => {
      authFailed = true;
    };
    librariesPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('core'),
      importLibrary('marker'),
    ]).then(([maps, core, marker]) => ({ maps, core, marker }));
  }
  return librariesPromise;
}

/** Pick readable ink for a badge sitting on top of a coloured marker. */
function inkOn(hex: string): string {
  const value = hex.replace('#', '');
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear(parseInt(value.slice(0, 2), 16));
  const g = toLinear(parseInt(value.slice(2, 4), 16));
  const b = toLinear(parseInt(value.slice(4, 6), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#0b0b0b' : '#ffffff';
}

/** A popup row, built as DOM so data values are never parsed as HTML. */
function popupRow(label: string, value: string, theme: Theme): HTMLElement {
  const row = document.createElement('div');
  row.className = 'popup-row';

  const key = document.createElement('span');
  key.className = 'popup-key';
  key.style.color = theme.textMuted;
  key.textContent = label;

  const val = document.createElement('span');
  val.className = 'popup-value';
  val.style.color = theme.textPrimary;
  val.textContent = value;

  row.append(key, val);
  return row;
}

function buildPopup(
  point: MapPoint,
  theme: Theme,
  color: string,
  territoryLabel: string,
  nameLabel: string,
): HTMLElement {
  const root = document.createElement('div');
  root.className = `map-popup ${theme.mode}`;

  const title = document.createElement('div');
  title.className = 'popup-title';
  title.style.color = theme.textPrimary;
  title.textContent = point.name || nameLabel || `Row ${point.rowIndex + 1}`;
  root.append(title);

  if (point.territory) {
    const chip = document.createElement('div');
    chip.className = 'popup-chip';
    chip.style.color = theme.textSecondary;

    const dot = document.createElement('span');
    dot.className = 'popup-dot';
    dot.style.background = color;
    dot.style.borderColor = theme.surface;

    const text = document.createElement('span');
    text.textContent = point.territory;

    chip.append(dot, text);
    root.append(chip);
  }

  const rule = document.createElement('div');
  rule.className = 'popup-rule';
  rule.style.background = theme.gridline;
  root.append(rule);

  if (territoryLabel && !point.territory) {
    root.append(popupRow(territoryLabel, '—', theme));
  }
  root.append(popupRow('Latitude', point.lat.toFixed(6), theme));
  root.append(popupRow('Longitude', point.lng.toFixed(6), theme));

  return root;
}

interface GoogleMapProps {
  apiKey: string;
  points: MapPoint[];
  theme: Theme;
  scale: TerritoryScale;
  mapStyle: string | undefined;
  nameLabel: string;
  territoryLabel: string;
  selectedRow: number | null;
  onSelect: (rowIndex: number | null) => void;
}

export function GoogleMap({
  apiKey,
  points,
  theme,
  scale,
  mapStyle,
  nameLabel,
  territoryLabel,
  selectedRow,
  onSelect,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const libsRef = useRef<Awaited<ReturnType<typeof loadLibraries>> | null>(null);
  const fittedRef = useRef<string>('');

  const [loadState, setLoadState] = useState<LoadState>('loading');

  // `onSelect` changes identity between renders; hold it in a ref so the marker
  // effect does not rebuild every marker just to stay current.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Boot the Maps API and create the map once.
  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setLoadState('error');
      return;
    }

    loadLibraries(apiKey)
      .then((libs) => {
        if (cancelled || !containerRef.current) return;
        if (authFailed) {
          setLoadState('error');
          return;
        }

        libsRef.current = libs;
        const { styles } = mapStyleFor(mapStyle);

        mapRef.current = new libs.maps.Map(containerRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          styles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          zoomControl: true,
        });

        infoRef.current = new libs.maps.InfoWindow({ disableAutoPan: false });
        infoRef.current.addListener('closeclick', () => onSelectRef.current(null));

        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Restyle the basemap when the author switches light/dark.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ styles: mapStyleFor(mapStyle).styles });
  }, [mapStyle, loadState]);

  // Rebuild markers whenever the rows, territories, or theme change.
  useEffect(() => {
    const map = mapRef.current;
    const libs = libsRef.current;
    if (!map || !libs || loadState !== 'ready') return;

    for (const marker of markersRef.current.values()) marker.setMap(null);
    markersRef.current.clear();

    for (const point of points) {
      const style = scale.styleFor(point.territory);

      const marker = new libs.marker.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: point.name || undefined,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: MARKER_SCALE,
          fillColor: style.color,
          fillOpacity: 0.9,
          strokeColor: theme.surface,
          strokeWeight: RING_WEIGHT,
        },
        // Once more than three colours are in play, hue alone cannot carry
        // identity — every marker also shows its territory's badge.
        label: scale.needsBadges
          ? {
              text: style.badge,
              color: inkOn(style.color),
              fontSize: '10px',
              fontWeight: '700',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            }
          : undefined,
      });

      marker.addListener('click', () => onSelectRef.current(point.rowIndex));
      markersRef.current.set(point.rowIndex, marker);
    }

    // Refit only when the coordinates themselves change, so recolouring does
    // not yank the viewport out from under the reader.
    const signature = points.map((p) => `${p.lat},${p.lng}`).join('|');
    if (signature && signature !== fittedRef.current) {
      fittedRef.current = signature;
      const bounds = new libs.core.LatLngBounds();
      for (const point of points) bounds.extend({ lat: point.lat, lng: point.lng });
      map.fitBounds(bounds, 48);

      const listener = map.addListener('idle', () => {
        const zoom = map.getZoom();
        if (zoom !== undefined && zoom > MAX_AUTO_ZOOM) map.setZoom(MAX_AUTO_ZOOM);
        listener.remove();
      });
    }
  }, [points, scale, theme, loadState]);

  // Reflect selection: emphasise the marker and open its popup.
  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!map || !info || loadState !== 'ready') return;

    for (const [rowIndex, marker] of markersRef.current) {
      const style = scale.styleFor(
        points.find((p) => p.rowIndex === rowIndex)?.territory ?? '',
      );
      const isSelected = rowIndex === selectedRow;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? SELECTED_MARKER_SCALE : MARKER_SCALE,
        fillColor: style.color,
        fillOpacity: 0.9,
        strokeColor: isSelected ? theme.selection : theme.surface,
        strokeWeight: isSelected ? SELECTED_RING_WEIGHT : RING_WEIGHT,
      });
      marker.setZIndex(isSelected ? 1000 : undefined);
    }

    if (selectedRow === null) {
      info.close();
      return;
    }

    const point = points.find((p) => p.rowIndex === selectedRow);
    const marker = markersRef.current.get(selectedRow);
    if (!point || !marker) {
      info.close();
      return;
    }

    info.setContent(
      buildPopup(point, theme, scale.styleFor(point.territory).color, territoryLabel, nameLabel),
    );
    info.open({ map, anchor: marker });
  }, [selectedRow, points, scale, theme, loadState, nameLabel, territoryLabel]);

  if (loadState === 'error') {
    return (
      <div className="map-error" style={{ background: theme.plane, color: theme.textSecondary }}>
        <div
          className="empty-card"
          style={{ background: theme.surface, borderColor: theme.border }}
        >
          <h1 style={{ color: theme.textPrimary }}>Google Maps could not load</h1>
          <ol>
            <li>Confirm the API key is set and the Maps JavaScript API is enabled for it.</li>
            <li>
              If the key restricts HTTP referrers, add this plugin&apos;s deployed domain to the
              allowed list.
            </li>
            <li>Check that billing is active on the Google Cloud project.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-canvas" aria-label="Map of restaurant locations" />
      {loadState === 'loading' && (
        <div className="map-loading" style={{ color: theme.textMuted }}>
          Loading map…
        </div>
      )}
    </div>
  );
}
