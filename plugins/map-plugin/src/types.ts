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
  /** Value written to the writeback variable so Sigma can find this row again. */
  key: string;
  ytd: number | null;
  pytd: number | null;
  /**
   * Growth as supplied by the workbook, or derived from ytd/pytd when no
   * growth column is configured. `growthIsRatio` says which scale it is on.
   */
  growth: number | null;
  growthIsRatio: boolean;
}

export interface PluginConfig {
  source?: string;
  latitude?: string;
  longitude?: string;
  restaurantName?: string;
  territory?: string;
  rowKey?: string;
  ytdSales?: string;
  pytdSales?: string;
  growthPct?: string;
  mapStyle?: string;
  selectedKey?: string;
  newTerritory?: string;
  onTerritoryChange?: string;
}
