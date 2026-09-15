import { format as d3Format } from 'd3-format';
import type { ColumnInfo, SigmaValue } from '../types';

/**
 * Sigma hands dates back as ISO strings, numeric timestamps (seconds *or*
 * milliseconds), or Date objects depending on the source, so parse defensively.
 */
export function parseDate(value: SigmaValue): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    // Timestamps below ~10 billion are seconds; above are milliseconds.
    const ms = value < 1e10 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** Coerce a Sigma cell to a number, or null when it isn't one. */
export function toNumber(value: SigmaValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const DEFAULT_NUMBER = d3Format(',.4~f');

/**
 * Build a display formatter for one column, honouring the d3-format string in
 * the column's format metadata when Sigma supplies one.
 */
export function formatterFor(column: ColumnInfo | undefined): (value: SigmaValue) => string {
  const spec = column?.format;
  const columnType = column?.columnType;

  if (columnType === 'datetime' || columnType === 'date' || spec?.type === 'date') {
    return (value) => {
      const date = parseDate(value);
      if (!date) return '';
      return columnType === 'date' || spec?.type === 'date'
        ? date.toLocaleDateString()
        : date.toLocaleString();
    };
  }

  let numeric: ((n: number) => string) | null = null;
  if (spec?.format) {
    try {
      numeric = d3Format(spec.format);
    } catch {
      // A format string d3 can't parse is not worth failing a render over.
      numeric = null;
    }
  }
  if (!numeric && spec?.type === 'compact') {
    numeric = d3Format('.3~s');
  }

  return (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    const n = toNumber(value);
    if (n !== null && typeof value !== 'string') {
      return (numeric ?? DEFAULT_NUMBER)(n);
    }
    return String(value);
  };
}

/** Compact axis/legend number, used where space is tight. */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1000) return d3Format('.3~s')(n);
  if (Number.isInteger(n)) return String(n);
  return d3Format('.2~f')(n);
}
