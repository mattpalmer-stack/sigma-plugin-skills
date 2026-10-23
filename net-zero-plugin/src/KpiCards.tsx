import type { Kpis } from './model.ts';
import { fmtDeltaKt, fmtDeltaPct, fmtKt } from './format.ts';

function EmissionsCard({ title, value, base, showPct }: { title: string; value: number | null; base: number | null; showPct: boolean }) {
  let sub = 'baseline: —';
  let cls = '';
  if (value !== null && base !== null) {
    const d = value - base;
    sub = `${fmtDeltaKt(d)} vs baseline${showPct && base !== 0 ? ` (${fmtDeltaPct(d, base)})` : ''}`;
    cls = Math.round(d) < 0 ? 'good' : Math.round(d) > 0 ? 'bad' : '';
  }
  return (
    <div className="kpi">
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{fmtKt(value)}</div>
      <div className={`kpi-sub ${cls}`}>{sub}</div>
    </div>
  );
}

export default function KpiCards({ k }: { k: Kpis }) {
  const cls = k.onTrack > k.baseOnTrack ? 'good' : k.onTrack < k.baseOnTrack ? 'bad' : '';
  return (
    <div className="kpis">
      <div className="kpi">
        <div className="kpi-label">Countries on track</div>
        <div className="kpi-value">
          {k.onTrack} of {k.total}
        </div>
        <div className={`kpi-sub ${cls}`}>
          baseline: {k.baseOnTrack} of {k.total}
        </div>
      </div>
      <EmissionsCard title="2030 ingredient emissions" value={k.em2030} base={k.baseEm2030} showPct />
      <EmissionsCard title="2040 projected emissions" value={k.em2040} base={k.baseEm2040} showPct={false} />
    </div>
  );
}
