/**
 * Dev harness — renders the map against fixture data without a Sigma workbook.
 *
 * It deliberately does NOT import `src/App.tsx`: that module calls
 * `configureEditorPanel` at load time, which only works inside Sigma's iframe.
 * The shell below stands in for it so the visual pieces can be checked in a
 * plain browser. Vite's production build only takes the root `index.html`, so
 * nothing here ships.
 */
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/theme.css';
import { GoogleMap } from '../src/components/GoogleMap';
import { Legend } from '../src/components/Legend';
import { TableView } from '../src/components/TableView';
import { themeFor } from '../src/lib/palette';
import { buildTerritoryScale } from '../src/lib/territories';
import { buildPoints } from '../src/lib/rows';
import { mapStyleFor, MAP_STYLE_NAMES } from '../src/lib/mapStyles';
import mock from './mockData.json';
import type { SigmaData } from '../src/types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

function Harness() {
  const [mapStyle, setMapStyle] = useState<string>('Light');
  const [view, setView] = useState<'map' | 'table'>('map');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [territoryCap, setTerritoryCap] = useState<number>(99);

  const theme = themeFor(mapStyleFor(mapStyle).mode);

  const { points } = useMemo(() => {
    const built = buildPoints({
      data: mock.data as SigmaData,
      latColumn: 'col-lat',
      lngColumn: 'col-lng',
      nameColumn: 'col-name',
      territoryColumn: 'col-territory',
    });
    // Lets the harness force the ≤3-territory (colour-only) path for comparison.
    const allowed = [...new Set(built.points.map((p) => p.territory))].sort().slice(0, territoryCap);
    return {
      points: built.points.map((p) =>
        allowed.includes(p.territory) ? p : { ...p, territory: allowed[0] ?? '' },
      ),
    };
  }, [territoryCap]);

  const scale = useMemo(() => buildTerritoryScale(points, theme), [points, theme]);

  return (
    <div className="plugin-root" style={{ background: theme.plane, color: theme.textPrimary }}>
      <header className="toolbar" style={{ borderColor: theme.border }}>
        <span className="row-count" style={{ color: theme.textSecondary }}>
          {points.length} locations · {scale.entries.length} territories
          {scale.needsBadges ? ' · badges on' : ' · colour only'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={territoryCap} onChange={(e) => setTerritoryCap(Number(e.target.value))}>
            <option value={99}>All territories</option>
            <option value={3}>Cap at 3</option>
          </select>
          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
            {MAP_STYLE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="view-switch" style={{ borderColor: theme.border }}>
            {(['map', 'table'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                style={{
                  color: view === option ? theme.textPrimary : theme.textMuted,
                  background: view === option ? theme.surface : 'transparent',
                }}
              >
                {option === 'map' ? 'Map' : 'Table'}
              </button>
            ))}
          </div>
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
              mapStyle={mapStyle}
              nameLabel="Name"
              territoryLabel="Territory"
              selectedRow={selectedRow}
              onSelect={setSelectedRow}
            />
            <Legend theme={theme} scale={scale} title="Territory" />
          </>
        ) : (
          <TableView
            points={points}
            theme={theme}
            scale={scale}
            nameHeader="Name"
            territoryHeader="Territory"
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
          />
        )}
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  );
}
