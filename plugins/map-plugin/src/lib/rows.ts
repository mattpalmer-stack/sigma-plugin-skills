import { formatterFor, toNumber } from './format';
import type { ColumnInfo, MapPoint, SigmaColumns, SigmaData } from '../types';

/**
 * Normalise a `column` config entry to an array. Sigma returns a bare string
 * when `allowMultiple` is false and an array when it is true.
 */
export function asColumnList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

/** Human-readable column name, falling back to the opaque column ID. */
export function columnName(columns: SigmaColumns, id: string | undefined): string {
  if (!id) return '';
  return columns[id]?.name ?? id;
}

function rowCountOf(data: SigmaData): number {
  for (const key of Object.keys(data)) {
    const column = data[key];
    if (Array.isArray(column)) return column.length;
  }
  return 0;
}

export interface BuildPointsArgs {
  data: SigmaData;
  columns: SigmaColumns;
  latColumn: string;
  lonColumn: string;
  labelColumn?: string;
  colorColumn?: string;
  sizeColumn?: string;
  detailColumns: string[];
}

export interface BuildPointsResult {
  points: MapPoint[];
  /** Rows dropped because their coordinates were missing or out of range. */
  skipped: number;
}

/**
 * Transpose Sigma's column-oriented data into mappable rows.
 *
 * Rows without a usable coordinate pair are dropped rather than clamped — a
 * marker at a made-up location is worse than a missing one — and counted so the
 * UI can say how many did not make it onto the map.
 */
export function buildPoints({
  data,
  columns,
  latColumn,
  lonColumn,
  labelColumn,
  colorColumn,
  sizeColumn,
  detailColumns,
}: BuildPointsArgs): BuildPointsResult {
  const lats = data[latColumn];
  const lons = data[lonColumn];
  if (!Array.isArray(lats) || !Array.isArray(lons)) {
    return { points: [], skipped: 0 };
  }

  const labels = labelColumn ? data[labelColumn] : undefined;
  const colorValues = colorColumn ? data[colorColumn] : undefined;
  const sizeValues = sizeColumn ? data[sizeColumn] : undefined;

  const detailMeta: { id: string; name: string; format: (v: never) => string }[] = detailColumns.map(
    (id) => {
      const info: ColumnInfo | undefined = columns[id];
      return {
        id,
        name: info?.name ?? id,
        format: formatterFor(info) as (v: never) => string,
      };
    },
  );

  const rowCount = Math.min(lats.length, lons.length, rowCountOf(data) || lats.length);
  const points: MapPoint[] = [];
  let skipped = 0;

  for (let i = 0; i < rowCount; i++) {
    const lat = toNumber(lats[i]);
    const lon = toNumber(lons[i]);

    const usable =
      lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    if (!usable) {
      skipped++;
      continue;
    }

    const rawLabel = labels?.[i];
    points.push({
      rowIndex: i,
      lat,
      lon,
      label: rawLabel === null || rawLabel === undefined ? '' : String(rawLabel),
      colorValue: colorValues ? toNumber(colorValues[i]) : null,
      sizeValue: sizeValues ? toNumber(sizeValues[i]) : null,
      details: detailMeta.map((meta) => ({
        name: meta.name,
        value: meta.format(data[meta.id]?.[i] as never),
      })),
    });
  }

  return { points, skipped };
}
