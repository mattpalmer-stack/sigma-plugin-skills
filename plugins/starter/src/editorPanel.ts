import type { CustomPluginConfigOptions } from '@sigmacomputing/plugin'

/**
 * The editor panel is the config sidebar a workbook author sees after adding
 * this plugin to a page. Each entry's `name` is the key you read back out of
 * `useConfig()`.
 *
 * This starter binds only a source element, so the inspector can show every
 * column on it. The optional column bindings are here as the hook a real
 * plugin grows from -- swap them for whatever roles your plugin needs.
 *
 * The annotation matters: `CustomPluginConfigOptions` is a discriminated union
 * on `type`, so without it TypeScript widens each `type` to `string` and the
 * array stops matching.
 */
export const EDITOR_PANEL: CustomPluginConfigOptions[] = [
  { name: 'source', type: 'element' },
  {
    name: 'dimension',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    label: 'Label column (optional)',
  },
  {
    name: 'measures',
    type: 'column',
    source: 'source',
    allowMultiple: true,
    label: 'Value columns (optional)',
  },
  { name: 'title', type: 'text', label: 'Title', defaultValue: '' },
  { name: 'rowLimit', type: 'text', label: 'Rows to preview', defaultValue: '25' },
]
