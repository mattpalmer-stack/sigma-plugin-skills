import { BANDS, NO_INFO, bandFor, filledSegments, inkOn } from './ratings'

export interface CardRow {
  group: string
  disease: string
  female: number | null
  male: number | null
}

/** Consecutive rows sharing a group value, so the group label can span them. */
export interface RowGroup {
  group: string
  rows: CardRow[]
}

/**
 * Collapse rows into runs of equal group value, preserving the order Sigma
 * delivered. Grouping on runs rather than on distinct values means the card
 * follows whatever sort the source element applies instead of imposing one.
 */
export function groupRows(rows: CardRow[]): RowGroup[] {
  const groups: RowGroup[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.group === row.group) last.rows.push(row)
    else groups.push({ group: row.group, rows: [row] })
  }
  return groups
}

interface CardProps {
  title: string
  femaleLabel: string
  maleLabel: string
  rows: CardRow[]
  maxRating: number
  showLegend: boolean
  showValues: boolean
}

export function DiseaseCard({
  title,
  femaleLabel,
  maleLabel,
  rows,
  maxRating,
  showLegend,
  showValues,
}: CardProps) {
  const groups = groupRows(rows)

  return (
    <div className="card">
      <h1 className="card-title">{title}</h1>

      <table className="grid">
        <caption className="sr-only">
          {title}: disease reaction ratings from 1 to {maxRating} for each parent line.
        </caption>
        <thead>
          <tr>
            <th className="col-group" />
            <th className="col-disease">
              <span className="pill pill-neutral">Disease</span>
            </th>
            <th className="col-rating">
              <span className="pill pill-female">{femaleLabel}</span>
            </th>
            <th className="col-rating">
              <span className="pill pill-male">{maleLabel}</span>
            </th>
          </tr>
        </thead>

        {groups.map((group, groupIndex) => (
          // Index, not group name: a group name can legitimately recur if the
          // caller's ordering interleaves them, and duplicate keys would make
          // React reuse the wrong tbody.
          <tbody key={`${groupIndex}-${group.group}`}>
            {group.rows.map((row, index) => (
              <tr key={`${row.group}-${row.disease}`}>
                {index === 0 && (
                  <td className="col-group" rowSpan={group.rows.length}>
                    <div className="group-tab">
                      <span className="group-tab-text">{group.group}</span>
                    </div>
                  </td>
                )}
                <th scope="row" className="disease-name">
                  {row.disease}
                </th>
                <td>
                  <RatingBar
                    rating={row.female}
                    max={maxRating}
                    label={`${row.disease} — ${femaleLabel}`}
                    showValue={showValues}
                  />
                </td>
                <td>
                  <RatingBar
                    rating={row.male}
                    max={maxRating}
                    label={`${row.disease} — ${maleLabel}`}
                    showValue={showValues}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      {showLegend && <Legend />}
    </div>
  )
}

interface BarProps {
  rating: number | null
  max: number
  label: string
  showValue: boolean
}

function RatingBar({ rating, max, label, showValue }: BarProps) {
  const band = bandFor(rating)
  const filled = filledSegments(rating, max)

  const readout =
    rating === null
      ? 'no info'
      : `${rating} of ${max} — ${band.label}${band.range ? ` (${band.range})` : ''}`

  return (
    <div className="bar-wrap">
      <div
        className="bar"
        role="img"
        aria-label={`${label}: ${readout}`}
        data-tooltip={`${label}\n${readout}`}
      >
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`seg${i < filled ? ' seg-on' : ''}`}
            style={i < filled ? { background: band.color } : undefined}
          />
        ))}
      </div>
      {showValue && <span className="bar-value">{rating === null ? '—' : rating}</span>}
    </div>
  )
}

function Legend() {
  return (
    <ul className="legend">
      {[...BANDS, NO_INFO].map((band) => (
        <li
          key={band.id}
          className="legend-pill"
          style={{ background: band.color, color: inkOn(band.color) }}
        >
          {band.label}
          {band.range && <span className="legend-range"> ({band.range})</span>}
        </li>
      ))}
    </ul>
  )
}
