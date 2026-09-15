import { computeGrowth } from './format';
import type { MapPoint, SigmaColumns, SigmaData, SigmaValue } from '../types';

/** Coerce a Sigma cell to a number, or null when it isn't one. */
export function toNumber(value: SigmaValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Human-readable column name, falling back to the opaque column ID. */
export function columnName(columns: SigmaColumns, id: string | undefined): string {
  if (!id) return '';
  return columns[id]?.name ?? id;
}

function toText(value: SigmaValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export interface BuildPointsArgs {
  data: SigmaData;
  latColumn: string;
  lngColumn: string;
  nameColumn?: string;
  territoryColumn?: string;
  keyColumn?: string;
  ytdColumn?: string;
  pytdColumn?: string;
  growthColumn?: string;
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
 * toolbar can say how many did not make it onto the map.
 */
export function buildPoints({
  data,
  latColumn,
  lngColumn,
  nameColumn,
  territoryColumn,
  keyColumn,
  ytdColumn,
  pytdColumn,
  growthColumn,
}: BuildPointsArgs): BuildPointsResult {
  const lats = data[latColumn];
  const lngs = data[lngColumn];
  if (!Array.isArray(lats) || !Array.isArray(lngs)) {
    return { points: [], skipped: 0 };
  }

  const names = nameColumn ? data[nameColumn] : undefined;
  const territories = territoryColumn ? data[territoryColumn] : undefined;
  const keys = keyColumn ? data[keyColumn] : undefined;
  const ytds = ytdColumn ? data[ytdColumn] : undefined;
  const pytds = pytdColumn ? data[pytdColumn] : undefined;
  const growths = growthColumn ? data[growthColumn] : undefined;

  const rowCount = Math.min(lats.length, lngs.length);
  const points: MapPoint[] = [];
  let skipped = 0;

  for (let i = 0; i < rowCount; i++) {
    const lat = toNumber(lats[i]);
    const lng = toNumber(lngs[i]);

    const usable =
      lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    if (!usable) {
      skipped++;
      continue;
    }

    const ytd = ytds ? toNumber(ytds[i]) : null;
    const pytd = pytds ? toNumber(pytds[i]) : null;
    const suppliedGrowth = growths ? toNumber(growths[i]) : null;
    const useSupplied = growths !== undefined && suppliedGrowth !== null;

    points.push({
      rowIndex: i,
      lat,
      lng,
      name: toText(names?.[i]),
      territory: toText(territories?.[i]),
      // Falls back to the row index so writeback still identifies a row when no
      // key column is configured — a workbook-side match on index is fragile,
      // which is why the editor panel asks for a real key.
      key: keys ? toText(keys[i]) : String(i),
      ytd,
      pytd,
      growth: useSupplied ? suppliedGrowth : computeGrowth(ytd, pytd),
      growthIsRatio: !useSupplied,
    });
  }

  return { points, skipped };
}
