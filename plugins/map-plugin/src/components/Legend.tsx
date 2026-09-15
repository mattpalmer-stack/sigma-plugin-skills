import type { Theme } from '../lib/palette';
import type { TerritoryScale } from '../lib/territories';

interface LegendProps {
  theme: Theme;
  scale: TerritoryScale;
  title: string;
}

/**
 * Always present once there is more than one territory. When badges are in play
 * the legend shows them too, so the map can be read without relying on hue.
 */
export function Legend({ theme, scale, title }: LegendProps) {
  if (scale.entries.length < 2) return null;

  return (
    <div className="legend" style={{ background: theme.surface, borderColor: theme.border }}>
      {title && (
        <div className="legend-title" style={{ color: theme.textSecondary }}>
          {title}
        </div>
      )}
      <ul className="legend-list">
        {scale.entries.map((entry) => (
          <li key={entry.name} style={{ color: theme.textPrimary }}>
            <span
              className="legend-dot"
              style={{ background: entry.color, borderColor: theme.surface }}
              aria-hidden="true"
            >
              {scale.needsBadges && !entry.isNeutral && (
                <span className="legend-badge">{entry.badge}</span>
              )}
            </span>
            <span className="legend-name">{entry.name}</span>
            <span className="legend-count" style={{ color: theme.textMuted }}>
              {entry.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
