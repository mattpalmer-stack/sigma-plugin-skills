import type { CustomPluginConfigOptions } from '@sigmacomputing/plugin'

/**
 * Editor panel for the disease reaction card.
 *
 * The annotation matters: `CustomPluginConfigOptions` is a discriminated union
 * on `type`, so without it TypeScript widens each `type` to `string` and the
 * array stops matching.
 */
export const EDITOR_PANEL: CustomPluginConfigOptions[] = [
  { name: 'source', type: 'element' },
  {
    name: 'group',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    label: 'Group',
  },
  {
    name: 'disease',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    label: 'Disease',
  },
  {
    name: 'female',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['number', 'integer'],
    label: 'Female rating',
  },
  {
    name: 'male',
    type: 'column',
    source: 'source',
    allowMultiple: false,
    allowedTypes: ['number', 'integer'],
    label: 'Male rating',
  },
  { name: 'title', type: 'text', label: 'Title', defaultValue: 'Disease Reaction' },
  { name: 'femaleLabel', type: 'text', label: 'Female column header', defaultValue: 'Female' },
  { name: 'maleLabel', type: 'text', label: 'Male column header', defaultValue: 'Male' },
  { name: 'maxRating', type: 'text', label: 'Scale maximum', defaultValue: '9' },
  { name: 'showLegend', type: 'toggle', label: 'Show legend', defaultValue: true },
  { name: 'showValues', type: 'toggle', label: 'Show rating numbers', defaultValue: false },
]
