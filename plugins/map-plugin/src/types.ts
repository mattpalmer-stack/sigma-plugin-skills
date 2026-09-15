/** Shapes the Sigma plugin SDK hands back, plus this plugin's own row model. */

export type SigmaValue = string | number | boolean | Date | null | undefined;

export interface ColumnFormat {
  type?: string;
  format?: string;
}

export interface ColumnInfo {
  name?: string;
  columnType?: string;
  id?: string;
  format?: ColumnFormat;
}

export type SigmaData = Record<string, SigmaValue[]>;
export type SigmaColumns = Record<string, ColumnInfo>;

/** One mappable row, already validated as having usable coordinates. */
export interface MapPoint {
  /** Index of the row in the source element, used as a stable identity. */
  rowIndex: number;
  lat: number;
  lon: number;
  label: string;
  /** Value driving marker colour, when a "colour by" column is configured. */
  colorValue: number | null;
  /** Value driving marker radius, when a "size by" column is configured. */
  sizeValue: number | null;
  /** Pre-formatted popup rows, in the order the author picked the columns. */
  details: { name: string; value: string }[];
}

export type BasemapName = 'Light' | 'Dark' | 'Voyager';

export interface PluginConfig {
  source?: string;
  latitude?: string;
  longitude?: string;
  label?: string;
  colorBy?: string;
  sizeBy?: string;
  details?: string | string[];
  basemap?: BasemapName;
  selectedValue?: string;
  selectedLabel?: string;
  onSelect?: string;
  onReset?: string;
}
