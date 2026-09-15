# Sigma Map Plugin

A Sigma Computing plugin that plots rows on a Google Map, colour-coded by a
categorical column. Built for the `mapapp` workbook, but nothing in it is
specific to restaurants — the author picks every column from the editor panel.

**Deployed:** https://sigma-restaurant-map.netlify.app

## What it does

- One marker per row, positioned by the chosen latitude/longitude columns.
- Markers coloured by the chosen territory column.
- Click a marker for a popup showing the name, territory, YTD Sales, PYTD Sales,
  and Growth %, plus a **New Territory** picker that writes the change back to
  the workbook.
- The map auto-fits to the plotted rows on load and whenever the coordinates change.
- A **Table** toggle shows the same fields as text.

## Editor panel

| Field | Type | Required | Notes |
|---|---|---|---|
| Source | element | yes | The workbook element to plot |
| Latitude | column (number) | yes | Degrees, not formatted text |
| Longitude | column (number) | yes | Degrees, not formatted text |
| Restaurant name | column (text) | no | Popup title and table label |
| Territory name | column (text) | no | Drives marker colour |
| YTD Sales | column (number) | no | Shown in the popup and table |
| PYTD Sales | column (number) | no | Shown in the popup and table |
| Growth % | column (number) | no | If omitted, derived from YTD and PYTD |
| Map style | dropdown | no | `Light` or `Dark` |
| Row key (writeback) | column | for writeback | Identifies the row to update |
| Row key → variable | variable | for writeback | Receives the clicked row's key |
| New territory → variable | variable | for writeback | Receives the chosen territory |
| On territory change | action-trigger | for writeback | Fired after both variables are set |

Sales figures use the d3 format string from the column's own metadata, so they
render exactly as they do elsewhere in the workbook.

Growth is printed with an explicit sign (`+4.2%` / `−1.7%`) and tinted green or
red. The sign carries the direction on its own, so the colour is reinforcement
rather than the only cue. A supplied Growth column is treated as already being a
percentage (`12.4` → `+12.4%`); a derived one is a ratio. Growth is not reported
when the prior period is zero, since any increase from zero is infinite.

Rows whose coordinates are missing or out of range are dropped rather than
placed at a guessed location, and the count is reported in the toolbar.

## Colour handling

Colours come from a validated categorical palette and are assigned in its fixed
published order. Two constraints shape the behaviour:

**Only three colours are reliably distinguishable on a map.** On a map any two
markers can end up adjacent, so every *pair* of colours has to be separable —
not just the pairs that sit next to each other in a legend. Validating the
palette under that rule (`--pairs all`) passes at three slots and fails at four,
where yellow and orange become hard to tell apart even with full colour vision.

So once a fourth territory appears, every marker also carries a short **letter
badge**, and the legend shows the badges alongside the colours. Identity never
rests on hue alone. Below four territories the badges are omitted as
unnecessary clutter.

**Hues are never generated or cycled.** Past the eighth territory, the least
common ones fold into a single neutral "Other" bucket rather than repeating a
colour that already means something else.

Slots are assigned in alphabetical order of territory name, so a territory keeps
its colour when a filter changes which rows are on screen.

## Territory writeback

The plugin does not write to the warehouse itself. It publishes the change and
lets the workbook act on it, which is what Sigma's action model expects:

1. The author picks a territory in the popup's **New Territory** control.
2. The plugin sets the **row key** variable to the clicked row's key, and the
   **new territory** variable to the chosen value.
3. The plugin fires the **On territory change** action trigger.
4. In Sigma, attach an action sequence to that trigger that updates the input
   table row matching the key variable, setting its territory to the territory
   variable.

Until all three of those are configured, the control renders disabled with a
note saying so, rather than silently doing nothing.

The picker lists every distinct territory in the current rows, with the row's
current one preselected. Nothing is written when the selection does not change.

Selection is tracked by the row key rather than the row index, because an update
can reorder the source rows — an index would quietly start pointing at a
different restaurant.

## Google Maps API key

The key is read at **build time** from `VITE_GOOGLE_MAPS_API_KEY` and is
necessarily present in the shipped JavaScript — a Maps JS key is sent from the
browser, so it cannot be hidden. **Restricting the key is what protects it**, not
keeping it out of the bundle:

1. Google Cloud Console → *APIs & Services* → *Credentials* → the key.
2. *Application restrictions* → **HTTP referrers**, and add the deployed origin
   (e.g. `https://sigma-restaurant-map.netlify.app/*`).
3. *API restrictions* → restrict to **Maps JavaScript API**.

An unrestricted key on a public URL can be scraped and billed to your project.

## Local development

```bash
npm install
cp .env.example .env     # add your Maps key
npm run dev
```

- `http://localhost:5173/` — the plugin itself. Register this URL in Sigma
  (*Administration → Plugins*) to develop against a live workbook.
- `http://localhost:5173/harness/` — a dev harness that renders the map against
  fixture data with no Sigma workbook attached. Useful for working on the
  visuals. It is not part of the production build.

## Build and deploy

```bash
npm run build     # typechecks, then builds to dist/
```

`netlify.toml` points at this subdirectory, so connecting the repository to
Netlify works without further configuration. Set `VITE_GOOGLE_MAPS_API_KEY` in
*Site settings → Environment variables* first — the build reads it, and without
it the plugin renders a "key missing" message instead of a map.

## Registering in Sigma

1. *Administration → Plugins → Add plugin*, pointing at the deployed URL.
2. In the workbook, add the plugin element and pick the source element.
3. Map the Latitude, Longitude, Restaurant name, and Territory name columns.
