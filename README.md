# Sigma Plugin Skills

Claude AI agent skills for building [Sigma Computing](https://www.sigmacomputing.com/) plugins. These skills give Claude deep, project-aware knowledge of the Sigma plugin SDK so you can build, iterate, and debug plugins faster.

## Skills

### `sigma-plugin-development`
Core reference skill covering the full `@sigmacomputing/plugin` SDK:

- Plugin architecture and initialization (module-level vs. React hook)
- All editor panel configuration types (`element`, `column`, `text`, `toggle`, `dropdown`, `variable`, `action-trigger`, `action-effect`, and more)
- Reading config with `useConfig()` and the subscription API
- Accessing element data and column metadata
- Control variables and bidirectional data binding
- Action triggers and action effects
- URL parameters, plugin styles, and loading state
- Date/time handling
- Full SDK API reference (hooks + client API)

### `sigma-plugin-patterns`
Practical patterns and architectural recipes for common plugin needs:

- **JSON Settings Pattern** — store rich configuration as serialized JSON in a `text` config field, with your own custom settings UI inside the plugin
- **Edit Mode Pattern** — gate editor-only UI behind a toggle so viewers never see configuration controls
- **Variable + Action Trigger Pattern** — pass user selections back to the Sigma workbook
- **Dynamic Editor Panel Reconfiguration** — conditionally show/hide editor panel fields based on current config state
- **Variable Value Unwrapping** — safely handle the object-wrapped values that some variable types return
- **Action Effect Pattern** — let the workbook invoke callbacks inside the plugin
- **LLM/AI Integration Pattern** — orchestrate AI workflows via variables and action triggers
- **Multi-Column Data Pattern** — handle `allowMultiple` columns, named role columns, and auto-detection via column type metadata
- **Data Transformation Patterns** — column-to-row conversion, null filtering, aggregation, and type-safe value handling
- **Graceful Loading Pattern** — handle partial config states with friendly guidance messages
- **Vanilla JavaScript Plugin Pattern** — build plugins without a framework using the subscription API

## Plugins

The [`plugins/`](./plugins) folder holds actual plugin projects built with these skills. First up: [`plugins/disease-reaction-card`](./plugins/disease-reaction-card) — a Vite + React + TypeScript plugin that renders a seed variety card's disease reaction ratings as segmented 1–9 scale bars, split by parent line. See [`plugins/README.md`](./plugins/README.md) for the editor panel, rating bands, and the dev and deploy loop.

## Usage

These are Claude agent skills — they are read and followed by Claude at the start of relevant tasks. Place the `.claude/skills/` folder in your project or reference it from your Claude configuration.

Skills are triggered when you ask Claude to help with Sigma plugin development tasks, such as:
- "Add a dropdown to the editor panel to let the user pick a chart type"
- "Set a control variable when the user clicks a row"
- "Persist my plugin's color settings to the workbook"
- "How do I read date column values?"

## Getting Started with a Plugin

If you need a React + TypeScript starting point, the [sigma-plugin-template](https://github.com/neil-oliver/sigma-plugin-template) repo provides a clean template with React, TypeScript, and shadcn/ui components pre-configured and ready to customise.

## Related

- [Sigma Plugin SDK (`@sigmacomputing/plugin`)](https://www.npmjs.com/package/@sigmacomputing/plugin)
- [Sigma Plugin Documentation](https://help.sigmacomputing.com/docs/intro-to-plugins)
- [sigma-plugin-template](https://github.com/neil-oliver/sigma-plugin-template) — React/TypeScript template to get started quickly
