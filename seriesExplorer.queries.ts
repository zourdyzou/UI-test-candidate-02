import { queryOptions } from "@tanstack/react-query";
import { ZodError } from "zod";
import { seriesExplorerDataSchema } from "../model/schemas";
import {
  seriesExplorerDataSource,
  type SeriesExplorerDataSource,
} from "./seriesExplorer.api";

export const seriesExplorerKeys = {
  all: ["series-explorer"] as const,
  data: (sourceKey: string) =>
    [...seriesExplorerKeys.all, sourceKey, "data"] as const,
};

export function seriesExplorerQueryOptions(
  source: SeriesExplorerDataSource = seriesExplorerDataSource,
) {
  return queryOptions({
    queryKey: seriesExplorerKeys.data(source.cacheKey),
    queryFn: async ({ signal }) => {
      const data = await source.load(signal);
      signal.throwIfAborted();
      return seriesExplorerDataSchema.parse(data);
    },
    // Invalid data will not become valid by retrying the same request.
    retry: (failureCount, error) =>
      !(error instanceof ZodError) && failureCount < 1,
  });
}
