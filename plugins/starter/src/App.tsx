import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useConfig,
  useEditorPanelConfig,
  useElementColumns,
  useElementData,
  useLoadingState,
} from '@sigmacomputing/plugin'

import { EDITOR_PANEL } from './editorPanel'
import { formatValue } from './format'
import { useRows } from './useRows'
import type { SigmaColumns, SigmaData } from './types'

const DEFAULT_ROW_LIMIT = 25
const MAX_ROW_LIMIT = 500
const SAMPLES_IN_SCHEMA = 5

export default function App() {
  useEditorPanelConfig(EDITOR_PANEL)
  const config = useConfig()

  const sourceId = typeof config.source === 'string' ? config.source : ''
  const data: SigmaData | undefined = useElementData(sourceId)
  const columns: SigmaColumns | undefined = useElementColumns(sourceId)

  const rowLimit = useMemo(() => {
    const parsed = Number.parseInt(String(config.rowLimit ?? ''), 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_ROW_LIMIT
    return Math.min(parsed, MAX_ROW_LIMIT)
  }, [config.rowLimit])

  const { columnIds, rowCount, rows } = useRows(data, rowLimit)

  // Only spin while a source is selected but its metadata has not landed yet.
  // Spinning on "nothing configured" would hide the setup instructions.
  const awaitingData = sourceId !== '' && columnIds.length === 0
  const [, setLoading] = useLoadingState(false)
  useEffect(() => {
    setLoading(awaitingData)
  }, [awaitingData, setLoading])

  const schemaJson = useMemo(
    () =>
      JSON.stringify(
        {
          elementId: sourceId,
          rowCount,
          columns: columnIds.map((id) => ({
            id,
            name: columns?.[id]?.name ?? null,
            columnType: columns?.[id]?.columnType ?? null,
            format: columns?.[id]?.format ?? null,
            sample: (data?.[id] ?? []).slice(0, SAMPLES_IN_SCHEMA),
          })),
        },
        null,
        2,
      ),
    [sourceId, rowCount, columnIds, columns, data],
  )

  if (sourceId === '') {
    return <EmptyState />
  }

  const title = typeof config.title === 'string' ? config.title.trim() : ''

  return (
    <div className="app">
      <header className="header">
        <h1>{title || 'Element inspector'}</h1>
        <p className="subtitle">
          {columnIds.length} column{columnIds.length === 1 ? '' : 's'} · {rowCount} row
          {rowCount === 1 ? '' : 's'}
          {rows.length < rowCount ? ` · showing first ${rows.length}` : ''}
        </p>
      </header>

      <Section title="Schema">
        <table className="table">
          <thead>
            <tr>
              <th>Column name</th>
              <th>Type</th>
              <th>Format</th>
              <th>Column ID</th>
            </tr>
          </thead>
          <tbody>
            {columnIds.map((id) => {
              const column = columns?.[id]
              return (
                <tr key={id}>
                  <td>{column?.name ?? <span className="muted">unknown</span>}</td>
                  <td>
                    <code className="badge">{column?.columnType ?? '?'}</code>
                  </td>
                  <td className="muted">
                    {column?.format
                      ? [column.format.type, column.format.format].filter(Boolean).join(' · ')
                      : '—'}
                  </td>
                  <td>
                    <code className="muted">{id}</code>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Rows">
        <div className="scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="rownum">#</th>
                {columnIds.map((id) => (
                  <th key={id}>{columns?.[id]?.name ?? id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="rownum muted">{rowIndex + 1}</td>
                  {row.map((value, colIndex) => (
                    <td key={columnIds[colIndex]}>
                      {formatValue(value, columns?.[columnIds[colIndex]])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <SchemaHandoff json={schemaJson} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="app empty">
      <h1>Pick a source element</h1>
      <p>
        Open the plugin's editor panel and set <strong>source</strong> to the element you want to
        build against. This starter then lists every column it receives — name, type, format, and a
        few sample values — so you know exactly what the plugin has to work with.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function SchemaHandoff({ json }: { json: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
    } catch {
      // Clipboard access is often blocked inside the plugin iframe. The
      // textarea below is always selectable, so this failure is not fatal.
      setCopied(false)
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Schema JSON</h2>
        <button type="button" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="muted">
        Paste this to describe the element to someone who cannot open the workbook.
      </p>
      <textarea className="json" readOnly value={json} rows={12} spellCheck={false} />
    </section>
  )
}
