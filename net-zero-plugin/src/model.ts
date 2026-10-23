// Pure data logic: raw Sigma rows -> scenario/country view models.
// No React or Sigma imports so it can be unit-tested with plain node.

export const YEARS: number[] = Array.from({ length: 15 }, (_, i) => 2026 + i);
export const LAST_INPUT_YEAR = 2030;
export const BASELINE_ID = 'S0';
export const ALL = 'All';

export interface RawRow {
  run_id: string;
  scenario_id: string;
  scenario_name: string;
  chart_color: string;
  year: number;
  country: string;
  ingredient: string;
  metric: string;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  sort_order: number | null;
  volume_mhl: number | null;
}

export interface Band {
  p10: number | null;
  p50: number;
  p90: number | null;
}

export interface ScenarioData {
  id: string;
  name: string; // display name, spaces instead of underscores
  color: string;
  num: number;
  runId: string;
  intensity: Record<string, Record<number, Band>>; // country -> year -> band
  target: Record<string, Record<number, number>>;
  prob: Record<string, number>; // 0-1
  emissions: Record<number, number>; // company total, kt
  volume2040: Record<string, number>; // million hl
}

export interface Model {
  countries: string[]; // raw keys, display order
  baseline: ScenarioData | null;
  baselineState: 'ok' | 'missing' | 'incomplete';
  scenarios: ScenarioData[]; // non-baseline, complete, sorted by number
}

export type Status = 'on' | 'risk' | 'off';

const METRICS = new Set([
  'intensity_kg_per_hl',
  'target_intensity_kg_per_hl',
  'prob_net_zero_2040',
  'emissions_kt',
]);

const DEFAULT_COUNTRY_ORDER = ['Argentina', 'Bolivia', 'Brazil', 'United States', 'Belgium'];

export const label = (s: string): string => s.replace(/_/g, ' ');
export const round2 = (x: number): number => Math.round(x * 100) / 100 + 0; // + 0 turns -0 into 0
export const scenarioNum = (id: string): number => {
  const m = /(\d+)/.exec(id);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
};

