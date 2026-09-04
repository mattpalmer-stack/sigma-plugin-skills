# Plugins

Sigma plugin projects built with the skills in `.claude/skills/`.

| Plugin | What it does |
|--------|--------------|
| [`starter/`](./starter) | Vite + React + TypeScript base. Renders an inspector of whatever element you bind to it — every column's name, type, format, and sample values. |

## Starting a new plugin

```bash
cp -r starter my-plugin
cd my-plugin
# update "name" in package.json
npm install
npm run dev
```

Then edit `src/editorPanel.ts` to declare the config the plugin needs, and
replace the body of `src/App.tsx`. The pieces around it — `useRows`, `format`,
and `types` — are useful for most plugins and worth keeping.

## Running against a workbook

A plugin is a web page Sigma loads in an iframe, so Sigma needs a URL it can
reach.

1. `npm run dev` (serves on `http://localhost:5173`)
2. In Sigma: **Administration → Plugins → Add Plugin**, and enter that URL
3. In the workbook, add the plugin element to a page
4. Open its editor panel and set **source** to the element you want to read

Edits hot-reload straight into the workbook. Note that `localhost` only works
for whoever is running the dev server — for anyone else, deploy first.

## Deploying

```bash
npm run build   # typechecks, then emits dist/
```

`dist/` is a static bundle; any static host works (Vercel, Netlify, S3 +
CloudFront, GitHub Pages). Register the deployed URL the same way, then point
the workbook's plugin element at it.

`vite.config.ts` sets `base: './'` so assets resolve relative to wherever the
bundle ends up, rather than assuming it sits at a domain root.

## Notes

- **Data arrives column-oriented** — `{ [columnId]: values[] }`, keyed by
  opaque column IDs rather than display names. `useRows` pivots this to rows.
- **`useElementData` caps at 25,000 data points.** Past that, use
  `usePaginatedElementData` or `useIncrementalElementData`.
- **Dates are inconsistent** — a `Date`, an ISO string, or a timestamp in
  either seconds or milliseconds, depending on the source. `src/format.ts`
  normalizes all four.
- **Dependencies are pinned exactly**, so a fresh `npm install` reproduces the
  build that was actually tested.
