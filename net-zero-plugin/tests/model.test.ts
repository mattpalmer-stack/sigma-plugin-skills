import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModel, countryView, kpis, round2, statusFromProb, YEARS, type RawRow } from '../src/model.ts';
import { fmtGap } from '../src/format.ts';

const COUNTRIES = ['Argentina', 'Bolivia', 'Brazil', 'United_States', 'Belgium'];
const base = { ingredient: 'All', p10: null, p90: null, sort_order: null, volume_mhl: null };

function row(o: Partial<RawRow> & Pick<RawRow, 'scenario_id' | 'metric' | 'year' | 'country' | 'p50'>, run = 'r_20261015_100000'): RawRow {
  return {
    ...base,
    run_id: `${run}_${o.scenario_id}`,
    scenario_name: o.scenario_id === 'S0' ? 'Baseline' : 'Adjunct_swap',
    ...o,
  } as RawRow;
}

// per-scenario Brazil 2040 intensity + probs, other countries fixed
function seed(sid: string, brazil2040: number, probs: Record<string, number>, em: [number, number], run?: string) {
  const out: RawRow[] = [];
  for (const c of COUNTRIES) {
    for (const y of YEARS) {
      const end = c === 'Brazil' ? brazil2040 : 2.0;
      const v = 12 - ((12 - end) * (y - 2026)) / 14;
      out.push(row({ scenario_id: sid, metric: 'intensity_kg_per_hl', year: y, country: c, p50: v, p10: v - 0.2, p90: v + 0.2, volume_mhl: 15 }, run));
      out.push(row({ scenario_id: sid, metric: 'target_intensity_kg_per_hl', year: y, country: c, p50: c === 'Brazil' ? 1.47 + (2040 - y) * 0.5 : 1 }, run));
    }
    out.push(row({ scenario_id: sid, metric: 'prob_net_zero_2040', year: 2040, country: c, p50: probs[c] ?? 0.1 }, run));
  }
  out.push(row({ scenario_id: sid, metric: 'emissions_kt', year: 2030, country: 'All', p50: em[0] }, run));
  out.push(row({ scenario_id: sid, metric: 'emissions_kt', year: 2040, country: 'All', p50: em[1] }, run));
  return out;
}

const rows = [
  ...seed('S0', 1.61, { Belgium: 0.74, Brazil: 0.33 }, [1665.5, 403.9]),
  ...seed('S1', 1.4701, { Belgium: 0.74, Brazil: 0.51 }, [1541.4, 374.1]),
  ...seed('S2', 1.39, { Belgium: 0.74, Brazil: 0.603 }, [1465.0, 355.8]),
];

test('scenarios, order and KPI acceptance numbers', () => {
  const m = buildModel(rows);
  assert.equal(m.baselineState, 'ok');
  assert.deepEqual(m.scenarios.map((s) => s.id), ['S1', 'S2']);
  assert.deepEqual(m.countries, ['Argentina', 'Bolivia', 'Brazil', 'United_States', 'Belgium']);
  const [s1, s2] = m.scenarios;
  assert.deepEqual([kpis(m, m.baseline!).onTrack, kpis(m, s1).onTrack, kpis(m, s2).onTrack], [1, 1, 2]);
  const k = kpis(m, s1);
  assert.equal(Math.round(k.em2030! - k.baseEm2030!), -124);
  assert.equal(Math.round(k.em2040! - k.baseEm2040!), -30);
});

test('Brazil gaps and rounding', () => {
  const m = buildModel(rows);
  const [s1, s2] = m.scenarios;
  const b0 = countryView(m, m.baseline!, 'Brazil');
  assert.equal(round2(b0.gap2040!), 0.14);
  assert.equal(b0.status, 'risk');
  const v1 = countryView(m, s1, 'Brazil');
  assert.equal(fmtGap(v1.gap2040), '0.00');
  assert.equal(v1.status, 'risk'); // 51%
  const v2 = countryView(m, s2, 'Brazil');
  assert.equal(fmtGap(v2.gap2040), '−0.08');
  assert.equal(v2.status, 'on');
  assert.equal(v2.gapKt, v2.gap2040! * 15);
});

test('latest run per scenario only; partial runs skipped', () => {
  const newer = seed('S1', 3, {}, [1, 1], 'r_20261016_090000');
  const partial = newer.filter((r) => !(r.country === 'Belgium' && r.year > 2035 && r.metric === 'intensity_kg_per_hl'));
  const m = buildModel([...rows, ...partial]);
  assert.deepEqual(m.scenarios.map((s) => s.id), ['S2']); // S1's latest run is incomplete
  const m2 = buildModel([...rows, ...newer]);
  assert.equal(m2.scenarios[0].runId, 'r_20261016_090000_S1');
});

test('missing baseline', () => {
  const m = buildModel(rows.filter((r) => r.scenario_id !== 'S0'));
  assert.equal(m.baselineState, 'missing');
});

test('status thresholds and sort_order', () => {
  assert.deepEqual([0.6, 0.599, 0.3, 0.29].map(statusFromProb), ['on', 'risk', 'risk', 'off']);
  const so = rows.map((r) => ({ ...r, sort_order: r.country === 'Belgium' ? 1 : r.country === 'Argentina' ? 2 : 5 }));
  assert.equal(buildModel(so).countries[0], 'Belgium');
});
