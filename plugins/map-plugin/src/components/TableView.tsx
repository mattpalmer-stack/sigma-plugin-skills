import type { Theme } from '../lib/palette';
import type { TerritoryScale } from '../lib/territories';
import type { MapPoint } from '../types';

interface TableViewProps {
  points: MapPoint[];
  theme: Theme;
  scale: TerritoryScale;
  nameHeader: string;
  territoryHeader: string;
  selectedRow: number | null;
  onSelect: (rowIndex: number) => void;
}

/**
 * The non-visual route to the same data — what makes the encoding legible when
 * colour is not available to the reader.
 */
export function TableView({
  points,
  theme,
  scale,
  nameHeader,
  territoryHeader,
  selectedRow,
  onSelect,
}: TableViewProps) {
  return (
    <div className="table-wrap" style={{ background: theme.surface }}>
      <table className="data-table">
        <thead>
          <tr style={{ color: theme.textSecondary, borderColor: theme.gridline }}>
            <th scope="col">{nameHeader || 'Name'}</th>
            <th scope="col">{territoryHeader || 'Territory'}</th>
            <th scope="col">Latitude</th>
            <th scope="col">Longitude</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const style = scale.styleFor(point.territory);
            const isSelected = point.rowIndex === selectedRow;
            return (
              <tr
                key={point.rowIndex}
                onClick={() => onSelect(point.rowIndex)}
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
                <td>{point.lat.toFixed(6)}</td>
                <td>{point.lng.toFixed(6)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
