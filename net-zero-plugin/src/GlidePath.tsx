import { useMemo } from 'react';
import {
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { CountryView, ScenarioData } from './model.ts';
import { LAST_INPUT_YEAR, label, round2 } from './model.ts';
import { fmtGap } from './format.ts';
import { scenarioLabel } from './Header.tsx';
import {
  ABOVE_FILL_OPACITY,
  BAND_OPACITY,
  CHART_HEIGHT,
  hexToRgba,
  type Palette,
} from './theme.ts';

ChartJS.register(Filler, LinearScale, LineElement, PointElement, Tooltip);

interface Props {
  view: CountryView;
  scenario: ScenarioData;
  scenarioColor: string;
  countries: string[];
  selected: string;
  onSelect: (c: string) => void;
  palette: Palette;
}

const pts = (years: number[], vals: (number | null)[]) =>
  years.map((x, i) => ({ x, y: vals[i] as number | null }));

export default function GlidePath({ view, scenario, scenarioColor, countries, selected, onSelect, palette: p }: Props) {
  const scColor = scenarioColor;

  const data = useMemo(() => {
    const common = { clip: false as const, spanGaps: false };
    const datasets: any[] = [
      {
        ...common,
        label: 'Net zero pathway',
        data: pts(view.years, view.pathway),
        borderColor: p.pathway,
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 3,
        tip: 0,
      },
      {
        ...common,
        label: 'Baseline',
        data: pts(view.years, view.baseline),
        borderColor: p.ink,
        backgroundColor: p.ink,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        order: 2,
        tip: 1,
      },
    ];
    if (view.hasScenario) {
      datasets.push(
        {
          ...common,
          label: 'p10',
          data: pts(view.years, view.scenario.map((b) => b?.p10 ?? null)),
          borderWidth: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          order: 5,
        },
        {
          ...common,
          label: 'p90',
          data: pts(view.years, view.scenario.map((b) => b?.p90 ?? null)),
          borderWidth: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 2, // down to the p10 dataset
          backgroundColor: hexToRgba(scColor, BAND_OPACITY),
          order: 5,
        },
        {
          ...common,
          label: scenarioLabel(scenario),
          data: pts(view.years, view.scenario.map((b) => b?.p50 ?? null)),
          borderColor: scColor,
          backgroundColor: scColor,
          borderWidth: 2.5,
          pointRadius: 3.5,
          pointHoverRadius: 4.5,
          // red wedge only where the scenario sits ABOVE the pathway (dataset 0)
          fill: { target: 0, above: hexToRgba(p.aboveFill, ABOVE_FILL_OPACITY), below: 'transparent' },
          order: 1,
          tip: 2,
        },
      );
    }
    return { datasets };
  }, [view, scenario, scColor, p]);

  // Dotted divider between the last input year and the first projected year.
  const divider = useMemo<Plugin<'line'>>(
    () => ({
      id: 'inputProjectionDivider',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const x = scales.x.getPixelForValue(LAST_INPUT_YEAR + 0.5);
        ctx.save();
        ctx.strokeStyle = p.muted;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = p.muted;
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText('Inputs', x - 6, chartArea.top + 6);
        ctx.textAlign = 'left';
        ctx.fillText('Projection', x + 6, chartArea.top + 6);
        ctx.restore();
      },
    }),
    [p],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { right: 8, top: 4 } },
      interaction: { mode: 'index', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'linear',
          min: view.years[0],
          max: view.years[view.years.length - 1],
          grid: { display: false },
          border: { color: p.grid },
          ticks: { stepSize: 2, color: p.muted, font: { size: 12 }, callback: (v) => String(v) },
        },
        y: {
          beginAtZero: true,
          grid: { color: p.grid },
          border: { display: false },
          title: { display: true, text: 'kg CO₂e per hl', color: p.muted, font: { size: 11, weight: 'normal' } },
          ticks: { color: p.muted, font: { size: 12 }, callback: (v) => `${v} kg` },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item) => (item.dataset as any).tip !== undefined,
          itemSort: (a, b) => (a.dataset as any).tip - (b.dataset as any).tip,
          callbacks: {
            title: (items) => String(items[0]?.parsed.x ?? ''),
            label: (item) => `${item.dataset.label}: ${(item.parsed.y as number).toFixed(2)} kg/hl`,
            labelColor: (item) => {
              const c = (item.dataset.borderColor as string) ?? p.ink;
              return { borderColor: c, backgroundColor: c };
            },
          },
        },
      },
    }),
    [view.years, p],
  );

  return (
    <>
      <div className="gp-head">
        <h2>{label(selected)} · glide path to 2040</h2>
        <div className="chips" role="group" aria-label="Country">
          {countries.map((c) => (
            <button key={c} aria-pressed={c === selected} onClick={() => onSelect(c)}>
              {label(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        <span>
          <i className="sw-dash" style={{ borderColor: p.pathway }} />
          Net zero pathway (−90% by 2040 + removals)
        </span>
        <span>
          <i className="sw-line" style={{ borderColor: p.ink }} />
          Baseline
        </span>
        {view.hasScenario && (
          <>
            <span>
              <i className="sw-line" style={{ borderColor: scColor, borderTopWidth: 3 }} />
              {scenarioLabel(scenario)}
            </span>
            <span>
              <i className="sw-box" style={{ background: hexToRgba(scColor, BAND_OPACITY * 2) }} />
              P10–P90
            </span>
            <span>
              <i className="sw-box" style={{ background: hexToRgba(p.aboveFill, ABOVE_FILL_OPACITY * 1.5) }} />
              Above pathway
            </span>
          </>
        )}
      </div>

      <div className="chart-wrap" style={{ height: CHART_HEIGHT }}>
        <Line data={data as any} options={options} plugins={[divider]} />
      </div>

      <StatusLine view={view} />
    </>
  );
}

function StatusLine({ view }: { view: CountryView }) {
  if (!view.hasScenario || view.gap2040 === null) {
    return <p className="status-line rest" style={{ color: 'var(--muted)' }}>No scenario results for this country.</p>;
  }
  if (view.firstAbove === null) {
    const h = round2(view.headroom2040 ?? 0);
    return (
      <p className="status-line good">
        Stays on or below the pathway through 2040 · 2040 headroom {h.toFixed(2)} kg/hl
      </p>
    );
  }
  const gap = fmtGap(view.gap2040);
  const kt = view.gapKt !== null && round2(view.gap2040) > 0 ? ` (${Math.round(view.gapKt).toLocaleString('en-US')} kt)` : '';
  const base =
    view.baseFirstAbove === null ? 'baseline stays on the pathway' : `baseline drifts in ${view.baseFirstAbove}`;
  return (
    <p className="status-line">
      <span className="bad">Drifts above the pathway in {view.firstAbove}</span>
      <span className="rest">
        {' '}
        · 2040 gap {gap} kg/hl{kt} · {base}
      </span>
    </p>
  );
}