export function statusFromProb(p: number): Status {
  if (p >= 0.6) return 'on';
  if (p >= 0.3) return 'risk';
  return 'off';
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function buildModel(rows: RawRow[]): Model {
  // Rule 1: per scenario keep only rows from its latest run_id (max string).
  const latest = new Map<string, string>();
  for (const r of rows) {
    if (!r.scenario_id) continue;
    const cur = latest.get(r.scenario_id);
    if (cur === undefined || r.run_id > cur) latest.set(r.scenario_id, r.run_id);
  }
  const kept = rows.filter(
    (r) =>
      r.scenario_id &&
      latest.get(r.scenario_id) === r.run_id &&
      r.ingredient === ALL &&
      METRICS.has(r.metric) &&
      Number.isFinite(r.year),
  );

  // Rule 2: countries = distinct values except All.
  const sortOrder = new Map<string, number>();
  const countrySet = new Set<string>();
  for (const r of kept) {
    if (!r.country || r.country === ALL) continue;
    countrySet.add(r.country);
    if (r.sort_order !== null) {
      const cur = sortOrder.get(r.country);
      if (cur === undefined || r.sort_order < cur) sortOrder.set(r.country, r.sort_order);
    }
  }
  const rank = (c: string) => {
    const i = DEFAULT_COUNTRY_ORDER.indexOf(label(c));
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  const countries = [...countrySet].sort((a, b) => {
    if (sortOrder.size > 0) {
      const d = (sortOrder.get(a) ?? Infinity) - (sortOrder.get(b) ?? Infinity);
      if (d !== 0 && !Number.isNaN(d)) return d;
    }
    const d = rank(a) - rank(b);
    if (d !== 0 && !Number.isNaN(d)) return d;
    return label(a).localeCompare(label(b));
  });

  const byScenario = new Map<string, ScenarioData>();
  for (const r of kept) {
    let s = byScenario.get(r.scenario_id);
    if (!s) {
      s = {
        id: r.scenario_id,
        name: label(r.scenario_name || ''),
        color: r.chart_color || '',
        num: scenarioNum(r.scenario_id),
        runId: r.run_id,
        intensity: {},
        target: {},
        prob: {},
        emissions: {},
        volume2040: {},
      };
      byScenario.set(r.scenario_id, s);
    }
    if (!s.name && r.scenario_name) s.name = label(r.scenario_name);
    if (!s.color && r.chart_color) s.color = r.chart_color;
    const p50 = r.p50;
    if (p50 === null) continue;
    if (r.metric === 'emissions_kt') {
      if (r.country === ALL) s.emissions[r.year] = p50;
      continue;
    }
    if (r.country === ALL) continue;
    if (r.metric === 'intensity_kg_per_hl') {
      (s.intensity[r.country] ??= {})[r.year] = { p10: r.p10, p50, p90: r.p90 };
      if (r.year === 2040 && r.volume_mhl !== null) s.volume2040[r.country] = r.volume_mhl;
    } else if (r.metric === 'target_intensity_kg_per_hl') {
      (s.target[r.country] ??= {})[r.year] = p50;
    } else if (r.metric === 'prob_net_zero_2040' && r.year === 2040) {
      s.prob[r.country] = p50;
    }
  }

  // Partially written run: any country with some but not all 15 years of
  // intensity means the job is mid-write, so skip that scenario.
  const isComplete = (s: ScenarioData): boolean => {
    const present = Object.keys(s.intensity);
    if (present.length === 0) return false;
    return present.every((c) => YEARS.every((y) => s.intensity[c][y] !== undefined));
  };

  const base = byScenario.get(BASELINE_ID) ?? null;
  const baselineState: Model['baselineState'] = !base ? 'missing' : isComplete(base) ? 'ok' : 'incomplete';

  const scenarios = [...byScenario.values()]
    .filter((s) => s.id !== BASELINE_ID && isComplete(s))
    .sort((a, b) => a.num - b.num || a.id.localeCompare(b.id));

  return { countries, baseline: baselineState === 'ok' ? base : null, baselineState, scenarios };
}

// ---- per-country view --------------------------------------------------

export interface CountryView {
  country: string;
  hasScenario: boolean;
  years: number[];
  pathway: (number | null)[];
  baseline: (number | null)[];
  scenario: (Band | null)[]; // empty entries when the scenario lacks the country
  i2030: number | null;
  i2040: number | null;
  target2040: number | null;
  gap2040: number | null; // raw
  prob: number | null;
  baseProb: number | null;
  status: Status | null;
  firstAbove: number | null; // first year whose ROUNDED gap > 0
  baseFirstAbove: number | null;
  headroom2040: number | null; // target - intensity at 2040 (raw)
  gapKt: number | null; // gap x 2040 volume, only when volume is mapped
}

const firstYearAbove = (
  years: number[],
  inten: (number | null)[],
  target: (number | null)[],
): number | null => {
  for (let i = 0; i < years.length; i++) {
    const a = inten[i];
    const t = target[i];
    if (a === null || t === null) continue;
    if (round2(a - t) > 0) return years[i];
  }
  return null;
};

export function countryView(model: Model, scenario: ScenarioData, country: string): CountryView {
  const base = model.baseline!;
  const has = !!scenario.intensity[country];
  const targetSrc = scenario.target[country] ?? base.target[country] ?? {};
  const pathway = YEARS.map((y) => targetSrc[y] ?? null);
  const baseline = YEARS.map((y) => base.intensity[country]?.[y]?.p50 ?? null);
  const scen = YEARS.map((y) => (has ? scenario.intensity[country][y] ?? null : null));
  const scenP50 = scen.map((b) => b?.p50 ?? null);

  const at = (arr: (number | null)[], year: number) => arr[YEARS.indexOf(year)] ?? null;
  const i2040 = at(scenP50, 2040);
  const target2040 = at(pathway, 2040);
  const gap2040 = i2040 !== null && target2040 !== null ? i2040 - target2040 : null;
  const prob = has ? scenario.prob[country] ?? null : null;
  const volume = scenario.volume2040[country] ?? base.volume2040[country];

  return {
    country,
    hasScenario: has,
    years: YEARS,
    pathway,
    baseline,
    scenario: scen,
    i2030: at(scenP50, 2030),
    i2040,
    target2040,
    gap2040,
    prob,
    baseProb: base.prob[country] ?? null,
    status: prob === null ? null : statusFromProb(prob),
    firstAbove: has ? firstYearAbove(YEARS, scenP50, pathway) : null,
    baseFirstAbove: firstYearAbove(YEARS, baseline, pathway),
    headroom2040: gap2040 === null ? null : -gap2040,
    gapKt: gap2040 !== null && volume !== undefined ? gap2040 * volume : null,
  };
}

// ---- KPIs --------------------------------------------------------------

export interface Kpis {
  onTrack: number;
  baseOnTrack: number;
  total: number;
  em2030: number | null;
  baseEm2030: number | null;
  em2040: number | null;
  baseEm2040: number | null;
}

const countOnTrack = (s: ScenarioData, countries: string[]) =>
  countries.filter((c) => (s.prob[c] ?? -1) >= 0.6).length;

export function kpis(model: Model, s: ScenarioData): Kpis {
  const b = model.baseline!;
  return {
    onTrack: countOnTrack(s, model.countries),
    baseOnTrack: countOnTrack(b, model.countries),
    total: model.countries.length,
    em2030: s.emissions[2030] ?? null,
    baseEm2030: b.emissions[2030] ?? null,
    em2040: s.emissions[2040] ?? null,
    baseEm2040: b.emissions[2040] ?? null,
  };
}
