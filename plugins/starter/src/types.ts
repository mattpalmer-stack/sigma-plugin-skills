import type {
  WorkbookElementColumn,
  WorkbookElementData,
} from '@sigmacomputing/plugin'

/**
 * Shapes Sigma hands the plugin at runtime.
 *
 * These build on the SDK's own types rather than restating them, so they
 * cannot drift as the SDK changes.
 */

/** A single cell. Dates can arrive as a Date, an ISO string, or a timestamp. */
export type SigmaValue = string | number | boolean | Date | null

/**
 * Element data is column-oriented: one array of values per column ID. The SDK
 * types the arrays as `any[]`; narrow to `SigmaValue` at the point of use.
 */
export type SigmaData = WorkbookElementData

export interface SigmaColumnFormat {
  /** 'number' | 'currency' | 'percent' | 'date' | 'auto' | 'compact' */
  type?: string
  /** d3-format string for numbers, d3-time-format string for dates. */
  format?: string
}

/**
 * The SDK declares a column as `{ id, name, columnType }`. Sigma also sends a
 * `format` object at runtime that the published types do not cover yet, so it
 * is declared optional here instead of reaching for `any` at each use.
 */
export type SigmaColumnInfo = WorkbookElementColumn & {
  format?: SigmaColumnFormat
}

/** Column metadata, keyed by the same column IDs used in SigmaData. */
export type SigmaColumns = Record<string, SigmaColumnInfo>
