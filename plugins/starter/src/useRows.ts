import { useMemo } from 'react'
import type { SigmaData, SigmaValue } from './types'

export interface RowView {
  /** Column IDs in the order Sigma delivered them. */
  columnIds: string[]
  /** Total rows in the element, before `limit` is applied. */
  rowCount: number
  /** Row-oriented slice, each row aligned to `columnIds`. */
  rows: SigmaValue[][]
}

/**
 * Sigma delivers data column-oriented. Most rendering wants rows, so pivot
 * once here and memoize rather than re-deriving it inside components.
 */
export function useRows(data: SigmaData | undefined, limit?: number): RowView {
  return useMemo(() => {
    const columnIds = Object.keys(data ?? {})
    if (columnIds.length === 0) {
      return { columnIds, rowCount: 0, rows: [] }
    }

    // Every column array is the same length, so the first one sets row count.
    const rowCount = data?.[columnIds[0]]?.length ?? 0
    const shown = limit === undefined ? rowCount : Math.min(limit, rowCount)

    const rows: SigmaValue[][] = []
    for (let i = 0; i < shown; i++) {
      rows.push(columnIds.map((id) => data?.[id]?.[i] ?? null))
    }

    return { columnIds, rowCount, rows }
  }, [data, limit])
}
