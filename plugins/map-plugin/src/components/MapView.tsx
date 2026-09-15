import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { basemapFor } from '../lib/basemaps';
import { bucketIndex, radiusFor, type Extent } from '../lib/scales';
import { formatCompact } from '../lib/format';
import type { Theme } from '../lib/palette';
import type { MapPoint } from '../types';

/** Marker radii. The floor doubles as the hit target, so it stays generous. */
const MIN_RADIUS = 8;
const MAX_RADIUS = 26;

/** Ring drawn in the surface colour so overlapping marks stay separable. */
const RING_WEIGHT = 2;
const SELECTED_RING_WEIGHT = 3;

interface MapViewProps {
  points: MapPoint[];
  theme: Theme;
  basemap: string | undefined;
  colorExtent: Extent | null;
  sizeExtent: Extent | null;
  colorLabel: string;
  sizeLabel: string;
  selectedRow: number | null;
  onSelect: (point: MapPoint) => void;
}

/** A definition-list row, built as DOM so data values are never parsed as HTML. */
function detailRow(name: string, value: string, theme: Theme): HTMLElement {
  const row = document.createElement('div');
  row.className = 'popup-row';

  const key = document.createElement('span');
  key.className = 'popup-key';
  key.style.color = theme.textMuted;
  key.textContent = name;

  const val = document.createElement('span');
  val.className = 'popup-value';
  val.style.color = theme.textPrimary;
  val.textContent = value;

  row.append(key, val);
  return row;
}

function buildTooltip(
  point: MapPoint,
  theme: Theme,
  colorLabel: string,
  sizeLabel: string,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'map-tooltip';

  if (point.label) {
    const title = document.createElement('div');
    title.className = 'popup-title';
    title.style.color = theme.textPrimary;
    title.textContent = point.label;
    root.append(title);
  }

  if (point.colorValue !== null && colorLabel) {
    root.append(detailRow(colorLabel, formatCompact(point.colorValue), theme));
  }
  if (point.sizeValue !== null && sizeLabel) {
    root.append(detailRow(sizeLabel, formatCompact(point.sizeValue), theme));
  }

  if (!root.childNodes.length) {
    const fallback = document.createElement('div');
    fallback.style.color = theme.textSecondary;
    fallback.textContent = `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`;
    root.append(fallback);
  }

  return root;
}

function buildPopup(
  point: MapPoint,
  theme: Theme,
  colorLabel: string,
  sizeLabel: string,
): HTMLElement {
  const root = buildTooltip(point, theme, colorLabel, sizeLabel);
  const shown = point.details.filter((d) => d.value !== '');
  if (shown.length) {
    const rule = document.createElement('div');
    rule.className = 'popup-rule';
    rule.style.background = theme.gridline;
    root.append(rule);
    for (const detail of shown) {
      root.append(detailRow(detail.name, detail.value, theme));
    }
  }
  return root;
}

export function MapView({
  points,
  theme,
  basemap,
  colorExtent,
  sizeExtent,
  colorLabel,
  sizeLabel,
  selectedRow,
  onSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number, L.CircleMarker>>(new Map());
  const fittedRef = useRef<string>('');

  // `onSelect` changes identity on most renders; hold it in a ref so the marker
  // effect does not have to tear down and rebuild every marker to stay current.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    }).setView([0, 0], 2);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    // The plugin lives in an iframe that the workbook can resize at any time.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Swap the basemap tiles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const spec = basemapFor(basemap);
    if (tileRef.current) {
      tileRef.current.remove();
    }
    tileRef.current = L.tileLayer(spec.url, {
      attribution: spec.attribution,
      subdomains: spec.subdomains,
      maxZoom: spec.maxZoom,
    }).addTo(map);
  }, [basemap]);

  // Rebuild markers whenever the data, scales, or theme change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    const steps = theme.ramp.length;

    // Draw large markers first so small ones land on top and stay clickable.
    const ordered = [...points].sort(
      (a, b) =>
        radiusFor(b.sizeValue, sizeExtent, MIN_RADIUS, MAX_RADIUS) -
        radiusFor(a.sizeValue, sizeExtent, MIN_RADIUS, MAX_RADIUS),
    );

    for (const point of ordered) {
      const fill =
        point.colorValue !== null && colorExtent
          ? theme.ramp[bucketIndex(point.colorValue, colorExtent, steps)]
          : theme.neutralMark;

      const marker = L.circleMarker([point.lat, point.lon], {
        radius: radiusFor(point.sizeValue, sizeExtent, MIN_RADIUS, MAX_RADIUS),
        fillColor: fill,
        fillOpacity: 0.85,
        color: theme.surface,
        weight: RING_WEIGHT,
      });

      marker.bindTooltip(() => buildTooltip(point, theme, colorLabel, sizeLabel), {
        direction: 'top',
        opacity: 1,
        className: `map-tooltip-shell ${theme.mode}`,
      });
      marker.bindPopup(() => buildPopup(point, theme, colorLabel, sizeLabel), {
        closeButton: true,
        className: `map-popup-shell ${theme.mode}`,
      });
      marker.on('click', () => onSelectRef.current(point));

      marker.addTo(layer);
      markersRef.current.set(point.rowIndex, marker);
    }

    // Refit only when the set of coordinates actually changes, so a colour or
    // size tweak does not yank the viewport out from under the user.
    const signature = points.map((p) => `${p.lat},${p.lon}`).join('|');
    if (signature && signature !== fittedRef.current) {
      fittedRef.current = signature;
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
      }
    }
  }, [points, theme, colorExtent, sizeExtent, colorLabel, sizeLabel]);

  // Restyle on selection change without rebuilding every marker.
  useEffect(() => {
    for (const [rowIndex, marker] of markersRef.current) {
      const isSelected = rowIndex === selectedRow;
      marker.setStyle({
        color: isSelected ? theme.selection : theme.surface,
        weight: isSelected ? SELECTED_RING_WEIGHT : RING_WEIGHT,
      });
      if (isSelected) marker.bringToFront();
    }
  }, [selectedRow, theme, points]);

  return <div ref={containerRef} className="map-canvas" aria-label="Map of plotted rows" />;
}
