import { useQuery } from "@tanstack/react-query";
import type { SeriesExplorerDataSource } from "../api/seriesExplorer.api";
import { seriesExplorerQueryOptions } from "../api/seriesExplorer.queries";

export function useSeriesExplorerData(source?: SeriesExplorerDataSource) {
  return useQuery(seriesExplorerQueryOptions(source));
}
