import { bucketRange, type Extent } from '../lib/scales';
import { formatCompact } from '../lib/format';
import type { Theme } from '../lib/palette';

interface LegendProps {
  theme: Theme;
  colorExtent: Extent | null;
  colorLabel: string;
  sizeExtent: Extent | null;
  sizeLabel: string;
}

/**
 * Identity is never carried by colour alone: the ramp is labelled with the
 * values each band covers, and the size key states its own range.
 */
export function Legend({ theme, colorExtent, colorLabel, sizeExtent, sizeLabel }: LegendProps) {
  const showColor = colorExtent !== null && colorLabel !== '';
  const showSize = sizeExtent !== null && sizeLabel !== '';
  if (!showColor && !showSize) return null;

  return (
    <div className="legend" style={{ background: theme.surface, borderColor: theme.border }}>
      {showColor && (
        <div className="legend-block">
          <div className="legend-title" style={{ color: theme.textSecondary }}>
            {colorLabel}
          </div>
          <div className="legend-ramp">
            {theme.ramp.map((color, i) => {
              const range = bucketRange(i, colorExtent, theme.ramp.length);
              return (
                <div
                  key={color}
                  className="legend-swatch"
                  style={{ background: color }}
                  title={`${formatCompact(range.min)} – ${formatCompact(range.max)}`}
                />
              );
            })}
          </div>
          <div className="legend-scale" style={{ color: theme.textMuted }}>
            <span>{formatCompact(colorExtent.min)}</span>
            <span>{formatCompact(colorExtent.max)}</span>
          </div>
        </div>
      )}

      {showSize && (
        <div className="legend-block">
          <div className="legend-title" style={{ color: theme.textSecondary }}>
            {sizeLabel}
          </div>
          <div className="legend-sizes">
            {[8, 15, 24].map((diameter, i) => (
              <span
                key={diameter}
                className="legend-bubble"
                style={{
                  width: diameter,
                  height: diameter,
                  background: theme.neutralMark,
                  borderColor: theme.surface,
                  opacity: 0.85,
                }}
                title={i === 0 ? 'smaller' : i === 2 ? 'larger' : 'mid'}
              />
            ))}
          </div>
          <div className="legend-scale" style={{ color: theme.textMuted }}>
            <span>{formatCompact(sizeExtent.min)}</span>
            <span>{formatCompact(sizeExtent.max)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
