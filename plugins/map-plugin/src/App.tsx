import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  client,
  useActionEffect,
  useActionTrigger,
  useConfig,
  useElementColumns,
  useElementData,
  useVariable,
} from '@sigmacomputing/plugin';
import { MapView } from './components/MapView';
import { Legend } from './components/Legend';
import { TableView } from './components/TableView';
import { EmptyState } from './components/EmptyState';
import { BASEMAP_NAMES, DEFAULT_BASEMAP, basemapFor } from './lib/basemaps';
import { themeFor } from './lib/palette';
import { extentOf } from './lib/scales';
import { asColumnList, buildPoints, columnName } from './lib/rows';
import type { MapPoint, PluginConfig, SigmaColumns, SigmaData } from './types';

// The editor panel must be declared once, at module load, before anything renders.
client.config.configureEditorPanel([
  { name: 'source', type: 'element' },
  {
    name: 'latitude',
    type: 'column',
    source: 'source',
    allowedTypes: ['number', 'integer'],
    label: 'Latitude',
  },
  {
    name: 'longitude',
    type: 'column',
    source: 'source',
    allowedTypes: ['number', 'integer'],
    label: 'Longitude',
  },
  {
    name: 'label',
    type: 'column',
    source: 'source',
    allowedTypes: ['text'],
    label: 'Marker label',
  },
  {
    name: 'colorBy',
    type: 'column',
    source: 'source',
    allowedTypes: ['number', 'integer'],
    label: 'Colour by (optional)',
  },
  {
    name: 'sizeBy',
    type: 'column',
    source: 'source',
    allowedTypes: ['number', 'integer'],
    label: 'Size by (optional)',
  },
  {
    name: 'details',
    type: 'column',
    source: 'source',
    allowMultiple: true,
    label: 'Popup details (optional)',
  },
  {
    name: 'keyColumn',
    type: 'column',
    source: 'source',
    label: 'Key column for writeback (optional)',
    description: 'Value written to the selected-value variable. Defaults to the marker label.',
  },
  {
    name: 'basemap',
    type: 'dropdown',
    source: 'source',
    values: BASEMAP_NAMES,
    label: 'Basemap',
  },
  { name: 'selectedValue', type: 'variable', label: 'Selected value → variable' },
  { name: 'selectedLabel', type: 'variable', label: 'Selected label → variable' },
  { name: 'onSelect', type: 'action-trigger', label: 'On marker click' },
  { name: 'onReset', type: 'action-effect', label: 'Clear selection (from workbook)' },
]);

type View = 'map' | 'table';

