import { bucketIndex, type Extent } from '../lib/scales';
import { formatCompact } from '../lib/format';
import type { Theme } from '../lib/palette';
import type { MapPoint } from '../types';

interface TableViewProps {
  points: MapPoint[];
  theme: Theme;
  colorExtent: Extent | null;
  colorLabel: string;
  sizeLabel: string;
  labelHeader: string;
  selectedRow: number | null;
  onSelect: (point: MapPoint) => void;
}

/**
 * The table is the non-visual route to the same data — it is what makes the
 * encoding legible when colour is not available to the reader.
 */
export function TableView({
  points,
  theme,
  colorExtent,
  colorLabel,
  sizeLabel,
  labelHeader,
  selectedRow,
  onSelect,
}: TableViewProps) {
  const detailNames = points[0]?.details.map((d) => d.name) ?? [];

  return (
    <div className="table-wrap" style={{ background: theme.surface }}>
      <table className="data-table">
        <thead>
          <tr style={{ color: theme.textSecondary, borderColor: theme.gridline }}>
            <th scope="col">{labelHeader || 'Row'}</th>
            {colorLabel && <th scope="col">{colorLabel}</th>}
            {sizeLabel && <th scope="col">{sizeLabel}</th>}
            {detailNames.map((name) => (
              <th scope="col" key={name}>
                {name}
              </th>
            ))}
            <th scope="col">Latitude</th>
            <th scope="col">Longitude</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const isSelected = point.rowIndex === selectedRow;
            const swatch =
              point.colorValue !== null && colorExtent
                ? theme.ramp[bucketIndex(point.colorValue, colorExtent, theme.ramp.length)]
                : theme.neutralMark;
            return (
              <tr
                key={point.rowIndex}
                onClick={() => onSelect(point)}
                className={isSelected ? 'row-selected' : undefined}
                style={{
                  color: theme.textPrimary,
                  borderColor: theme.gridline,
                  background: isSelected ? theme.plane : 'transparent',
                }}
              >
                <th scope="row" style={{ color: theme.textPrimary }}>
                  <span
                    className="row-dot"
                    style={{ background: swatch, borderColor: theme.surface }}
                    aria-hidden="true"
                  />
                  {point.label || `Row ${point.rowIndex + 1}`}
                </th>
                {colorLabel && (
                  <td>{point.colorValue === null ? '—' : formatCompact(point.colorValue)}</td>
                )}
                {sizeLabel && (
                  <td>{point.sizeValue === null ? '—' : formatCompact(point.sizeValue)}</td>
                )}
                {point.details.map((detail) => (
                  <td key={detail.name}>{detail.value || '—'}</td>
                ))}
                <td>{point.lat.toFixed(5)}</td>
                <td>{point.lon.toFixed(5)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
