import type { SigmaColumnInfo, SigmaValue } from './types'

/**
 * Numbers below this are almost certainly second-precision timestamps rather
 * than millisecond ones (1e11 ms lands in 1973, 1e11 s lands in year 5138).
 */
const SECONDS_CUTOFF = 1e11

/** Normalize whatever Sigma sent for a date column into a Date. */
export function toDate(value: SigmaValue): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    const ms = Math.abs(value) < SECONDS_CUTOFF ? value * 1000 : value
    const parsed = new Date(ms)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 4,
})

/**
 * Render a cell for display.
 *
 * Deliberately does not implement d3-format -- the column's own format string
 * is surfaced in the schema panel instead, so you can decide per plugin
 * whether pulling in d3-format is worth the bundle size.
 */
export function formatValue(value: SigmaValue, column?: SigmaColumnInfo): string {
  if (value === null || value === undefined) return '—'

  // Annotated as `string` on purpose: the SDK's ValueType union does not list
  // every value Sigma sends in practice, and narrowing would reject the checks.
  const columnType: string = column?.columnType ?? ''
  if (columnType === 'date' || columnType === 'datetime') {
    const parsed = toDate(value)
    if (parsed) {
      const iso = parsed.toISOString()
      return columnType === 'date' ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ')
    }
  }

  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return numberFormatter.format(value)
  if (value instanceof Date) return value.toISOString()
  return value
}
