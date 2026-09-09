# Plugins

Sigma plugin projects built with the skills in `.claude/skills/`.

| Plugin | What it does |
|--------|--------------|
| [`disease-reaction-card/`](./disease-reaction-card) | Renders a seed variety card's disease reaction ratings as segmented 1–9 scale bars, split by parent line and grouped by disease group. |

## disease-reaction-card

Reproduces the printed variety card that Sigma's native tables can't: each
disease gets a bar per parent, filled to its rating and colored by band.

**Editor panel**

| Field | Purpose |
|---|---|
| `source` | Element supplying the ratings |
| `group` | Disease group — consecutive equal values become one spanning tab |
| `disease` | Row label. The only column the card can't render without |
| `female` / `male` | Ratings per parent line, numeric |
| `title` | Card heading |
| `femaleLabel` / `maleLabel` | Column header text |
| `maxRating` | Segments per bar, default 9 |
| `showLegend` | Legend on/off |
| `showValues` | Print the numeric rating beside each bar |

**Bands** — boundaries sit on the half-step so a fractional average lands in
exactly one band:

| Rating | Band | Color |
|---|---|---|
| 1–3 | Susceptible | `#D93318` |
| 4 | Moderately susceptible | `#F59120` |
| 5–6 | Moderately tolerant | `#FFD616` |
| 7–9 | Tolerant | `#3E9C35` |
| blank | No info | `#C9CDD4` |

Colors were checked with the dataviz palette validator. The printed card's
red/orange pair sat at ΔE 14.8 — below the floor where even full-color readers
can separate two hues — so red was deepened until the pair cleared it (now
ΔE 17.0 normal, 13.9 deutan). Fill length carries the same value as hue, so a
rating stays readable when color doesn't survive.

**Row order** comes from the source element. Groups are formed from *runs* of
equal values rather than distinct ones, so the card follows whatever sort the
element applies instead of imposing its own — sort in Sigma to reorder.

## Starting another plugin

```bash
cp -r disease-reaction-card my-plugin
cd my-plugin
# update "name" in package.json
npm install
npm run dev
```

Edit `src/editorPanel.ts` for the config it needs, then replace `src/App.tsx`.
`src/types.ts` is worth keeping — it builds on the SDK's own types instead of
restating them.

## Running against a workbook

1. `npm run dev` (serves on `http://localhost:5173`)
2. In Sigma: **Administration → Plugins → Add Plugin**, enter that URL
3. Add the plugin element to a page, then map the editor panel fields

Edits hot-reload into the workbook. `localhost` only works for whoever runs the
dev server — deploy for anyone else.

## Deploying

```bash
npm run build   # typechecks, then emits dist/
```

`dist/` is a static bundle; any static host works. `netlify.toml` at the repo
root builds this folder on push. For a prebuilt zip upload, `public/_headers`
carries the same headers, since `netlify.toml` only applies to git builds.

`vite.config.ts` sets `base: './'` so assets resolve relative to wherever the
bundle lands rather than assuming a domain root.

## Notes

- **Data arrives column-oriented** — `{ [columnId]: values[] }`, keyed by opaque
  column IDs, not display names.
- **`useElementData` caps at 25,000 data points.** Past that, use
  `usePaginatedElementData` or `useIncrementalElementData`.
- **Dependencies are pinned exactly**, so a fresh `npm install` reproduces the
  build that was tested.
