import { formatGrowth } from '../lib/format';
import type { PopupFormatters, PopupLabels } from './GoogleMap';
import type { Theme } from '../lib/palette';
import type { TerritoryScale } from '../lib/territories';
import type { MapPoint } from '../types';

interface TableViewProps {
  points: MapPoint[];
  theme: Theme;
  scale: TerritoryScale;
  labels: PopupLabels;
  formatters: PopupFormatters;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * The non-visual route to the same data — what makes the encoding legible when
 * colour is not available to the reader. It mirrors the popup's fields.
 */
export function TableView({
  points,
  theme,
  scale,
  labels,
  formatters,
  selectedKey,
  onSelect,
}: TableViewProps) {
  return (
    <div className="table-wrap" style={{ background: theme.surface }}>
      <table className="data-table">
        <thead>
          <tr style={{ color: theme.textSecondary, borderColor: theme.gridline }}>
            <th scope="col">{labels.name || 'Name'}</th>
            <th scope="col">{labels.territory}</th>
            <th scope="col">{labels.ytd}</th>
            <th scope="col">{labels.pytd}</th>
            <th scope="col">{labels.growth}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const style = scale.styleFor(point.territory);
            const isSelected = point.key === selectedKey;
            const growthInk =
              point.growth === null || point.growth === 0
                ? undefined
                : point.growth > 0
                  ? theme.deltaUp
                  : theme.deltaDown;
            return (
              <tr
                key={point.rowIndex}
                onClick={() => onSelect(point.key)}
                className={isSelected ? 'row-selected' : undefined}
                style={{
                  color: theme.textPrimary,
                  borderColor: theme.gridline,
                  background: isSelected ? theme.plane : 'transparent',
                }}
              >
                <th scope="row" style={{ color: theme.textPrimary }}>
                  {point.name || `Row ${point.rowIndex + 1}`}
                </th>
                <td>
                  <span
                    className="row-dot"
                    style={{ background: style.color, borderColor: theme.surface }}
                    aria-hidden="true"
                  />
                  {point.territory || '—'}
                </td>
                <td>{point.ytd === null ? '—' : formatters.ytd(point.ytd)}</td>
                <td>{point.pytd === null ? '—' : formatters.pytd(point.pytd)}</td>
                <td style={{ color: growthInk }}>
                  {point.growth === null ? '—' : formatGrowth(point.growth, point.growthIsRatio)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
