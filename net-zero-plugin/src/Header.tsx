import type { ScenarioData } from './model.ts';
import { DROPDOWN_THRESHOLD } from './theme.ts';

export const scenarioLabel = (s: ScenarioData) => (s.name ? `${s.id} · ${s.name}` : s.id);

interface Props {
  scenarios: ScenarioData[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function Header({ scenarios, selectedId, onSelect }: Props) {
  return (
    <div className="nz-head">
      <div>
        <h1 className="nz-title">Net zero 2040 · ingredient mix scenarios</h1>
        <p className="nz-sub">Ingredient emissions · inputs 2026–2030, projected to 2040</p>
      </div>
      {scenarios.length > DROPDOWN_THRESHOLD ? (
        <select aria-label="Scenario" value={selectedId} onChange={(e) => onSelect(e.target.value)}>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {scenarioLabel(s)}
            </option>
          ))}
        </select>
      ) : (
        <div className="seg" role="group" aria-label="Scenario">
          {scenarios.map((s) => (
            <button key={s.id} aria-pressed={s.id === selectedId} onClick={() => onSelect(s.id)}>
              {scenarioLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
