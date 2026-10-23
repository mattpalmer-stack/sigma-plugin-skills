import type { CountryView, Status } from './model.ts';
import { label } from './model.ts';
import { fmt2, fmtGap, fmtPct } from './format.ts';
import { round2 } from './model.ts';

const STATUS_TEXT: Record<Status, string> = { on: 'On track', risk: 'At risk', off: 'Off track' };

interface Props {
  views: CountryView[];
  selected: string;
  onSelect: (country: string) => void;
}

export default function Scorecard({ views, selected, onSelect }: Props) {
  return (
    <>
      <h2 className="sc-title">Country scorecard</h2>
      <div className="sc-scroll">
        <table className="sc">
          <thead>
            <tr>
              <th>Country</th>
              <th>2030 kg/hl</th>
              <th>2040 proj.</th>
              <th>2040 target</th>
              <th>Gap</th>
              <th className="pcol">P(net zero 2040)</th>
              <th className="scol">Status</th>
            </tr>
          </thead>
          <tbody>
            {views.map((v) => {
              const gapR = v.gap2040 === null ? null : round2(v.gap2040);
              const gapCls = gapR === null ? '' : gapR > 0 ? 'bad' : 'good';
              return (
                <tr
                  key={v.country}
                  className={v.country === selected ? 'sel' : ''}
                  tabIndex={0}
                  aria-selected={v.country === selected}
                  onClick={() => onSelect(v.country)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(v.country);
                    }
                  }}
                >
                  <td>{label(v.country)}</td>
                  <td>{fmt2(v.i2030)}</td>
                  <td>{fmt2(v.i2040)}</td>
                  <td>{fmt2(v.target2040)}</td>
                  <td className={gapCls}>{fmtGap(v.gap2040)}</td>
                  <td className="pcol">
                    {v.prob === null ? (
                      '—'
                    ) : (
                      <div className="prob">
                        <div className="prob-track">
                          <div className="prob-fill" style={{ width: `${Math.min(100, v.prob * 100)}%` }} />
                          {v.baseProb !== null && (
                            <div className="prob-tick" style={{ left: `${Math.min(100, v.baseProb * 100)}%` }} />
                          )}
                        </div>
                        <div className="prob-pct">{fmtPct(v.prob)}</div>
                        <div className="prob-base">baseline {fmtPct(v.baseProb)}</div>
                      </div>
                    )}
                  </td>
                  <td className="scol">
                    {v.status ? <span className={`badge ${v.status}`}>{STATUS_TEXT[v.status]}</span> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="foot">
        Click a country to update the charts · P(net zero) = share of 10,000 Monte Carlo paths at or below the 2040
        target · On track ≥ 60%, at risk 30–60%, off track &lt; 30%
      </p>
    </>
  );
}