export default function App() {
  const config = useConfig() as PluginConfig & { keyColumn?: string };
  const data = useElementData(config.source ?? '') as SigmaData;
  const columns = useElementColumns(config.source ?? '') as SigmaColumns;

  // Write-only: the workbook owns these variables once they are set.
  const [, setSelectedValue] = useVariable(config.selectedValue ?? '');
  const [, setSelectedLabel] = useVariable(config.selectedLabel ?? '');
  const triggerOnSelect = useActionTrigger(config.onSelect ?? '');

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [view, setView] = useState<View>('map');

  const basemap = basemapFor(config.basemap ?? DEFAULT_BASEMAP);
  const theme = themeFor(basemap.mode);

  const detailColumns = useMemo(() => asColumnList(config.details), [config.details]);

  const { points, skipped } = useMemo(() => {
    if (!config.source || !config.latitude || !config.longitude) {
      return { points: [] as MapPoint[], skipped: 0 };
    }
    return buildPoints({
      data,
      columns,
      latColumn: config.latitude,
      lonColumn: config.longitude,
      labelColumn: config.label,
      colorColumn: config.colorBy,
      sizeColumn: config.sizeBy,
      detailColumns,
    });
  }, [
    data,
    columns,
    config.source,
    config.latitude,
    config.longitude,
    config.label,
    config.colorBy,
    config.sizeBy,
    detailColumns,
  ]);

  const colorExtent = useMemo(
    () => (config.colorBy ? extentOf(points.map((p) => p.colorValue)) : null),
    [points, config.colorBy],
  );
  const sizeExtent = useMemo(
    () => (config.sizeBy ? extentOf(points.map((p) => p.sizeValue)) : null),
    [points, config.sizeBy],
  );

  const colorLabel = columnName(columns, config.colorBy);
  const sizeLabel = columnName(columns, config.sizeBy);
  const labelHeader = columnName(columns, config.label);

  const clearSelection = useCallback(async () => {
    setSelectedRow(null);
    if (config.selectedValue) await setSelectedValue('');
    if (config.selectedLabel) await setSelectedLabel('');
  }, [config.selectedValue, config.selectedLabel, setSelectedValue, setSelectedLabel]);

  // Lets a workbook action reset the plugin's selection.
  useActionEffect(config.onReset ?? '', () => {
    void clearSelection();
  });

  const handleSelect = useCallback(
    async (point: MapPoint) => {
      setSelectedRow(point.rowIndex);

      const keyColumn = config.keyColumn;
      const rawKey = keyColumn ? data[keyColumn]?.[point.rowIndex] : undefined;
      const value = rawKey === null || rawKey === undefined ? point.label : String(rawKey);

      // The variable carries what was selected; the action tells the workbook to react.
      if (config.selectedValue) await setSelectedValue(String(value));
      if (config.selectedLabel) await setSelectedLabel(String(point.label));
      if (triggerOnSelect) await triggerOnSelect();
    },
    [
      config.keyColumn,
      config.selectedValue,
      config.selectedLabel,
      data,
      setSelectedValue,
      setSelectedLabel,
      triggerOnSelect,
    ],
  );

  // Drop a stale selection when the underlying rows change.
  useEffect(() => {
    if (selectedRow === null) return;
    if (!points.some((p) => p.rowIndex === selectedRow)) setSelectedRow(null);
  }, [points, selectedRow]);

  useEffect(() => {
    client.setLoadingState(false);
  }, []);

  if (!config.source) {
    return (
      <EmptyState
        theme={theme}
        title="Choose a data source"
        steps={['Pick an element in the editor panel to plot its rows on a map.']}
      />
    );
  }

  if (!config.latitude || !config.longitude) {
    const missing: string[] = [];
    if (!config.latitude) missing.push('Select the Latitude column.');
    if (!config.longitude) missing.push('Select the Longitude column.');
    missing.push('Optionally set Marker label, Colour by, and Size by.');
    return <EmptyState theme={theme} title="Map the coordinate columns" steps={missing} />;
  }

  if (points.length === 0) {
    return (
      <EmptyState
        theme={theme}
        title="No rows to plot"
        steps={
          skipped > 0
            ? [
                `All ${skipped} rows were missing a usable latitude/longitude pair.`,
                'Check that the selected columns hold degrees, not formatted text.',
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
          {skipped > 0 && (
            <span style={{ color: theme.textMuted }}> · {skipped} without coordinates</span>
          )}
        </span>

        <div className="toolbar-right">
          {selectedRow !== null && (
            <button
              type="button"
              className="ghost-button"
              style={{ color: theme.textSecondary, borderColor: theme.border }}
              onClick={() => void clearSelection()}
            >
              Clear selection
            </button>
          )}
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
        </div>
      </header>

      <main className="stage">
        {view === 'map' ? (
          <>
            <MapView
              points={points}
              theme={theme}
              basemap={config.basemap}
              colorExtent={colorExtent}
              sizeExtent={sizeExtent}
              colorLabel={colorLabel}
              sizeLabel={sizeLabel}
              selectedRow={selectedRow}
              onSelect={(point) => void handleSelect(point)}
            />
            <Legend
              theme={theme}
              colorExtent={colorExtent}
              colorLabel={colorLabel}
              sizeExtent={sizeExtent}
              sizeLabel={sizeLabel}
            />
          </>
        ) : (
          <TableView
            points={points}
            theme={theme}
            colorExtent={colorExtent}
            colorLabel={colorLabel}
            sizeLabel={sizeLabel}
            labelHeader={labelHeader}
            selectedRow={selectedRow}
            onSelect={(point) => void handleSelect(point)}
          />
        )}
      </main>
    </div>
  );
}
