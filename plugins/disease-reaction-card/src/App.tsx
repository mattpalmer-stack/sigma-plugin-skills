import { useEffect, useMemo } from 'react'
import {
  useConfig,
  useEditorPanelConfig,
  useElementColumns,
  useElementData,
  useLoadingState,
} from '@sigmacomputing/plugin'

import { DiseaseCard, type CardRow } from './DiseaseCard'
import { EDITOR_PANEL } from './editorPanel'
import { toRating } from './ratings'
import type { SigmaData } from './types'

const DEFAULT_MAX_RATING = 9
const MAX_SCALE = 20

export default function App() {
  useEditorPanelConfig(EDITOR_PANEL)
  const config = useConfig()

  const sourceId = str(config.source)
  const data: SigmaData | undefined = useElementData(sourceId)
  const columns = useElementColumns(sourceId)

  const maxRating = useMemo(() => {
    const parsed = Number.parseInt(str(config.maxRating), 10)
    if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_RATING
    return Math.min(parsed, MAX_SCALE)
  }, [config.maxRating])

  const rows = useMemo<CardRow[]>(() => {
    const groupCol = data?.[str(config.group)]
    const diseaseCol = data?.[str(config.disease)]
    const femaleCol = data?.[str(config.female)]
    const maleCol = data?.[str(config.male)]

    // Disease is the only column the card cannot render without; the rest
    // degrade to a blank group or a "no info" bar.
    if (!diseaseCol) return []

    return diseaseCol.map((disease, i) => ({
      group: groupCol?.[i] == null ? '' : String(groupCol[i]),
      disease: String(disease),
      female: toRating(femaleCol?.[i]),
      male: toRating(maleCol?.[i]),
    }))
  }, [data, config.group, config.disease, config.female, config.male])

  const columnsReady = Object.keys(columns ?? {}).length > 0
  const [, setLoading] = useLoadingState(false)
  useEffect(() => {
    // Only spin once a source is chosen -- spinning while unconfigured would
    // hide the setup instructions.
    setLoading(sourceId !== '' && !columnsReady)
  }, [sourceId, columnsReady, setLoading])

  if (sourceId === '' || !str(config.disease)) {
    return <Setup hasSource={sourceId !== ''} />
  }

  if (rows.length === 0) {
    return (
      <div className="state">
        <p>No rows to show. Check the source element returns data for the current filters.</p>
      </div>
    )
  }

  return (
    <DiseaseCard
      title={str(config.title) || 'Disease Reaction'}
      femaleLabel={str(config.femaleLabel) || 'Female'}
      maleLabel={str(config.maleLabel) || 'Male'}
      rows={rows}
      maxRating={maxRating}
      showLegend={config.showLegend !== false}
      showValues={config.showValues === true}
    />
  )
}

function Setup({ hasSource }: { hasSource: boolean }) {
  return (
    <div className="state">
      <h1>Set up the card</h1>
      <ol>
        <li className={hasSource ? 'done' : undefined}>
          Pick the <strong>source</strong> element
        </li>
        <li>
          Map <strong>Group</strong>, <strong>Disease</strong>, <strong>Female rating</strong>, and{' '}
          <strong>Male rating</strong>
        </li>
      </ol>
    </div>
  )
}

/** Config values are typed `any`; coerce to a string without inventing values. */
function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
