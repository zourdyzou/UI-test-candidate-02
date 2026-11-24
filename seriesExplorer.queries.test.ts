import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import {
  localSeriesExplorerDataSource,
  type SeriesExplorerDataSource,
} from "./seriesExplorer.api";
import { seriesExplorerQueryOptions } from "./seriesExplorer.queries";

const emptyData = {
  series: [],
  hierarchy: [],
  observations: [],
  lockedPeriods: [],
};

describe("series explorer queries", () => {
  it("loads and validates the supplied JSON files", async () => {
    const client = new QueryClient();
    try {
      const data = await client.fetchQuery(seriesExplorerQueryOptions());
      expect(data.series.length).toBeGreaterThan(0);
      expect(data.hierarchy.length).toBeGreaterThan(0);
      expect(data.observations.length).toBeGreaterThan(0);
      expect(data.lockedPeriods.length).toBeGreaterThan(0);
    } finally {
      client.clear();
    }
  });

  it("reuses fresh data and keeps different sources in separate caches", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    });
    const local = {
      cacheKey: "local-test",
      load: vi.fn().mockResolvedValue(emptyData),
    };
    const server = {
      cacheKey: "server-test",
      load: vi.fn().mockResolvedValue({
        ...emptyData,
        series: [
          {
            KY_ID: 1,
            TX_DESCRIPTION: "Server series",
            TX_SKU: "",
            TX_COUNTRY: "US",
          },
        ],
      }),
    };
    try {
      await client.fetchQuery(seriesExplorerQueryOptions(local));
      await client.fetchQuery(seriesExplorerQueryOptions(local));
      const data = await client.fetchQuery(seriesExplorerQueryOptions(server));
      expect(local.load).toHaveBeenCalledTimes(1);
      expect(server.load).toHaveBeenCalledTimes(1);
      expect(data.series[0].TX_DESCRIPTION).toBe("Server series");
      expect(
        client.getQueryData(seriesExplorerQueryOptions(local).queryKey),
      ).toEqual(emptyData);
    } finally {
      client.clear();
    }
  });

  it("rejects malformed data without retrying or caching a successful result", async () => {
    const client = new QueryClient();
    const source = {
      cacheKey: "invalid",
      load: vi.fn().mockResolvedValue({
        ...emptyData,
        observations: [
          { FK_SERIES: 1, TX_PERIOD: "2026-13", QY_SALES: 2, QY_DEMAND: 3 },
        ],
      }),
    };
    try {
      await expect(
        client.fetchQuery(seriesExplorerQueryOptions(source)),
      ).rejects.toBeInstanceOf(ZodError);
      expect(source.load).toHaveBeenCalledTimes(1);
      expect(
        client.getQueryData(seriesExplorerQueryOptions(source).queryKey),
      ).toBeUndefined();
    } finally {
      client.clear();
    }
  });

  it("passes cancellation to the data source", async () => {
    const client = new QueryClient();
    let requestSignal: AbortSignal | undefined;
    const source: SeriesExplorerDataSource = {
      cacheKey: "cancelled",
      load: (signal) =>
        new Promise((_resolve, reject) => {
          requestSignal = signal;
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    };
    try {
      const options = seriesExplorerQueryOptions(source);
      const request = client.fetchQuery(options);
      const rejection = expect(request).rejects.toThrow();
      await client.cancelQueries({ queryKey: options.queryKey });
      await rejection;
      expect(requestSignal?.aborted).toBe(true);
      expect(client.getQueryData(options.queryKey)).toBeUndefined();
    } finally {
      client.clear();
    }
  });

  it("does not load local files for an already cancelled request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      localSeriesExplorerDataSource.load(controller.signal),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
