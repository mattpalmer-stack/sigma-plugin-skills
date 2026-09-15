import type { Theme } from '../lib/palette';

interface EmptyStateProps {
  theme: Theme;
  title: string;
  steps: string[];
}

/**
 * Authors configure a plugin field by field, so every partial state needs to
 * say what is still missing rather than rendering an empty frame.
 */
export function EmptyState({ theme, title, steps }: EmptyStateProps) {
  return (
    <div className="empty-state" style={{ background: theme.plane }}>
      <div className="empty-card" style={{ background: theme.surface, borderColor: theme.border }}>
        <h1 style={{ color: theme.textPrimary }}>{title}</h1>
        {steps.length > 0 && (
          <ol style={{ color: theme.textSecondary }}>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
