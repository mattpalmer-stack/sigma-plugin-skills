# Net zero 2040 · ingredient mix scenarios (Sigma plugin)

React + `@sigmacomputing/plugin` custom plugin: scenario toggle, 3 KPI cards, country glide path (Chart.js), status line and country scorecard. No waterfall.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # data-rule unit tests (node >= 22)
npm run build      # typecheck + production bundle in dist/
```

Register in Sigma: **Administration > Plugins > Add Plugin**, URL `http://localhost:3000` for dev (or your hosted `dist/`). Add the plugin to a workbook, select the `scenario_results` element (joined to `scenarios` on `scenario_id`, optionally `dim_plant`), then map the columns.

## Editor panel

Required text: `run_id`, `scenario_id`, `scenario_name`, `chart_color`, `country`, `ingredient`, `metric`. Required number: `year`, `p10`, `p50`, `p90`.
Optional number: `sort_order` (country chip order), `volume_mhl` (million hl; enables the kt figure in the status line, read from the 2040 intensity rows).

## Layout

- `src/theme.ts`: brand colours, light/dark palettes, opacities, chart height, default country. Edit here.
- `src/model.ts`: pure data rules (latest run per scenario, country order, partial-run skip, status, gap rounding, KPIs). Covered by `tests/model.test.ts`.
- `src/App.tsx`: editor panel config, row assembly, selection state. `Header`, `KpiCards`, `GlidePath`, `Scorecard` are the view pieces.

Switching scenario or country is pure client state; no re-fetch.

## Notes / assumptions

- A scenario is skipped while any country it has intensity for lacks one of the 15 years (mid-write). A country absent from a scenario entirely shows "—" and its line is hidden.
- A gap that rounds to 0.00 counts as on the pathway and is shown as `0.00` (no sign, green).
- Dependencies are pinned to versions older than 3 days (org rule); `@sigmacomputing/*` is exempt.
