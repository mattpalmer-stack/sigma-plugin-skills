/** Numeric scales for marker colour and marker size. */

export interface Extent {
  min: number;
  max: number;
}

/** Extent of the finite numbers in `values`, or null when there are none. */
export function extentOf(values: readonly (number | null)[]): Extent | null {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v === null || !Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return Number.isFinite(min) ? { min, max } : null;
}

/**
 * Bucket `value` into one of `steps` equal-width bands across `extent`.
 * A zero-width extent (every row shares one value) collapses to the top band,
 * which reads as "all the same" rather than "all at the bottom".
 */
export function bucketIndex(value: number, extent: Extent, steps: number): number {
  if (steps <= 1) return 0;
  const span = extent.max - extent.min;
  if (span <= 0) return steps - 1;
  const t = (value - extent.min) / span;
  return Math.min(steps - 1, Math.max(0, Math.floor(t * steps)));
}

/** Inclusive value range covered by band `index`, for the legend. */
export function bucketRange(index: number, extent: Extent, steps: number): Extent {
  const span = extent.max - extent.min;
  if (span <= 0) return { min: extent.min, max: extent.max };
  const width = span / steps;
  return {
    min: extent.min + width * index,
    max: index === steps - 1 ? extent.max : extent.min + width * (index + 1),
  };
}

/**
 * Radius in pixels, on a square-root scale so that *area* tracks magnitude —
 * a linear radius would overstate large values by squaring them.
 */
export function radiusFor(
  value: number | null,
  extent: Extent | null,
  minRadius: number,
  maxRadius: number,
): number {
  if (value === null || extent === null || !Number.isFinite(value)) return minRadius;
  const span = extent.max - extent.min;
  if (span <= 0) return (minRadius + maxRadius) / 2;
  const t = Math.min(1, Math.max(0, (value - extent.min) / span));
  return minRadius + (maxRadius - minRadius) * Math.sqrt(t);
}
