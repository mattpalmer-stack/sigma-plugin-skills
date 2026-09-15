/**
 * Dev harness — renders the map against fixture data without a Sigma workbook.
 *
 * It deliberately does NOT import `src/App.tsx`: that module calls
 * `configureEditorPanel` at load time, which only works inside Sigma's iframe.
 * The shell below stands in for it so the visual pieces can be checked in a
 * plain browser. Vite's production build only takes the root `index.html`, so
 * nothing here ships.
 */
import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/theme.css';
import { GoogleMap, buildPopup } from '../src/components/GoogleMap';
import { Legend } from '../src/components/Legend';
import { TableView } from '../src/components/TableView';
import { themeFor } from '../src/lib/palette';
import { buildTerritoryScale } from '../src/lib/territories';
import { buildPoints } from '../src/lib/rows';
import { mapStyleFor, MAP_STYLE_NAMES } from '../src/lib/mapStyles';
import { formatterFor } from '../src/lib/format';
import mock from './mockData.json';
import type { MapPoint, SigmaColumns, SigmaData } from '../src/types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/**
 * Renders the real popup DOM outside Google Maps.
 *
 * The info window is the one surface that cannot be reached without the Maps
 * API loading, so previewing it here is the only way to check its layout,
 * number formatting, and the territory control.
 */
function PopupPreview(props: Parameters<typeof buildPopup>[0]) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren(buildPopup(props));
  });
  return (
    <div
      className="popup-preview"
      ref={hostRef}
      style={{ background: props.theme.surface, borderColor: props.theme.border }}
    />
  );
}

function Harness() {
  const [mapStyle, setMapStyle] = useState<string>('Light');
  const [view, setView] = useState<'map' | 'table'>('map');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [territoryCap, setTerritoryCap] = useState<number>(99);

  const theme = themeFor(mapStyleFor(mapStyle).mode);

  const { points } = useMemo(() => {
    const built = buildPoints({
      data: mock.data as SigmaData,
      latColumn: 'col-lat',
      lngColumn: 'col-lng',
      nameColumn: 'col-name',
      territoryColumn: 'col-territory',
      keyColumn: 'col-key',
      ytdColumn: 'col-ytd',
      pytdColumn: 'col-pytd',
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

  const columns = mock.columns as SigmaColumns;
  const labels = {
    name: 'Name',
    territory: 'Territory',
    ytd: 'YTD Sales',
    pytd: 'PYTD Sales',
    growth: 'Growth %',
  };
  const formatters = {
    ytd: formatterFor(columns['col-ytd']),
    pytd: formatterFor(columns['col-pytd']),
  };
  const territoryOptions = useMemo(
    () =>
      [...new Set(points.map((p) => p.territory.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [points],
  );
  // The harness has no workbook to write to, so it just reports the call.
  const [lastWrite, setLastWrite] = useState<string>('');
  const onTerritoryChange = (point: MapPoint, next: string) =>
    setLastWrite(`${point.key} → ${next}`);

  return (
    <div className="plugin-root" style={{ background: theme.plane, color: theme.textPrimary }}>
      <header className="toolbar" style={{ borderColor: theme.border }}>
        <span className="row-count" style={{ color: theme.textSecondary }}>
          {points.length} locations · {scale.entries.length} territories
          {scale.needsBadges ? ' · badges on' : ' · colour only'}
          {lastWrite && <span data-testid="last-write"> · wrote {lastWrite}</span>}
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
              labels={labels}
              formatters={formatters}
              territoryOptions={territoryOptions}
              writebackReady
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onTerritoryChange={onTerritoryChange}
            />
            <Legend theme={theme} scale={scale} title="Territory" />
            <div className="popup-preview-rail">
              {[0, 1].map((offset) => {
                const point = points[offset];
                return point ? (
                  <PopupPreview
                    key={point.rowIndex}
                    point={point}
                    theme={theme}
                    color={scale.styleFor(point.territory).color}
                    labels={labels}
                    formatters={formatters}
                    territoryOptions={territoryOptions}
                    writebackReady={offset === 0}
                    onTerritoryChange={onTerritoryChange}
                  />
                ) : null;
              })}
            </div>
          </>
        ) : (
          <TableView
            points={points}
            theme={theme}
            scale={scale}
            labels={labels}
            formatters={formatters}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
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
