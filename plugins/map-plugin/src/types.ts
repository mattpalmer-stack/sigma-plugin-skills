/** Shapes the Sigma plugin SDK hands back, plus this plugin's own row model. */

export type SigmaValue = string | number | boolean | Date | null | undefined;

export interface ColumnInfo {
  name?: string;
  columnType?: string;
  id?: string;
  format?: { type?: string; format?: string };
}

export type SigmaData = Record<string, SigmaValue[]>;
export type SigmaColumns = Record<string, ColumnInfo>;

/** One restaurant, already validated as having usable coordinates. */
export interface MapPoint {
  /** Index of the row in the source element — a stable identity for the marker. */
  rowIndex: number;
  lat: number;
  lng: number;
  name: string;
  /** Raw territory value; empty string when the row has none. */
  territory: string;
}

export interface PluginConfig {
  source?: string;
  latitude?: string;
  longitude?: string;
  restaurantName?: string;
  territory?: string;
  mapStyle?: string;
}
