export type SeriesId = number;

export interface SeriesTreeNode {
  series: Series;
  children: SeriesTreeNode[];
}

/** Series record as stored in tblSeries.json. */
export interface Series {
  KY_ID: SeriesId;
  TX_DESCRIPTION: string;
  TX_SKU: string;
  TX_COUNTRY: string;
  TX_CUSTOMER?: string;
  TX_CATEGORY?: string;
}

export interface SeriesHierarchy {
  FK_SERIES: SeriesId;
  /** Zero identifies a root series. */
  FK_PARENT_SERIES: SeriesId;
}

export type ObservationQuantity = "QY_SALES" | "QY_DEMAND" | "QY_SUPPLY";

export interface Observation {
  FK_SERIES: SeriesId;
  TX_PERIOD: string;
  QY_SALES: number | null;
  QY_DEMAND: number | null;
  QY_SUPPLY?: number | null;
}

export interface LockedPeriod {
  FK_SERIES: SeriesId;
  TX_PERIOD: string;
  TX_OPINION: ObservationQuantity;
}

export interface SeriesExplorerData {
  series: Series[];
  hierarchy: SeriesHierarchy[];
  observations: Observation[];
  lockedPeriods: LockedPeriod[];
}
