import { useEffect, useMemo, useState } from 'react';
import {
  client,
  useConfig,
  useElementColumns,
  useElementData,
} from '@sigmacomputing/plugin';
import { buildModel, countryView, kpis, type RawRow } from './model.ts';
import { DARK, DEFAULT_COUNTRY, LIGHT, assignScenarioColors, cssVars } from './theme.ts';
import Header from './Header.tsx';
import KpiCards from './KpiCards.tsx';
import GlidePath from './GlidePath.tsx';
import Scorecard from './Scorecard.tsx';

const colText = (name: string, label: string, description?: string, optional = false) => ({
  name,
  type: 'column' as const,
  source: 'source',
  allowMultiple: false,
  allowedTypes: ['text' as const],
  label: optional ? `${label} (optional)` : label,
  description,
});
const colNum = (name: string, label: string, description?: string, optional = false) => ({
  name,
  type: 'column' as const,
  source: 'source',
  allowMultiple: false,
  allowedTypes: ['number' as const, 'integer' as const],
  label: optional ? `${label} (optional)` : label,
  description,
});

client.config.configureEditorPanel([
  { name: 'source', type: 'element', label: 'scenario_results (joined to scenarios)' },
  colText('run_id', 'run_id'),
  colText('scenario_id', 'scenario_id'),
  colText('scenario_name', 'scenario_name'),
  colNum('year', 'year'),
  colText('country', 'country'),
  colText('ingredient', 'ingredient'),
  colText('metric', 'metric'),
  colNum('p10', 'p10'),
  colNum('p50', 'p50'),
  colNum('p90', 'p90'),
  colNum('sort_order', 'sort_order', 'From dim_plant. Controls country chip order.', true),
  colNum('volume_mhl', 'volume_mhl', 'Million hl. Enables the kt figure in the status line.', true),
]);

const REQUIRED = [
  'run_id', 'scenario_id', 'scenario_name', 'year',
  'country', 'ingredient', 'metric', 'p10', 'p50', 'p90',
] as const;

function useIsDark(): boolean {
  const mq = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia?.(mq).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(mq);
    if (!m) return;
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return dark;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const numOrNull = (v: unknown) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function App() {
  const config = useConfig() as Record<string, string | undefined>;
  const data = useElementData(config.source || '');
  const columns = useElementColumns(config.source || '');
  const dark = useIsDark();
  const palette = dark ? DARK : LIGHT;

  const [scenarioPick, setScenarioPick] = useState<string | null>(null);
  const [countryPick, setCountryPick] = useState<string | null>(null);

  const mapped = REQUIRED.every((k) => !!config[k]);
  const rowCount = mapped ? data?.[config.run_id!]?.length ?? 0 : 0;

  const model = useMemo(() => {
    if (!mapped || rowCount === 0) return null;
    const col = (k: string) => (config[k] ? data[config[k]!] : undefined);
    const c = Object.fromEntries(
      [...REQUIRED, 'sort_order', 'volume_mhl'].map((k) => [k, col(k)]),
    ) as Record<string, unknown[] | undefined>;
    const rows: RawRow[] = [];
    for (let i = 0; i < rowCount; i++) {
      rows.push({
        run_id: str(c.run_id![i]),
        scenario_id: str(c.scenario_id![i]),
        scenario_name: str(c.scenario_name![i]),
        year: Number(c.year![i]),
        country: str(c.country![i]),
        ingredient: str(c.ingredient![i]),
        metric: str(c.metric![i]),
        p10: numOrNull(c.p10![i]),
        p50: numOrNull(c.p50![i]),
        p90: numOrNull(c.p90![i]),
        sort_order: c.sort_order ? numOrNull(c.sort_order[i]) : null,
        volume_mhl: c.volume_mhl ? numOrNull(c.volume_mhl[i]) : null,
      });
    }
    return buildModel(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns, mapped, rowCount, ...REQUIRED.map((k) => config[k]), config.sort_order, config.volume_mhl]);

  const wrap = (children: React.ReactNode) => (
    <div className="nz" style={cssVars(palette) as React.CSSProperties}>
      {children}
    </div>
  );
  const placeholder = (text: string) => wrap(<div className="nz-placeholder">{text}</div>);

  if (!config.source) return placeholder('Select the scenario_results element in the editor panel.');
  if (!mapped) return placeholder('Map all required columns in the editor panel.');
  if (!model) return placeholder('Loading data…');
  if (model.baselineState === 'missing') return placeholder('Run the baseline (S0) first');
  if (model.baselineState === 'incomplete') return placeholder('The baseline (S0) run is still being written…');
  if (model.scenarios.length === 0 || model.countries.length === 0) {
    return placeholder('No scenario results yet. Run a scenario to compare it with the baseline.');
  }

  // Default = highest-numbered scenario / Brazil; fall back if a pick disappears.
  const scenario =
    model.scenarios.find((s) => s.id === scenarioPick) ?? model.scenarios[model.scenarios.length - 1];
  const country =
    model.countries.find((c) => c === countryPick) ??
    model.countries.find((c) => c.replace(/_/g, ' ') === DEFAULT_COUNTRY) ??
    model.countries[0];

  const scenarioColor = assignScenarioColors(model.scenarios.map((s) => s.id), dark)[scenario.id];
  const views = model.countries.map((c) => countryView(model, scenario, c));
  const selectedView = views.find((v) => v.country === country)!;

  return wrap(
    <>
      <Header scenarios={model.scenarios} selectedId={scenario.id} onSelect={setScenarioPick} />
      <KpiCards k={kpis(model, scenario)} />
      <GlidePath
        view={selectedView}
        scenario={scenario}
        scenarioColor={scenarioColor}
        countries={model.countries}
        selected={country}
        onSelect={setCountryPick}
        palette={palette}
      />
      <Scorecard views={views} selected={country} onSelect={setCountryPick} />
    </>,
  );
}
