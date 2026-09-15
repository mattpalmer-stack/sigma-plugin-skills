import { format as d3Format } from 'd3-format';
import type { ColumnInfo } from '../types';

const DEFAULT_NUMBER = d3Format(',.0f');
const PERCENT = d3Format('+.1%');
const SIGNED_NUMBER = d3Format('+,.1f');

/**
 * Build a display formatter for one column, honouring the d3-format string
 * Sigma supplies in the column's format metadata so figures match the workbook.
 */
export function formatterFor(column: ColumnInfo | undefined): (value: number) => string {
  const spec = column?.format;

  if (spec?.format) {
    try {
      return d3Format(spec.format);
    } catch {
      // A format string d3 cannot parse is not worth failing a render over.
    }
  }

  if (spec?.type === 'currency') return d3Format('$,.0f');
  if (spec?.type === 'percent') return d3Format('.1%');
  if (spec?.type === 'compact') return d3Format('.3~s');

  return DEFAULT_NUMBER;
}

/**
 * Growth is shown with an explicit sign so the direction is carried by the text
 * itself, not only by colour.
 *
 * A growth column supplied by the workbook may already be a percentage (12.4)
 * or a ratio (0.124); a computed one is always a ratio. `asRatio` says which.
 */
export function formatGrowth(value: number, asRatio: boolean): string {
  if (!Number.isFinite(value)) return '—';
  return asRatio ? PERCENT(value) : `${SIGNED_NUMBER(value)}%`;
}

/**
 * Period-over-period growth as a ratio, or null when it cannot be expressed.
 *
 * A zero prior period is deliberately not reported as growth: any increase from
 * zero is infinite, and rendering that as a percentage would be misleading.
 */
export function computeGrowth(ytd: number | null, pytd: number | null): number | null {
  if (ytd === null || pytd === null) return null;
  if (!Number.isFinite(ytd) || !Number.isFinite(pytd)) return null;
  if (pytd === 0) return null;
  return (ytd - pytd) / Math.abs(pytd);
}
