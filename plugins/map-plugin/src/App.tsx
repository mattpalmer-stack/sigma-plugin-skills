import { useEffect, useMemo, useState } from 'react';
import { client, useConfig, useElementColumns, useElementData } from '@sigmacomputing/plugin';
import { GoogleMap } from './components/GoogleMap';
import { Legend } from './components/Legend';
import { TableView } from './components/TableView';
import { EmptyState } from './components/EmptyState';
import { DEFAULT_MAP_STYLE, MAP_STYLE_NAMES, mapStyleFor } from './lib/mapStyles';
import { themeFor } from './lib/palette';
import { buildTerritoryScale } from './lib/territories';
import { buildPoints, columnName } from './lib/rows';
import type { MapPoint, PluginConfig, SigmaColumns, SigmaData } from './types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

// The editor panel must be declared once, at module load, before anything renders.
client.config.configureEditorPanel([
  { name: 'source', type: 'element' },
  {
    name: 'latitude',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['number', 'integer'],
    label: 'Latitude',
  },
  {
    name: 'longitude',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['number', 'integer'],
    label: 'Longitude',
  },
  {
    name: 'restaurantName',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['text'],
    label: 'Restaurant name',
  },
  {
    name: 'territory',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['text'],
    label: 'Territory name',
  },
  {
    name: 'mapStyle',
    type: 'dropdown',
    source: 'source',
    values: MAP_STYLE_NAMES,
    defaultValue: DEFAULT_MAP_STYLE,
    label: 'Map style',
  },
]);

type View = 'map' | 'table';

export default function App() {
  const config = useConfig() as PluginConfig;
  const data = useElementData(config.source ?? '') as SigmaData;
  const columns = useElementColumns(config.source ?? '') as SigmaColumns;

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [view, setView] = useState<View>('map');

  const theme = themeFor(mapStyleFor(config.mapStyle).mode);

  const { points, skipped } = useMemo(() => {
    if (!config.source || !config.latitude || !config.longitude) {
      return { points: [] as MapPoint[], skipped: 0 };
    }
    return buildPoints({
      data,
      latColumn: config.latitude,
      lngColumn: config.longitude,
      nameColumn: config.restaurantName,
      territoryColumn: config.territory,
    });
  }, [data, config.source, config.latitude, config.longitude, config.restaurantName, config.territory]);

  const scale = useMemo(() => buildTerritoryScale(points, theme), [points, theme]);

  const nameHeader = columnName(columns, config.restaurantName);
  const territoryHeader = columnName(columns, config.territory);

  // Drop a stale selection when the underlying rows change.
  useEffect(() => {
    if (selectedRow === null) return;
    if (!points.some((p) => p.rowIndex === selectedRow)) setSelectedRow(null);
  }, [points, selectedRow]);

  if (!API_KEY) {
    return (
      <EmptyState
        theme={theme}
        title="Google Maps API key missing"
        steps={[
          'Set VITE_GOOGLE_MAPS_API_KEY in the build environment.',
          'Rebuild and redeploy — the key is read at build time, not at runtime.',
        ]}
      />
    );
  }

  if (!config.source) {
    return (
      <EmptyState
        theme={theme}
        title="Choose a data source"
        steps={['Pick an element in the editor panel to plot its rows on the map.']}
      />
    );
  }

  if (!config.latitude || !config.longitude) {
    const missing: string[] = [];
    if (!config.latitude) missing.push('Select the Latitude column.');
    if (!config.longitude) missing.push('Select the Longitude column.');
    missing.push('Then pick the Restaurant name and Territory name columns.');
    return <EmptyState theme={theme} title="Map the coordinate columns" steps={missing} />;
  }

  if (points.length === 0) {
    return (
      <EmptyState
        theme={theme}
        title="No locations to plot"
        steps={
          skipped > 0
            ? [
                `All ${skipped} rows were missing a usable latitude/longitude pair.`,
                'Check that the selected columns hold numeric degrees, not formatted text.',
              ]
            : ['The selected element returned no rows.']
        }
      />
    );
  }

  return (
    <div className="plugin-root" style={{ background: theme.plane, color: theme.textPrimary }}>
      <header className="toolbar" style={{ borderColor: theme.border }}>
        <span className="row-count" style={{ color: theme.textSecondary }}>
          {points.length.toLocaleString()} {points.length === 1 ? 'location' : 'locations'}
          {scale.entries.length > 0 && (
            <span style={{ color: theme.textMuted }}>
              {' · '}
              {scale.entries.length} {scale.entries.length === 1 ? 'territory' : 'territories'}
            </span>
          )}
          {skipped > 0 && (
            <span style={{ color: theme.textMuted }}> · {skipped} without coordinates</span>
          )}
        </span>

        <div className="view-switch" style={{ borderColor: theme.border }}>
          {(['map', 'table'] as View[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              style={{
                color: view === option ? theme.textPrimary : theme.textMuted,
                background: view === option ? theme.surface : 'transparent',
              }}
            >
              {option === 'map' ? 'Map' : 'Table'}
            </button>
          ))}
        </div>
      </header>

      <main className="stage">
        {view === 'map' ? (
          <>
            <GoogleMap
              apiKey={API_KEY}
              points={points}
              theme={theme}
              scale={scale}
              mapStyle={config.mapStyle}
              nameLabel={nameHeader}
              territoryLabel={territoryHeader}
              selectedRow={selectedRow}
              onSelect={setSelectedRow}
            />
            <Legend theme={theme} scale={scale} title={territoryHeader || 'Territory'} />
          </>
        ) : (
          <TableView
            points={points}
            theme={theme}
            scale={scale}
            nameHeader={nameHeader}
            territoryHeader={territoryHeader}
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
          />
        )}
      </main>
    </div>
  );
}
