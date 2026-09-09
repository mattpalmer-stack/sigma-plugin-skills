/**
 * Disease reaction rating bands.
 *
 * Ratings run 1-9, low = susceptible, high = tolerant. The four bands and their
 * boundaries come from the printed variety card's legend.
 *
 * Colors were validated with the dataviz palette checker: adjacent bands clear
 * both the CVD separation floor (worst pair ΔE 13.9 deutan) and the
 * normal-vision floor (ΔE 17.0). The reference card's red/orange pair sat at
 * ΔE 14.8 — under the floor where full-color readers can still tell two colors
 * apart — so red was deepened until the pair separated.
 *
 * Color is never the only encoding here: fill length carries the same value, so
 * the rating stays readable when hue does not survive (CVD, print, photocopy).
 */

export interface Band {
  id: string
  /** Legend text. */
  label: string
  /** Rating range as shown in the legend. */
  range: string
  color: string
}

export const BANDS: Band[] = [
  { id: 'susceptible', label: 'Susceptible', range: '1 to 3', color: '#D93318' },
  { id: 'mod-susceptible', label: 'Moderately susceptible', range: '4', color: '#F59120' },
  { id: 'mod-tolerant', label: 'Moderately tolerant', range: '5 to 6', color: '#FFD616' },
  { id: 'tolerant', label: 'Tolerant', range: '7 to 9', color: '#3E9C35' },
]

export const NO_INFO: Band = { id: 'no-info', label: 'No info', range: '', color: '#C9CDD4' }

/**
 * Band for a rating. Boundaries sit on the half-step so a fractional average
 * (say 4.5) lands in exactly one band instead of falling through.
 */
export function bandFor(rating: number | null): Band {
  if (rating === null) return NO_INFO
  if (rating < 3.5) return BANDS[0]
  if (rating < 4.5) return BANDS[1]
  if (rating < 6.5) return BANDS[2]
  return BANDS[3]
}

/**
 * Readable text color for a filled swatch of `hex`.
 *
 * The printed card sets white text on every legend pill, which is illegible on
 * the yellow and gray ones. Picking per background from WCAG relative luminance
 * keeps the pill look without that cost.
 */
export function inkOn(hex: string): string {
  const channel = (offset: number) => {
    const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return luminance > 0.4 ? '#1a1d21' : '#ffffff'
}

/** Parse a cell into a rating, treating blanks and non-numbers as "no info". */
export function toRating(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** How many segments to fill for a rating, clamped to the scale. */
export function filledSegments(rating: number | null, max: number): number {
  if (rating === null) return 0
  return Math.max(0, Math.min(max, Math.round(rating)))
}
