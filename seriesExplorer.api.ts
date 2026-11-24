export interface SeriesExplorerDataSource {
  /** Stable cache namespace; use a different key for each backend/dataset. */
  readonly cacheKey: string;
  /** External data is validated at the query boundary. */
  load(signal: AbortSignal): Promise<unknown>;
}

export const localSeriesExplorerDataSource: SeriesExplorerDataSource = {
  cacheKey: "local-json",
  async load(signal) {
    signal.throwIfAborted();
    const [series, hierarchy, observations, lockedPeriods] = await Promise.all([
      import("../../../data/tblSeries.json"),
      import("../../../data/tblHierarchy.json"),
      import("../../../data/tblObservations.json"),
      import("../../../data/tblLockedPeriods.json"),
    ]);
    // Imports cannot be cancelled, but cancelled results must not be consumed.
    signal.throwIfAborted();
    return {
      series: series.default,
      hierarchy: hierarchy.default,
      observations: observations.default,
      lockedPeriods: lockedPeriods.default,
    };
  },
};

// Replace this binding with a server data source when the API is available.
export const seriesExplorerDataSource = localSeriesExplorerDataSource;
