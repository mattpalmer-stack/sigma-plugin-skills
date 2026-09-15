import { SAFE_COLOR_ONLY_COUNT, type Theme } from './palette';
import type { MapPoint } from '../types';

/** Rows whose territory column is empty are grouped under this label. */
export const NO_TERRITORY = '(No territory)';
/** Territories past the last palette slot fold into this bucket. */
export const OTHER = 'Other';

export interface TerritoryStyle {
  name: string;
  color: string;
  /** Short label drawn on the marker when colour alone is not enough. */
  badge: string;
  count: number;
  /** True for the folded bucket and for the missing-value bucket. */
  isNeutral: boolean;
}

export interface TerritoryScale {
  /** Legend entries, in the order slots were assigned. */
  entries: TerritoryStyle[];
  /** Style for a raw territory value. */
  styleFor: (territory: string) => TerritoryStyle;
  /**
   * True once more than three colours are on screen, at which point hue alone
   * can no longer be relied on and every marker carries its badge.
   */
  needsBadges: boolean;
}

/**
 * Derive short, unique badges. Tries progressively longer prefixes of the name
 * and falls back to the slot number when names still collide (e.g. two
 * territories that differ only after several words).
 */
function assignBadges(names: string[]): Map<string, string> {
  const badges = new Map<string, string>();
  const used = new Set<string>();

  names.forEach((name, index) => {
    const cleaned = name.trim();
    let badge = '';

    for (const length of [1, 2, 3]) {
      const candidate = cleaned.slice(0, length).toUpperCase();
      if (candidate && !used.has(candidate)) {
        badge = candidate;
        break;
      }
    }
    if (!badge) badge = String(index + 1);

    used.add(badge);
    badges.set(name, badge);
  });

  return badges;
}

/**
 * Map territory values onto palette slots.
 *
 * Slots are assigned in alphabetical order of the territory name so the colour
 * follows the territory itself rather than how many rows it happens to have —
 * a filter that drops rows does not repaint the territories that remain.
 * When there are more territories than slots, the least common ones fold into a
 * single neutral "Other" bucket; hues are never generated or reused.
 */
export function buildTerritoryScale(points: MapPoint[], theme: Theme): TerritoryScale {
  const counts = new Map<string, number>();
  let missing = 0;

  for (const point of points) {
    const value = point.territory.trim();
    if (!value) {
      missing++;
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const slotCount = theme.categorical.length;
  const allNames = [...counts.keys()];

  // Choose which territories get their own colour (the most common ones when
  // there are too many), then colour that set alphabetically.
  const keptNames =
    allNames.length <= slotCount
      ? [...allNames].sort((a, b) => a.localeCompare(b))
      : [...allNames]
          .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b))
          .slice(0, slotCount)
          .sort((a, b) => a.localeCompare(b));

  const badges = assignBadges(keptNames);
  const styles = new Map<string, TerritoryStyle>();
  const entries: TerritoryStyle[] = [];

  keptNames.forEach((name, index) => {
    const style: TerritoryStyle = {
      name,
      color: theme.categorical[index],
      badge: badges.get(name) ?? String(index + 1),
      count: counts.get(name) ?? 0,
      isNeutral: false,
    };
    styles.set(name, style);
    entries.push(style);
  });

  const foldedNames = allNames.filter((name) => !styles.has(name));
  let otherStyle: TerritoryStyle | null = null;
  if (foldedNames.length > 0) {
    otherStyle = {
      name: OTHER,
      color: theme.neutralMark,
      badge: '·',
      count: foldedNames.reduce((sum, name) => sum + (counts.get(name) ?? 0), 0),
      isNeutral: true,
    };
    entries.push(otherStyle);
  }

  let missingStyle: TerritoryStyle | null = null;
  if (missing > 0) {
    missingStyle = {
      name: NO_TERRITORY,
      color: theme.neutralMark,
      badge: '–',
      count: missing,
      isNeutral: true,
    };
    entries.push(missingStyle);
  }

  const fallback: TerritoryStyle = missingStyle ?? {
    name: NO_TERRITORY,
    color: theme.neutralMark,
    badge: '–',
    count: 0,
    isNeutral: true,
  };

  return {
    entries,
    needsBadges: keptNames.length > SAFE_COLOR_ONLY_COUNT,
    styleFor: (territory: string) => {
      const value = territory.trim();
      if (!value) return fallback;
      return styles.get(value) ?? otherStyle ?? fallback;
    },
  };
}
